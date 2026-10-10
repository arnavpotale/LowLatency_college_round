import React from 'react';
import { Claim, VerdictCategory } from '../../types';

interface AnswerHighlighterProps {
  originalAnswer: string;
  claims: Claim[];
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
}

export const AnswerHighlighter: React.FC<AnswerHighlighterProps> = ({
  originalAnswer,
  claims,
  selectedClaimId,
  onSelectClaim,
}) => {
  if (!originalAnswer) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs italic">
        No answer submitted yet. Enter an AI answer above to begin audit.
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-800">
        {originalAnswer}
      </div>
    );
  }

  // Sort claims by start_offset
  const sortedClaims = [...claims].sort((a, b) => a.start_offset - b.start_offset);

  // Segment original_answer into interleaved plain text and highlighted claim spans
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  const verdictStyles: Record<VerdictCategory, { bg: string; hover: string; border: string; activeRing: string }> = {
    supported: {
      bg: 'bg-emerald-500/15 text-emerald-200',
      hover: 'hover:bg-emerald-500/25',
      border: 'border-b-2 border-emerald-500',
      activeRing: 'ring-2 ring-emerald-400 bg-emerald-500/30'
    },
    contradicted: {
      bg: 'bg-rose-500/20 text-rose-200',
      hover: 'hover:bg-rose-500/30',
      border: 'border-b-2 border-rose-500',
      activeRing: 'ring-2 ring-rose-400 bg-rose-500/35'
    },
    unsupported: {
      bg: 'bg-amber-500/15 text-amber-200',
      hover: 'hover:bg-amber-500/25',
      border: 'border-b-2 border-amber-500',
      activeRing: 'ring-2 ring-amber-400 bg-amber-500/30'
    },
    ambiguous: {
      bg: 'bg-purple-500/15 text-purple-200',
      hover: 'hover:bg-purple-500/25',
      border: 'border-b-2 border-purple-500',
      activeRing: 'ring-2 ring-purple-400 bg-purple-500/30'
    },
    inconclusive: {
      bg: 'bg-slate-500/15 text-slate-200',
      hover: 'hover:bg-slate-500/25',
      border: 'border-b-2 border-slate-500',
      activeRing: 'ring-2 ring-slate-400 bg-slate-500/30'
    }
  };

  sortedClaims.forEach((claim, idx) => {
    // Plain text before this claim
    if (claim.start_offset > cursor) {
      const textBefore = originalAnswer.substring(cursor, claim.start_offset);
      segments.push(
        <span key={`plain-${idx}`} className="text-slate-300">
          {textBefore}
        </span>
      );
    }

    // Highlighted claim text span
    const claimSubstring = originalAnswer.substring(claim.start_offset, claim.end_offset);
    const isSelected = selectedClaimId === claim.claim_id;
    const style = verdictStyles[claim.verdict] || verdictStyles.inconclusive;

    segments.push(
      <mark
        key={claim.claim_id}
        onClick={() => onSelectClaim(claim.claim_id)}
        className={`cursor-pointer px-1 py-0.5 rounded transition inline-block font-sans cursor-pointer ${style.bg} ${style.hover} ${style.border} ${
          isSelected ? style.activeRing : ''
        }`}
        title={`Click to view claim audit findings (${claim.verdict})`}
      >
        {claimSubstring}
      </mark>
    );

    cursor = Math.max(cursor, claim.end_offset);
  });

  // Any remaining plain text after the last claim
  if (cursor < originalAnswer.length) {
    segments.push(
      <span key="plain-tail" className="text-slate-300">
        {originalAnswer.substring(cursor)}
      </span>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm leading-relaxed whitespace-pre-wrap selection:bg-indigo-500">
      {segments}
    </div>
  );
};
