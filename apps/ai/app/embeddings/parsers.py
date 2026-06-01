def parse_tiptap_node(node: dict) -> str:
    """
    Recursively convert a TipTap JSON node to plain text.
    Handles node types (doc, heading, paragraph, bulletList, orderedList,
    blockquote, codeBlock, table, horizontalRule, hardBreak, text).
    Extracts filename from attachment-link class.
    """
    if not node:
        return ""
        
    node_type = node.get("type")
    
    # 1. Text node (leaf)
    if node_type == "text":
        text = node.get("text", "")
        marks = node.get("marks", [])
        for mark in marks:
            if mark.get("type") == "link":
                attrs = mark.get("attrs", {})
                classes = attrs.get("class", "") or ""
                if "attachment-link" in classes:
                    # Strip leading emoji if present, e.g. "📎 filename.pdf"
                    clean_text = text.lstrip("📎").strip()
                    return f"[Attachment: {clean_text}]"
        return text

    # 2. Leaf nodes
    if node_type == "hardBreak":
        return "\n"
        
    if node_type == "horizontalRule":
        return "---\n"
        
    # 3. Container nodes (recursive)
    children = node.get("content", [])
    
    if node_type == "doc":
        return "\n".join(filter(None, [parse_tiptap_node(child) for child in children]))
        
    if node_type == "paragraph":
        text = "".join([parse_tiptap_node(child) for child in children])
        return text + "\n" if text.strip() else ""
        
    if node_type == "heading":
        level = node.get("attrs", {}).get("level", 1)
        prefix = "#" * level + " "
        text = "".join([parse_tiptap_node(child) for child in children])
        return prefix + text + "\n" if text.strip() else ""
        
    if node_type == "blockquote":
        text = "".join([parse_tiptap_node(child) for child in children])
        lines = text.strip().split("\n")
        return "\n".join([f"> {line}" for line in lines]) + "\n"
        
    if node_type == "codeBlock":
        text = "".join([parse_tiptap_node(child) for child in children])
        lang = node.get("attrs", {}).get("language", "") or ""
        return f"```{lang}\n{text}\n```\n"
        
    if node_type == "bulletList":
        items = []
        for child in children:
            if child.get("type") == "listItem":
                item_text = parse_tiptap_node(child).strip()
                if item_text:
                    items.append(f"• {item_text}")
        return "\n".join(items) + "\n"
        
    if node_type == "orderedList":
        items = []
        for idx, child in enumerate(children, start=1):
            if child.get("type") == "listItem":
                item_text = parse_tiptap_node(child).strip()
                if item_text:
                    items.append(f"{idx}. {item_text}")
        return "\n".join(items) + "\n"
        
    if node_type == "listItem":
        return " ".join(filter(None, [parse_tiptap_node(child).strip() for child in children]))

    if node_type == "table":
        rows = []
        for child in children:
            if child.get("type") == "tableRow":
                row_cells = []
                for cell in child.get("content", []):
                    if cell.get("type") in ("tableCell", "tableHeader"):
                        cell_text = parse_tiptap_node(cell).strip().replace("\n", " ")
                        row_cells.append(cell_text)
                rows.append(row_cells)
        
        if not rows:
            return ""
            
        col_count = max(len(row) for row in rows)
        markdown_table = []
        
        # Header row
        header_row = rows[0]
        header_row += [""] * (col_count - len(header_row))
        markdown_table.append("| " + " | ".join(header_row) + " |")
        
        # Separator row
        markdown_table.append("| " + " | ".join(["---"] * col_count) + " |")
        
        # Data rows
        for data_row in rows[1:]:
            data_row += [""] * (col_count - len(data_row))
            markdown_table.append("| " + " | ".join(data_row) + " |")
            
        return "\n".join(markdown_table) + "\n"
        
    if node_type in ("tableCell", "tableHeader"):
        return " ".join(filter(None, [parse_tiptap_node(child).strip() for child in children]))

    # Default fallback: parse children
    if children:
        return "".join([parse_tiptap_node(child) for child in children])
        
    return ""

def parse_tiptap_document(content: dict | None) -> str:
    """Top-level entry: parse entire document to plain text."""
    if not content:
        return ""
    return parse_tiptap_node(content).strip()

def extract_sections(content: dict | None) -> list[dict]:
    """
    Split document into sections by H1/H2 headings.
    Returns: [{"title": "Section Title", "text": "section content..."}]
    Used by the chunker in Step 4.
    """
    if not content or content.get("type") != "doc":
        return []
        
    sections = []
    current_title = "Introduction"
    current_text_parts = []
    
    children = content.get("content", [])
    for child in children:
        child_type = child.get("type")
        
        # Split at H1 or H2 headings
        if child_type == "heading" and child.get("attrs", {}).get("level", 1) in (1, 2):
            section_text = "\n".join(current_text_parts).strip()
            if section_text or current_title != "Introduction":
                sections.append({
                    "title": current_title,
                    "text": section_text
                })
            
            heading_content = child.get("content", [])
            current_title = "".join([parse_tiptap_node(c) for c in heading_content]).strip()
            current_text_parts = []
        else:
            node_text = parse_tiptap_node(child)
            if node_text:
                current_text_parts.append(node_text)
                
    # Append the last section
    section_text = "\n".join(current_text_parts).strip()
    if section_text or current_title != "Introduction":
        sections.append({
            "title": current_title,
            "text": section_text
        })
        
    return sections

def extract_attachment_links(content: dict | None) -> list[dict]:
    """
    Recursively find all attachment link marks in the TipTap JSON.
    Returns list of dicts: [{"filename": "...", "url": "..."}]
    """
    if not content:
        return []
        
    links = []
    node_type = content.get("type")
    
    if node_type == "text":
        text = content.get("text", "")
        marks = content.get("marks", [])
        for mark in marks:
            if mark.get("type") == "link":
                attrs = mark.get("attrs", {})
                classes = attrs.get("class", "") or ""
                if "attachment-link" in classes:
                    url = attrs.get("href", "")
                    clean_text = text.lstrip("📎").strip()
                    links.append({
                        "filename": clean_text,
                        "url": url
                    })
        return links
        
    # Recurse children
    children = content.get("content", [])
    for child in children:
        links.extend(extract_attachment_links(child))
        
    return links
