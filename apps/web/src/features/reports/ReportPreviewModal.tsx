import React, { useState, useEffect } from 'react';
import { AuditResponse } from '../../types';
import { apiClient } from '../../services/api';
import { X, Copy, Check, Download, FileText, FileCode, FileType } from 'lucide-react';

interface ReportPreviewModalProps {
  audit: AuditResponse;
  reportMarkdown: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  audit,
  reportMarkdown: initialMarkdown,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [reportType, setReportType] = useState<'detailed' | 'executive'>('detailed');
  const [currentMarkdown, setCurrentMarkdown] = useState<string>(initialMarkdown);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setCurrentMarkdown(initialMarkdown);
  }, [initialMarkdown]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function loadScopeReport() {
      setIsLoading(true);
      try {
        const md = await apiClient.getReport(audit.audit_id, reportType);
        if (mounted) setCurrentMarkdown(md);
      } catch (err) {
        console.error('Failed to load report for scope:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadScopeReport();
    return () => {
      mounted = false;
    };
  }, [reportType, audit.audit_id, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'markdown' | 'txt' | 'docx' | 'pdf') => {
    const downloadUrl = apiClient.getReportDownloadUrl(audit.audit_id, format, reportType);
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#DCE3DF] dark:border-[#343E38] flex items-center justify-between bg-[#F6F7F8] dark:bg-[#202824]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#17211D] dark:text-[#EDF2EE]">
                Audit Dossier &amp; Export Center
              </h2>
              <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
                Audit ID: {audit.audit_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Scope Switcher */}
            <div className="inline-flex rounded-lg bg-[#F6F7F8] dark:bg-[#111614] p-0.5 border border-[#DCE3DF] dark:border-[#343E38] text-xs mr-2">
              <button
                onClick={() => setReportType('detailed')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  reportType === 'detailed'
                    ? 'bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] shadow-xs'
                    : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
                }`}
              >
                Forensic Dossier
              </button>
              <button
                onClick={() => setReportType('executive')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  reportType === 'executive'
                    ? 'bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] shadow-xs'
                    : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
                }`}
              >
                Executive Summary
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#7E8C86] dark:text-[#738078] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive Summary Metrics Strip */}
        {audit.summary && (
          <div className="px-5 py-2.5 bg-[#F6F7F8] dark:bg-[#202824] border-b border-[#DCE3DF] dark:border-[#343E38] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div title="Normalized Trust Score: Supported ÷ (Supported + Contradicted + Unsupported) × 100">
              <span className="text-[#58645F] dark:text-[#A7B2AB] text-[11px]">Trust Score:</span>{' '}
              <strong className="text-[#17211D] dark:text-[#EDF2EE]">
                {audit.summary.trust_score !== null && audit.summary.trust_score !== undefined
                  ? `${Math.round(audit.summary.trust_score)}%`
                  : 'N/A'}
              </strong>
            </div>
            <div>
              <span className="text-[#58645F] dark:text-[#A7B2AB] text-[11px]">Risk:</span>{' '}
              <strong className="uppercase text-[#965B0A] dark:text-[#E5AC48]">{audit.summary.risk_level}</strong>
            </div>
            <div>
              <span className="text-[#58645F] dark:text-[#A7B2AB] text-[11px]">Claims:</span>{' '}
              <strong className="text-[#17211D] dark:text-[#EDF2EE]">{audit.summary.total_claims}</strong>
            </div>
            <div>
              <span className="text-[#58645F] dark:text-[#A7B2AB] text-[11px]">Contradictions:</span>{' '}
              <strong className="text-[#9E2222] dark:text-[#F17575]">{audit.summary.contradicted_claims}</strong>
            </div>
          </div>
        )}

        {/* Action Download Strip */}
        <div className="px-5 py-2.5 bg-[#F6F7F8] dark:bg-[#202824] border-b border-[#DCE3DF] dark:border-[#343E38] flex items-center justify-between text-xs">
          <div className="text-[#58645F] dark:text-[#A7B2AB] font-mono text-[11px]">
            Download genuine report artifact:
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => handleDownload('markdown')}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium flex items-center gap-1 transition shadow-xs"
            >
              <FileCode className="w-3.5 h-3.5 text-[#176B58] dark:text-[#65B89D]" />
              <span>.MD</span>
            </button>

            <button
              onClick={() => handleDownload('txt')}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium flex items-center gap-1 transition shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>.TXT</span>
            </button>

            <button
              onClick={() => handleDownload('docx')}
              className="px-2.5 py-1 rounded bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium flex items-center gap-1 transition shadow-xs"
            >
              <FileType className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>.DOCX</span>
            </button>

            <button
              onClick={() => handleDownload('pdf')}
              className="px-3 py-1 rounded bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-[#17211D] dark:text-[#EDF2EE] leading-relaxed bg-[#F6F7F8] dark:bg-[#111614] select-text">
          {isLoading ? (
            <div className="py-20 text-center text-[#58645F] dark:text-[#A7B2AB] font-mono">Loading report...</div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono">{currentMarkdown || 'No report generated yet.'}</pre>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-[#DCE3DF] dark:border-[#343E38] bg-[#F6F7F8] dark:bg-[#202824] flex items-center justify-between text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
          <span>Second Opinion Verification Artifact</span>
          <span>{reportType === 'executive' ? 'Executive Format' : 'Forensic Format'}</span>
        </div>
      </div>
    </div>
  );
};
