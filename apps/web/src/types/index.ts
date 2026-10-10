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
  report_reference?: string;
  is_mock: boolean;
  created_at: string;
  completed_at?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  database: string;
  mock_verification_enabled: boolean;
}
