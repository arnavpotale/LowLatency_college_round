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
  ChevronLeft
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

  // Sync selectedClaimId if empty
  useEffect(() => {
    if (!selectedClaimId && claims.length > 0) {
      onSelectClaim(claims[0].claim_id);
    }
  }, [selectedClaimId, claims, onSelectClaim]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Investigation Workspace Sub-header */}
      <div className="h-11 px-6 flex-shrink-0 flex items-center justify-between border-b border-zinc-800/80 bg-[#12141a]/90 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/audits/${audit.audit_id}/overview`)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Audit Overview</span>
          </button>
          <span className="text-zinc-400">|</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-mono">INVESTIGATING:</span>
            <span className="font-semibold text-zinc-200 truncate max-w-sm">
              {audit.title || 'Audit Session'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-400 font-mono text-[11px]">
            Claim {claims.findIndex((c) => c.claim_id === selectedClaim?.claim_id) + 1} of {claims.length}
          </span>
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column (5 cols): Submitted Answer Document or Claim Ledger */}
        <div className="lg:col-span-5 border-r border-zinc-800/80 flex flex-col h-full bg-[#101218] overflow-hidden">
          {/* Segmented View Switcher */}
          <div className="p-3 border-b border-zinc-800/80 bg-[#12141a] flex items-center justify-between">
            <div className="inline-flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800 text-xs">
              <button
                onClick={() => setLeftTab('document')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                  leftTab === 'document'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Answer Document</span>
              </button>
              <button
                onClick={() => setLeftTab('claims')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                  leftTab === 'claims'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Claims List ({claims.length})</span>
              </button>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {leftTab === 'document' ? 'Click span to focus' : 'Select claim card'}
            </span>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
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
        <div className="lg:col-span-7 flex flex-col h-full bg-[#0d0f14] overflow-hidden">
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
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 space-y-3">
                <Layers className="w-10 h-10 text-zinc-400" />
                <div className="text-xs font-medium text-zinc-300">No Claim Selected</div>
                <p className="text-[11px] text-zinc-400 max-w-sm">
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
