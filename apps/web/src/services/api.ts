import { AuditResponse, Source, HealthResponse, AdversarialTestCase, AdversarialRunResult } from '../types';
import { MOCK_INITIAL_AUDIT } from '../mocks/sampleData';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function parseErrorResponse(res: Response, fallbackMsg: string): Promise<Error> {
  try {
    const data = await res.json();
    const detail = data?.detail || data?.message || data?.error;
    if (detail) return new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  } catch {
    // fallback if response is not JSON
  }
  return new Error(`${fallbackMsg} (Status ${res.status}: ${res.statusText})`);
}

export const apiClient = {
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) throw await parseErrorResponse(res, "Health check failed");
      return await res.json();
    } catch (err: any) {
      console.warn("Backend not reachable, operating in client mock mode:", err?.message || err);
      return {
        status: "client-mock-mode",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        database: "simulated (in-memory)",
        mock_verification_enabled: true
      };
    }
  },

  async createAudit(title?: string, notes?: string): Promise<AuditResponse> {
    try {
      const res = await fetch(`${BASE_URL}/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes })
      });
      if (!res.ok) throw await parseErrorResponse(res, "Create audit failed");
      return await res.json();
    } catch (err: any) {
      if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        // Fallback only if backend is completely offline
        return {
          ...MOCK_INITIAL_AUDIT,
          audit_id: `aud_local_${Math.random().toString(36).substring(2, 9)}`,
          status: 'created',
          title: title || 'New Audit Session',
          original_answer: '',
          sources: [],
          claims: [],
          evidence: [],
          verdicts: {},
          consistency_findings: [],
          safety_findings: [],
          summary: undefined
        };
      }
      throw err;
    }
  },

  async uploadSourceText(auditId: string, title: string, content: string): Promise<Source> {
    const formData = new FormData();
    formData.append('text_title', title);
    formData.append('text_content', content);

    const res = await fetch(`${BASE_URL}/audits/${auditId}/sources`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw await parseErrorResponse(res, "Source upload failed");
    return await res.json();
  },

  async uploadSourceFile(auditId: string, file: File): Promise<Source> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/audits/${auditId}/sources`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw await parseErrorResponse(res, `Failed to upload file '${file.name}'`);
    return await res.json();
  },

  async deleteSource(auditId: string, sourceId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/audits/${auditId}/sources/${sourceId}`, {
      method: 'DELETE'
    });
    if (!res.ok && res.status !== 204) throw await parseErrorResponse(res, "Failed to delete source");
  },

  async listAudits(): Promise<AuditResponse[]> {
    try {
      const res = await fetch(`${BASE_URL}/audits`);
      if (!res.ok) throw await parseErrorResponse(res, "Failed to list audits");
      return await res.json();
    } catch (err: any) {
      console.warn("Could not list audits from backend:", err?.message || err);
      return [];
    }
  },

  async submitAnswer(auditId: string, originalAnswer: string): Promise<AuditResponse> {
    const res = await fetch(`${BASE_URL}/audits/${auditId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_answer: originalAnswer })
    });
    if (!res.ok) throw await parseErrorResponse(res, "Submit answer failed");
    return await res.json();
  },

  async runAnalysis(auditId: string): Promise<AuditResponse> {
    const res = await fetch(`${BASE_URL}/audits/${auditId}/analyze`, {
      method: 'POST'
    });
    if (!res.ok) throw await parseErrorResponse(res, "Audit analysis failed");
    return await res.json();
  },

  async getAudit(auditId: string): Promise<AuditResponse> {
    const res = await fetch(`${BASE_URL}/audits/${auditId}`);
    if (!res.ok) throw await parseErrorResponse(res, `Failed to fetch audit '${auditId}'`);
    return await res.json();
  },

  async getReport(auditId: string, type: 'detailed' | 'executive' = 'detailed'): Promise<string> {
    const res = await fetch(`${BASE_URL}/audits/${auditId}/report?format=markdown&type=${type}`);
    if (!res.ok) throw await parseErrorResponse(res, "Failed to fetch report");
    return await res.text();
  },

  getReportDownloadUrl(auditId: string, format: 'markdown' | 'txt' | 'docx' | 'pdf', type: 'detailed' | 'executive' = 'detailed'): string {
    return `${BASE_URL}/audits/${auditId}/report?format=${format}&type=${type}`;
  },

  async submitHumanReview(
    auditId: string,
    claimId: string,
    review: { action: string; notes?: string; reviewer?: string }
  ): Promise<AuditResponse> {
    const res = await fetch(`${BASE_URL}/audits/${auditId}/claims/${claimId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (!res.ok) throw await parseErrorResponse(res, "Failed to submit human review");
    return await res.json();
  },

  async getAdversarialCases(): Promise<AdversarialTestCase[]> {
    const res = await fetch(`${BASE_URL}/audits/adversarial-lab/cases`);
    if (!res.ok) throw await parseErrorResponse(res, "Failed to fetch adversarial cases");
    const data = await res.json();
    return data.cases || [];
  },

  async runAdversarialLab(): Promise<AdversarialRunResult> {
    const res = await fetch(`${BASE_URL}/audits/adversarial-lab/run`, {
      method: 'POST'
    });
    if (!res.ok) throw await parseErrorResponse(res, "Failed to run adversarial lab");
    return await res.json();
  }
};
