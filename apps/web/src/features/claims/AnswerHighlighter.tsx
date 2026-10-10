import React, { useEffect } from 'react';
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
  // Smoothly scroll the highlighted span into view when selected
  useEffect(() => {
    if (selectedClaimId) {
      const el = document.getElementById(`highlight-claim-${selectedClaimId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedClaimId]);

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

  // Convert to Unicode code-point array for exact character-offset slicing (protects emojis & surrogate pairs)
  const chars = Array.from(originalAnswer);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  const verdictStyles: Record<VerdictCategory, { bg: string; hover: string; border: string; activeRing: string }> = {
    supported: {
      bg: 'bg-emerald-500/15 text-emerald-200',
      hover: 'hover:bg-emerald-500/25',
      border: 'border-b-2 border-emerald-500',
      activeRing: 'ring-2 ring-emerald-400 bg-emerald-500/30 font-medium'
    },
    contradicted: {
      bg: 'bg-rose-500/20 text-rose-200',
      hover: 'hover:bg-rose-500/30',
      border: 'border-b-2 border-rose-500',
      activeRing: 'ring-2 ring-rose-400 bg-rose-500/35 font-medium'
    },
    unsupported: {
      bg: 'bg-amber-500/15 text-amber-200',
      hover: 'hover:bg-amber-500/25',
      border: 'border-b-2 border-amber-500',
      activeRing: 'ring-2 ring-amber-400 bg-amber-500/30 font-medium'
    },
    ambiguous: {
      bg: 'bg-purple-500/15 text-purple-200',
      hover: 'hover:bg-purple-500/25',
      border: 'border-b-2 border-purple-500',
      activeRing: 'ring-2 ring-purple-400 bg-purple-500/30 font-medium'
    },
    inconclusive: {
      bg: 'bg-slate-500/15 text-slate-200',
      hover: 'hover:bg-slate-500/25',
      border: 'border-b-2 border-slate-500',
      activeRing: 'ring-2 ring-slate-400 bg-slate-500/30 font-medium'
    }
  };

  sortedClaims.forEach((claim, idx) => {
    let rawStart = Math.max(0, Math.min(chars.length, claim.start_offset));
    let rawEnd = Math.max(rawStart, Math.min(chars.length, claim.end_offset));

    // If claim_text is provided and direct slice diverges due to CRLF line-ending drift on Windows,
    // verify if adjusting for preceding '\r' characters aligns it exactly with the claim text
    if (claim.claim_text && chars.slice(rawStart, rawEnd).join('') !== claim.claim_text) {
      let crCount = 0;
      for (let i = 0; i < rawStart && i < chars.length; i++) {
        if (chars[i] === '\r') crCount++;
      }
      if (crCount > 0 && chars.slice(rawStart + crCount, rawEnd + crCount).join('') === claim.claim_text) {
        rawStart += crCount;
        rawEnd += crCount;
      }
    }

    // Plain text before this claim
    if (rawStart > cursor) {
      const textBefore = chars.slice(cursor, rawStart).join('');
      segments.push(
        <span key={`plain-${idx}-${cursor}`} className="text-slate-300">
          {textBefore}
        </span>
      );
    }

    // Guard against backwards or overlapping cursors
    const safeStart = Math.max(cursor, rawStart);
    if (rawEnd > safeStart) {
      const claimSubstring = chars.slice(safeStart, rawEnd).join('');
      const isSelected = selectedClaimId === claim.claim_id;
      const style = verdictStyles[claim.verdict] || verdictStyles.inconclusive;

      segments.push(
        <mark
          key={claim.claim_id}
          id={`highlight-claim-${claim.claim_id}`}
          onClick={() => onSelectClaim(claim.claim_id)}
          className={`cursor-pointer px-1 py-0.5 rounded transition inline font-sans box-decoration-clone ${style.bg} ${style.hover} ${style.border} ${
            isSelected ? style.activeRing : ''
          }`}
          title={`[${claim.start_offset}:${claim.end_offset}] • ${claim.verdict.toUpperCase()} (${Math.round(claim.confidence * 100)}% conf)\nClick to inspect claim findings & citations`}
        >
          {claimSubstring}
        </mark>
      );

      cursor = Math.max(cursor, rawEnd);
    }
  });

  // Any remaining plain text after the last claim
  if (cursor < chars.length) {
    segments.push(
      <span key="plain-tail" className="text-slate-300">
        {chars.slice(cursor).join('')}
      </span>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm leading-relaxed whitespace-pre-wrap selection:bg-indigo-500">
      {segments}
    </div>
  );
};
