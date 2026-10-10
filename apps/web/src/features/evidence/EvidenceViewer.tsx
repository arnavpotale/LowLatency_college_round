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
      <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-dashed border-slate-800">
        No evidence excerpts retrieved yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contextual notice if currently selected claim has NO citations */}
      {activeClaim && activeClaim.evidence_ids.length === 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-200">
              Selected Claim Has No Direct Citations
            </p>
            <p className="text-slate-300 mt-1 italic font-sans">
              "{activeClaim.claim_text}"
            </p>
            <p className="text-slate-400 text-[11px] mt-1 font-sans">
              Audit verdict: <span className="font-semibold text-amber-300 uppercase font-mono">{activeClaim.verdict}</span>. No retrieved passages in source files met relevance thresholds for this statement.
            </p>
          </div>
        </div>
      )}

      {/* Contextual indicator if currently selected claim HAS citations */}
      {activeClaim && activeClaim.evidence_ids.length > 0 && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              Focusing on evidence for: <strong className="text-white font-sans">"{activeClaim.claim_text.slice(0, 48)}..."</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 shrink-0">
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
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-3 ${
                isActive
                  ? 'bg-slate-800/95 border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Source info & relevance */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {ev.source_name}
                  </span>
                  <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
                    {ev.page_or_section}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  {Math.round(ev.relevance_score * 100)}% match
                </span>
              </div>

              {/* Excerpt text */}
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed border border-slate-800/80">
                "{ev.text}"
              </div>

              {/* Bidirectional Linking: Referencing Claims */}
              {referencingClaims.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/70">
                  <span className="text-[11px] text-slate-400 font-medium">Cited by:</span>
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
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 transition ${
                          isCurrentClaim
                            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 ring-1 ring-indigo-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        <span>
                          Claim {claimIdx >= 0 ? `#${claimIdx + 1}` : `[${rc.start_offset}:${rc.end_offset}]`}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">({rc.verdict})</span>
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
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
