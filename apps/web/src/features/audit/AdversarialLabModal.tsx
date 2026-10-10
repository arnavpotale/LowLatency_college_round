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
      <div className="bg-[#14171c] border border-zinc-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#181b22]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Adversarial Claim Lab
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 uppercase">
                  Stress-Testing Suite
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Live automated test harness evaluating numerical inflation, rate intervals, polarity, and conflicting sources.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Metric Ribbon */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-[#161920] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleRunSuite}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
            >
              {isRunning ? (
                <>
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating 8 Vectors...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-zinc-900" />
                  <span>Run Adversarial Suite (8 Cases)</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
              Source: Deterministic Rule Verifier &bull; Isolated Ground Truths
            </span>
          </div>

          {results && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Accuracy:</span>
                <span className={`font-bold ${results.accuracy_pct === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {results.accuracy_pct}% ({results.passed_cases}/{results.total_cases})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <span>Latency:</span>
                <span>{results.total_latency_ms}ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
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
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      : 'bg-rose-950/20 border-rose-900/60 hover:border-rose-800'
                  }`}
                >
                  <div
                    onClick={() => setExpandedCaseId(isExpanded ? null : tc.id)}
                    className="p-4 flex items-center justify-between cursor-pointer gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-zinc-500">#{idx + 1}</span>
                        <h4 className="text-xs font-semibold text-zinc-100 truncate">{tc.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {tc.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-serif text-xs text-zinc-300 italic truncate">
                        "{tc.claim_text}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-[11px] font-mono">
                        <div className="text-zinc-500 text-[10px]">Expected → Actual</div>
                        <span className="text-zinc-400">{tc.expected_verdict}</span>
                        <span className="mx-1 text-zinc-600">→</span>
                        <span className={tc.passed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {tc.actual_verdict}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
                          tc.passed
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/60 border-rose-800 text-rose-300'
                        }`}
                      >
                        {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{tc.passed ? 'PASSED' : 'FAILED'}</span>
                      </span>

                      <span className="font-mono text-[10px] text-zinc-500">{tc.latency_ms}ms</span>
                    </div>
                  </div>

                  {/* Expanded diagnostic drawer */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 space-y-2.5 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">
                            Adversarial Attack Vector:
                          </span>
                          <p className="text-zinc-300 text-xs">{tc.adversarial_mechanism}</p>
                          <p className="text-zinc-500 text-[11px] pt-1">{tc.description}</p>
                        </div>

                        <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">
                            Verification Explanation:
                          </span>
                          <p className="text-zinc-300 text-xs leading-relaxed">{tc.explanation}</p>
                          {tc.autopsy && (
                            <p className="text-zinc-400 text-[11px] pt-1 italic font-mono">
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
              <FlaskConical className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-300">Run Live Adversarial Verification</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
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
