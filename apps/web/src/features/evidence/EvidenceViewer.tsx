import React from 'react';
import { Evidence } from '../../types';
import { BookOpen } from 'lucide-react';

interface EvidenceViewerProps {
  evidenceList: Evidence[];
  activeEvidenceId: string | null;
  onSelectEvidence?: (evidenceId: string) => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  evidenceList,
  activeEvidenceId,
  onSelectEvidence
}) => {
  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-dashed border-slate-800">
        No evidence excerpts retrieved yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {evidenceList.map((ev) => {
        const isActive = activeEvidenceId === ev.evidence_id;

        return (
          <div
            key={ev.evidence_id}
            id={`evidence-${ev.evidence_id}`}
            onClick={() => onSelectEvidence && onSelectEvidence(ev.evidence_id)}
            className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-2.5 ${
              isActive
                ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500'
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
          </div>
        );
      })}
    </div>
  );
};
