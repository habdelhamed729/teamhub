import json
import os
from app.embeddings.parsers import parse_tiptap_document, extract_sections, extract_attachment_links

def test_tiptap_parser():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    fixture_path = os.path.join(base_dir, "fixtures", "test_content.json")
    
    with open(fixture_path, "r", encoding="utf-8") as f:
        content = json.load(f)
        
    text = parse_tiptap_document(content)
    
    # Assert plain text properties
    assert "What is Semantic Search?" in text
    assert "exact keywords" in text
    assert "[Attachment: rdoc_specification.pdf]" in text
    assert "PGVector + SentenceTransformers" in text
    
    # Assert sections splitting (should have 4 sections: Introduction/H1, Attached Specifications, Full Flow, Feature Comparison Table)
    sections = extract_sections(content)
    assert len(sections) == 4
    assert sections[0]["title"] == "What is Semantic Search?"
    assert sections[1]["title"] == "Attached Specifications"
    assert sections[2]["title"] == "Full Flow"
    assert "PGVector" in sections[2]["text"]
    assert sections[3]["title"] == "Feature Comparison Table"
    
    # Assert attachment links
    links = extract_attachment_links(content)
    assert len(links) == 1
    assert links[0]["filename"] == "rdoc_specification.pdf"
    assert links[0]["url"] == "https://res.cloudinary.com/dnrzcqzdi/raw/upload/v172601/rdoc_specification.pdf"

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
        
    # If run directly, print outputs as requested
    base_dir = os.path.dirname(os.path.abspath(__file__))
    fixture_path = os.path.join(base_dir, "fixtures", "test_content.json")
    
    with open(fixture_path, "r", encoding="utf-8") as f:
        content = json.load(f)
        
    print("=== parse_tiptap_document OUTPUT ===")
    text = parse_tiptap_document(content)
    print(text)
    print("=" * 40)
    
    print("\n=== extract_sections OUTPUT ===")
    sections = extract_sections(content)
    print(f"Found {len(sections)} sections:")
    for idx, s in enumerate(sections):
        print(f"\n  Section {idx + 1}: Title='{s['title']}' ({len(s['text'])} chars)")
        print("  " + "-" * 20)
        indented_text = "\n".join(["    " + line for line in s['text'].split("\n")])
        print(indented_text)
    print("=" * 40)
    
    print("\n=== extract_attachment_links OUTPUT ===")
    links = extract_attachment_links(content)
    print(json.dumps(links, indent=2))
    print("=" * 40)
