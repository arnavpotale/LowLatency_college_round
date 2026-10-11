import React from 'react';
import { PairResult, Evidence, Claim } from '../../types';
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, FileText, Compass, ArrowRight } from 'lucide-react';

interface VerdictTrailViewerProps {
  evaluationTrail?: PairResult[];
  evidenceList: Evidence[];
  claimEvidenceIds: string[];
  activeEvidenceId?: string | null;
  onSelectEvidence?: (evidenceId: string) => void;
  allClaims?: Claim[];
  selectedClaimId?: string | null;
  onJumpToClaim?: (claimId: string) => void;
}

export const VerdictTrailViewer: React.FC<VerdictTrailViewerProps> = ({
  evaluationTrail = [],
  evidenceList,
  claimEvidenceIds,
  activeEvidenceId,
  onSelectEvidence,
  allClaims = [],
  selectedClaimId,
  onJumpToClaim
}) => {
  const hasTrail = evaluationTrail.length > 0;

  if (!hasTrail && claimEvidenceIds.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#58645F] dark:text-[#A7B2AB] text-center space-y-1 shadow-xs">
        <Compass className="w-4 h-4 text-[#7E8C86] dark:text-[#738078] mx-auto mb-1" />
        <p className="font-medium text-[#17211D] dark:text-[#EDF2EE]">No Evidence Passages Cited</p>
        <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">
          This claim is either ungrounded or unsupported by retrieved source documentation.
        </p>
      </div>
    );
  }

  const getRelationBadge = (relation: string) => {
    switch (relation.toLowerCase()) {
      case 'entails':
        return {
          label: 'Corroborates',
          style: 'bg-[#E8F5EE] dark:bg-[#176B58]/25 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        };
      case 'contradicts':
        return {
          label: 'Contradicts',
          style: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]',
          icon: <XCircle className="w-3.5 h-3.5" />
        };
      case 'insufficient':
        return {
          label: 'Insufficient Context',
          style: 'bg-[#FEF6E9] dark:bg-[#B45309]/25 border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48]',
          icon: <AlertTriangle className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: 'Neutral',
          style: 'bg-[#EDF1EF] dark:bg-[#202824] border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB]',
          icon: <MinusCircle className="w-3.5 h-3.5" />
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38] pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#176B58] dark:text-[#65B89D]" />
          Proof-of-Verdict Trail ({hasTrail ? evaluationTrail.length : claimEvidenceIds.length})
        </span>
        <span className="text-[10px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
          Grounded Verification Trace
        </span>
      </div>

      <div className="space-y-2.5">
        {hasTrail ? (
          evaluationTrail.map((item, idx) => {
            const relBadge = getRelationBadge(item.relation);
            const isActive = activeEvidenceId === item.evidence_id;

            return (
              <div
                key={item.evidence_id || idx}
                onClick={() => item.evidence_id && onSelectEvidence?.(item.evidence_id)}
                className={`p-3.5 rounded-lg border transition text-xs space-y-2.5 cursor-pointer shadow-xs ${
                  isActive
                    ? 'border-[#176B58] dark:border-[#65B89D] bg-[#EDF1EF] dark:bg-[#202824] ring-1 ring-[#176B58] dark:ring-[#65B89D]'
                    : 'border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] hover:border-[#BCD8CD] dark:hover:border-[#445149]'
                }`}
              >
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB] shrink-0" />
                    <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE] truncate">
                      {item.source_name || 'Source Document'}
                    </span>
                    {item.page_or_section && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB] shrink-0">
                        {item.page_or_section}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-[#58645F] dark:text-[#A7B2AB]">
                      {Math.round(item.score * 100)}%
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${relBadge.style}`}
                    >
                      {relBadge.icon}
                      <span>{relBadge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Excerpt quote */}
                {item.excerpt && (
                  <p className="font-sans text-xs text-[#17211D] dark:text-[#EDF2EE] bg-[#EDF1EF] dark:bg-[#202824] p-2.5 rounded border border-[#DCE3DF] dark:border-[#343E38] leading-relaxed">
                    &ldquo;{item.excerpt}&rdquo;
                  </p>
                )}

                {/* Verification Rationale */}
                <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-sans leading-normal">
                  <span className="font-mono text-[10px] uppercase text-[#17211D] dark:text-[#EDF2EE] font-semibold mr-1">
                    Rule Evaluation:
                  </span>
                  {item.rationale}
                </p>

                {/* Bidirectional Linking: Cited Claims */}
                {allClaims.length > 0 && item.evidence_id && (() => {
                  const citingClaims = allClaims.filter((c) => c.evidence_ids.includes(item.evidence_id));
                  if (citingClaims.length === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#DCE3DF] dark:border-[#343E38]">
                      <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">Cited in:</span>
                      {citingClaims.map((cc) => {
                        const claimIdx = allClaims.findIndex((c) => c.claim_id === cc.claim_id);
                        const isCurrent = cc.claim_id === selectedClaimId;
                        return (
                          <button
                            key={cc.claim_id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToClaim?.(cc.claim_id);
                            }}
                            title={`Jump to Claim ${claimIdx + 1}: "${cc.claim_text.slice(0, 50)}..."`}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition shadow-xs ${
                              isCurrent
                                ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border border-[#176B58] dark:border-[#65B89D] font-semibold'
                                : 'bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] border border-[#DCE3DF] dark:border-[#343E38]'
                            }`}
                          >
                            <span>Claim {claimIdx + 1}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-80" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })
        ) : (
          // Fallback to linked evidence excerpts
          evidenceList
            .filter((e) => claimEvidenceIds.includes(e.evidence_id))
            .map((ev) => {
              const isActive = activeEvidenceId === ev.evidence_id;
              const citingClaims = allClaims.filter((c) => c.evidence_ids.includes(ev.evidence_id));
              return (
                <div
                  key={ev.evidence_id}
                  onClick={() => onSelectEvidence?.(ev.evidence_id)}
                  className={`p-3 rounded-lg border transition text-xs space-y-2 cursor-pointer shadow-xs ${
                    isActive
                      ? 'border-[#176B58] dark:border-[#65B89D] bg-[#EDF1EF] dark:bg-[#202824] ring-1 ring-[#176B58] dark:ring-[#65B89D]'
                      : 'border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] hover:border-[#BCD8CD] dark:hover:border-[#445149]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE]">{ev.source_name}</span>
                    <span className="font-mono text-[10px] text-[#58645F] dark:text-[#A7B2AB]">{ev.page_or_section}</span>
                  </div>
                  <p className="font-serif text-xs text-[#17211D] dark:text-[#EDF2EE] italic bg-[#EDF1EF] dark:bg-[#202824] p-2 rounded border border-[#DCE3DF] dark:border-[#343E38]">
                    &ldquo;{ev.text}&rdquo;
                  </p>
                  {citingClaims.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#DCE3DF] dark:border-[#343E38]">
                      <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">Cited in:</span>
                      {citingClaims.map((cc) => {
                        const claimIdx = allClaims.findIndex((c) => c.claim_id === cc.claim_id);
                        const isCurrent = cc.claim_id === selectedClaimId;
                        return (
                          <button
                            key={cc.claim_id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToClaim?.(cc.claim_id);
                            }}
                            title={`Jump to Claim ${claimIdx + 1}`}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition shadow-xs ${
                              isCurrent
                                ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border border-[#176B58] dark:border-[#65B89D] font-semibold'
                                : 'bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] border border-[#DCE3DF] dark:border-[#343E38]'
                            }`}
                          >
                            <span>Claim {claimIdx + 1}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-80" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

