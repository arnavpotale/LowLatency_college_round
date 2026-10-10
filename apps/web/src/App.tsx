import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SourceUploader } from './features/sources/SourceUploader';
import { AuditInputForm } from './features/audit/AuditInputForm';
import { AuditSummaryCard } from './features/audit/AuditSummaryCard';
import { AnswerHighlighter } from './features/claims/AnswerHighlighter';
import { ClaimList } from './features/claims/ClaimList';
import { EvidenceViewer } from './features/evidence/EvidenceViewer';
import { ReportPreviewModal } from './features/reports/ReportPreviewModal';
import { apiClient } from './services/api';
import { AuditResponse, HealthResponse } from './types';
import { MOCK_INITIAL_AUDIT } from './mocks/sampleData';
import { Layers, CheckCircle2, FileCheck, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [audit, setAudit] = useState<AuditResponse>(MOCK_INITIAL_AUDIT);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'claims' | 'evidence'>('claims');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');

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
      if (audit.claims[0].evidence_ids.length > 0) {
        setActiveEvidenceId(audit.claims[0].evidence_ids[0]);
      }
    }
  }, [audit.claims, selectedClaimId]);

  // Handle Demo Case Load
  const handleLoadDemo = async () => {
    setAudit(MOCK_INITIAL_AUDIT);
    setSelectedClaimId(MOCK_INITIAL_AUDIT.claims[0]?.claim_id || null);
    setActiveEvidenceId(MOCK_INITIAL_AUDIT.claims[0]?.evidence_ids[0] || null);
  };

  // Upload file handler
  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    try {
      const source = await apiClient.uploadSourceFile(audit.audit_id, file);
      setAudit((prev) => ({
        ...prev,
        sources: [...prev.sources, source]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Add text source handler
  const handleAddTextSource = async (title: string, content: string) => {
    setIsLoading(true);
    try {
      const source = await apiClient.uploadSourceText(audit.audit_id, title, content);
      setAudit((prev) => ({
        ...prev,
        sources: [...prev.sources, source]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Run Audit
  const handleRunAudit = async (title: string, answerText: string) => {
    setIsLoading(true);
    try {
      // 1. Submit answer
      await apiClient.submitAnswer(audit.audit_id, answerText);
      // 2. Trigger analysis
      const updatedAudit = await apiClient.runAnalysis(audit.audit_id);
      setAudit({ ...updatedAudit, title });
      if (updatedAudit.claims.length > 0) {
        setSelectedClaimId(updatedAudit.claims[0].claim_id);
        if (updatedAudit.claims[0].evidence_ids.length > 0) {
          setActiveEvidenceId(updatedAudit.claims[0].evidence_ids[0]);
        }
      }
    } catch (err: any) {
      console.error("Audit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Report Modal
  const handleOpenReport = async () => {
    const reportText = await apiClient.getReport(audit.audit_id);
    setReportMarkdown(reportText);
    setIsReportOpen(true);
  };

  // Claim click handler
  const handleSelectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    const targetClaim = audit.claims.find((c) => c.claim_id === claimId);
    if (targetClaim && targetClaim.evidence_ids.length > 0) {
      setActiveEvidenceId(targetClaim.evidence_ids[0]);
    }
  };

  // Evidence pill click handler
  const handleEvidenceClick = (evidenceId: string) => {
    setActiveEvidenceId(evidenceId);
    setRightTab('evidence');
  };

  const hasResults = audit.status === 'completed' && audit.claims.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        health={health}
        onLoadDemo={handleLoadDemo}
        onOpenReport={handleOpenReport}
        hasCompletedAudit={hasResults}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col gap-6">
        {/* Step 1 & 2 Inputs: Sources and AI Answer Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Audit Results View (Shown when audit is analyzed) */}
        {hasResults && audit.summary && (
          <div className="flex flex-col gap-6 pt-2">
            {/* Top Summary Card */}
            <AuditSummaryCard
              summary={audit.summary}
              consistencyFindings={audit.consistency_findings}
              safetyFindings={audit.safety_findings}
              isMock={audit.is_mock}
            />

            {/* Main Interactive Split Inspection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Original Answer with Offset Highlighting */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-indigo-400" />
                      Answer Offset Highlighter
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Click text spans to inspect
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Exact character offsets <span className="font-mono text-slate-300">[start:end]</span> anchored to original LLM answer:
                  </p>
                  <AnswerHighlighter
                    originalAnswer={audit.original_answer}
                    claims={audit.claims}
                    selectedClaimId={selectedClaimId}
                    onSelectClaim={handleSelectClaim}
                  />
                </div>

                {/* Safety & Consistency Findings Section */}
                {(audit.safety_findings.length > 0 || audit.consistency_findings.length > 0) && (
                  <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Risk & Consistency Audits
                    </h3>
                    <div className="space-y-2 text-xs">
                      {audit.safety_findings.map((sf) => (
                        <div key={sf.finding_id} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                          <div className="flex items-center justify-between font-semibold">
                            <span>{sf.category.replace('_', ' ').toUpperCase()}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20">{sf.severity}</span>
                          </div>
                          <p className="mt-1 text-slate-300">{sf.description}</p>
                          <p className="mt-1.5 text-[11px] text-rose-400 italic font-mono">Advisory: {sf.recommendation}</p>
                        </div>
                      ))}
                      {audit.consistency_findings.map((cf) => (
                        <div key={cf.finding_id} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          <div className="flex items-center justify-between font-semibold">
                            <span>{cf.finding_type.replace('_', ' ').toUpperCase()}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20">{cf.severity}</span>
                          </div>
                          <p className="mt-1 text-slate-300">{cf.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Claims & Evidence Tabs */}
              <div className="lg:col-span-7 bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRightTab('claims')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        rightTab === 'claims'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Claims & Verdicts ({audit.claims.length})</span>
                    </button>
                    <button
                      onClick={() => setRightTab('evidence')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        rightTab === 'evidence'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Evidence Base ({audit.evidence.length})</span>
                    </button>
                  </div>

                  <button
                    onClick={handleOpenReport}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                  >
                    View Full Report
                  </button>
                </div>

                {rightTab === 'claims' ? (
                  <ClaimList
                    claims={audit.claims}
                    evidenceList={audit.evidence}
                    selectedClaimId={selectedClaimId}
                    onSelectClaim={handleSelectClaim}
                    onEvidenceClick={handleEvidenceClick}
                  />
                ) : (
                  <EvidenceViewer
                    evidenceList={audit.evidence}
                    activeEvidenceId={activeEvidenceId}
                    onSelectEvidence={(id) => setActiveEvidenceId(id)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Audit Report Modal */}
      <ReportPreviewModal
        audit={audit}
        reportMarkdown={reportMarkdown}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>Second Opinion — AI Answer Verification Platform &bull; College Round Foundation</p>
      </footer>
    </div>
  );
};

export default App;
