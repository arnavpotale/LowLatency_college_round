import { AuditResponse, Source, HealthResponse } from '../types';
import { MOCK_INITIAL_AUDIT } from '../mocks/sampleData';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = {
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Backend not reachable, operating in client mock mode:", err);
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
      if (!res.ok) throw new Error(`Create audit failed: ${res.statusText}`);
      return await res.json();
    } catch {
      // Fallback in case backend is offline
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
  },

  async uploadSourceText(auditId: string, title: string, content: string): Promise<Source> {
    try {
      const formData = new FormData();
      formData.append('text_title', title);
      formData.append('text_content', content);

      const res = await fetch(`${BASE_URL}/audits/${auditId}/sources`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`Source upload failed: ${res.statusText}`);
      return await res.json();
    } catch {
      return {
        source_id: `src_${Math.random().toString(36).substring(2, 9)}`,
        filename: title || 'pasted_source.txt',
        file_type: 'txt',
        char_count: content.length,
        uploaded_at: new Date().toISOString(),
        content_snippet: content.substring(0, 200),
        raw_content: content
      };
    }
  },

  async uploadSourceFile(auditId: string, file: File): Promise<Source> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BASE_URL}/audits/${auditId}/sources`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`File upload failed: ${res.statusText}`);
      return await res.json();
    } catch {
      return {
        source_id: `src_${Math.random().toString(36).substring(2, 9)}`,
        filename: file.name,
        file_type: file.name.split('.').pop() || 'unknown',
        char_count: file.size,
        uploaded_at: new Date().toISOString(),
        content_snippet: `Uploaded file ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      };
    }
  },

  async submitAnswer(auditId: string, originalAnswer: string): Promise<AuditResponse> {
    try {
      const res = await fetch(`${BASE_URL}/audits/${auditId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_answer: originalAnswer })
      });
      if (!res.ok) throw new Error(`Submit answer failed: ${res.statusText}`);
      return await res.json();
    } catch {
      return {
        ...MOCK_INITIAL_AUDIT,
        audit_id: auditId,
        original_answer: originalAnswer
      };
    }
  },

  async runAnalysis(auditId: string): Promise<AuditResponse> {
    try {
      const res = await fetch(`${BASE_URL}/audits/${auditId}/analyze`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
      return await res.json();
    } catch {
      // Fallback to rich mock audit simulation
      return {
        ...MOCK_INITIAL_AUDIT,
        audit_id: auditId
      };
    }
  },

  async getAudit(auditId: string): Promise<AuditResponse> {
    const res = await fetch(`${BASE_URL}/audits/${auditId}`);
    if (!res.ok) throw new Error(`Failed to fetch audit: ${res.statusText}`);
    return await res.json();
  },

  async getReport(auditId: string): Promise<string> {
    try {
      const res = await fetch(`${BASE_URL}/audits/${auditId}/report`);
      if (!res.ok) throw new Error(`Failed to fetch report`);
      return await res.text();
    } catch {
      return `# Second Opinion — Audit Report Preview\nAudit ID: ${auditId}\nMode: Mock Preview`;
    }
  }
};
