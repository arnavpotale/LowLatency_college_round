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


def test_mock_mode_explicitly_labelled(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", True)

    create_res = client.post("/api/audits", json={"title": "Mock Audit Label Test"})
    audit_id = create_res.json()["audit_id"]

    client.post(f"/api/audits/{audit_id}/sources", data={"text_title": "dummy.txt", "text_content": "Any text"})
    client.post(f"/api/audits/{audit_id}/answer", json={"original_answer": "Clinical dosage is 25mg daily."})

    res = client.post(f"/api/audits/{audit_id}/analyze")
    assert res.status_code == 200
    data = res.json()
    assert data["is_mock"] is True
    assert data["status"] == "completed"
    assert "MOCK AUDIT RESULT" in data["summary"]["key_takeaway"]


def test_deterministic_mode_audit_lifecycle(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    create_res = client.post("/api/audits", json={"title": "Real Deterministic Audit"})
    audit_id = create_res.json()["audit_id"]

    # Add real source
    client.post(
        f"/api/audits/{audit_id}/sources",
        data={
            "text_title": "protocol.txt",
            "text_content": "Recommended initial dosage is 25mg daily under supervision. Maximum dose is 50mg daily."
        }
    )

    # Submit answer
    client.post(
        f"/api/audits/{audit_id}/answer",
        json={"original_answer": "Recommended initial dosage is 25mg daily under supervision."}
    )

    res = client.post(f"/api/audits/{audit_id}/analyze")
    assert res.status_code == 200
    data = res.json()

    assert data["is_mock"] is False
    assert data["status"] == "completed"
    assert "DETERMINISTIC RULE-BASED AUDIT" in data["summary"]["key_takeaway"]
    assert len(data["claims"]) == 1
    assert data["claims"][0]["verdict"] == "supported"
    assert len(data["claims"][0]["evidence_ids"]) == 1


def test_deterministic_mode_numerical_contradiction(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    create_res = client.post("/api/audits", json={"title": "Numerical Contradiction Audit"})
    audit_id = create_res.json()["audit_id"]

    client.post(
        f"/api/audits/{audit_id}/sources",
        data={
            "text_title": "protocol.txt",
            "text_content": "Clinical trial protocol: Maximum safe daily dose is 50mg."
        }
    )

    client.post(
        f"/api/audits/{audit_id}/answer",
        json={"original_answer": "Patients may safely consume 100mg daily of this medication."}
    )

    res = client.post(f"/api/audits/{audit_id}/analyze")
    assert res.status_code == 200
    data = res.json()

    assert data["is_mock"] is False
    assert data["claims"][0]["verdict"] == "contradicted"
    assert "exceeding" in data["claims"][0]["explanation"].lower() or "contradiction" in data["claims"][0]["explanation"].lower()
    # Check that consistency findings captured this numerical conflict
    assert len(data["consistency_findings"]) > 0
    assert data["consistency_findings"][0]["finding_type"] == "numerical_mismatch"


def test_deterministic_mode_unsupported_no_fabricated_citations(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    create_res = client.post("/api/audits", json={"title": "Unsupported Claim Audit"})
    audit_id = create_res.json()["audit_id"]

    client.post(
        f"/api/audits/{audit_id}/sources",
        data={
            "text_title": "financial.txt",
            "text_content": "Operating expenses grew by 8% in Q3."
        }
    )

    client.post(
        f"/api/audits/{audit_id}/answer",
        json={"original_answer": "The company developed a quantum processor operating at 10GHz."}
    )

    res = client.post(f"/api/audits/{audit_id}/analyze")
    assert res.status_code == 200
    data = res.json()

    assert data["is_mock"] is False
    assert data["claims"][0]["verdict"] == "unsupported"
    # Invariant: Unsupported claims must have 0 citations (never fabricated)
    assert data["claims"][0]["evidence_ids"] == []


def test_deterministic_mode_ambiguous_evidence(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    create_res = client.post("/api/audits", json={"title": "Ambiguous Evidence Audit"})
    audit_id = create_res.json()["audit_id"]

    client.post(
        f"/api/audits/{audit_id}/sources",
        data={
            "text_title": "conflicting_trials.txt",
            "text_content": (
                "Cohort A demonstrated that this therapy reduced symptom severity.\n\n"
                "Confirmatory trials observed no reduction in symptom severity, showing statistical equivalence to placebo."
            )
        }
    )

    client.post(
        f"/api/audits/{audit_id}/answer",
        json={"original_answer": "Clinical trials demonstrated that this therapy reduced symptom severity."}
    )

    res = client.post(f"/api/audits/{audit_id}/analyze")
    assert res.status_code == 200
    data = res.json()

    assert data["is_mock"] is False
    assert data["claims"][0]["verdict"] == "ambiguous"
    assert len(data["claims"][0]["evidence_ids"]) >= 2
    assert "conflicting evidence" in data["claims"][0]["explanation"].lower()


def test_llm_provider_failure_not_replaced_by_mock(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "llm")
    monkeypatch.setattr(settings, "openai_api_key", None)

    create_res = client.post("/api/audits", json={"title": "LLM Failure Test"})
    audit_id = create_res.json()["audit_id"]

    client.post(f"/api/audits/{audit_id}/sources", data={"text_title": "doc.txt", "text_content": "Some source text."})
    client.post(f"/api/audits/{audit_id}/answer", json={"original_answer": "An answer statement to verify."})

    res = client.post(f"/api/audits/{audit_id}/analyze")
    # Must fail with 502 Bad Gateway and not silently fall back to mock!
    assert res.status_code == 502
    assert "Verification provider failed" in res.json()["detail"]

    # Verify audit status in database is FAILED, not completed
    get_res = client.get(f"/api/audits/{audit_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "failed"


def test_audit_response_schema_compatibility(client, monkeypatch):
    from app.core.config import settings
    # Test response schema completeness in both mock and real modes
    for mock_mode in [True, False]:
        monkeypatch.setattr(settings, "enable_mock_verification", mock_mode)
        monkeypatch.setattr(settings, "verification_provider", "deterministic")

        create_res = client.post("/api/audits", json={"title": f"Compatibility Test (Mock={mock_mode})"})
        audit_id = create_res.json()["audit_id"]

        client.post(
            f"/api/audits/{audit_id}/sources",
            data={"text_title": "source.txt", "text_content": "Standard dosage is 25mg daily."}
        )
        client.post(f"/api/audits/{audit_id}/answer", json={"original_answer": "Standard dosage is 25mg daily."})

        res = client.post(f"/api/audits/{audit_id}/analyze")
        assert res.status_code == 200
        data = res.json()

        # Check all required top-level contract fields expected by frontend
        assert "audit_id" in data
        assert "status" in data
        assert "original_answer" in data
        assert "sources" in data
        assert "claims" in data
        assert "evidence" in data
        assert "verdicts" in data
        assert "consistency_findings" in data
        assert "safety_findings" in data
        assert "summary" in data
        assert "is_mock" in data
        assert data["is_mock"] is mock_mode


def test_full_workflow_real_file_upload_all_five_verdict_cases(client, monkeypatch):
    """
    Stage 2 End-to-End Validation:
    Tests the complete application lifecycle with a real uploaded file:
    1. Create audit
    2. Upload real document via multipart upload
    3. Submit AI answer with claims covering all 5 verdict categories:
       - supported
       - numerical contradiction
       - unsupported
       - ambiguous (conflicting sources)
       - inconclusive (insufficient context)
    4. Analyze audit using deterministic verifier
    5. Verify database persistence and schema compatibility
    6. Verify generated report
    """
    import io
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    # 1. Create audit
    create_res = client.post("/api/audits", json={"title": "E2E Multi-Category Audit", "notes": "Stage 2 validation"})
    assert create_res.status_code == 201
    audit_id = create_res.json()["audit_id"]

    # 2. Upload real file via multipart upload
    doc_content = (
        "Clinical Pharmacology Protocol: Standard initial dosage is 10mg daily for adult hypertension. "
        "Maximum allowable safe dosage is 40mg daily.\n\n"
        "Trial Alpha concluded that daily therapy reduced symptom severity.\n\n"
        "Trial Beta observed no reduction in symptom severity, showing equivalence to placebo.\n\n"
        "Apache Cassandra is a distributed database with eventual consistency and replica nodes."
    ).encode("utf-8")

    upload_res = client.post(
        f"/api/audits/{audit_id}/sources",
        files={"file": ("clinical_protocol.txt", io.BytesIO(doc_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    source_data = upload_res.json()
    assert source_data["filename"] == "clinical_protocol.txt"
    assert source_data["char_count"] == len(doc_content)

    # 3. Submit AI answer containing all 5 verdict cases
    answer_text = (
        "Standard initial dosage is 10mg daily for adult hypertension. "
        "Patients may safely consume 150mg daily without risk. "
        "The treatment improves competitive swimming speed by 50%. "
        "Clinical trials conclude that daily therapy reduced symptom severity. "
        "Cassandra write latency defaults to exactly 2ms across replica nodes."
    )
    answer_res = client.post(f"/api/audits/{audit_id}/answer", json={"original_answer": answer_text})
    assert answer_res.status_code == 200

    # 4. Analyze audit
    analyze_res = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_res.status_code == 200
    result = analyze_res.json()

    # Integrity & contract assertions
    assert result["status"] == "completed"
    assert result["is_mock"] is False
    assert "[DETERMINISTIC RULE-BASED AUDIT]" in result["summary"]["key_takeaway"]
    assert len(result["claims"]) == 5

    # Match each claim
    claims_by_text = {c["claim_text"]: c for c in result["claims"]}

    # Case 1: Directly supported claim
    c1 = next(c for c in result["claims"] if "10mg daily" in c["claim_text"])
    assert c1["verdict"] == "supported"
    assert len(c1["evidence_ids"]) >= 1

    # Case 2: Numerically contradicted claim (150mg vs max 40mg)
    c2 = next(c for c in result["claims"] if "150mg daily" in c["claim_text"])
    assert c2["verdict"] == "contradicted"
    assert len(c2["evidence_ids"]) >= 1
    assert "numerical" in c2["explanation"].lower() or "exceeding" in c2["explanation"].lower() or "discrepancy" in c2["explanation"].lower()

    # Case 3: Unsupported claim (never receive fabricated citations)
    c3 = next(c for c in result["claims"] if "swimming speed" in c["claim_text"])
    assert c3["verdict"] == "unsupported"
    assert c3["evidence_ids"] == []  # Citation invariant: strictly empty

    # Case 4: Ambiguous claim (conflicting trials Alpha vs Beta)
    c4 = next(c for c in result["claims"] if "reduced symptom severity" in c["claim_text"])
    assert c4["verdict"] == "ambiguous"
    assert len(c4["evidence_ids"]) >= 2  # Must preserve both conflicting evidence items

    # Case 5: Inconclusive claim (insufficient context)
    c5 = next(c for c in result["claims"] if "Cassandra write latency" in c["claim_text"])
    assert c5["verdict"] == "inconclusive"
    assert len(c5["evidence_ids"]) >= 1

    # Verify consistency finding captured numerical discrepancy
    assert any(cf["finding_type"] == "numerical_mismatch" for cf in result["consistency_findings"])

    # 5. Retrieve audit state via GET
    get_res = client.get(f"/api/audits/{audit_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "completed"
    assert get_res.json()["is_mock"] is False

    # 6. Retrieve report
    report_res = client.get(f"/api/audits/{audit_id}/report")
    assert report_res.status_code == 200
    assert "Second Opinion — Audit Report" in report_res.text
    assert "DETERMINISTIC RULE-BASED AUDIT" in report_res.text


def test_end_to_end_compound_decomposition_multi_passage_audit(client, monkeypatch):
    """
    Milestone 2 End-to-End Regression Test:
    1. Upload multi-passage source document.
    2. Submit compound AI answer requiring atomic decomposition into distinct factual propositions.
    3. Run live deterministic verification.
    4. Assert:
       - Compound sentences are decomposed into discrete verifiable claims.
       - Exact slice reconstruction: original_answer[start:end] == claim_text.
       - Independent evidence retrieval per claim.
       - Multi-passage reasoning produces expected verdicts.
       - Citations match passages actually supplied and retrieved.
       - Generated markdown report contains claim findings and citation passages that resolve properly.
    """
    import io
    from app.core.config import settings
    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    # 1. Create audit
    create_res = client.post("/api/audits", json={"title": "Compound Multi-Passage Audit", "notes": "Milestone 2 e2e test"})
    assert create_res.status_code == 201
    audit_id = create_res.json()["audit_id"]

    # 2. Upload source document containing distinct passages
    doc_content = (
        "Enterprise Architecture Document:\n\n"
        "Passage A: In Q1 2024, CloudCorp revenue grew by 18% year-over-year across enterprise subscriptions.\n\n"
        "Passage B: In Q2 2024, operating expenses rose by 4% due to infrastructure investments.\n\n"
        "Passage C: The platform encrypts all stored customer data at rest using AES-256."
    ).encode("utf-8")

    upload_res = client.post(
        f"/api/audits/{audit_id}/sources",
        files={"file": ("architecture_report.txt", io.BytesIO(doc_content), "text/plain")}
    )
    assert upload_res.status_code == 201

    # 3. Submit compound AI answer with coordinate conjunctions and contrastive clauses
    answer_text = (
        "In Q1 2024, CloudCorp revenue grew by 18% year-over-year, and operating expenses rose by 4% in Q2 2024. "
        "The platform encrypts all stored customer data at rest, but it stores all user credentials in plaintext."
    )
    ans_res = client.post(f"/api/audits/{audit_id}/answer", json={"original_answer": answer_text})
    assert ans_res.status_code == 200

    # 4. Trigger analysis
    analyze_res = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_res.status_code == 200
    result = analyze_res.json()

    assert result["status"] == "completed"
    assert result["is_mock"] is False
    claims = result["claims"]

    # Must decompose into 4 atomic propositions
    assert len(claims) == 4

    # Offset validity invariant
    for c in claims:
        assert answer_text[c["start_offset"]:c["end_offset"]] == c["claim_text"]

    # Verify claim 1: Q1 revenue growth
    c1 = next(c for c in claims if "revenue grew by 18%" in c["claim_text"])
    assert c1["verdict"] == "supported"
    assert len(c1["evidence_ids"]) >= 1

    # Verify claim 2: Q2 expense rise
    c2 = next(c for c in claims if "operating expenses rose by 4%" in c["claim_text"])
    assert c2["verdict"] == "supported"
    assert len(c2["evidence_ids"]) >= 1

    # Verify claim 3: Encryption at rest
    c3 = next(c for c in claims if "encrypts all stored customer data" in c["claim_text"])
    assert c3["verdict"] == "supported"
    assert len(c3["evidence_ids"]) >= 1

    # Verify claim 4: Plaintext credentials (unsupported/no citation fabricated, triggers security guardrail)
    c4 = next(c for c in claims if "plaintext" in c["claim_text"])
    assert c4["verdict"] in ["unsupported", "inconclusive"]
    # Check that safety finding flagged plaintext password risk
    assert any("plaintext" in sf["description"].lower() for sf in result["safety_findings"])

    # 5. Check markdown report citation resolution
    report_res = client.get(f"/api/audits/{audit_id}/report")
    assert report_res.status_code == 200
    report_text = report_res.text
    assert "Second Opinion — Audit Report" in report_text
    assert "Referenced Evidence Passages" in report_text

    # Verify evidence mapping
    evidence_map = {ev["evidence_id"]: ev for ev in result["evidence"]}
    for c in claims:
        for ev_id in c["evidence_ids"]:
            assert ev_id in evidence_map
            assert ev_id in report_text
            # Cited text appears in report
            assert evidence_map[ev_id]["text"] in report_text


def test_end_to_end_pdf_upload_multi_passage_audit(client, monkeypatch):
    """
    Phase D End-to-End Integration Verification:
    1. Generates and uploads a real multi-page PDF document with known page markers.
    2. Parses and chunks the PDF preserving page locations (Page 1, Page 2).
    3. Submits an answer with compound coordinate assertions (supported, contradicted, and multi-passage conflict).
    4. Decomposes answer into atomic propositions with exact slice offsets.
    5. Retrieves candidate evidence with hybrid retriever.
    6. Verifies deterministic verification correctly identifies:
       - Supported claim citing Page 1.
       - Contradicted numerical claim citing Page 1.
       - Ambiguous claim citing conflicting evidence from Page 2.
    7. Evaluates consistency findings and safety guardrails.
    8. Validates Markdown report citations and evidence references.
    9. Tests NLI provider on the same PDF audit.
    """
    import io
    import fitz
    from app.core.config import settings

    # 1. Generate real PDF with three distinct pages
    doc = fitz.open()
    p1 = doc.new_page()
    p1.insert_text((50, 72), "Clinical Protocol Monograph:\nDaily standard medication dosage is strictly 20mg for adult hypertension.")
    p2 = doc.new_page()
    p2.insert_text((50, 72), "Multicenter Trial Alpha:\nTrial Alpha concluded therapy reduced overall cardiac mortality.")
    p3 = doc.new_page()
    p3.insert_text((50, 72), "Multicenter Trial Beta:\nTrial Beta observed therapy failed to reduce cardiac mortality, showing strict equivalence to placebo.")
    pdf_bytes = doc.write()
    doc.close()

    monkeypatch.setattr(settings, "enable_mock_verification", False)
    monkeypatch.setattr(settings, "verification_provider", "deterministic")

    # 2. Create audit session
    create_res = client.post("/api/audits", json={"title": "PDF Ingestion Multi-Passage Audit", "notes": "Phase D validation"})
    assert create_res.status_code == 201
    audit_id = create_res.json()["audit_id"]

    # 3. Upload real PDF via multipart form
    upload_res = client.post(
        f"/api/audits/{audit_id}/sources",
        files={"file": ("clinical_trial.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert upload_res.status_code == 201
    src_data = upload_res.json()
    assert src_data["file_type"] == "pdf"

    # 4. Submit answer with compound clauses
    answer_text = (
        "Daily standard medication dosage is strictly 20mg, but patients may safely take up to 100mg without titration. "
        "Clinical trials conclude that the therapy reduced cardiac mortality."
    )
    ans_res = client.post(f"/api/audits/{audit_id}/answer", json={"original_answer": answer_text})
    assert ans_res.status_code == 200

    # 5. Analyze with deterministic engine
    analyze_res = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_res.status_code == 200
    res_det = analyze_res.json()

    assert res_det["status"] == "completed"
    assert res_det["is_mock"] is False
    claims = res_det["claims"]
    assert len(claims) == 3

    # Exact slice invariant
    for c in claims:
        assert answer_text[c["start_offset"]:c["end_offset"]] == c["claim_text"]

    # Claim 1: 20mg standard dosage -> supported, cites Page 1
    c1 = next(c for c in claims if "strictly 20mg" in c["claim_text"])
    assert c1["verdict"] == "supported"
    assert len(c1["evidence_ids"]) >= 1

    # Claim 2: 100mg -> contradicted, cites Page 1
    c2 = next(c for c in claims if "100mg" in c["claim_text"])
    assert c2["verdict"] == "contradicted"
    assert len(c2["evidence_ids"]) >= 1

    # Claim 3: reduced cardiac mortality -> ambiguous due to Trial Alpha vs Trial Beta on Page 2
    c3 = next(c for c in claims if "reduced cardiac mortality" in c["claim_text"])
    assert c3["verdict"] == "ambiguous"
    assert len(c3["evidence_ids"]) >= 2

    # Check that evidence excerpts contain Page 1 and Page 2 markers
    ev_pages = [ev["page_or_section"] for ev in res_det["evidence"]]
    assert any("Page 1" in p for p in ev_pages)
    assert any("Page 2" in p for p in ev_pages)

    # Check safety finding flagged hazardous dosage without titration
    assert any("dosage" in sf["description"].lower() or "titration" in sf["description"].lower() for sf in res_det["safety_findings"])

    # 6. Fetch markdown report and verify citation resolution
    report_res = client.get(f"/api/audits/{audit_id}/report")
    assert report_res.status_code == 200
    report_text = report_res.text
    assert "Second Opinion — Audit Report" in report_text
    assert "Referenced Evidence Passages" in report_text

    # 7. Repeat analysis with NLI provider
    monkeypatch.setattr(settings, "verification_provider", "nli")
    analyze_nli_res = client.post(f"/api/audits/{audit_id}/analyze")
    assert analyze_nli_res.status_code == 200
    res_nli = analyze_nli_res.json()
    assert res_nli["status"] == "completed"
    assert len(res_nli["claims"]) == 3
    # NLI also identifies the conflict as ambiguous
    nli_c3 = next(c for c in res_nli["claims"] if "reduced cardiac mortality" in c["claim_text"])
    assert nli_c3["verdict"] == "ambiguous"



