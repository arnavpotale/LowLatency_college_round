import React from 'react';
import { Claim, Evidence } from '../../types';
import { VerdictBadge } from '../../components/VerdictBadge';
import { Link2, HelpCircle, Layers, FileQuestion, BookOpen } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
  evidenceList: Evidence[];
  isSelected: boolean;
  onSelect: () => void;
  onEvidenceClick?: (evidenceId: string) => void;
  claimIndex?: number;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  evidenceList,
  isSelected,
  onSelect,
  onEvidenceClick,
  claimIndex
}) => {
  const linkedEvidence = evidenceList.filter((e) => claim.evidence_ids.includes(e.evidence_id));

  const confPercent = Math.round(claim.confidence * 100);
  const confColor =
    confPercent >= 80
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : confPercent >= 50
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-slate-400 bg-slate-800 border-slate-700';

  return (
    <div
      id={`claim-card-${claim.claim_id}`}
      onClick={onSelect}
      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-3 ${
        isSelected
          ? 'bg-slate-800/95 border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Row: Claim Index, Verdict & Confidence */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {claimIndex !== undefined && (
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              #{claimIndex + 1}
            </span>
          )}
          <VerdictBadge verdict={claim.verdict} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
            title="0-indexed Unicode character offsets [start:end]"
          >
            [{claim.start_offset}:{claim.end_offset}]
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${confColor}`}>
            {confPercent}% conf
          </span>
        </div>
      </div>

      {/* Claim Statement */}
      <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug">
        "{claim.claim_text}"
      </p>

      {/* Grounded Explanation */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-400" />
          Audit Explanation
        </p>
        <p>{claim.explanation}</p>
      </div>

      {/* Citations or Missing Evidence Callout */}
      {linkedEvidence.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Link2 className="w-3 h-3 text-indigo-400" />
            Citations ({linkedEvidence.length}):
          </span>
          {linkedEvidence.map((ev) => (
            <button
              key={ev.evidence_id}
              onClick={(e) => {
                e.stopPropagation();
                if (onEvidenceClick) onEvidenceClick(ev.evidence_id);
              }}
              title={`Inspect excerpt from ${ev.source_name} (${Math.round(ev.relevance_score * 100)}% match)`}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/20 flex items-center gap-1 transition"
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>{ev.page_or_section}</span>
              <span className="text-[10px] text-indigo-400/80 font-mono">
                {Math.round(ev.relevance_score * 100)}%
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90">
          <FileQuestion className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-amber-200">
              <span>No direct citations found</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                Ungrounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No retrieved passages in uploaded sources met relevance thresholds to verify this assertion.
            </p>
          </div>
        </div>
      )}

      {/* Linked Evidence Excerpts (Expanded when claim is selected) */}
      {isSelected && linkedEvidence.length > 0 && (
        <div className="mt-1 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Linked Evidence Excerpts ({linkedEvidence.length})
            </p>
            <span className="text-[10px] text-slate-500 font-mono">
              Click excerpt to jump to evidence base
            </span>
          </div>
          <div className="space-y-2">
            {linkedEvidence.map((ev) => (
              <div
                key={ev.evidence_id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEvidenceClick) onEvidenceClick(ev.evidence_id);
                }}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col gap-1.5 cursor-pointer group"
                title="Click to view excerpt in Evidence Base"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-200 truncate">
                      {ev.source_name}
                    </span>
                    <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
                      {ev.page_or_section}
                    </span>
                  </div>
                  {ev.relevance_score !== undefined && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      {Math.round(ev.relevance_score * 100)}% match
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-300 leading-relaxed pl-2 border-l-2 border-indigo-500/60 italic">
                  "{ev.text}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
