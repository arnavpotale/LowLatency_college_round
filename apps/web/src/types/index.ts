/**
 * Shared Data Contract Types
 * Directly mirrors backend Pydantic models in services/api/app/schemas/
 */

export type VerdictCategory =
  | 'supported'
  | 'contradicted'
  | 'unsupported'
  | 'ambiguous'
  | 'inconclusive';

export type AuditStatus = 'created' | 'processing' | 'completed' | 'failed';

export interface Source {
  source_id: string;
  filename: string;
  file_type: string;
  char_count: number;
  uploaded_at: string;
  content_snippet: string;
  raw_content?: string;
}

export interface Evidence {
  evidence_id: string;
  source_id: string;
  source_name: string;
  text: string;
  page_or_section: string;
  relevance_score: number;
  start_offset?: number;
  end_offset?: number;
  start_char?: number;
  end_char?: number;
}

export interface PairResult {
  evidence_id: string;
  relation: 'entails' | 'contradicts' | 'neutral' | 'insufficient' | string;
  score: number;
  rationale: string;
  contradiction_detail?: string;
  numerical_finding?: string;
  source_name?: string;
  page_or_section?: string;
  excerpt?: string;
}

export interface ConflictDetail {
  conflict_id: string;
  conflict_type: 'direct_contradiction' | 'divergent_metrics' | 'scope_mismatch' | string;
  description: string;
  claim_id?: string;
  supporting_evidence_id?: string;
  supporting_source_name?: string;
  supporting_location?: string;
  supporting_text?: string;
  contradicting_evidence_id?: string;
  contradicting_source_name?: string;
  contradicting_location?: string;
  contradicting_text?: string;
}

export interface ClaimAutopsy {
  problematic_phrase?: string;
  issue_type:
    | 'quantity_mismatch'
    | 'rate_frequency'
    | 'polarity_negation'
    | 'missing_evidence'
    | 'verified_match'
    | 'conflicting_sources'
    | 'insufficient_context'
    | 'direct_contradiction'
    | string;
  claim_elements: string[];
  evidence_elements: string[];
  diagnosis: string;
}

export interface HumanReview {
  action: 'accepted' | 'overridden_supported' | 'override_supported' | 'overridden_contradicted' | 'override_contradicted' | 'overridden_unsupported' | 'override_unsupported' | 'deferred' | string;
  notes: string;
  reviewer: string;
  reviewed_at: string;
  original_verdict: VerdictCategory;
}

export interface Claim {
  claim_id: string;
  claim_text: string;
  /** 0-indexed Unicode character start offset in original_answer */
  start_offset: number;
  /** 0-indexed Unicode character end offset in original_answer */
  end_offset: number;
  verdict: VerdictCategory;
  explanation: string;
  confidence: number;
  evidence_ids: string[];
  evaluation_trail?: PairResult[];
  conflict?: ConflictDetail;
  autopsy?: ClaimAutopsy;
  human_review?: HumanReview;
}

export interface ConsistencyFinding {
  finding_id: string;
  finding_type: 'numerical_mismatch' | 'internal_contradiction' | 'temporal_inconsistency' | 'logical_fallacy' | string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affected_claim_ids: string[];
}

export interface SafetyFinding {
  finding_id: string;
  category: 'harmful_advice' | 'medical_disclaimer_missing' | 'financial_risk' | 'unverified_procedure' | 'security_risk' | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface AuditSummary {
  total_claims: number;
  supported_claims: number;
  contradicted_claims: number;
  unsupported_claims: number;
  ambiguous_claims: number;
  inconclusive_claims: number;
  trust_score: number; // 0.0 - 100.0
  risk_level: 'low' | 'medium' | 'high';
  key_takeaway: string;
}

export interface AuditResponse {
  audit_id: string;
  status: AuditStatus;
  title?: string;
  original_answer: string;
  sources: Source[];
  claims: Claim[];
  evidence: Evidence[];
  verdicts: Record<string, number>;
  consistency_findings: ConsistencyFinding[];
  safety_findings: SafetyFinding[];
  summary?: AuditSummary;
  conflict_map?: ConflictDetail[];
  report_reference?: string;
  is_mock: boolean;
  created_at: string;
  completed_at?: string;
}

export interface AdversarialTestCase {
  id: string;
  title: string;
  category: string;
  description: string;
  adversarial_mechanism: string;
  source_name: string;
  claim_text: string;
  expected_verdict: string;
}

export interface AdversarialCaseResult extends AdversarialTestCase {
  actual_verdict: string;
  passed: boolean;
  latency_ms: number;
  explanation: string;
  autopsy?: ClaimAutopsy;
  conflict?: ConflictDetail;
}

export interface AdversarialRunResult {
  total_cases: number;
  passed_cases: number;
  failed_cases: number;
  accuracy_pct: number;
  total_latency_ms: number;
  test_cases: AdversarialCaseResult[];
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  database: string;
  mock_verification_enabled: boolean;
}
