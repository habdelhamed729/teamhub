import asyncio
import uuid
import traceback
from datetime import datetime, timezone
from sqlalchemy import select, and_

from app.database import async_session
from app.models.ai_job import AIJob

# Global control flag to shut down worker cleanly
keep_running = True

async def process_single_job(job_id: uuid.UUID, worker_id: str) -> None:
    """Acquires a session, processes the job, and handles completion or retry failures."""
    async with async_session() as session:
        # Re-fetch the job using current session
        res = await session.execute(select(AIJob).where(AIJob.id == job_id))
        job = res.scalars().first()
        if not job:
            return
            
        try:
            if job.job_type == "embed_document":
                from app.embeddings.pipeline import embed_document
                # Process document embedding pipeline
                chunks_count = await embed_document(job.source_id, job.workspace_id, session)
                print(f"[Worker] Job {job.id} completed. Embedded {chunks_count} chunks.")
            else:
                raise ValueError(f"Unknown job type '{job.job_type}'")
                
            # Set job status to completed
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            job.error = None
            await session.commit()
            
        except Exception as e:
            # Rollback any uncommitted pipeline queries (e.g. partial embeddings)
            await session.rollback()
            
            error_trace = traceback.format_exc()
            print(f"[Worker] Error processing job {job.id}: {e}\n{error_trace}")
            
            # Re-fetch job using fresh session state to log the failure
            res_fail = await session.execute(select(AIJob).where(AIJob.id == job.id))
            fail_job = res_fail.scalars().first()
            if fail_job:
                fail_job.status = "failed" if fail_job.attempts >= fail_job.max_attempts else "pending"
                fail_job.error = f"{str(e)}\n\n{error_trace}"
                await session.commit()

async def job_worker_loop():
    """Continuous polling loop running in the background of FastAPI."""
    global keep_running
    worker_id = f"worker-{uuid.uuid4()}"
    print(f"[Worker] Background job worker started (ID: {worker_id})")
    
    while keep_running:
        try:
            async with async_session() as session:
                # Poll and lock the next pending job using SELECT ... FOR UPDATE SKIP LOCKED
                stmt = (
                    select(AIJob)
                    .where(
                        and_(
                            AIJob.status == "pending",
                            AIJob.attempts < AIJob.max_attempts
                        )
                    )
                    .with_for_update(skip_locked=True)
                    .limit(1)
                )
                res = await session.execute(stmt)
                job = res.scalars().first()
                
                if not job:
                    # No pending jobs, sleep before checking again
                    await asyncio.sleep(3.0)
                    continue
                
                # Instantly lock the job row inside a short transaction
                job.status = "processing"
                job.attempts += 1
                job.locked_at = datetime.now(timezone.utc)
                job.locked_by = worker_id
                await session.commit()
                
                job_id = job.id
                
            # Process the job outside the polling transaction to keep lock duration short
            await process_single_job(job_id, worker_id)
            
        except Exception as e:
            print(f"[Worker] Critical error in job worker loop: {e}")
            traceback.print_exc()
            await asyncio.sleep(5.0)

def start_job_worker(app_lifespan_tasks):
    """Start the background job worker task and append to application lifecycle."""
    task = asyncio.create_task(job_worker_loop())
    app_lifespan_tasks.append(task)
    return task
