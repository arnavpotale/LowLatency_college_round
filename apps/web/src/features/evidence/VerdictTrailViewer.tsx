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
      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 text-center space-y-1">
        <Compass className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
        <p className="font-medium text-zinc-300">No Evidence Passages Cited</p>
        <p className="text-[11px] text-zinc-500">
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
          style: 'bg-emerald-950/60 border-emerald-800 text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        };
      case 'contradicts':
        return {
          label: 'Contradicts',
          style: 'bg-rose-950/60 border-rose-800 text-rose-300',
          icon: <XCircle className="w-3.5 h-3.5" />
        };
      case 'insufficient':
        return {
          label: 'Insufficient Context',
          style: 'bg-stone-900 border-stone-700 text-stone-300',
          icon: <AlertTriangle className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: 'Neutral',
          style: 'bg-zinc-900 border-zinc-800 text-zinc-400',
          icon: <MinusCircle className="w-3.5 h-3.5" />
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-zinc-400" />
          Proof-of-Verdict Trail ({hasTrail ? evaluationTrail.length : claimEvidenceIds.length})
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
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
                className={`p-3 rounded-lg border transition text-xs space-y-2 cursor-pointer ${
                  isActive
                    ? 'border-zinc-500 bg-zinc-900 ring-1 ring-zinc-500'
                    : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                }`}
              >
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-200 truncate">
                      {item.source_name || 'Source Document'}
                    </span>
                    {item.page_or_section && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                        {item.page_or_section}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-zinc-400">
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
                  <p className="font-serif text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80 italic leading-snug">
                    &ldquo;{item.excerpt}&rdquo;
                  </p>
                )}

                {/* Verification Rationale */}
                <p className="text-[11px] text-zinc-400 font-sans leading-normal">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 font-semibold mr-1">
                    Rule Evaluation:
                  </span>
                  {item.rationale}
                </p>

                {/* Bidirectional Linking: Cited Claims */}
                {allClaims.length > 0 && item.evidence_id && (() => {
                  const citingClaims = allClaims.filter((c) => c.evidence_ids.includes(item.evidence_id));
                  if (citingClaims.length === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 font-mono">Cited in:</span>
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
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                              isCurrent
                                ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                            }`}
                          >
                            <span>Claim {claimIdx + 1}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
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
                  className={`p-3 rounded-lg border transition text-xs space-y-2 cursor-pointer ${
                    isActive
                      ? 'border-zinc-500 bg-zinc-900 ring-1 ring-zinc-500'
                      : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{ev.source_name}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{ev.page_or_section}</span>
                  </div>
                  <p className="font-serif text-xs text-zinc-300 italic bg-zinc-900/60 p-2 rounded">
                    &ldquo;{ev.text}&rdquo;
                  </p>
                  {citingClaims.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 font-mono">Cited in:</span>
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
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                              isCurrent
                                ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                            }`}
                          >
                            <span>Claim {claimIdx + 1}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
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
