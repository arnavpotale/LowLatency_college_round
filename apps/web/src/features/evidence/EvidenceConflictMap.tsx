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
      <div className="p-8 rounded-lg bg-[#12141a] border border-zinc-800/80 text-xs text-zinc-400 text-center space-y-1.5">
        <GitFork className="w-5 h-5 text-zinc-500 mx-auto mb-1" />
        <p className="font-semibold text-zinc-200">No Inter-Source Conflicts Detected</p>
        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
          Authoritative source documents agree or candidate evidence does not assert incompatible claims.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-purple-800/60 bg-purple-950/15 p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-900/40 pb-2.5">
        <div className="flex items-center gap-2 text-purple-300">
          <AlertOctagon className="w-4 h-4 shrink-0 text-purple-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Evidence Conflict Map
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded">
          {activeConflict.conflict_type.replace('_', ' ')}
        </span>
      </div>

      {/* Narrative Summary of the Disagreement */}
      <p className="text-xs text-purple-200/90 leading-relaxed font-sans">
        {activeConflict.description}
      </p>

      {/* Side-by-Side Opposing Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Supporting Source */}
        <div className="rounded border border-emerald-900/60 bg-[#0f1117] p-3 flex flex-col justify-between space-y-2">
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
            <p className="font-sans text-xs text-zinc-200 leading-relaxed bg-[#0a0c10] p-2.5 rounded border border-zinc-800/80">
              &ldquo;{activeConflict.supporting_text || 'Text affirms the assertion.'}&rdquo;
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
            &bull; Affirms Assertion
          </span>
        </div>

        {/* Contradicting Source */}
        <div className="rounded border border-rose-900/60 bg-[#0f1117] p-3 flex flex-col justify-between space-y-2">
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
            <p className="font-sans text-xs text-zinc-200 leading-relaxed bg-[#0a0c10] p-2.5 rounded border border-zinc-800/80">
              &ldquo;{activeConflict.contradicting_text || 'Text contradicts the assertion.'}&rdquo;
            </p>
          </div>
          <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">
            &bull; Contradicts Assertion
          </span>
        </div>
      </div>

      <div className="pt-1 text-[11px] text-purple-300/80 font-mono flex items-center gap-1.5">
        <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
        <span>System policy: Withholds affirmative verdict when authoritative sources disagree.</span>
      </div>
    </div>
  );
};
