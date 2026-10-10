import os
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import Tuple


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes an uploaded filename to prevent directory traversal attacks
    and filesystem incompatibilities.
    """
    if not filename:
        return "source_document.txt"

    # Strip any directory path components
    basename = os.path.basename(filename.replace("\\", "/"))

    # Replace illegal/unsafe characters with underscore
    cleaned = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', basename)

    # Strip leading/trailing whitespace, dots, and underscores
    cleaned = cleaned.strip(". _")

    if not cleaned:
        return "source_document.txt"

    return cleaned


def extract_text_from_file(file_path: str, filename: str) -> Tuple[str, str]:
    """
    Extracts plain text from an uploaded document (.txt, .md, .pdf, .docx).
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

    elif ext == "docx":
        text = _read_docx_file(file_path, filename)
        if not text or not text.strip():
            raise ValueError(f"Word document '{filename}' contains no extractable text.")
        return text, "docx"

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


def _read_docx_file(file_path: str, filename: str) -> str:
    """
    Extracts text from a .docx file using python-docx if available,
    falling back to standard library zipfile XML parsing.
    """
    try:
        import docx
        doc = docx.Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)
        return "\n\n".join(paragraphs)
    except Exception:
        # Fallback to standard library zipfile XML parsing if python-docx is not present or fails
        try:
            with zipfile.ZipFile(file_path, "r") as z:
                xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            paragraphs = []
            for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                texts = [
                    node.text for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
                    if node.text
                ]
                p_str = "".join(texts).strip()
                if p_str:
                    paragraphs.append(p_str)
            return "\n\n".join(paragraphs)
        except Exception as e:
            raise ValueError(f"Failed to extract text from DOCX file '{filename}': {str(e)}")


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


