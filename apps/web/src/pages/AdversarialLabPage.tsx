import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { AdversarialTestCase, AdversarialRunResult } from '../types';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export const AdversarialLabPage: React.FC = () => {
  const [cases, setCases] = useState<AdversarialTestCase[]>([]);
  const [runResult, setRunResult] = useState<AdversarialRunResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch benchmark cases on mount
  useEffect(() => {
    let mounted = true;
    async function fetchCases() {
      try {
        setIsLoadingCases(true);
        const fetched = await apiClient.getAdversarialCases();
        if (mounted) {
          setCases(fetched);
          if (fetched.length > 0) setSelectedCaseId(fetched[0].id);
        }
      } catch (err: any) {
        console.error('Failed to fetch adversarial cases:', err);
      } finally {
        if (mounted) setIsLoadingCases(false);
      }
    }
    fetchCases();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRunSuite = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.runAdversarialLab();
      setRunResult(res);
    } catch (err: any) {
      console.error('Adversarial run failed:', err);
      setErrorMsg(err?.message || 'Failed to execute adversarial test suite.');
    } finally {
      setIsRunning(false);
    }
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0] || null;
  const selectedRunOutcome = runResult?.test_cases?.find((r) => r.id === selectedCase?.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-xl border border-purple-900/50 bg-gradient-to-b from-[#181324] to-[#110e1a] p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/80 text-purple-300 uppercase tracking-wider font-semibold">
                Autonomous Verifier Stress Lab
              </span>
              <span className="text-xs text-zinc-400">• Deterministic &amp; NLI Robustness</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <FlaskConical className="w-6 h-6 text-purple-400" />
              <span>Adversarial Stress Test Suite</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Stress-test the verification pipeline against deliberately deceptive mutations: negation insertion,
              hazardous numerical drift, entity substitutions, temporal shifts, and subtle scope generalizations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunSuite}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition active:scale-[0.99]"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executing Verification Engine...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Adversarial Suite</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/50 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Row (when run executed) */}
      {runResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#12141a] space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400">Total Cases</div>
            <div className="text-2xl font-bold text-zinc-100">{runResult.total_cases}</div>
            <div className="text-[10px] text-zinc-400 font-mono">Benchmark Suite</div>
          </div>
          <div className="p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 space-y-1">
            <div className="text-[10px] font-mono uppercase text-emerald-400">Passed</div>
            <div className="text-2xl font-bold text-emerald-300">{runResult.passed_cases}</div>
            <div className="text-[10px] text-emerald-500/80 font-mono">Correctly Identified</div>
          </div>
          <div className="p-4 rounded-xl border border-purple-900/50 bg-purple-950/20 space-y-1">
            <div className="text-[10px] font-mono uppercase text-purple-400">Accuracy</div>
            <div className="text-2xl font-bold text-purple-300">{runResult.accuracy_pct}%</div>
            <div className="text-[10px] text-purple-500/80 font-mono">Robustness Rate</div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#12141a] space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400">Execution Latency</div>
            <div className="text-2xl font-bold text-zinc-200">{runResult.total_latency_ms} ms</div>
            <div className="text-[10px] text-zinc-400 font-mono">Real Engine Time</div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Test Cases List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases List (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-800/80 bg-[#12141a] p-4 space-y-3">
          <div className="text-xs font-semibold text-zinc-300 pb-2 border-b border-zinc-800 flex items-center justify-between">
            <span>Benchmark Test Cases ({cases.length})</span>
            <span className="text-[10px] font-mono text-zinc-400">Select to inspect</span>
          </div>

          {isLoadingCases ? (
            <div className="py-8 text-center text-xs text-zinc-400 font-mono">
              Loading adversarial cases...
            </div>
          ) : (
            <div className="space-y-1.5">
              {cases.map((c, idx) => {
                const outcome = runResult?.test_cases?.find((r) => r.id === c.id);
                const isSelected = c.id === selectedCase?.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-800/80'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200 truncate pr-2">
                        {idx + 1}. {c.category.replace('_', ' ').toUpperCase()}
                      </span>
                      {outcome ? (
                        outcome.passed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>PASSED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-800 text-rose-300">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>FAILED</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400">Ready</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                      &ldquo;{c.claim_text}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Case Inspector (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-5">
          {selectedCase ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
                    PERTURBATION: {selectedCase.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-100">
                    {selectedCase.title || `Adversarial Case #${selectedCase.id}`}
                  </h3>
                </div>
                {selectedRunOutcome && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                      selectedRunOutcome.passed
                        ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-800 text-rose-300'
                    }`}
                  >
                    {selectedRunOutcome.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{selectedRunOutcome.passed ? 'TEST PASSED' : 'TEST FAILED'}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  MUTATION MECHANISM
                </div>
                <div className="p-3 rounded-lg bg-[#0d0f14] border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed">
                  {selectedCase.adversarial_mechanism || selectedCase.description}
                </div>
              </div>

              {/* Claim */}
              <div className="p-3.5 rounded-lg bg-purple-950/30 border border-purple-800/60 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-semibold">
                  ADVERSARIAL MUTATED ASSERTION
                </div>
                <p className="text-xs text-purple-100 italic leading-relaxed">
                  &ldquo;{selectedCase.claim_text}&rdquo;
                </p>
              </div>

              {/* Expected vs Actual */}
              <div className="p-3.5 rounded-lg bg-[#0d0f14] border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">EXPECTED VERDICT:</span>
                  <span className="font-semibold text-rose-400 uppercase">
                    {selectedCase.expected_verdict}
                  </span>
                </div>
                {selectedRunOutcome && (
                  <div className="flex items-center justify-between text-[11px] font-mono border-t border-zinc-800/80 pt-2">
                    <span className="text-zinc-400">ACTUAL VERIFIER RESULT:</span>
                    <span className="font-semibold text-zinc-100 uppercase">
                      {selectedRunOutcome.actual_verdict}
                    </span>
                  </div>
                )}
                {selectedRunOutcome?.explanation && (
                  <p className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 leading-relaxed">
                    <strong>Verifier Rationale:</strong> {selectedRunOutcome.explanation}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-400">
              Select a test case to inspect its mutation and evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
