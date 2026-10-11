import React, { useEffect, useState } from 'react';
import { AuditResponse } from '../types';
import { apiClient } from '../services/api';
import {
  FileCheck,
  Download,
  Copy,
  Check,
  FileText
} from 'lucide-react';

interface ReportsPageProps {
  activeAudit: AuditResponse | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ activeAudit }) => {
  const [completedAudits, setCompletedAudits] = useState<AuditResponse[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoadingAudits, setIsLoadingAudits] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function loadAudits() {
      setIsLoadingAudits(true);
      try {
        const list = await apiClient.listAudits();
        const completed = list.filter((a) => a.status === 'completed');

        // Include activeAudit if completed
        if (activeAudit && activeAudit.status === 'completed') {
          if (!completed.some((a) => a.audit_id === activeAudit.audit_id)) {
            completed.unshift(activeAudit);
          }
        }

        if (mounted) {
          setCompletedAudits(completed);
          if (completed.length > 0) {
            setSelectedAuditId(completed[0].audit_id);
          }
        }
      } catch (err) {
        console.error('Failed to load completed audits for reports:', err);
      } finally {
        if (mounted) setIsLoadingAudits(false);
      }
    }
    loadAudits();
    return () => {
      mounted = false;
    };
  }, [activeAudit]);

  // Load report when selectedAuditId changes
  useEffect(() => {
    if (!selectedAuditId) return;
    let mounted = true;
    async function fetchReport() {
      setIsLoadingReport(true);
      try {
        const md = await apiClient.getReport(selectedAuditId!);
        if (mounted) setReportMarkdown(md);
      } catch (err) {
        console.error('Failed to fetch report markdown:', err);
        if (mounted) setReportMarkdown('# Error\nFailed to generate report for this audit.');
      } finally {
        if (mounted) setIsLoadingReport(false);
      }
    }
    fetchReport();
    return () => {
      mounted = false;
    };
  }, [selectedAuditId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `second_opinion_audit_report_${selectedAuditId?.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedAudit = completedAudits.find((a) => a.audit_id === selectedAuditId);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800/80 bg-gradient-to-b from-[#141720] to-[#101218] p-7 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 uppercase tracking-wider font-semibold">
              Regulatory Audit Artifacts
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {completedAudits.length} completed reports ready
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-emerald-400" />
            <span>Auditable Verification Reports</span>
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            Export standardized Markdown audit reports containing full claim decomposition,
            authoritative source locations, NLI evaluation trails, and human compliance sign-offs.
          </p>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Index (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-800/80 bg-[#12141a] p-4 space-y-3">
          <div className="text-xs font-semibold text-zinc-300 pb-2 border-b border-zinc-800 flex items-center justify-between">
            <span>Completed Audits ({completedAudits.length})</span>
            <span className="text-[10px] font-mono text-zinc-400">Select report</span>
          </div>

          {isLoadingAudits ? (
            <div className="py-8 text-center text-xs text-zinc-400 font-mono">Loading reports...</div>
          ) : completedAudits.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-zinc-400" />
              <div>No completed audits found.</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {completedAudits.map((a) => {
                const isSelected = selectedAuditId === a.audit_id;
                const claimCount = a.claims?.length || 0;
                const dateStr = a.completed_at
                  ? new Date(a.completed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Recent';

                return (
                  <div
                    key={a.audit_id}
                    onClick={() => setSelectedAuditId(a.audit_id)}
                    className={`p-3 rounded-lg border cursor-pointer transition text-xs space-y-1 ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-800/80'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="font-semibold text-zinc-200 truncate">
                      {a.title || 'Untitled Audit'}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{claimCount} claims</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Report Content Preview (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-4">
          {selectedAudit ? (
            <>
              {/* Report Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{selectedAudit.title}</h3>
                  <div className="text-[11px] font-mono text-zinc-400">
                    ID: {selectedAudit.audit_id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={isLoadingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy Markdown'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isLoadingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-medium transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>

              {/* Monospace Markdown Preview */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>GENERATED MARKDOWN REPORT (LIVE BACKEND)</span>
                  <span className="font-mono text-zinc-400">{reportMarkdown.length} chars</span>
                </div>

                {isLoadingReport ? (
                  <div className="py-20 text-center text-xs text-zinc-400 font-mono">
                    Generating report from backend...
                  </div>
                ) : (
                  <pre className="p-4 rounded-lg bg-[#0d0f14] border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto selection:bg-emerald-900">
                    {reportMarkdown}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-zinc-400">
              Select an audit to preview and export its Markdown report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
