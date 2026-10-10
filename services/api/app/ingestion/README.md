# Module: Document Ingestion

**Owner:** Developer 3 — Document Intelligence and Retrieval

## Purpose
This module handles:
1. Parsing raw uploaded files (`.pdf`, `.txt`, `.md`).
2. Robust text extraction with page and section boundary tracking using `PyMuPDF` (`fitz`).
3. Document chunking into passages with exact character offsets and metadata.

## Module Interface
- `extract_text_from_file(file_path: str, filename: str) -> Tuple[str, str]`: Extracts full text and detects file format.
- `chunk_document(text: str, chunk_size: int, overlap: int) -> List[Dict[str, Any]]`: Chunks text into granular passages with page/section citations.

## Planned Enhancements
- OCR fallback for scanned PDF documents using Tesseract / PaddleOCR.
- Table and structured data extraction.
- Hierarchical section title extraction.
