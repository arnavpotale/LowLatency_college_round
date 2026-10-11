import React, { useState } from 'react';
import { AdversarialRunResult } from '../../types';
import { apiClient } from '../../services/api';
import { Play, CheckCircle2, XCircle, ShieldAlert, Cpu, X, FlaskConical } from 'lucide-react';

interface AdversarialLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdversarialLabModal: React.FC<AdversarialLabModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<AdversarialRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunSuite = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const data = await apiClient.runAdversarialLab();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute adversarial test suite');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE3DF] dark:border-[#343E38] bg-[#F6F7F8] dark:bg-[#202824]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] flex items-center justify-center text-[#176B58] dark:text-[#65B89D]">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2">
                Adversarial Claim Lab
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D] border border-[#BCD8CD] dark:border-[#2C5E4E] uppercase">
                  Stress-Testing Suite
                </span>
              </h2>
              <p className="text-xs text-[#58645F] dark:text-[#A7B2AB]">
                Live automated test harness evaluating numerical inflation, rate intervals, polarity, and conflicting sources.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E8C86] dark:text-[#738078] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Metric Ribbon */}
        <div className="px-6 py-4 border-b border-[#DCE3DF] dark:border-[#343E38] bg-[#F6F7F8] dark:bg-[#202824] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleRunSuite}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 shadow-xs"
            >
              {isRunning ? (
                <>
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating 8 Vectors...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-current" />
                  <span>Run Adversarial Suite (8 Cases)</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono hidden md:inline">
              Source: Deterministic Rule Verifier &bull; Isolated Ground Truths
            </span>
          </div>

          {results && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[#58645F] dark:text-[#A7B2AB]">Accuracy:</span>
                <span className={`font-bold ${results.accuracy_pct === 100 ? 'text-[#0E6245] dark:text-[#65B89D]' : 'text-[#965B0A] dark:text-[#E5AC48]'}`}>
                  {results.accuracy_pct}% ({results.passed_cases}/{results.total_cases})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#58645F] dark:text-[#A7B2AB]">
                <span>Latency:</span>
                <span>{results.total_latency_ms}ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {results ? (
            results.test_cases.map((tc, idx) => {
              const isExpanded = expandedCaseId === tc.id;

              return (
                <div
                  key={tc.id}
                  className={`rounded-lg border transition ${
                    tc.passed
                      ? 'bg-white dark:bg-[#191F1C] border-[#DCE3DF] dark:border-[#343E38] hover:border-[#176B58] dark:hover:border-[#65B89D]'
                      : 'bg-[#FDF0F0] dark:bg-[#B91C1C]/10 border-[#F7C5C5] dark:border-[#6B2323]'
                  }`}
                >
                  <div
                    onClick={() => setExpandedCaseId(isExpanded ? null : tc.id)}
                    className="p-4 flex items-center justify-between cursor-pointer gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#58645F] dark:text-[#A7B2AB]">#{idx + 1}</span>
                        <h4 className="text-xs font-semibold text-[#17211D] dark:text-[#EDF2EE] truncate">{tc.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB]">
                          {tc.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-[#58645F] dark:text-[#A7B2AB] italic truncate">
                        "{tc.claim_text}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-[11px] font-mono">
                        <div className="text-[#58645F] dark:text-[#A7B2AB] text-[10px]">Expected → Actual</div>
                        <span className="text-[#58645F] dark:text-[#A7B2AB]">{tc.expected_verdict}</span>
                        <span className="mx-1 text-[#7E8C86] dark:text-[#738078]">→</span>
                        <span className={tc.passed ? 'text-[#0E6245] dark:text-[#65B89D] font-semibold' : 'text-[#9E2222] dark:text-[#F17575] font-semibold'}>
                          {tc.actual_verdict}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
                          tc.passed
                            ? 'bg-[#E8F5EE] dark:bg-[#176B58]/20 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]'
                            : 'bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]'
                        }`}
                      >
                        {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{tc.passed ? 'PASSED' : 'FAILED'}</span>
                      </span>

                      <span className="font-mono text-[10px] text-[#58645F] dark:text-[#A7B2AB]">{tc.latency_ms}ms</span>
                    </div>
                  </div>

                  {/* Expanded diagnostic drawer */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#DCE3DF] dark:border-[#343E38] space-y-2.5 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] space-y-1">
                          <span className="text-[10px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB] font-semibold block">
                            Adversarial Attack Vector:
                          </span>
                          <p className="text-[#17211D] dark:text-[#EDF2EE] text-xs">{tc.adversarial_mechanism}</p>
                          <p className="text-[#58645F] dark:text-[#A7B2AB] text-[11px] pt-1">{tc.description}</p>
                        </div>

                        <div className="p-3 rounded bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] space-y-1">
                          <span className="text-[10px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB] font-semibold block">
                            Verification Explanation:
                          </span>
                          <p className="text-[#17211D] dark:text-[#EDF2EE] text-xs leading-relaxed">{tc.explanation}</p>
                          {tc.autopsy && (
                            <p className="text-[#58645F] dark:text-[#A7B2AB] text-[11px] pt-1 italic font-mono">
                              Autopsy Diagnosis: {tc.autopsy.diagnosis}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center space-y-3">
              <FlaskConical className="w-8 h-8 text-[#58645F] dark:text-[#A7B2AB] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#17211D] dark:text-[#EDF2EE]">Run Live Adversarial Verification</h3>
                <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] max-w-md mx-auto">
                  Click the button above to execute all 8 adversarial stress test scenarios against the actual backend engine.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
