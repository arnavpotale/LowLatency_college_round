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
      <div className="p-8 text-center text-zinc-500 text-xs rounded-lg border border-dashed border-zinc-800 bg-[#12141a]">
        No evidence excerpts retrieved yet.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Contextual notice if currently selected claim has NO citations */}
      {activeClaim && activeClaim.evidence_ids.length === 0 && (
        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/50 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-200">
              Selected Claim Has No Direct Citations
            </p>
            <p className="text-zinc-300 mt-1 italic font-sans text-xs">
              &ldquo;{activeClaim.claim_text}&rdquo;
            </p>
            <p className="text-zinc-400 text-[11px] mt-1 font-sans">
              Audit verdict: <span className="font-semibold text-amber-300 uppercase font-mono">{activeClaim.verdict}</span>. No retrieved passages in source files met relevance thresholds for this statement.
            </p>
          </div>
        </div>
      )}

      {/* Contextual indicator if currently selected claim HAS citations */}
      {activeClaim && activeClaim.evidence_ids.length > 0 && (
        <div className="p-2.5 rounded-lg bg-[#14161f] border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              Focusing on evidence for: <strong className="text-zinc-100 font-sans">&ldquo;{activeClaim.claim_text.slice(0, 48)}...&rdquo;</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 shrink-0">
            {activeClaim.evidence_ids.length} Citation{activeClaim.evidence_ids.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Evidence Excerpts List */}
      <div className="space-y-3">
        {evidenceList.map((ev) => {
          const isActive = activeEvidenceId === ev.evidence_id;
          const referencingClaims = claims.filter((c) => c.evidence_ids.includes(ev.evidence_id));

          return (
            <div
              key={ev.evidence_id}
              id={`evidence-${ev.evidence_id}`}
              onClick={() => onSelectEvidence && onSelectEvidence(ev.evidence_id)}
              className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col gap-2.5 ${
                isActive
                  ? 'bg-[#171a24] border-zinc-400 ring-1 ring-zinc-400 shadow-sm'
                  : 'bg-[#12141a] border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Source info & relevance */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-200 truncate">
                    {ev.source_name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
                    {ev.page_or_section}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50 shrink-0">
                  {Math.round(ev.relevance_score * 100)}% match
                </span>
              </div>

              {/* Excerpt text */}
              <div className="p-3 rounded bg-[#0a0c10] font-sans text-xs text-zinc-200 leading-relaxed border border-zinc-800/80">
                &ldquo;{ev.text}&rdquo;
              </div>

              {/* Bidirectional Linking: Referencing Claims */}
              {referencingClaims.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 font-mono">Cited in:</span>
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
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 transition ${
                          isCurrentClaim
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-500 font-semibold shadow-sm'
                            : 'bg-[#0f1117] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                        }`}
                      >
                        <span>
                          Claim {claimIdx >= 0 ? `#${claimIdx + 1}` : `[${rc.start_offset}:${rc.end_offset}]`}
                        </span>
                        <span className="text-zinc-500">({rc.verdict})</span>
                        <ArrowRight className="w-2.5 h-2.5 text-zinc-400" />
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
