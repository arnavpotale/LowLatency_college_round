import React, { useEffect } from 'react';
import { Evidence, Claim } from '../../types';
import { BookOpen, ArrowRight, AlertTriangle, Layers } from 'lucide-react';

interface EvidenceViewerProps {
  evidenceList: Evidence[];
  activeEvidenceId: string | null;
  onSelectEvidence?: (evidenceId: string) => void;
  claims?: Claim[];
  selectedClaimId?: string | null;
  onJumpToClaim?: (claimId: string) => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  evidenceList,
  activeEvidenceId,
  onSelectEvidence,
  claims = [],
  selectedClaimId,
  onJumpToClaim
}) => {
  // Smoothly scroll the active evidence item into view
  useEffect(() => {
    if (activeEvidenceId) {
      const el = document.getElementById(`evidence-${activeEvidenceId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeEvidenceId]);

  const activeClaim = claims.find((c) => c.claim_id === selectedClaimId);

  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="p-8 text-center text-[#58645F] dark:text-[#A7B2AB] text-xs rounded-lg border border-dashed border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C]">
        No evidence excerpts retrieved yet.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Contextual notice if currently selected claim has NO citations */}
      {activeClaim && activeClaim.evidence_ids.length === 0 && (
        <div className="p-3 rounded-lg bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] text-xs text-[#965B0A] dark:text-[#E5AC48] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#17211D] dark:text-[#EDF2EE]">
              Selected Claim Has No Direct Citations
            </p>
            <p className="mt-1 italic font-sans text-xs text-[#58645F] dark:text-[#A7B2AB]">
              &ldquo;{activeClaim.claim_text}&rdquo;
            </p>
            <p className="text-[11px] mt-1 font-sans text-[#58645F] dark:text-[#A7B2AB]">
              Audit verdict: <span className="font-semibold uppercase font-mono">{activeClaim.verdict}</span>. No retrieved passages in source files met relevance thresholds for this statement.
            </p>
          </div>
        </div>
      )}

      {/* Contextual indicator if currently selected claim HAS citations */}
      {activeClaim && activeClaim.evidence_ids.length > 0 && (
        <div className="p-2.5 rounded-lg bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#17211D] dark:text-[#EDF2EE] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB] shrink-0" />
            <span className="truncate">
              Focusing on evidence for: <strong className="font-sans font-semibold">&ldquo;{activeClaim.claim_text.slice(0, 48)}...&rdquo;</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] px-2 py-0.5 rounded text-[#58645F] dark:text-[#A7B2AB] shrink-0">
            {activeClaim.evidence_ids.length} Citation{activeClaim.evidence_ids.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Evidence Excerpts List */}
      <div className="space-y-3">
        {evidenceList.map((ev) => {
          const isActive = activeEvidenceId === ev.evidence_id;
          const referencingClaims = claims.filter((c) => c.evidence_ids.includes(ev.evidence_id));

          // Find specific relation to active claim if available
          const pairEvaluation = activeClaim?.evaluation_trail?.find(
            (p) => p.evidence_id === ev.evidence_id
          );
          const isCitedByActiveClaim = activeClaim?.evidence_ids.includes(ev.evidence_id);

          let relationBadge = null;
          if (pairEvaluation) {
            if (pairEvaluation.relation === 'entails') {
              relationBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-[#E8F5EE] dark:bg-[#176B58]/25 text-[#0E6245] dark:text-[#65B89D] border border-[#B7E1CA] dark:border-[#2C5E4E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E6245] dark:bg-[#65B89D]"></span>
                  Supporting Evidence
                </span>
              );
            } else if (pairEvaluation.relation === 'contradicts') {
              relationBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/25 text-[#9E2222] dark:text-[#F17575] border border-[#F7C5C5] dark:border-[#6B2323]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9E2222] dark:bg-[#F17575]"></span>
                  Contradicting Evidence
                </span>
              );
            } else {
              relationBadge = (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-[#FEF6E9] dark:bg-[#B45309]/25 text-[#965B0A] dark:text-[#E5AC48] border border-[#F8DCAB] dark:border-[#633910]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#965B0A] dark:bg-[#E5AC48]"></span>
                  Insufficient Context
                </span>
              );
            }
          } else if (isCitedByActiveClaim) {
            relationBadge = (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D] border border-[#BCD8CD] dark:border-[#2C5E4E]">
                Direct Citation
              </span>
            );
          }

          return (
            <div
              key={ev.evidence_id}
              id={`evidence-${ev.evidence_id}`}
              onClick={() => onSelectEvidence && onSelectEvidence(ev.evidence_id)}
              className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col gap-2.5 shadow-xs ${
                isActive
                  ? 'bg-[#EDF1EF] dark:bg-[#202824] border-[#176B58] dark:border-[#65B89D] ring-1 ring-[#176B58] dark:ring-[#65B89D]'
                  : 'bg-white dark:bg-[#191F1C] border-[#DCE3DF] dark:border-[#343E38] hover:border-[#BCD8CD] dark:hover:border-[#445149]'
              }`}
            >
              {/* Source info & relevance */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB] shrink-0" />
                  <span className="text-xs font-semibold text-[#17211D] dark:text-[#EDF2EE] truncate">
                    {ev.source_name}
                  </span>
                  <span className="text-[10px] font-mono text-[#58645F] dark:text-[#A7B2AB] bg-[#EDF1EF] dark:bg-[#202824] px-2 py-0.5 rounded border border-[#DCE3DF] dark:border-[#343E38] shrink-0">
                    {ev.page_or_section}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {relationBadge}
                  <span className="text-[10px] font-mono text-[#0E6245] dark:text-[#65B89D] bg-[#E8F5EE] dark:bg-[#176B58]/25 px-2 py-0.5 rounded border border-[#B7E1CA] dark:border-[#2C5E4E] shrink-0 font-semibold">
                    {Math.round(ev.relevance_score * 100)}% match
                  </span>
                </div>
              </div>

              {/* Excerpt text */}
              <div className="p-3 rounded bg-[#EDF1EF] dark:bg-[#202824] font-sans text-xs text-[#17211D] dark:text-[#EDF2EE] leading-relaxed border border-[#DCE3DF] dark:border-[#343E38]">
                &ldquo;{ev.text}&rdquo;
              </div>

              {/* Finding notes if available from pair evaluation */}
              {pairEvaluation?.rationale && (
                <div className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] italic px-1">
                  Reasoning: {pairEvaluation.rationale}
                </div>
              )}

              {/* Bidirectional Linking: Referencing Claims */}
              {referencingClaims.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#DCE3DF] dark:border-[#343E38]">
                  <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">Cited in:</span>
                  {referencingClaims.map((rc) => {
                    const claimIdx = claims.findIndex((c) => c.claim_id === rc.claim_id);
                    const isCurrentClaim = rc.claim_id === selectedClaimId;
                    return (
                      <button
                        key={rc.claim_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onJumpToClaim) onJumpToClaim(rc.claim_id);
                        }}
                        title={`Jump to claim: "${rc.claim_text}"`}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 transition shadow-xs ${
                          isCurrentClaim
                            ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] font-semibold'
                            : 'bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] border-[#DCE3DF] dark:border-[#343E38]'
                        }`}
                      >
                        <span>
                          Claim {claimIdx >= 0 ? `#${claimIdx + 1}` : `[${rc.start_offset}:${rc.end_offset}]`}
                        </span>
                        <span className="opacity-80">({rc.verdict})</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-80" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

