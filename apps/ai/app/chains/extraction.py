from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.prompts.loader import load_prompt

class ActionItem(BaseModel):
    action: str = Field(description="The clear description of what needs to be done.")
    assignee: str | None = Field(default=None, description="The name of the person or team assigned to this action item, if mentioned. Otherwise null.")
    priority: str = Field(description="The priority of the task ('high', 'medium', or 'low') based on context.")
    due_date: str | None = Field(default=None, description="The due date / deadline of the task if mentioned (e.g. YYYY-MM-DD or relative description). Otherwise null.")

class ActionItemsSchema(BaseModel):
    items: list[ActionItem] = Field(description="A list of action items / tasks extracted from the document.")

async def extract_action_items(document_text: str) -> list[dict]:
    """
    Extract structured action items / tasks from a document using Groq LLM.
    Uses llama-3.3-70b-versatile for high quality structured extraction.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Please add it to your .env file.")

    system_prompt = load_prompt("extract_actions_v1.txt")
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Extract all action items from the following content:\n\n{text}")
    ])

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.STRONG_LLM_MODEL,
        temperature=0.1,  # low temperature for accuracy
    )

    # Use structured output parsing
    structured_llm = llm.with_structured_output(ActionItemsSchema)
    chain = prompt | structured_llm

    result = await chain.ainvoke({"text": document_text})
    
    # Return as list of dicts for API response serialization compatibility
    return [item.model_dump() for item in result.items]
