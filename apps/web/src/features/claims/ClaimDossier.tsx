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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 text-xs bg-[#12141a] border border-zinc-800/80 rounded-lg">
        <FileText className="w-8 h-8 text-zinc-600 mb-2" />
        <p className="font-medium text-zinc-300">No Claim Selected</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Select an assertion from the Submitted Answer or Claim Ledger to inspect evidence and autopsy.
        </p>
      </div>
    );
  }

  const hasConflict = claim.conflict || claim.verdict === 'ambiguous';
  const claimIndex = allClaims.findIndex((c) => c.claim_id === claim.claim_id);
  const claimEvidence = evidenceList.filter((e) => claim.evidence_ids.includes(e.evidence_id));

  return (
    <div className="flex flex-col h-full bg-[#12141a] border border-zinc-800/80 rounded-lg overflow-hidden">
      {/* Top Dossier Header */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-[#14161f] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase text-zinc-200 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              {claimIndex >= 0 ? `CLAIM #${claimIndex + 1}` : claim.claim_id}
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              [{claim.start_offset}:{claim.end_offset}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <VerdictBadge verdict={claim.verdict} size="sm" />
            <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              {Math.round(claim.confidence * 100)}% conf
            </span>
          </div>
        </div>

        {/* Claim Full Text */}
        <blockquote className="font-sans text-xs text-zinc-100 leading-snug border-l-2 border-zinc-400 pl-3">
          &ldquo;{claim.claim_text}&rdquo;
        </blockquote>

        {/* Concise Grounded Finding Callout */}
        <div className="text-xs text-zinc-300 font-sans bg-[#0f1117] p-2.5 rounded border border-zinc-800/80 leading-relaxed">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold mr-1.5">
            Verification Finding:
          </span>
          {claim.explanation}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-zinc-800/80">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'evidence'
                ? 'bg-zinc-200 text-zinc-900 border-zinc-200 font-semibold shadow-sm'
                : 'bg-[#0f1117] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Evidence ({claim.evidence_ids.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('autopsy')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'autopsy'
                ? 'bg-zinc-200 text-zinc-900 border-zinc-200 font-semibold shadow-sm'
                : 'bg-[#0f1117] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Claim Autopsy</span>
          </button>

          <button
            onClick={() => setActiveTab('trail')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'trail'
                ? 'bg-zinc-200 text-zinc-900 border-zinc-200 font-semibold shadow-sm'
                : 'bg-[#0f1117] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Verdict Trail ({claim.evaluation_trail?.length || claim.evidence_ids.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflict')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'conflict'
                ? 'bg-zinc-200 text-zinc-900 border-zinc-200 font-semibold shadow-sm'
                : hasConflict
                ? 'bg-purple-950/40 text-purple-300 border-purple-800/80 hover:bg-purple-900/50'
                : 'bg-[#0f1117] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Conflict Map</span>
            {hasConflict && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
              activeTab === 'review'
                ? 'bg-zinc-200 text-zinc-900 border-zinc-200 font-semibold shadow-sm'
                : claim.human_review
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                : 'bg-[#0f1117] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Human Review</span>
            {claim.human_review && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f1117]">
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
