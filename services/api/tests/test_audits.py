import io
from app.schemas import VerdictCategory


def test_audit_lifecycle_end_to_end(client):
    # 1. Create audit
    create_res = client.post("/api/audits", json={"title": "Test Clinical Audit", "notes": "Evaluating drug dosage claims"})
    assert create_res.status_code == 201
    audit = create_res.json()
    audit_id = audit["audit_id"]
    assert audit["status"] == "created"
    assert audit["title"] == "Test Clinical Audit"

    # 2. Add text source
    source_res = client.post(
        f"/api/audits/{audit_id}/sources",
        data={"text_title": "protocol.txt", "text_content": "The standard dosage is 25mg daily. Maximum recommended dose is 50mg daily."}
    )
    assert source_res.status_code == 201
    source_data = source_res.json()
    assert source_data["filename"] == "protocol.txt"
    assert source_data["char_count"] > 0

    # 3. Submit original answer
    answer_text = (
        "The standard dosage for this medication is 25mg daily. "
        "However, patients may take up to 100mg daily safely. "
        "It also boosts cognitive speed by 30% according to studies."
    )
    ans_res = client.post(f"/api/audits/{audit_id}/answer", json={"original_answer": answer_text})
    assert ans_res.status_code == 200
    assert ans_res.json()["original_answer"] == answer_text

    # 4. Trigger analysis
    analyze_res = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_res.status_code == 200
    result = analyze_res.json()

    assert result["audit_id"] == audit_id
    assert result["status"] == "completed"
    assert result["is_mock"] is True
    assert len(result["claims"]) > 0
    assert len(result["evidence"]) > 0
    assert "verdicts" in result
    assert result["summary"] is not None
    assert result["summary"]["trust_score"] >= 0.0

    # Check claim structure and offset validity
    for claim in result["claims"]:
        assert "claim_id" in claim
        assert "claim_text" in claim
        assert claim["start_offset"] >= 0
        assert claim["end_offset"] > claim["start_offset"]
        assert claim["verdict"] in [v.value for v in VerdictCategory]
        # Verify slice in original_answer
        sliced_claim = answer_text[claim["start_offset"]:claim["end_offset"]]
        assert sliced_claim == claim["claim_text"]

    # 5. Get audit by ID
    get_res = client.get(f"/api/audits/{audit_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "completed"

    # 6. Get results endpoint
    results_res = client.get(f"/api/audits/{audit_id}/results")
    assert results_res.status_code == 200
    assert len(results_res.json()["claims"]) == len(result["claims"])

    # 7. Get markdown report
    report_res = client.get(f"/api/audits/{audit_id}/report")
    assert report_res.status_code == 200
    assert "Second Opinion — Audit Report" in report_res.text


def test_file_upload_source(client):
    create_res = client.post("/api/audits", json={"title": "File Upload Audit"})
    audit_id = create_res.json()["audit_id"]

    file_content = b"Reference document excerpt: High availability requires 3 nodes."
    file_tuple = ("architecture.txt", io.BytesIO(file_content), "text/plain")
    
    upload_res = client.post(
        f"/api/audits/{audit_id}/sources",
        files={"file": file_tuple}
    )
    assert upload_res.status_code == 201
    data = upload_res.json()
    assert data["filename"] == "architecture.txt"
    assert data["file_type"] == "txt"
    assert data["char_count"] == len(file_content.decode())


def test_unsupported_file_extension(client):
    create_res = client.post("/api/audits", json={"title": "Invalid File Test"})
    audit_id = create_res.json()["audit_id"]

    file_content = b"malicious binary payload"
    file_tuple = ("script.exe", io.BytesIO(file_content), "application/octet-stream")
    
    upload_res = client.post(
        f"/api/audits/{audit_id}/sources",
        files={"file": file_tuple}
    )
    assert upload_res.status_code == 400
    assert "Unsupported file extension" in upload_res.json()["detail"]


def test_empty_answer_analysis_validation(client):
    create_res = client.post("/api/audits", json={"title": "Empty Audit"})
    audit_id = create_res.json()["audit_id"]

    analyze_res = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_res.status_code == 400
    assert "empty original answer" in analyze_res.json()["detail"]
