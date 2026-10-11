import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse } from '../types';
import { AnswerHighlighter } from '../features/claims/AnswerHighlighter';
import { ClaimLedger } from '../features/claims/ClaimLedger';
import { ClaimDossier } from '../features/claims/ClaimDossier';
import {
  FileText,
  ListFilter,
  Download,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface InvestigationPageProps {
  audit: AuditResponse;
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
  onSaveReview: (claimId: string, action: string, notes: string, reviewer: string) => Promise<void>;
  onOpenReportModal: () => void;
}

export const InvestigationPage: React.FC<InvestigationPageProps> = ({
  audit,
  selectedClaimId,
  onSelectClaim,
  onSaveReview,
  onOpenReportModal
}) => {
  const { navigate } = useRouter();

  // Left panel view: 'document' (default) or 'claims'
  const [leftTab, setLeftTab] = useState<'document' | 'claims'>('document');

  const claims = audit.claims || [];
  const selectedClaim = claims.find((c) => c.claim_id === selectedClaimId) || claims[0] || null;
  const currentIndex = claims.findIndex((c) => c.claim_id === selectedClaim?.claim_id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < claims.length - 1;

  const handlePrevClaim = () => {
    if (hasPrev) onSelectClaim(claims[currentIndex - 1].claim_id);
  };

  const handleNextClaim = () => {
    if (hasNext) onSelectClaim(claims[currentIndex + 1].claim_id);
  };

  // Sync selectedClaimId if empty
  useEffect(() => {
    if (!selectedClaimId && claims.length > 0) {
      onSelectClaim(claims[0].claim_id);
    }
  }, [selectedClaimId, claims, onSelectClaim]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F6F7F8] dark:bg-[#111614]">
      {/* Investigation Workspace Sub-header */}
      <div className="h-11 px-6 flex-shrink-0 flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/audits/${audit.audit_id}/overview`)}
            className="flex items-center gap-1.5 text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Audit Overview</span>
          </button>
          <span className="text-[#DCE3DF] dark:text-[#343E38]">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[#58645F] dark:text-[#A7B2AB] font-mono text-[11px]">INVESTIGATING:</span>
            <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE] truncate max-w-sm">
              {audit.title || 'Audit Session'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Prev/Next Claim Stepper */}
          <div className="flex items-center gap-1.5 bg-[#EDF1EF] dark:bg-[#202824] px-2 py-0.5 rounded border border-[#DCE3DF] dark:border-[#343E38]">
            <button
              onClick={handlePrevClaim}
              disabled={!hasPrev}
              title="Previous Claim"
              className="p-1 rounded text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[#58645F] dark:text-[#A7B2AB] font-mono text-[11px] px-1">
              Claim {currentIndex >= 0 ? currentIndex + 1 : 1} of {claims.length}
            </span>
            <button
              onClick={handleNextClaim}
              disabled={!hasNext}
              title="Next Claim"
              className="p-1 rounded text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EDF1EF] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB]" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column (5 cols): Submitted Answer Document or Claim Ledger */}
        <div className="lg:col-span-5 border-r border-[#DCE3DF] dark:border-[#343E38] flex flex-col h-full bg-white dark:bg-[#191F1C] overflow-hidden">
          {/* Segmented View Switcher */}
          <div className="p-3 border-b border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#202824] flex items-center justify-between">
            <div className="inline-flex rounded-lg bg-[#DCE3DF] dark:bg-[#191F1C] p-0.5 border border-[#C5D0CB] dark:border-[#343E38] text-xs">
              <button
                onClick={() => setLeftTab('document')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                  leftTab === 'document'
                    ? 'bg-white dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] shadow-xs'
                    : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Answer Document</span>
              </button>
              <button
                onClick={() => setLeftTab('claims')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                  leftTab === 'claims'
                    ? 'bg-white dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] shadow-xs'
                    : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Claims List ({claims.length})</span>
              </button>
            </div>
            <span className="text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
              {leftTab === 'document' ? 'Click span to focus' : 'Select claim card'}
            </span>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F6F7F8] dark:bg-[#111614]">
            {leftTab === 'document' ? (
              <AnswerHighlighter
                originalAnswer={audit.original_answer || ''}
                claims={claims}
                selectedClaimId={selectedClaim?.claim_id || null}
                onSelectClaim={onSelectClaim}
              />
            ) : (
              <ClaimLedger
                claims={claims}
                selectedClaimId={selectedClaim?.claim_id || null}
                onSelectClaim={onSelectClaim}
              />
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Claim Dossier & Forensics */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#F6F7F8] dark:bg-[#111614] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {selectedClaim ? (
              <ClaimDossier
                claim={selectedClaim}
                evidenceList={audit.evidence || []}
                allConflicts={audit.conflict_map || []}
                allClaims={claims}
                onJumpToClaim={onSelectClaim}
                onSaveReview={onSaveReview}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#58645F] dark:text-[#A7B2AB] space-y-3">
                <Layers className="w-10 h-10 text-[#7E8C86] dark:text-[#738078]" />
                <div className="text-xs font-medium text-[#17211D] dark:text-[#EDF2EE]">No Claim Selected</div>
                <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] max-w-sm">
                  Click any highlighted sentence in the Submitted Answer Document to open its detailed investigation dossier.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

