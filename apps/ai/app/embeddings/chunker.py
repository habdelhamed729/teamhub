import app.main as main_app

def count_tokens(text: str) -> int:
    """Count tokens using the sentence-transformers tokenizer, falling back to word heuristic."""
    try:
        if main_app.embedding_model is not None:
            # sentence-transformers models usually have a tokenize/encode method
            return len(main_app.embedding_model.tokenize([text])[0])
    except Exception:
        pass
    # Fallback heuristic: roughly 1.3 tokens per word
    return int(len(text.split()) * 1.3)

def chunk_by_sections(sections: list[dict], max_tokens: int = 400, min_tokens: int = 100, overlap_tokens: int = 50) -> list[dict]:
    """
    Splits and merges document sections into optimal chunks.
    
    Input:  [{"title": "Section Title", "text": "section content..."}]
    Output: [{"chunk_text": "...", "section_title": "...", "chunk_index": int}]
    
    Strategy:
    1. Group small adjacent sections to reach min_tokens where possible.
    2. Split sections exceeding max_tokens at paragraph boundaries with overlap_tokens overlap.
    3. Prepend the section title context to every chunk.
    """
    chunks = []
    chunk_index = 0
    
    current_title = ""
    current_text_parts = []
    current_token_count = 0
    
    def finalize_chunk(title: str, text_parts: list[str]):
        nonlocal chunk_index
        if not text_parts:
            return
        
        body_text = "\n\n".join(text_parts).strip()
        # Prepend the section title context for RAG
        full_text = f"# {title}\n{body_text}" if title else body_text
        
        chunks.append({
            "chunk_text": full_text,
            "section_title": title,
            "chunk_index": chunk_index
        })
        chunk_index += 1

    for section in sections:
        title = section.get("title", "").strip()
        text = section.get("text", "").strip()
        
        if not text:
            # Carry over titles of empty sections as category breadcrumbs
            if title:
                if not current_title:
                    current_title = title
                else:
                    current_title = f"{current_title} > {title}"
            continue
            
        section_tokens = count_tokens(text)
        
        # Scenario A: Fits completely in the current running chunk
        if current_token_count + section_tokens <= max_tokens:
            if current_title:
                current_title = f"{current_title} & {title}" if title else current_title
            else:
                current_title = title
            current_text_parts.append(text)
            current_token_count += section_tokens
            
        # Scenario B: Too big for current chunk, but fits on its own in a new chunk
        elif section_tokens <= max_tokens:
            finalize_chunk(current_title, current_text_parts)
            current_title = title
            current_text_parts = [text]
            current_token_count = section_tokens
            
        # Scenario C: Exceeds max_tokens, must be split at paragraph boundaries
        else:
            finalize_chunk(current_title, current_text_parts)
            
            paragraphs = text.split("\n\n")
            split_parts = []
            split_tokens = 0
            
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue
                para_tokens = count_tokens(para)
                
                if split_tokens + para_tokens <= max_tokens:
                    split_parts.append(para)
                    split_tokens += para_tokens
                else:
                    finalize_chunk(title, split_parts)
                    
                    # Compute overlap (add previous paragraphs that fit within overlap limit)
                    overlap_parts = []
                    overlap_tokens_count = 0
                    for prev_para in reversed(split_parts):
                        prev_tokens = count_tokens(prev_para)
                        if overlap_tokens_count + prev_tokens <= overlap_tokens:
                            overlap_parts.insert(0, prev_para)
                            overlap_tokens_count += prev_tokens
                        else:
                            break
                            
                    split_parts = overlap_parts + [para]
                    split_tokens = overlap_tokens_count + para_tokens
            
            # Finalize any leftover split paragraphs
            finalize_chunk(title, split_parts)
            
            # Reset current running chunk state
            current_title = ""
            current_text_parts = []
            current_token_count = 0
            
    # Finalize the last chunk
    finalize_chunk(current_title, current_text_parts)
    
    return chunks
