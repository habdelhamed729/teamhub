import pytest_asyncio
import pytest
from app.database import engine

@pytest_asyncio.fixture(autouse=True)
async def cleanup_db_engine():
    """
    Automatically disposes the SQLAlchemy engine connection pool after each test.
    This prevents 'Event loop is closed' errors on Windows by ensuring that
    subsequent tests establish fresh connections in their own active event loops.
    """
    yield
    # Dispose pool connections linked to the completed test's event loop
    await engine.dispose()
