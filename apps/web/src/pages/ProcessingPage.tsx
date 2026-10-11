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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 mb-2">
          {error ? (
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          ) : (
            <Cpu className="w-7 h-7 animate-pulse text-emerald-400" />
          )}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          {error ? 'Verification Halted' : 'Verifying Your AI Answer'}
        </h1>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          {error
            ? 'The verification provider encountered an issue. Your uploaded inputs have been preserved.'
            : 'Your reference material and submitted statements are being cross-referenced against authoritative passages.'}
        </p>
      </div>

      {/* Error Card if failed */}
      {error && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-5 space-y-3 text-xs">
          <div className="font-semibold text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Analysis Failure Details</span>
          </div>
          <p className="text-rose-200 font-mono text-[11px] leading-relaxed bg-black/40 p-3 rounded border border-rose-900/60">
            {error}
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 transition"
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
      <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-5">
        <div className="space-y-4">
          {stages.map((st) => {
            const isDone = activeStage > st.num;
            const isCurrent = activeStage === st.num;

            return (
              <div key={st.num} className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : isCurrent && !error ? (
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                      {st.num}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div
                    className={`text-xs font-semibold ${
                      isDone
                        ? 'text-zinc-200'
                        : isCurrent && !error
                        ? 'text-emerald-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {st.label}
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-normal">
                    {st.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>AUDIT ID: {auditId?.slice(0, 8)}...</span>
          <span>{isProcessing ? 'PROCESSING...' : 'COMPLETE'}</span>
        </div>
      </div>
    </div>
  );
};
