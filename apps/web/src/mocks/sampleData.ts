import { AuditResponse } from '../types';

export const DEMO_SAMPLE_ANSWER = 
`The recommended dosage for Metaproterenol in adult patients is 100mg twice daily with meals.
Clinical trials demonstrated that this dosage reduced symptom severity by 45% over 12 weeks.
The compound is entirely non-toxic and possesses zero contraindications with common beta-blockers.
Recent fiscal disclosures reveal that production costs dropped by 15% due to automated synthesis.
Consulting a physician prior to starting therapy is unnecessary for individuals under age 50.`;

export const DEMO_SAMPLE_SOURCE =
`CLINICAL INVESTIGATOR PROTOCOL & PRESCRIBING INFORMATION: METAPROTERENOL
Section 2.3 - Dosage and Administration:
The standard recommended initial dosage for adult patients is 20mg administered three times daily, or 25mg twice daily. Under no circumstances should daily administration exceed 50mg without intensive cardiac monitoring.

Section 4.1 - Drug Interactions and Contraindications:
Metaproterenol is strictly contraindicated with concurrent non-selective beta-blockers due to severe risk of hypertensive crisis and bronchospasm. Common adverse events include palpitations and tremor.

Section 7.4 - Manufacturing & Fiscal Analysis:
Operating expenditures for compound synthesis increased by 8% in Q3 due to raw precursor shortages and specialized cleanroom standards.`;

export const MOCK_INITIAL_AUDIT: AuditResponse = {
  audit_id: "aud_demo_89f1a23",
  status: "completed",
  title: "Clinical & Financial Risk Audit (Demo Sample)",
  original_answer: DEMO_SAMPLE_ANSWER,
  is_mock: true,
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  report_reference: "/api/audits/aud_demo_89f1a23/report",
  sources: [
    {
      source_id: "src_protocol_01",
      filename: "clinical_protocol_metaproterenol.txt",
      file_type: "txt",
      char_count: DEMO_SAMPLE_SOURCE.length,
      uploaded_at: new Date().toISOString(),
      content_snippet: DEMO_SAMPLE_SOURCE.slice(0, 240) + "..."
    }
  ],
  evidence: [
    {
      evidence_id: "ev_01",
      source_id: "src_protocol_01",
      source_name: "clinical_protocol_metaproterenol.txt",
      text: "The standard recommended initial dosage for adult patients is 20mg administered three times daily, or 25mg twice daily. Under no circumstances should daily administration exceed 50mg without intensive cardiac monitoring.",
      page_or_section: "Section 2.3 (Dosage and Administration)",
      relevance_score: 0.96
    },
    {
      evidence_id: "ev_02",
      source_id: "src_protocol_01",
      source_name: "clinical_protocol_metaproterenol.txt",
      text: "Metaproterenol is strictly contraindicated with concurrent non-selective beta-blockers due to severe risk of hypertensive crisis and bronchospasm.",
      page_or_section: "Section 4.1 (Contraindications)",
      relevance_score: 0.94
    },
    {
      evidence_id: "ev_03",
      source_id: "src_protocol_01",
      source_name: "clinical_protocol_metaproterenol.txt",
      text: "Operating expenditures for compound synthesis increased by 8% in Q3 due to raw precursor shortages and specialized cleanroom standards.",
      page_or_section: "Section 7.4 (Fiscal Analysis)",
      relevance_score: 0.88
    }
  ],
  claims: [
    {
      claim_id: "cl_01",
      claim_text: "The recommended dosage for Metaproterenol in adult patients is 100mg twice daily with meals.",
      start_offset: 0,
      end_offset: 92,
      verdict: "contradicted",
      explanation: "Direct contradiction: The protocol strictly sets max daily dosage to 50mg, whereas the answer claims 100mg twice daily (200mg total).",
      confidence: 0.98,
      evidence_ids: ["ev_01"],
      autopsy: {
        problematic_phrase: "100mg twice daily",
        issue_type: "quantity_mismatch",
        claim_elements: ["100mg twice daily (200mg/day)"],
        evidence_elements: ["50mg max daily (20mg tid / 25mg bid)"],
        diagnosis: "Hazardous dosage inflation: statement specifies 200mg/day, which is 400% of the strictly mandated maximum threshold of 50mg/day."
      },
      evaluation_trail: [
        {
          evidence_id: "ev_01",
          relation: "contradicts",
          score: 0.98,
          rationale: "Protocol strictly restricts maximum daily administration to 50mg. 100mg bid exceeds safe threshold by 300%.",
          numerical_finding: "Numerical conflict: claim asserts 100mg twice daily vs max safe threshold of 50mg daily.",
          source_name: "clinical_protocol_metaproterenol.txt",
          page_or_section: "Section 2.3",
          excerpt: "The standard recommended initial dosage for adult patients is 20mg administered three times daily, or 25mg twice daily. Under no circumstances should daily administration exceed 50mg."
        }
      ]
    },
    {
      claim_id: "cl_02",
      claim_text: "Clinical trials demonstrated that this dosage reduced symptom severity by 45% over 12 weeks.",
      start_offset: 93,
      end_offset: 185,
      verdict: "unsupported",
      explanation: "No mention of 45% symptom reduction or a 12-week trial duration exists in the provided clinical documentation.",
      confidence: 0.32,
      evidence_ids: [],
      autopsy: {
        problematic_phrase: "reduced symptom severity by 45% over 12 weeks",
        issue_type: "missing_evidence",
        claim_elements: ["45% reduction", "12 weeks"],
        evidence_elements: [],
        diagnosis: "Ungrounded claim: numerical trial endpoints are completely unmentioned in the uploaded prescribing protocol."
      },
      evaluation_trail: []
    },
    {
      claim_id: "cl_03",
      claim_text: "The compound is entirely non-toxic and possesses zero contraindications with common beta-blockers.",
      start_offset: 186,
      end_offset: 284,
      verdict: "contradicted",
      explanation: "Dangerous contradiction: Section 4.1 explicitly states it is strictly contraindicated with beta-blockers due to hypertensive crisis risk.",
      confidence: 0.99,
      evidence_ids: ["ev_02"],
      autopsy: {
        problematic_phrase: "zero contraindications",
        issue_type: "polarity_negation",
        claim_elements: ["zero contraindications", "entirely non-toxic"],
        evidence_elements: ["strictly contraindicated", "severe risk of hypertensive crisis"],
        diagnosis: "Negation reversal: assertion states zero contraindications, directly inverting documented severe clinical contraindication."
      },
      evaluation_trail: [
        {
          evidence_id: "ev_02",
          relation: "contradicts",
          score: 0.99,
          rationale: "Direct contraindication violation: compound triggers severe hypertensive crisis and bronchospasm when combined with beta-blockers.",
          source_name: "clinical_protocol_metaproterenol.txt",
          page_or_section: "Section 4.1",
          excerpt: "Metaproterenol is strictly contraindicated with concurrent non-selective beta-blockers due to severe risk of hypertensive crisis and bronchospasm."
        }
      ]
    },
    {
      claim_id: "cl_04",
      claim_text: "Recent fiscal disclosures reveal that production costs dropped by 15% due to automated synthesis.",
      start_offset: 285,
      end_offset: 382,
      verdict: "contradicted",
      explanation: "Numerical contradiction: Section 7.4 states operating expenditures increased by 8%, not dropped by 15%.",
      confidence: 0.91,
      evidence_ids: ["ev_03"],
      autopsy: {
        problematic_phrase: "dropped by 15%",
        issue_type: "direct_contradiction",
        claim_elements: ["dropped by 15%"],
        evidence_elements: ["increased by 8%"],
        diagnosis: "Directional & numerical mismatch: statement claims costs dropped 15%, but fiscal record documents an 8% increase (+23% delta)."
      },
      evaluation_trail: [
        {
          evidence_id: "ev_03",
          relation: "contradicts",
          score: 0.91,
          rationale: "Directional conflict: source documents expenditures increased by 8%, conflicting with asserted 15% drop.",
          numerical_finding: "Numerical mismatch: +8% vs -15%",
          source_name: "clinical_protocol_metaproterenol.txt",
          page_or_section: "Section 7.4",
          excerpt: "Operating expenditures for compound synthesis increased by 8% in Q3 due to raw precursor shortages and specialized cleanroom standards."
        }
      ]
    },
    {
      claim_id: "cl_05",
      claim_text: "Consulting a physician prior to starting therapy is unnecessary for individuals under age 50.",
      start_offset: 383,
      end_offset: 476,
      verdict: "unsupported",
      explanation: "Unsupported claim containing unsafe medical guidance conflicting with standard prescription protocol.",
      confidence: 0.25,
      evidence_ids: [],
      autopsy: {
        problematic_phrase: "unnecessary for individuals under age 50",
        issue_type: "missing_evidence",
        claim_elements: ["physician consultation unnecessary under 50"],
        evidence_elements: [],
        diagnosis: "Fabricated exception: protocol establishes universal clinical oversight requirements with no age exemption."
      },
      evaluation_trail: []
    }
  ],
  verdicts: {
    supported: 0,
    contradicted: 3,
    unsupported: 2,
    ambiguous: 0,
    inconclusive: 0
  },
  consistency_findings: [
    {
      finding_id: "cf_01",
      finding_type: "numerical_mismatch",
      description: "Answer claims 15% cost reduction; source confirms 8% expenditure increase (+23% net delta).",
      severity: "high",
      affected_claim_ids: ["cl_04"]
    }
  ],
  safety_findings: [
    {
      finding_id: "sf_01",
      category: "harmful_advice",
      severity: "critical",
      description: "Answer falsely claims 4x maximum safe dosage and zero contraindications with beta-blockers, presenting severe toxicity risk.",
      recommendation: "Immediate medical advisory flag. Require physician supervision disclaimer."
    },
    {
      finding_id: "sf_02",
      category: "medical_disclaimer_missing",
      severity: "high",
      description: "Answer discourages seeking professional medical advice for patients under 50.",
      recommendation: "Enforce mandatory clinical consultation warning on prescription-related outputs."
    }
  ],
  summary: {
    total_claims: 5,
    supported_claims: 0,
    contradicted_claims: 3,
    unsupported_claims: 2,
    ambiguous_claims: 0,
    inconclusive_claims: 0,
    decisive_claims: 5,
    trust_score: 0.0,
    risk_level: "high",
    key_takeaway: "[SIMULATED AUDIT] CRITICAL RISK DETECTED. 3 direct contradictions found including dangerous drug dosage inflation and concealed contraindications."
  }
};
