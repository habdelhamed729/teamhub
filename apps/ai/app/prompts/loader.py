import pathlib

PROMPTS_DIR = pathlib.Path(__file__).parent

def load_prompt(filename: str) -> str:
    """
    Load a versioned prompt template text file from the app/prompts directory.
    Uses UTF-8 encoding to prevent Windows compatibility issues.
    """
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt template file not found: {filename}")
        
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()
