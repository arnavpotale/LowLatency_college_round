import React, { useState } from 'react';
import { Claim, Evidence, ConflictDetail } from '../../types';
import { VerdictBadge } from '../../components/VerdictBadge';
import { ClaimAutopsyCard } from './ClaimAutopsyCard';
import { EvidenceConflictMap } from '../evidence/EvidenceConflictMap';
import { VerdictTrailViewer } from '../evidence/VerdictTrailViewer';
import { HumanReviewPanel } from '../audit/HumanReviewPanel';
import { EvidenceViewer } from '../evidence/EvidenceViewer';
import { Search, Compass, GitFork, UserCheck, FileText, Layers } from 'lucide-react';

interface ClaimDossierProps {
  claim: Claim | null;
  evidenceList: Evidence[];
  allConflicts?: ConflictDetail[];
  onSaveReview: (claimId: string, action: string, notes: string, reviewer: string) => Promise<void>;
  activeEvidenceId?: string | null;
  onSelectEvidence?: (evidenceId: string) => void;
  onJumpToClaim?: (claimId: string) => void;
  allClaims?: Claim[];
}

export const ClaimDossier: React.FC<ClaimDossierProps> = ({
  claim,
  evidenceList,
  allConflicts = [],
  onSaveReview,
  activeEvidenceId,
  onSelectEvidence,
  onJumpToClaim,
  allClaims = []
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'autopsy' | 'trail' | 'conflict' | 'review'>('evidence');

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#58645F] dark:text-[#A7B2AB] text-xs bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-lg shadow-xs">
        <FileText className="w-8 h-8 text-[#7E8C86] dark:text-[#738078] mb-2" />
        <p className="font-medium text-[#17211D] dark:text-[#EDF2EE]">No Claim Selected</p>
        <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] mt-0.5">
          Select an assertion from the Submitted Answer or Claim Ledger to inspect evidence and autopsy.
        </p>
      </div>
    );
  }

  const hasConflict = claim.conflict || claim.verdict === 'ambiguous';
  const claimIndex = allClaims.findIndex((c) => c.claim_id === claim.claim_id);
  const claimEvidence = evidenceList.filter((e) => claim.evidence_ids.includes(e.evidence_id));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-lg overflow-hidden shadow-xs">
      {/* Top Dossier Header */}
      <div className="p-3.5 border-b border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#202824] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase text-[#17211D] dark:text-[#EDF2EE] font-bold px-2 py-0.5 rounded bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38]">
              {claimIndex >= 0 ? `CLAIM #${claimIndex + 1}` : claim.claim_id}
            </span>
            <span className="font-mono text-[10px] text-[#58645F] dark:text-[#A7B2AB]">
              [{claim.start_offset}:{claim.end_offset}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <VerdictBadge verdict={claim.verdict} size="sm" />
            <span className="font-mono text-[11px] text-[#58645F] dark:text-[#A7B2AB] bg-white dark:bg-[#191F1C] px-2 py-0.5 rounded border border-[#DCE3DF] dark:border-[#343E38]">
              {Math.round(claim.confidence * 100)}% conf
            </span>
          </div>
        </div>

        {/* Claim Full Text */}
        <blockquote className="font-sans text-xs text-[#17211D] dark:text-[#EDF2EE] leading-snug border-l-2 border-[#176B58] dark:border-[#65B89D] pl-3">
          &ldquo;{claim.claim_text}&rdquo;
        </blockquote>

        {/* Concise Grounded Finding Callout */}
        <div className="text-xs text-[#17211D] dark:text-[#EDF2EE] font-sans bg-white dark:bg-[#191F1C] p-2.5 rounded border border-[#DCE3DF] dark:border-[#343E38] leading-relaxed shadow-xs">
          <span className="text-[10px] uppercase font-mono text-[#58645F] dark:text-[#A7B2AB] font-semibold mr-1.5">
            Verification Finding:
          </span>
          {claim.explanation}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[#DCE3DF] dark:border-[#343E38]">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'evidence'
                ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] font-semibold shadow-xs'
                : 'bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border-[#DCE3DF] dark:border-[#343E38] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Evidence ({claim.evidence_ids.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('autopsy')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'autopsy'
                ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] font-semibold shadow-xs'
                : 'bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border-[#DCE3DF] dark:border-[#343E38] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Claim Autopsy</span>
          </button>

          <button
            onClick={() => setActiveTab('trail')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'trail'
                ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] font-semibold shadow-xs'
                : 'bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border-[#DCE3DF] dark:border-[#343E38] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Verdict Trail ({claim.evaluation_trail?.length || claim.evidence_ids.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflict')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'conflict'
                ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] font-semibold shadow-xs'
                : hasConflict
                ? 'bg-[#F4F0FC] dark:bg-[#6D28D9]/25 text-[#5B32A8] dark:text-[#B48DEF] border-[#D5C6F5] dark:border-[#4E2582] hover:bg-[#E9DDFB] dark:hover:bg-[#6D28D9]/40'
                : 'bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border-[#DCE3DF] dark:border-[#343E38] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Conflict Map</span>
            {hasConflict && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B32A8] dark:bg-[#B48DEF] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'review'
                ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] font-semibold shadow-xs'
                : claim.human_review
                ? 'bg-[#E8F5EE] dark:bg-[#176B58]/25 text-[#0E6245] dark:text-[#65B89D] border-[#B7E1CA] dark:border-[#2C5E4E] hover:bg-[#D6EFE3] dark:hover:bg-[#176B58]/40'
                : 'bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border-[#DCE3DF] dark:border-[#343E38] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Human Review</span>
            {claim.human_review && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E6245] dark:bg-[#65B89D]" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F6F7F8] dark:bg-[#111614]">
        {activeTab === 'evidence' && (
          <EvidenceViewer
            evidenceList={claimEvidence.length > 0 ? claimEvidence : evidenceList}
            activeEvidenceId={activeEvidenceId || null}
            onSelectEvidence={onSelectEvidence}
            claims={allClaims}
            selectedClaimId={claim.claim_id}
            onJumpToClaim={onJumpToClaim}
          />
        )}

        {activeTab === 'autopsy' && (
          <ClaimAutopsyCard autopsy={claim.autopsy} claimText={claim.claim_text} />
        )}

        {activeTab === 'trail' && (
          <VerdictTrailViewer
            evaluationTrail={claim.evaluation_trail}
            evidenceList={evidenceList}
            claimEvidenceIds={claim.evidence_ids}
            activeEvidenceId={activeEvidenceId}
            onSelectEvidence={onSelectEvidence}
            allClaims={allClaims}
            selectedClaimId={claim.claim_id}
            onJumpToClaim={onJumpToClaim}
          />
        )}

        {activeTab === 'conflict' && (
          <EvidenceConflictMap conflict={claim.conflict} allConflicts={allConflicts} />
        )}

        {activeTab === 'review' && (
          <HumanReviewPanel
            claim={claim}
            onSaveReview={(action, notes, reviewer) =>
              onSaveReview(claim.claim_id, action, notes, reviewer)
            }
          />
        )}
      </div>
    </div>
  );
};

