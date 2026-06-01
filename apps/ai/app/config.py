from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # AI Providers
    GROQ_API_KEY: str = ""
    
    # Service Auth
    AI_SERVICE_TOKEN: str
    
    # Embedding Model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Defaults
    DEFAULT_LLM_MODEL: str = "llama-3.1-8b-instant"
    STRONG_LLM_MODEL: str = "llama-3.3-70b-versatile"
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = 25
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
