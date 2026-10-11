import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuditOverviewBar } from './features/audit/AuditOverviewBar';
import { AuditSetupModal } from './features/audit/AuditSetupModal';
import { AnswerHighlighter } from './features/claims/AnswerHighlighter';
import { ClaimLedger } from './features/claims/ClaimLedger';
import { ClaimDossier } from './features/claims/ClaimDossier';
import { AdversarialLabModal } from './features/audit/AdversarialLabModal';
import { ReportPreviewModal } from './features/reports/ReportPreviewModal';
import { apiClient } from './services/api';
import { AuditResponse, HealthResponse } from './types';
import { MOCK_INITIAL_AUDIT } from './mocks/sampleData';
import { ShieldAlert, ListFilter, FileText } from 'lucide-react';

export const App: React.FC = () => {
  const [audit, setAudit] = useState<AuditResponse>(MOCK_INITIAL_AUDIT);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'document' | 'claims'>('document');
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAdversarialOpen, setIsAdversarialOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial check on mount
  useEffect(() => {
    async function init() {
      const h = await apiClient.getHealth();
      setHealth(h);
    }
    init();
  }, []);

  // Set default selected claim and active evidence on load or change
  useEffect(() => {
    if (audit.claims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(audit.claims[0].claim_id);
      if (audit.claims[0].evidence_ids.length > 0) {
        setActiveEvidenceId(audit.claims[0].evidence_ids[0]);
      } else {
        setActiveEvidenceId(null);
      }
    }
  }, [audit.claims, selectedClaimId]);

  // Handle Demo Case Load
  const handleLoadDemo = () => {
    setErrorMessage(null);
    setAudit(MOCK_INITIAL_AUDIT);
    setSelectedClaimId(MOCK_INITIAL_AUDIT.claims[0]?.claim_id || null);
    setActiveEvidenceId(MOCK_INITIAL_AUDIT.claims[0]?.evidence_ids[0] || null);
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
      let targetAuditId = audit.audit_id;
      if (audit.is_mock) {
        try {
          const created = await apiClient.createAudit(title);
          targetAuditId = created.audit_id;
        } catch {
          // If backend offline or mock mode, keep current ID
        }
      }

      await apiClient.submitAnswer(targetAuditId, answerText);
      const updatedAudit = await apiClient.runAnalysis(targetAuditId);
      setAudit({ ...updatedAudit, title });
      if (updatedAudit.claims.length > 0) {
        setSelectedClaimId(updatedAudit.claims[0].claim_id);
        setActiveEvidenceId(updatedAudit.claims[0].evidence_ids[0] || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Audit verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Select Claim & sync active evidence
  const handleSelectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    const targetClaim = audit.claims.find((c) => c.claim_id === claimId);
    if (targetClaim && targetClaim.evidence_ids.length > 0) {
      setActiveEvidenceId(targetClaim.evidence_ids[0]);
    } else {
      setActiveEvidenceId(null);
    }
  };

  // Jump from evidence to claim
  const handleJumpToClaim = (claimId: string) => {
    handleSelectClaim(claimId);
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

  const contradictedClaimIds = audit.claims
    .filter((c) => c.verdict === 'contradicted')
    .map((c) => c.claim_id);

  const conflictClaimIds = audit.claims
    .filter((c) => c.conflict || c.verdict === 'ambiguous')
    .map((c) => c.claim_id);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      <Navbar
        health={health}
        onOpenSetup={() => setIsSetupOpen(true)}
        onLoadDemo={handleLoadDemo}
        onOpenReport={handleOpenReport}
        onOpenAdversarialLab={() => setIsAdversarialOpen(true)}
        hasCompletedAudit={hasResults}
        auditTitle={audit.title}
      />

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 py-4 flex-1 w-full flex flex-col gap-3.5">
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

        {/* Concise Single-Line Executive Overview Ribbon */}
        {hasResults && audit.summary && (
          <AuditOverviewBar
            summary={audit.summary}
            consistencyFindings={audit.consistency_findings}
            safetyFindings={audit.safety_findings}
            conflicts={audit.conflict_map || []}
            isMock={audit.is_mock}
            onSelectClaim={handleSelectClaim}
            contradictedClaimIds={contradictedClaimIds}
            conflictClaimIds={conflictClaimIds}
            title={audit.title}
            sourceCount={audit.sources.length}
          />
        )}

        {/* Clean 2-Panel Investigation Workspace */}
        {hasResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 min-h-[660px]">
            {/* Left Panel: Submitted Answer Document with Segmented View Switcher (Col 5 / 42%) */}
            <div className="lg:col-span-5 flex flex-col h-[660px] bg-[#12141a] border border-zinc-800/80 rounded-lg overflow-hidden">
              {/* Left Panel Segmented View Switcher */}
              <div className="px-3 py-2 border-b border-zinc-800/80 bg-[#14161f] flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#0f1117] p-0.5 rounded border border-zinc-800">
                  <button
                    onClick={() => setLeftTab('document')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                      leftTab === 'document'
                        ? 'bg-zinc-200 text-zinc-900 font-semibold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Answer Document</span>
                  </button>
                  <button
                    onClick={() => setLeftTab('claims')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                      leftTab === 'claims'
                        ? 'bg-zinc-200 text-zinc-900 font-semibold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Claims List ({audit.claims.length})</span>
                  </button>
                </div>

                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                  Click assertion to focus
                </span>
              </div>

              {/* View Content */}
              <div className="flex-1 overflow-hidden">
                {leftTab === 'document' ? (
                  <AnswerHighlighter
                    originalAnswer={audit.original_answer}
                    claims={audit.claims}
                    selectedClaimId={selectedClaimId}
                    onSelectClaim={handleSelectClaim}
                  />
                ) : (
                  <ClaimLedger
                    claims={audit.claims}
                    selectedClaimId={selectedClaimId}
                    onSelectClaim={handleSelectClaim}
                  />
                )}
              </div>
            </div>

            {/* Right Panel: Focused Claim Detail Dossier (Col 7 / 58%) */}
            <div className="lg:col-span-7 h-[660px]">
              <ClaimDossier
                claim={selectedClaim}
                evidenceList={audit.evidence}
                allClaims={audit.claims}
                allConflicts={audit.conflict_map || []}
                onSaveReview={handleSaveReview}
                activeEvidenceId={activeEvidenceId}
                onSelectEvidence={(id) => setActiveEvidenceId(id)}
                onJumpToClaim={handleJumpToClaim}
              />
            </div>
          </div>
        ) : (
          /* Empty Initial State: Welcoming & Actionable */
          <div className="flex flex-col items-center justify-center p-16 text-center bg-[#14161d] border border-zinc-800 rounded-lg max-w-2xl mx-auto my-12">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-3">
              <FileText className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">
              Welcome to Second Opinion
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md leading-relaxed">
              An evidence investigation workspace that shows not only whether an AI claim is supported, but exactly where the evidence comes from, when sources disagree, and why.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setIsSetupOpen(true)}
                className="px-4 py-2 rounded bg-zinc-200 text-zinc-900 text-xs font-semibold hover:bg-white transition shadow-sm"
              >
                Start New Audit
              </button>
              <button
                onClick={handleLoadDemo}
                className="px-4 py-2 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
              >
                Load Sample Case
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Audit Setup Modal (2-step clean setup) */}
      <AuditSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        sources={audit.sources}
        onUploadFile={handleUploadFile}
        onAddTextSource={handleAddTextSource}
        onSubmit={handleRunAudit}
        onLoadDemo={handleLoadDemo}
        isLoading={isLoading}
        initialTitle={audit.title || ''}
        initialAnswer={audit.original_answer || ''}
      />

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
        Second Opinion &bull; Evidence Investigation Workspace &bull; College Round Foundation
      </footer>
    </div>
  );
};

export default App;
