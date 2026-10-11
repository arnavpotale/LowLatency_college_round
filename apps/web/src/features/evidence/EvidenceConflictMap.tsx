import React from 'react';
import { ConflictDetail } from '../../types';
import { GitFork, BookOpen, AlertOctagon, ArrowRightLeft } from 'lucide-react';

interface EvidenceConflictMapProps {
  conflict?: ConflictDetail;
  allConflicts?: ConflictDetail[];
}

export const EvidenceConflictMap: React.FC<EvidenceConflictMapProps> = ({
  conflict,
  allConflicts = []
}) => {
  const activeConflict = conflict || (allConflicts.length > 0 ? allConflicts[0] : null);

  if (!activeConflict) {
    return (
      <div className="p-8 rounded-lg bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#58645F] dark:text-[#A7B2AB] text-center space-y-1.5 shadow-xs">
        <GitFork className="w-5 h-5 text-[#7E8C86] dark:text-[#738078] mx-auto mb-1" />
        <p className="font-semibold text-[#17211D] dark:text-[#EDF2EE]">No Inter-Source Conflicts Detected</p>
        <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] max-w-sm mx-auto">
          Authoritative source documents agree or candidate evidence does not assert incompatible claims.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#D5C6F5] dark:border-[#4E2582] bg-[#F4F0FC] dark:bg-[#6D28D9]/15 p-4 space-y-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D5C6F5] dark:border-[#4E2582]/60 pb-2.5">
        <div className="flex items-center gap-2 text-[#5B32A8] dark:text-[#B48DEF]">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Evidence Conflict Map
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-white dark:bg-[#202824] text-[#5B32A8] dark:text-[#B48DEF] border border-[#D5C6F5] dark:border-[#4E2582] px-2 py-0.5 rounded font-semibold">
          {activeConflict.conflict_type.replace('_', ' ')}
        </span>
      </div>

      {/* Narrative Summary of the Disagreement */}
      <p className="text-xs text-[#17211D] dark:text-[#EDF2EE] leading-relaxed font-sans">
        {activeConflict.description}
      </p>

      {/* Side-by-Side Opposing Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Supporting Source */}
        <div className="rounded-lg border border-[#B7E1CA] dark:border-[#2C5E4E] bg-white dark:bg-[#191F1C] p-3 flex flex-col justify-between space-y-2 shadow-xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-[#0E6245] dark:text-[#65B89D] mb-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-3 h-3 shrink-0" />
                {activeConflict.supporting_source_name || 'Corroborating Source'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E8F5EE] dark:bg-[#176B58]/25 border border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D] shrink-0 font-semibold">
                {activeConflict.supporting_location || 'Citation A'}
              </span>
            </div>
            <p className="font-sans text-xs text-[#17211D] dark:text-[#EDF2EE] leading-relaxed bg-[#E8F5EE] dark:bg-[#202824] p-2.5 rounded border border-[#B7E1CA] dark:border-[#2C5E4E]">
              &ldquo;{activeConflict.supporting_text || 'Text affirms the assertion.'}&rdquo;
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#0E6245] dark:text-[#65B89D] uppercase font-semibold">
            &bull; Affirms Assertion
          </span>
        </div>

        {/* Contradicting Source */}
        <div className="rounded-lg border border-[#F7C5C5] dark:border-[#6B2323] bg-white dark:bg-[#191F1C] p-3 flex flex-col justify-between space-y-2 shadow-xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-[#9E2222] dark:text-[#F17575] mb-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-3 h-3 shrink-0" />
                {activeConflict.contradicting_source_name || 'Opposing Source'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575] shrink-0 font-semibold">
                {activeConflict.contradicting_location || 'Citation B'}
              </span>
            </div>
            <p className="font-sans text-xs text-[#17211D] dark:text-[#EDF2EE] leading-relaxed bg-[#FDF0F0] dark:bg-[#202824] p-2.5 rounded border border-[#F7C5C5] dark:border-[#6B2323]">
              &ldquo;{activeConflict.contradicting_text || 'Text contradicts the assertion.'}&rdquo;
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#9E2222] dark:text-[#F17575] uppercase font-semibold">
            &bull; Contradicts Assertion
          </span>
        </div>
      </div>

      <div className="pt-1 text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono flex items-center gap-1.5">
        <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
        <span>System policy: Withholds affirmative verdict when authoritative sources disagree.</span>
      </div>
    </div>
  );
};

