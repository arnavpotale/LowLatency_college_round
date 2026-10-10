import os
from typing import Tuple


def extract_text_from_file(file_path: str, filename: str) -> Tuple[str, str]:
    """
    Extracts plain text from an uploaded document.
    Supports .txt, .md, and .pdf files.
    
    Returns:
        Tuple of (extracted_text, file_type)
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

    if ext in ["txt", "md"]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
        return text, ext

    elif ext == "pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            pages = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                pages.append(f"--- [Page {page_num + 1}] ---\n{page_text}")
            doc.close()
            return "\n\n".join(pages), "pdf"
        except ImportError:
            # Fallback if PyMuPDF is not installed yet
            return (
                f"[PDF extraction fallback: PyMuPDF not installed in current environment. "
                f"File: {filename} saved successfully.]",
                "pdf"
            )
        except Exception as e:
            return f"[Error extracting text from PDF: {str(e)}]", "pdf"

    else:
        raise ValueError(f"Unsupported file extension: .{ext}")
