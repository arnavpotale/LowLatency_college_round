import React, { useEffect, useState } from 'react';
import { AuditResponse } from '../types';
import { apiClient } from '../services/api';
import {
  FileCheck,
  Download,
  Copy,
  Check,
  FileText,
  FileCode,
  FileType
} from 'lucide-react';

interface ReportsPageProps {
  activeAudit: AuditResponse | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ activeAudit }) => {
  const [completedAudits, setCompletedAudits] = useState<AuditResponse[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'detailed' | 'executive'>('detailed');
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

  // Load report when selectedAuditId or reportType changes
  useEffect(() => {
    if (!selectedAuditId) return;
    let mounted = true;
    async function fetchReport() {
      setIsLoadingReport(true);
      try {
        const md = await apiClient.getReport(selectedAuditId!, reportType);
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
  }, [selectedAuditId, reportType]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = (format: 'markdown' | 'txt' | 'docx' | 'pdf') => {
    if (!selectedAuditId) return;
    const downloadUrl = apiClient.getReportDownloadUrl(selectedAuditId, format, reportType);
    window.open(downloadUrl, '_blank');
  };

  const selectedAudit = completedAudits.find((a) => a.audit_id === selectedAuditId);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-7 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] text-[#176B58] dark:text-[#65B89D] uppercase tracking-wider font-semibold">
              Regulatory Audit Artifacts
            </span>
            <span className="text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">
              {completedAudits.length} completed reports ready
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-[#176B58] dark:text-[#65B89D]" />
            <span>Audit Reports &amp; Dossiers</span>
          </h1>
          <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] max-w-2xl leading-relaxed">
            Export legally auditable verification dossiers and concise executive summaries with complete evidence provenance,
            claim-level verdicts, forensic autopsies, and compliance certifications in Markdown, Plain Text, Word DOCX, and PDF formats.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Sessions List (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE3DF] dark:border-[#343E38]">
            <div className="text-xs font-semibold text-[#17211D] dark:text-[#EDF2EE] uppercase tracking-wider font-mono">
              Completed Audits
            </div>
            <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
              {completedAudits.length} total
            </span>
          </div>

          {isLoadingAudits ? (
            <div className="py-8 text-center text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">Loading reports...</div>
          ) : completedAudits.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#58645F] dark:text-[#A7B2AB] space-y-2">
              <FileText className="w-8 h-8 mx-auto text-[#7E8C86] dark:text-[#738078]" />
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
                        ? 'bg-[#EBF5F1] dark:bg-[#19332A] border-[#BCD8CD] dark:border-[#2C5E4E] shadow-xs'
                        : 'bg-[#F6F7F8] dark:bg-[#202824] border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
                    }`}
                  >
                    <div className="font-semibold text-[#17211D] dark:text-[#EDF2EE] truncate">
                      {a.title || 'Untitled Audit'}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
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
        <div className="lg:col-span-8 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-6 space-y-5">
          {selectedAudit ? (
            <>
              {/* Report Controls & Format Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE3DF] dark:border-[#343E38]">
                <div>
                  <h3 className="text-sm font-bold text-[#17211D] dark:text-[#EDF2EE]">{selectedAudit.title}</h3>
                  <div className="text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
                    ID: {selectedAudit.audit_id}
                  </div>
                </div>

                {/* Scope Switcher: Detailed vs Executive */}
                <div className="inline-flex rounded-lg bg-[#F6F7F8] dark:bg-[#202824] p-0.5 border border-[#DCE3DF] dark:border-[#343E38] text-xs">
                  <button
                    onClick={() => setReportType('detailed')}
                    className={`px-3 py-1.5 rounded-md transition font-medium ${
                      reportType === 'detailed'
                        ? 'bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] shadow-xs'
                        : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
                    }`}
                  >
                    Forensic Dossier
                  </button>
                  <button
                    onClick={() => setReportType('executive')}
                    className={`px-3 py-1.5 rounded-md transition font-medium ${
                      reportType === 'executive'
                        ? 'bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] shadow-xs'
                        : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
                    }`}
                  >
                    Executive Summary
                  </button>
                </div>
              </div>

              {/* Action Toolbar: Multi-format Downloads */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#F6F7F8] dark:bg-[#202824] p-3 rounded-lg border border-[#DCE3DF] dark:border-[#343E38]">
                <div className="flex items-center gap-1.5 text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">
                  <span>Download Format:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={isLoadingReport}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-xs font-medium transition shadow-xs"
                    title="Copy report markdown to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleDownload('markdown')}
                    disabled={isLoadingReport}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-xs font-medium transition shadow-xs"
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#176B58] dark:text-[#65B89D]" />
                    <span>.MD</span>
                  </button>

                  <button
                    onClick={() => handleDownload('txt')}
                    disabled={isLoadingReport}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-xs font-medium transition shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>.TXT</span>
                  </button>

                  <button
                    onClick={() => handleDownload('docx')}
                    disabled={isLoadingReport}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-xs font-medium transition shadow-xs"
                  >
                    <FileType className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>.DOCX</span>
                  </button>

                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={isLoadingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] text-xs font-semibold shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Monospace Document Preview */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] flex items-center justify-between">
                  <span>
                    {reportType === 'executive' ? 'CONCISE EXECUTIVE SUMMARY' : 'FORENSIC AUDIT DOSSIER'} (LIVE GENERATION)
                  </span>
                  <span className="font-mono text-[#58645F] dark:text-[#A7B2AB]">{reportMarkdown.length} chars</span>
                </div>

                {isLoadingReport ? (
                  <div className="py-20 text-center text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">
                    Generating report from backend...
                  </div>
                ) : (
                  <pre className="p-4 rounded-lg bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] text-xs font-mono text-[#17211D] dark:text-[#EDF2EE] whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto selection:bg-[#EBF5F1] dark:selection:bg-[#19332A]">
                    {reportMarkdown}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-[#58645F] dark:text-[#A7B2AB]">
              Select an audit to preview and export its report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
