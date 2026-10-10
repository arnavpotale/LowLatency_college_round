import React from 'react';
import { Claim, Evidence } from '../../types';
import { VerdictBadge } from '../../components/VerdictBadge';
import { Link2, HelpCircle, Layers } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
  evidenceList: Evidence[];
  isSelected: boolean;
  onSelect: () => void;
  onEvidenceClick?: (evidenceId: string) => void;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  evidenceList,
  isSelected,
  onSelect,
  onEvidenceClick
}) => {
  const linkedEvidence = evidenceList.filter((e) => claim.evidence_ids.includes(e.evidence_id));

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-3 ${
        isSelected
          ? 'bg-slate-800/90 border-indigo-500 shadow-md shadow-indigo-500/10'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Row: Verdict & Confidence */}
      <div className="flex items-center justify-between gap-2">
        <VerdictBadge verdict={claim.verdict} />
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">
            [{claim.start_offset}:{claim.end_offset}]
          </span>
          <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {Math.round(claim.confidence * 100)}% conf
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

      {/* Associated Evidence Pills */}
      {linkedEvidence.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Link2 className="w-3 h-3 text-indigo-400" />
            Citations:
          </span>
          {linkedEvidence.map((ev) => (
            <button
              key={ev.evidence_id}
              onClick={(e) => {
                e.stopPropagation();
                if (onEvidenceClick) onEvidenceClick(ev.evidence_id);
              }}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/20 flex items-center gap-1 transition"
            >
              <Layers className="w-3 h-3" />
              <span>{ev.page_or_section}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
