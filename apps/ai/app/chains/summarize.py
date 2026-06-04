from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.config import settings

async def summarize_document(document_text: str, max_length: str = "medium") -> str:
    """
    Generate a summary of the document using Groq LLM.
    Uses llama-3.1-8b-instant for fast summaries.
    
    Since Llama 3.1 has a 128k token context window, we use the "stuff" strategy
    directly which is faster, cheaper, and more cohesive for almost all documents.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Please add it to your .env file.")

    # Determine prompt constraints based on max_length parameter
    length_guidelines = {
        "short": "Generate a concise summary of 2-3 sentences max.",
        "medium": "Generate a single paragraph summarizing the core theme, followed by 3-5 bullet points of key takeaways.",
        "long": "Generate a detailed, section-by-section summary. Break it down using markdown subheadings and clear bullet points for key details."
    }
    
    guideline = length_guidelines.get(max_length.lower(), length_guidelines["medium"])

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a professional document summarizer for a team collaboration workspace called TeamHub.\n"
            "Your goal is to extract the core ideas, decisions, and important details from the document text.\n"
            "Follow these constraints:\n"
            f"- {guideline}\n"
            "- Be direct and professional. Avoid meta-commentary like 'In this document...' or 'This text discusses...'.\n"
            "- Use markdown formatting (bolding, bullet points, headers) for readability.\n"
            "- Ground all summaries strictly in the text provided. Do not extrapolate."
        )),
        ("human", "Summarize the following content:\n\n{text}")
    ])

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.DEFAULT_LLM_MODEL,
        temperature=0.3,
    )
    
    chain = prompt | llm
    result = await chain.ainvoke({"text": document_text})
    return result.content.strip()
