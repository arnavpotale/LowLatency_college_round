import os
import tempfile
import pytest

from app.ingestion.parser import extract_text_from_file
from app.ingestion.chunker import chunk_document


def test_extract_txt_file(tmp_path):
    txt_file = tmp_path / "sample.txt"
    content = "Line 1: Clinical guidelines for patient intake.\nLine 2: Standard dosage is 25mg daily."
    txt_file.write_text(content, encoding="utf-8")

    text, file_type = extract_text_from_file(str(txt_file), "sample.txt")
    assert file_type == "txt"
    assert text == content


def test_extract_markdown_sections(tmp_path):
    md_file = tmp_path / "protocol.md"
    content = "# Patient Protocol\nThis is section one.\n\n## Dosage Instructions\nTake 50mg with water."
    md_file.write_text(content, encoding="utf-8")

    text, file_type = extract_text_from_file(str(md_file), "protocol.md")
    assert file_type == "md"
    assert "--- [Section: Patient Protocol] ---" in text
    assert "--- [Section: Dosage Instructions] ---" in text


def test_extract_empty_and_missing_files(tmp_path):
    # Missing file
    with pytest.raises(ValueError, match="File not found"):
        extract_text_from_file(str(tmp_path / "non_existent.txt"), "non_existent.txt")

    # 0-byte file
    empty_file = tmp_path / "empty.txt"
    empty_file.write_bytes(b"")
    with pytest.raises(ValueError, match="is empty"):
        extract_text_from_file(str(empty_file), "empty.txt")

    # Whitespace file
    ws_file = tmp_path / "whitespace.txt"
    ws_file.write_text("   \n\n\t  ", encoding="utf-8")
    with pytest.raises(ValueError, match="no readable text content"):
        extract_text_from_file(str(ws_file), "whitespace.txt")

    # Unsupported extension
    invalid_file = tmp_path / "binary.exe"
    invalid_file.write_bytes(b"some bytes")
    with pytest.raises(ValueError, match="Unsupported file extension"):
        extract_text_from_file(str(invalid_file), "binary.exe")


def test_chunk_document_character_offsets_and_lines():
    text = (
        "Paragraph one is here.\n"
        "It spans two lines.\n\n"
        "Paragraph two is separate.\n"
        "It has some more facts."
    )

    chunks = chunk_document(text, chunk_size=100, overlap=20)
    assert len(chunks) > 0

    for chunk in chunks:
        assert "text" in chunk
        assert "start_offset" in chunk
        assert "end_offset" in chunk
        assert "page_or_section" in chunk
        assert "line_start" in chunk
        assert "line_end" in chunk

        # Crucial check: verify slice integrity in original text
        slice_text = text[chunk["start_offset"]:chunk["end_offset"]]
        assert slice_text == chunk["text"]
        assert chunk["line_start"] >= 1
        assert chunk["line_end"] >= chunk["line_start"]


def test_chunk_document_long_paragraph_sliding_window():
    long_para = "Word " * 200  # 1000 characters
    chunks = chunk_document(long_para, chunk_size=300, overlap=50)

    assert len(chunks) >= 3
    for chunk in chunks:
        assert len(chunk["text"]) <= 300
        slice_text = long_para[chunk["start_offset"]:chunk["end_offset"]]
        assert slice_text == chunk["text"]


def test_chunk_document_with_section_and_page_markers():
    text = (
        "--- [Section: Introduction] ---\n"
        "Welcome to the document.\n\n"
        "--- [Page 2] ---\n"
        "This content is on page 2."
    )

    chunks = chunk_document(text, chunk_size=500, overlap=50)
    assert len(chunks) >= 2

    # First chunk should have Section: Introduction tag
    assert chunks[0]["page_or_section"] == "Section: Introduction"
    # Second chunk should have Page 2 tag
    assert chunks[1]["page_or_section"] == "Page 2"


def test_chunk_document_empty_input():
    assert chunk_document("") == []
    assert chunk_document("   \n\t") == []
