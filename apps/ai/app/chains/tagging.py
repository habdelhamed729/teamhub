import json
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings

class TagsSchema(BaseModel):
    tags: list[str] = Field(description="A list of 3 to 7 descriptive lowercase tags for the document")

async def generate_tags(document_text: str) -> list[str]:
    """
    Generate 3-7 relevant tags for the document content using Groq LLM.
    Uses llama-3.3-70b-versatile for high quality structured output.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Please add it to your .env file.")

    # We use a system message to instruct the model, followed by the text
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a document tagging assistant for a team collaboration platform called TeamHub.\n"
            "Analyze the document text and extract 3 to 7 descriptive, relevant tags.\n"
            "Follow these rules:\n"
            "- Tags must be lowercase.\n"
            "- Tags should be single words or short compound phrases.\n"
            "- Avoid generic tags like 'document', 'text', 'notes', or 'file'.\n"
            "- Focus on topics, technologies, tasks, or core themes."
        )),
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
    
    # Run the chain asynchronously using a thread pool (since langchain calls are synchronous)
    # Or langchain chains run natively async with ainvoke!
    result = await chain.ainvoke({"text": document_text})
    return result.tags

async def generate_title(document_text: str) -> str:
    """
    Suggest a concise, professional title for the document based on its content.
    Uses llama-3.1-8b-instant for fast inference speed.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Please add it to your .env file.")

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an assistant that suggests professional titles for team documents.\n"
            "Suggest a concise, highly relevant title (maximum 5-7 words) for the document content.\n"
            "Rule: Return ONLY the raw title string itself. Do not include quotation marks, intro phrases, or markdown styling."
        )),
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
