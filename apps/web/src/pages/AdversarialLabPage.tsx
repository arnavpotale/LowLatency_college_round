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
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] text-[#176B58] dark:text-[#65B89D] uppercase tracking-wider font-semibold">
                Autonomous Verifier Stress Lab
              </span>
              <span className="text-xs text-[#58645F] dark:text-[#A7B2AB]">• Deterministic &amp; NLI Robustness</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2.5">
              <FlaskConical className="w-6 h-6 text-[#176B58] dark:text-[#65B89D]" />
              <span>Adversarial Stress Test Suite</span>
            </h1>
            <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] leading-relaxed">
              Stress-test the verification pipeline against deliberately deceptive mutations: negation insertion,
              hazardous numerical drift, entity substitutions, temporal shifts, and subtle scope generalizations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunSuite}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] disabled:opacity-50 text-white dark:text-[#0E1A15] font-semibold text-xs shadow-xs transition active:scale-[0.99]"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white dark:border-[#0E1A15] border-t-transparent rounded-full animate-spin" />
                  <span>Executing Verification Engine...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Adversarial Suite</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Row (when run executed) */}
      {runResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB]">Total Cases</div>
            <div className="text-2xl font-bold text-[#17211D] dark:text-[#EDF2EE]">{runResult.total_cases}</div>
            <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">Benchmark Suite</div>
          </div>
          <div className="p-4 rounded-xl border border-[#B7E1CA] dark:border-[#2C5E4E] bg-[#E8F5EE] dark:bg-[#19332A] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#0E6245] dark:text-[#65B89D]">Passed</div>
            <div className="text-2xl font-bold text-[#0E6245] dark:text-[#65B89D]">{runResult.passed_cases}</div>
            <div className="text-[10px] text-[#0E6245]/80 dark:text-[#65B89D]/80 font-mono">Correctly Identified</div>
          </div>
          <div className="p-4 rounded-xl border border-[#BCD8CD] dark:border-[#2C5E4E] bg-[#EBF5F1] dark:bg-[#19332A] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#176B58] dark:text-[#65B89D]">Accuracy</div>
            <div className="text-2xl font-bold text-[#176B58] dark:text-[#65B89D]">{runResult.accuracy_pct}%</div>
            <div className="text-[10px] text-[#176B58]/80 dark:text-[#65B89D]/80 font-mono">Robustness Rate</div>
          </div>
          <div className="p-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB]">Execution Latency</div>
            <div className="text-2xl font-bold text-[#17211D] dark:text-[#EDF2EE]">{runResult.total_latency_ms} ms</div>
            <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">Real Engine Time</div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Test Cases List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases List (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-4 space-y-3">
          <div className="text-xs font-semibold text-[#17211D] dark:text-[#EDF2EE] pb-2 border-b border-[#DCE3DF] dark:border-[#343E38] flex items-center justify-between">
            <span>Benchmark Test Cases ({cases.length})</span>
            <span className="text-[10px] font-mono text-[#58645F] dark:text-[#A7B2AB]">Select to inspect</span>
          </div>

          {isLoadingCases ? (
            <div className="py-8 text-center text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">
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
                        ? 'bg-[#EBF5F1] dark:bg-[#19332A] border-[#BCD8CD] dark:border-[#2C5E4E]'
                        : 'bg-[#F6F7F8] dark:bg-[#202824] border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE] truncate pr-2">
                        {idx + 1}. {c.category.replace('_', ' ').toUpperCase()}
                      </span>
                      {outcome ? (
                        outcome.passed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E8F5EE] dark:bg-[#176B58]/20 border border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]">
                            <CheckCircle2 className="w-3 h-3 text-[#0E6245] dark:text-[#65B89D]" />
                            <span>PASSED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]">
                            <XCircle className="w-3 h-3 text-[#9E2222] dark:text-[#F17575]" />
                            <span>FAILED</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-[#58645F] dark:text-[#A7B2AB]">Ready</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] line-clamp-1 italic">
                      &ldquo;{c.claim_text}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Case Inspector (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-6 space-y-5">
          {selectedCase ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE3DF] dark:border-[#343E38]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#176B58] dark:text-[#65B89D] font-semibold">
                    PERTURBATION: {selectedCase.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <h3 className="text-sm font-bold text-[#17211D] dark:text-[#EDF2EE]">
                    {selectedCase.title || `Adversarial Case #${selectedCase.id}`}
                  </h3>
                </div>
                {selectedRunOutcome && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
                      selectedRunOutcome.passed
                        ? 'bg-[#E8F5EE] dark:bg-[#176B58]/20 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]'
                        : 'bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]'
                    }`}
                  >
                    {selectedRunOutcome.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#0E6245] dark:text-[#65B89D]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#9E2222] dark:text-[#F17575]" />
                    )}
                    <span>{selectedRunOutcome.passed ? 'TEST PASSED' : 'TEST FAILED'}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB]">
                  MUTATION MECHANISM
                </div>
                <div className="p-3 rounded-lg bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#17211D] dark:text-[#EDF2EE] font-mono leading-relaxed">
                  {selectedCase.adversarial_mechanism || selectedCase.description}
                </div>
              </div>

              {/* Claim */}
              <div className="p-3.5 rounded-lg bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#176B58] dark:text-[#65B89D] font-semibold">
                  ADVERSARIAL MUTATED ASSERTION
                </div>
                <p className="text-xs text-[#17211D] dark:text-[#EDF2EE] italic leading-relaxed">
                  &ldquo;{selectedCase.claim_text}&rdquo;
                </p>
              </div>

              {/* Expected vs Actual */}
              <div className="p-3.5 rounded-lg bg-[#F6F7F8] dark:bg-[#111614] border border-[#DCE3DF] dark:border-[#343E38] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#58645F] dark:text-[#A7B2AB]">EXPECTED VERDICT:</span>
                  <span className="font-semibold text-[#9E2222] dark:text-[#F17575] uppercase">
                    {selectedCase.expected_verdict}
                  </span>
                </div>
                {selectedRunOutcome && (
                  <div className="flex items-center justify-between text-[11px] font-mono border-t border-[#DCE3DF] dark:border-[#343E38] pt-2">
                    <span className="text-[#58645F] dark:text-[#A7B2AB]">ACTUAL VERIFIER RESULT:</span>
                    <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE] uppercase">
                      {selectedRunOutcome.actual_verdict}
                    </span>
                  </div>
                )}
                {selectedRunOutcome?.explanation && (
                  <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] border-t border-[#DCE3DF] dark:border-[#343E38] pt-2 leading-relaxed">
                    <strong>Verifier Rationale:</strong> {selectedRunOutcome.explanation}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-[#58645F] dark:text-[#A7B2AB]">
              Select a test case to inspect its mutation and evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
