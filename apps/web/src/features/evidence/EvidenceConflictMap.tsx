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
      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 text-center space-y-1">
        <GitFork className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
        <p className="font-medium text-zinc-300">No Inter-Source Conflicts Detected</p>
        <p className="text-[11px] text-zinc-500">
          Source documents agree or candidate evidence does not assert incompatible claims.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-800/60 bg-amber-950/20 p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-900/40 pb-2.5">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertOctagon className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Evidence Conflict Map
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded">
          {activeConflict.conflict_type.replace('_', ' ')}
        </span>
      </div>

      {/* Narrative Summary of the Disagreement */}
      <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
        {activeConflict.description}
      </p>

      {/* Side-by-Side Opposing Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Supporting Source */}
        <div className="rounded border border-emerald-900/60 bg-zinc-950/90 p-3 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-emerald-400 mb-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-3 h-3 shrink-0" />
                {activeConflict.supporting_source_name || 'Corroborating Source'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/50 text-emerald-300 shrink-0">
                {activeConflict.supporting_location || 'Citation A'}
              </span>
            </div>
            <p className="font-serif text-xs text-zinc-200 leading-snug italic bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
              "{activeConflict.supporting_text || 'Text affirms the assertion.'}"
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-500 uppercase font-semibold">
            &bull; Affirms Assertion
          </span>
        </div>

        {/* Contradicting Source */}
        <div className="rounded border border-rose-900/60 bg-zinc-950/90 p-3 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-rose-400 mb-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-3 h-3 shrink-0" />
                {activeConflict.contradicting_source_name || 'Opposing Source'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800/50 text-rose-300 shrink-0">
                {activeConflict.contradicting_location || 'Citation B'}
              </span>
            </div>
            <p className="font-serif text-xs text-zinc-200 leading-snug italic bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
              "{activeConflict.contradicting_text || 'Text contradicts the assertion.'}"
            </p>
          </div>
          <span className="text-[10px] font-mono text-rose-500 uppercase font-semibold">
            &bull; Contradicts Assertion
          </span>
        </div>
      </div>

      <div className="pt-1 text-[11px] text-amber-400/80 font-mono flex items-center gap-1.5">
        <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
        <span>System policy: Withholds affirmative verdict when authoritative sources disagree.</span>
      </div>
    </div>
  );
};
