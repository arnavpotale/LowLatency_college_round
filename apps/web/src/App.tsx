import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SourceUploader } from './features/sources/SourceUploader';
import { AuditInputForm } from './features/audit/AuditInputForm';
import { AuditSummaryCard } from './features/audit/AuditSummaryCard';
import { AnswerHighlighter } from './features/claims/AnswerHighlighter';
import { ClaimLedger } from './features/claims/ClaimLedger';
import { ClaimDossier } from './features/claims/ClaimDossier';
import { AdversarialLabModal } from './features/audit/AdversarialLabModal';
import { ReportPreviewModal } from './features/reports/ReportPreviewModal';
import { apiClient } from './services/api';
import { AuditResponse, HealthResponse } from './types';
import { MOCK_INITIAL_AUDIT } from './mocks/sampleData';
import { ShieldAlert, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

export const App: React.FC = () => {
  const [audit, setAudit] = useState<AuditResponse>(MOCK_INITIAL_AUDIT);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAdversarialOpen, setIsAdversarialOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);

  // Initial check on mount
  useEffect(() => {
    async function init() {
      const h = await apiClient.getHealth();
      setHealth(h);
    }
    init();
  }, []);

  // Set default selected claim if claims exist
  useEffect(() => {
    if (audit.claims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(audit.claims[0].claim_id);
    }
  }, [audit.claims, selectedClaimId]);

  // Handle Demo Case Load
  const handleLoadDemo = () => {
    setErrorMessage(null);
    setAudit(MOCK_INITIAL_AUDIT);
    setSelectedClaimId(MOCK_INITIAL_AUDIT.claims[0]?.claim_id || null);
  };

  // Upload file handler
  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const source = await apiClient.uploadSourceFile(audit.audit_id, file);
      setAudit((prev) => ({
        ...prev,
        sources: [...prev.sources, source]
      }));
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to upload ${file.name}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add text source handler
  const handleAddTextSource = async (title: string, content: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const source = await apiClient.uploadSourceText(audit.audit_id, title, content);
      setAudit((prev) => ({
        ...prev,
        sources: [...prev.sources, source]
      }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add text source');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Audit
  const handleRunAudit = async (title: string, answerText: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await apiClient.submitAnswer(audit.audit_id, answerText);
      const updatedAudit = await apiClient.runAnalysis(audit.audit_id);
      setAudit({ ...updatedAudit, title });
      if (updatedAudit.claims.length > 0) {
        setSelectedClaimId(updatedAudit.claims[0].claim_id);
      }
      setIsSetupOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Audit verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Human Review Auditor Callback
  const handleSaveReview = async (
    claimId: string,
    action: string,
    notes: string,
    reviewer: string
  ) => {
    try {
      if (!audit.is_mock) {
        const updated = await apiClient.submitHumanReview(audit.audit_id, claimId, {
          action,
          notes,
          reviewer
        });
        setAudit(updated);
      } else {
        // Local state update for mock demonstration mode
        setAudit((prev) => {
          const newClaims = prev.claims.map((c) => {
            if (c.claim_id !== claimId) return c;
            const origVerdict = c.verdict;
            let newVerdict = origVerdict;
            if (action === 'override_supported') newVerdict = 'supported';
            else if (action === 'override_contradicted') newVerdict = 'contradicted';
            else if (action === 'override_unsupported') newVerdict = 'unsupported';

            return {
              ...c,
              verdict: newVerdict,
              human_review: {
                action: action as any,
                notes,
                reviewer: reviewer || 'Human Auditor',
                reviewed_at: new Date().toISOString(),
                original_verdict: origVerdict
              }
            };
          });
          return {
            ...prev,
            claims: newClaims
          };
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record auditor review');
    }
  };

  // Open Report Modal
  const handleOpenReport = async () => {
    try {
      const reportText = await apiClient.getReport(audit.audit_id);
      setReportMarkdown(reportText);
      setIsReportOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load audit report');
    }
  };

  const selectedClaim = audit.claims.find((c) => c.claim_id === selectedClaimId) || null;
  const hasResults = audit.status === 'completed' && audit.claims.length > 0;

  return (
    <div className="min-h-screen bg-[#101216] text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      <Navbar
        health={health}
        onLoadDemo={handleLoadDemo}
        onOpenReport={handleOpenReport}
        onOpenAdversarialLab={() => setIsAdversarialOpen(true)}
        hasCompletedAudit={hasResults}
      />

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 py-4 flex-1 w-full flex flex-col gap-4">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition font-mono text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Ingestion & Input Toggle Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSetupOpen(!isSetupOpen)}
              className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition px-2.5 py-1 rounded bg-[#15181e] border border-zinc-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                {isSetupOpen ? 'Collapse Evidence Ingestion & Answer Input' : 'Configure Ingestion & Submit Answer'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ({audit.sources.length} sources attached)
              </span>
              {isSetupOpen ? (
                <ChevronUp className="w-3 h-3 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              )}
            </button>

            <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
              Audit Session: <span className="text-zinc-300">{audit.audit_id}</span>
            </span>
          </div>

          {/* Collapsible Source & Input Section */}
          {isSetupOpen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-150">
              <SourceUploader
                sources={audit.sources}
                onUploadFile={handleUploadFile}
                onAddTextSource={handleAddTextSource}
                isLoading={isLoading}
              />

              <AuditInputForm
                initialTitle={audit.title || ''}
                initialAnswer={audit.original_answer || ''}
                onSubmit={handleRunAudit}
                isLoading={isLoading}
                hasSources={audit.sources.length > 0}
              />
            </div>
          )}
        </div>

        {/* Executive Summary Bar */}
        {hasResults && audit.summary && (
          <AuditSummaryCard
            summary={audit.summary}
            consistencyFindings={audit.consistency_findings}
            safetyFindings={audit.safety_findings}
            conflicts={audit.conflict_map || []}
            isMock={audit.is_mock}
            onOpenAdversarialLab={() => setIsAdversarialOpen(true)}
          />
        )}

        {/* Core 3-Panel Evidence Investigation Workspace */}
        {hasResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 min-h-[640px]">
            {/* Left Panel: Document View with Inline Claim Highlighting (Col 4) */}
            <div className="lg:col-span-4 flex flex-col gap-3 h-full">
              <div className="h-[640px]">
                <AnswerHighlighter
                  originalAnswer={audit.original_answer}
                  claims={audit.claims}
                  selectedClaimId={selectedClaimId}
                  onSelectClaim={(id) => setSelectedClaimId(id)}
                />
              </div>

              {/* Safety & Consistency Findings Section */}
              {(audit.safety_findings.length > 0 || audit.consistency_findings.length > 0) && (
                <div className="bg-[#15181e] rounded-lg border border-zinc-800 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Advisory &amp; Consistency
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {audit.safety_findings.length + audit.consistency_findings.length} findings
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {audit.safety_findings.map((sf) => (
                      <div
                        key={sf.finding_id}
                        className="p-2.5 rounded bg-rose-950/25 border border-rose-800/50 text-rose-300"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{sf.category.replace('_', ' ').toUpperCase()}</span>
                          <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-rose-900/60 text-rose-300">
                            {sf.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-zinc-300 text-[11px]">{sf.description}</p>
                        <p className="mt-1 text-[10px] text-rose-400 italic font-mono">
                          Action: {sf.recommendation}
                        </p>
                      </div>
                    ))}
                    {audit.consistency_findings.map((cf) => (
                      <div
                        key={cf.finding_id}
                        className="p-2.5 rounded bg-amber-950/25 border border-amber-800/50 text-amber-300"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{cf.finding_type.replace('_', ' ').toUpperCase()}</span>
                          <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-amber-900/60 text-amber-300">
                            {cf.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-zinc-300 text-[11px]">{cf.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Centre Panel: Compact Claim Ledger (Col 3.5 -> Col 4) */}
            <div className="lg:col-span-4 h-[640px]">
              <ClaimLedger
                claims={audit.claims}
                selectedClaimId={selectedClaimId}
                onSelectClaim={(id) => setSelectedClaimId(id)}
              />
            </div>

            {/* Right Panel: Selected Claim Forensic Dossier (Col 4.5 -> Col 4) */}
            <div className="lg:col-span-4 h-[640px]">
              <ClaimDossier
                claim={selectedClaim}
                evidenceList={audit.evidence}
                allConflicts={audit.conflict_map || []}
                onSaveReview={handleSaveReview}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-[#15181e] border border-zinc-800 rounded-lg">
            <p className="text-sm font-medium text-zinc-300">No active audit session</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-md">
              Load the sample medical & financial demonstration case or attach source documents and submit an AI-generated answer to begin the forensic audit.
            </p>
            <button
              onClick={handleLoadDemo}
              className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 text-xs font-semibold hover:bg-white transition"
            >
              Load Demo Case
            </button>
          </div>
        )}
      </main>

      {/* Adversarial Claim Lab Modal */}
      <AdversarialLabModal
        isOpen={isAdversarialOpen}
        onClose={() => setIsAdversarialOpen(false)}
      />

      {/* Audit Report Modal */}
      <ReportPreviewModal
        audit={audit}
        reportMarkdown={reportMarkdown}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#12141a] py-3 text-center text-xs text-zinc-500 font-mono">
        Second Opinion &bull; Forensic Evidence Auditing &bull; College Round Foundation
      </footer>
    </div>
  );
};

export default App;
