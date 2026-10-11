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
      ? 'text-[#0E6245] bg-[#E8F5EE] border-[#B7E1CA] dark:text-[#65B89D] dark:bg-[#176B58]/25 dark:border-[#2C5E4E]'
      : confPercent >= 50
      ? 'text-[#965B0A] bg-[#FEF6E9] border-[#F8DCAB] dark:text-[#E5AC48] dark:bg-[#B45309]/25 dark:border-[#633910]'
      : 'text-[#58645F] bg-[#EDF1EF] border-[#DCE3DF] dark:text-[#A7B2AB] dark:bg-[#202824] dark:border-[#343E38]';

  return (
    <div
      id={`claim-card-${claim.claim_id}`}
      onClick={onSelect}
      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-3 shadow-xs ${
        isSelected
          ? 'bg-[#EDF1EF] dark:bg-[#202824] border-[#176B58] dark:border-[#65B89D] ring-1 ring-[#176B58] dark:ring-[#65B89D]'
          : 'bg-white dark:bg-[#191F1C] border-[#DCE3DF] dark:border-[#343E38] hover:border-[#BCD8CD] dark:hover:border-[#445149]'
      }`}
    >
      {/* Top Row: Claim Index, Verdict & Confidence */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {claimIndex !== undefined && (
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] border border-[#DCE3DF] dark:border-[#343E38]">
              #{claimIndex + 1}
            </span>
          )}
          <VerdictBadge verdict={claim.verdict} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB] bg-white dark:bg-[#191F1C] px-2 py-0.5 rounded border border-[#DCE3DF] dark:border-[#343E38]"
            title="0-indexed Unicode character offsets [start:end]"
          >
            [{claim.start_offset}:{claim.end_offset}]
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded border font-semibold ${confColor}`}>
            {confPercent}% conf
          </span>
        </div>
      </div>

      {/* Claim Statement */}
      <p className="text-xs sm:text-sm font-medium text-[#17211D] dark:text-[#EDF2EE] leading-snug">
        &ldquo;{claim.claim_text}&rdquo;
      </p>

      {/* Grounded Explanation */}
      <div className="p-3 rounded-lg bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#17211D] dark:text-[#EDF2EE]">
        <p className="text-[11px] font-semibold text-[#58645F] dark:text-[#A7B2AB] uppercase tracking-wider mb-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-[#176B58] dark:text-[#65B89D]" />
          Audit Explanation
        </p>
        <p>{claim.explanation}</p>
      </div>

      {/* Citations or Missing Evidence Callout */}
      {linkedEvidence.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] flex items-center gap-1 font-medium">
            <Link2 className="w-3 h-3 text-[#176B58] dark:text-[#65B89D]" />
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
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EBF5F1] dark:bg-[#19332A] text-[#176B58] dark:text-[#65B89D] hover:bg-[#D5ECE3] dark:hover:bg-[#204237] border border-[#BCD8CD] dark:border-[#2C5245] flex items-center gap-1 transition shadow-xs"
            >
              <Layers className="w-3 h-3 text-[#176B58] dark:text-[#65B89D]" />
              <span>{ev.page_or_section}</span>
              <span className="text-[10px] font-mono opacity-80">
                {Math.round(ev.relevance_score * 100)}%
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] text-xs text-[#965B0A] dark:text-[#E5AC48]">
          <FileQuestion className="w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-medium">
              <span>No direct citations found</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-white dark:bg-[#191F1C] border border-[#F8DCAB] dark:border-[#633910] font-semibold">
                Ungrounded
              </span>
            </div>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] mt-0.5">
              No retrieved passages in uploaded sources met relevance thresholds to verify this assertion.
            </p>
          </div>
        </div>
      )}

      {/* Linked Evidence Excerpts (Expanded when claim is selected) */}
      {isSelected && linkedEvidence.length > 0 && (
        <div className="mt-1 pt-3 border-t border-[#DCE3DF] dark:border-[#343E38] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-[#17211D] dark:text-[#EDF2EE] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#176B58] dark:text-[#65B89D]" />
              Linked Evidence Excerpts ({linkedEvidence.length})
            </p>
            <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
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
                className="p-3 rounded-lg bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] transition flex flex-col gap-1.5 cursor-pointer group shadow-xs"
                title="Click to view excerpt in Evidence Base"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE] truncate">
                      {ev.source_name}
                    </span>
                    <span className="text-[10px] font-medium text-[#176B58] dark:text-[#65B89D] bg-[#EBF5F1] dark:bg-[#19332A] px-1.5 py-0.5 rounded border border-[#BCD8CD] dark:border-[#2C5245] shrink-0 font-mono">
                      {ev.page_or_section}
                    </span>
                  </div>
                  {ev.relevance_score !== undefined && (
                    <span className="text-[10px] font-mono text-[#0E6245] dark:text-[#65B89D] bg-[#E8F5EE] dark:bg-[#176B58]/20 px-1.5 py-0.5 rounded border border-[#B7E1CA] dark:border-[#2C5E4E] shrink-0 font-semibold">
                      {Math.round(ev.relevance_score * 100)}% match
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-[#58645F] dark:text-[#A7B2AB] leading-relaxed pl-2 border-l-2 border-[#176B58] dark:border-[#65B89D] italic">
                  &ldquo;{ev.text}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

