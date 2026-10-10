import React, { useState } from 'react';
import { Claim, Evidence, ConflictDetail } from '../../types';
import { VerdictBadge } from '../../components/VerdictBadge';
import { ClaimAutopsyCard } from './ClaimAutopsyCard';
import { EvidenceConflictMap } from '../evidence/EvidenceConflictMap';
import { VerdictTrailViewer } from '../evidence/VerdictTrailViewer';
import { HumanReviewPanel } from '../audit/HumanReviewPanel';
import { Search, Compass, GitFork, UserCheck, FileText } from 'lucide-react';

interface ClaimDossierProps {
  claim: Claim | null;
  evidenceList: Evidence[];
  allConflicts?: ConflictDetail[];
  onSaveReview: (claimId: string, action: string, notes: string, reviewer: string) => Promise<void>;
  activeEvidenceId?: string | null;
  onSelectEvidence?: (evidenceId: string) => void;
  onJumpToClaim?: (claimId: string) => void;
}

export const ClaimDossier: React.FC<ClaimDossierProps> = ({
  claim,
  evidenceList,
  allConflicts = [],
  onSaveReview,
  activeEvidenceId,
  onSelectEvidence,
  onJumpToClaim: _onJumpToClaim
}) => {
  const [activeTab, setActiveTab] = useState<'autopsy' | 'trail' | 'conflict' | 'review'>('autopsy');

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 text-xs bg-[#15181e] border border-zinc-800 rounded-lg">
        <FileText className="w-8 h-8 text-zinc-600 mb-2" />
        <p className="font-medium text-zinc-400">No Claim Selected</p>
        <p className="text-[11px] text-zinc-600 mt-0.5">
          Select an assertion from the Answer document or Claim Ledger to inspect evidence and autopsy.
        </p>
      </div>
    );
  }

  const hasConflict = claim.conflict || claim.verdict === 'ambiguous';

  return (
    <div className="flex flex-col h-full bg-[#15181e] border border-zinc-800 rounded-lg overflow-hidden">
      {/* Top Dossier Header */}
      <div className="p-4 border-b border-zinc-800 bg-[#171a22] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
              Claim ID: {claim.claim_id}
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
        <blockquote className="font-serif text-sm text-zinc-100 leading-snug border-l-2 border-zinc-500 pl-3 italic">
          &ldquo;{claim.claim_text}&rdquo;
        </blockquote>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 pt-1 border-t border-zinc-800/80">
          <button
            onClick={() => setActiveTab('autopsy')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'autopsy'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Autopsy</span>
          </button>

          <button
            onClick={() => setActiveTab('trail')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'trail'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Verdict Trail ({claim.evaluation_trail?.length || claim.evidence_ids.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflict')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'conflict'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : hasConflict
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Conflict Map</span>
            {hasConflict && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : claim.human_review
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Auditor Review</span>
            {claim.human_review && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
