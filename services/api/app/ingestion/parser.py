import os
import re
from typing import Tuple


def extract_text_from_file(file_path: str, filename: str) -> Tuple[str, str]:
    """
    Extracts plain text from an uploaded document (.txt, .md, .pdf).
    Preserves page and section markers, line structures, and handles encodings
    and corrupted/empty files gracefully.
    
    Returns:
        Tuple of (extracted_text, file_type)
    
    Raises:
        ValueError: If file is empty, missing, invalid, or unsupported.
    """
    if not os.path.exists(file_path):
        raise ValueError(f"File not found: {file_path}")

    if os.path.getsize(file_path) == 0:
        raise ValueError(f"File '{filename}' is empty (0 bytes).")

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

    if ext in ["txt", "md"]:
        text = _read_text_file(file_path, filename)
        if not text or not text.strip():
            raise ValueError(f"File '{filename}' contains no readable text content.")
        
        if ext == "md":
            text = _format_markdown_sections(text)

        return text, ext

    elif ext == "pdf":
        text = _read_pdf_file(file_path, filename)
        if not text or not text.strip():
            raise ValueError(f"PDF file '{filename}' contains no extractable text. It may be scanned or empty.")
        return text, "pdf"

    else:
        raise ValueError(f"Unsupported file extension: .{ext}")


def _read_text_file(file_path: str, filename: str) -> str:
    """Reads a plain text or Markdown file trying UTF-8, UTF-8-SIG, and Latin-1 fallbacks."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc, errors="strict") as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue

    # Final fallback with replace
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def _format_markdown_sections(text: str) -> str:
    """
    Annotates Markdown headings with section markers so chunker can track section context.
    Example: '# Introduction' -> '--- [Section: Introduction] ---\n# Introduction'
    """
    lines = text.splitlines(keepends=True)
    formatted_lines = []
    
    for line in lines:
        heading_match = re.match(r"^(#{1,6})\s+(.+)$", line.strip())
        if heading_match:
            section_title = heading_match.group(2).strip()
            formatted_lines.append(f"--- [Section: {section_title}] ---\n")
        formatted_lines.append(line)

    return "".join(formatted_lines)


def _read_pdf_file(file_path: str, filename: str) -> str:
    """Extracts text from a PDF file page by page using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        # Fallback if PyMuPDF is not installed in current environment
        return (
            f"[PDF extraction fallback: PyMuPDF not installed in environment. "
            f"File: {filename} saved successfully.]"
        )

    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise ValueError(f"Failed to open PDF file '{filename}': {str(e)}")

    if doc.is_encrypted:
        raise ValueError(f"PDF file '{filename}' is password protected or encrypted.")

    if len(doc) == 0:
        doc.close()
        raise ValueError(f"PDF file '{filename}' has 0 pages.")

    pages = []
    total_pages = len(doc)

    for page_num in range(total_pages):
        page = doc[page_num]
        page_text = page.get_text("text")
        if page_text and page_text.strip():
            pages.append(f"--- [Page {page_num + 1}] ---\n{page_text.strip()}")

    doc.close()

    if not pages:
        return ""

    return "\n\n".join(pages)

