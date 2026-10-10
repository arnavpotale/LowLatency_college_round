import React, { useState } from 'react';
import { AuditResponse } from '../../types';
import { X, Copy, Check, Download, FileText } from 'lucide-react';

interface ReportPreviewModalProps {
  audit: AuditResponse;
  reportMarkdown: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  audit,
  reportMarkdown,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_report_${audit.audit_id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Verification Audit Report
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Audit ID: {audit.audit_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Summary Metrics Strip */}
        {audit.summary && (
          <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Trust Score:</span>{' '}
              <strong className="text-white font-mono">{audit.summary.trust_score}%</strong>
            </div>
            <div>
              <span className="text-slate-400">Risk Assessment:</span>{' '}
              <strong className="uppercase font-mono text-amber-400">{audit.summary.risk_level}</strong>
            </div>
            <div>
              <span className="text-slate-400">Claims Audited:</span>{' '}
              <strong className="text-white font-mono">{audit.summary.total_claims}</strong>
            </div>
            <div>
              <span className="text-slate-400">Contradictions:</span>{' '}
              <strong className="text-rose-400 font-mono">{audit.summary.contradicted_claims}</strong>
            </div>
          </div>
        )}

        {/* Body / Markdown Preview */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs leading-relaxed text-slate-300 bg-slate-950/40">
          <pre className="whitespace-pre-wrap">{reportMarkdown}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Second Opinion Verification Platform &bull; Export Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
