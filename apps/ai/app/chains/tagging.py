import json
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.prompts.loader import load_prompt

class TagsSchema(BaseModel):
    tags: list[str] = Field(description="A list of 3 to 7 descriptive lowercase tags for the document")

async def generate_tags(document_text: str) -> list[str]:
    """
    Generate 3-7 relevant tags for the document content using Groq LLM.
    Uses llama-3.3-70b-versatile for high quality structured output.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Please add it to your .env file.")

    system_prompt = load_prompt("tagging_v1.txt")
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Analyze the following document and return the tags:\n\n{text}")
    ])

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.STRONG_LLM_MODEL,
        temperature=0.1,
    )
    
    # Use LangChain's structured output extraction
    structured_llm = llm.with_structured_output(TagsSchema)
    chain = prompt | structured_llm
    
    # Run the chain asynchronously
    result = await chain.ainvoke({"text": document_text})
    return result.tags

async def generate_title(document_text: str) -> str:
    """
    Suggest a concise, professional title for the document based on its content.
    Uses llama-3.1-8b-instant for fast inference speed.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Please add it to your .env file.")

    system_prompt = load_prompt("title_v1.txt")
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Suggest a title for this content:\n\n{text}")
    ])

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.DEFAULT_LLM_MODEL,
        temperature=0.2,
    )
    
    chain = prompt | llm
    result = await chain.ainvoke({"text": document_text})
    # Strip any potential quotes or leading/trailing whitespace
    title = result.content.strip().strip('"').strip("'")
    return title
