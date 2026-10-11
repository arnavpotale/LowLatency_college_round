import React, { useEffect, useState } from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse } from '../types';
import { apiClient } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Cpu
} from 'lucide-react';

interface ProcessingPageProps {
  onAuditCompleted: (audit: AuditResponse) => void;
}

export const ProcessingPage: React.FC<ProcessingPageProps> = ({ onAuditCompleted }) => {
  const { params, navigate } = useRouter();
  const auditId = params.auditId;

  const [activeStage, setActiveStage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  const stages = [
    { num: 1, label: 'Reference Material Received & Validated', desc: 'Normalized file text, line indices, and chunking' },
    { num: 2, label: 'Claims Extracted & Decomposed', desc: 'Identified discrete verifiable assertions from submitted answer' },
    { num: 3, label: 'Hybrid Retrieval & NLI Evaluation', desc: 'BM25 + semantic vector search & natural language inference scoring' },
    { num: 4, label: 'Structural Autopsy & Report Preparation', desc: 'Synthesized contradictory elements and compiled markdown report' }
  ];

  const executeAnalysis = async () => {
    if (!auditId) return;
    setIsProcessing(true);
    setError(null);
    setActiveStage(1);

    try {
      // Stage 1 -> 2 animation progression
      setTimeout(() => setActiveStage(2), 500);
      setTimeout(() => setActiveStage(3), 1200);

      // Execute live analysis on backend
      const result = await apiClient.runAnalysis(auditId);

      setActiveStage(4);
      setTimeout(() => {
        onAuditCompleted(result);
        navigate(`/audits/${auditId}/overview`);
      }, 700);
    } catch (err: any) {
      console.error('Audit verification error:', err);
      setError(err?.message || 'Verification pipeline encountered a processing error.');
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    executeAnalysis();
  }, [auditId]);

  return (
    <div className="max-w-xl mx-auto px-6 py-16 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] text-[#176B58] dark:text-[#65B89D] mb-2 shadow-xs">
          {error ? (
            <AlertTriangle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          ) : (
            <Cpu className="w-7 h-7 animate-pulse text-[#176B58] dark:text-[#65B89D]" />
          )}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#17211D] dark:text-[#EDF2EE]">
          {error ? 'Verification Halted' : 'Verifying Your AI Answer'}
        </h1>
        <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] max-w-md mx-auto">
          {error
            ? 'The verification provider encountered an issue. Your uploaded inputs have been preserved.'
            : 'Your reference material and submitted statements are being cross-referenced against authoritative passages.'}
        </p>
      </div>

      {/* Error Card if failed */}
      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-5 space-y-3 text-xs">
          <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Analysis Failure Details</span>
          </div>
          <p className="text-rose-900 dark:text-rose-200 font-mono text-[11px] leading-relaxed bg-white/80 dark:bg-black/40 p-3 rounded border border-rose-200 dark:border-rose-900/60">
            {error}
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] text-xs hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={executeAnalysis}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Checklist */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-6 space-y-5 shadow-xs">
        <div className="space-y-4">
          {stages.map((st) => {
            const isDone = activeStage > st.num;
            const isCurrent = activeStage === st.num;

            return (
              <div key={st.num} className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-[#E8F5EE] dark:bg-[#176B58]/20 border border-[#B7E1CA] dark:border-[#2C5E4E] flex items-center justify-center text-[#0E6245] dark:text-[#65B89D]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : isCurrent && !error ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#176B58] dark:border-[#65B89D] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#DCE3DF] dark:border-[#343E38] bg-[#F6F7F8] dark:bg-[#202824] flex items-center justify-center text-[10px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
                      {st.num}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div
                    className={`text-xs font-semibold ${
                      isDone
                        ? 'text-[#17211D] dark:text-[#EDF2EE]'
                        : isCurrent && !error
                        ? 'text-[#176B58] dark:text-[#65B89D]'
                        : 'text-[#58645F] dark:text-[#A7B2AB]'
                    }`}
                  >
                    {st.label}
                  </div>
                  <div className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] leading-normal">
                    {st.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#DCE3DF] dark:border-[#343E38] flex items-center justify-between text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
          <span>AUDIT ID: {auditId?.slice(0, 8)}...</span>
          <span>{isProcessing ? 'PROCESSING...' : 'COMPLETE'}</span>
        </div>
      </div>
    </div>
  );
};
