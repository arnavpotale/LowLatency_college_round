import React, { useEffect } from 'react';
import { Claim, VerdictCategory } from '../../types';
import { FileText, MousePointerClick } from 'lucide-react';

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
      <div className="p-8 text-center text-zinc-500 text-xs italic bg-[#15181e] border border-zinc-800 rounded-lg">
        No answer submitted yet. Enter an AI answer above to begin audit.
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <div className="p-5 rounded-lg bg-[#14161c] font-serif text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap border border-zinc-800">
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

  const verdictStyles: Record<
    VerdictCategory,
    { bg: string; hover: string; border: string; activeRing: string; badge: string }
  > = {
    supported: {
      bg: 'bg-emerald-950/30 text-emerald-200',
      hover: 'hover:bg-emerald-950/50',
      border: 'border-b border-emerald-700/60',
      activeRing: 'ring-1 ring-emerald-400 bg-emerald-950/60 font-medium',
      badge: 'bg-emerald-950 text-emerald-400 border-emerald-800'
    },
    contradicted: {
      bg: 'bg-rose-950/35 text-rose-200',
      hover: 'hover:bg-rose-950/60',
      border: 'border-b border-rose-700/70',
      activeRing: 'ring-1 ring-rose-400 bg-rose-950/60 font-medium',
      badge: 'bg-rose-950 text-rose-400 border-rose-800'
    },
    unsupported: {
      bg: 'bg-amber-950/25 text-amber-200',
      hover: 'hover:bg-amber-950/50',
      border: 'border-b border-dashed border-amber-700/60',
      activeRing: 'ring-1 ring-amber-400 bg-amber-950/50 font-medium',
      badge: 'bg-amber-950 text-amber-400 border-amber-800'
    },
    ambiguous: {
      bg: 'bg-amber-950/35 text-amber-200',
      hover: 'hover:bg-amber-950/60',
      border: 'border-b-2 border-amber-600',
      activeRing: 'ring-1 ring-amber-400 bg-amber-950/60 font-medium',
      badge: 'bg-amber-950 text-amber-300 border-amber-700'
    },
    inconclusive: {
      bg: 'bg-zinc-800/40 text-zinc-300',
      hover: 'hover:bg-zinc-800/60',
      border: 'border-b border-zinc-600',
      activeRing: 'ring-1 ring-zinc-400 bg-zinc-800/70 font-medium',
      badge: 'bg-zinc-800 text-zinc-400 border-zinc-700'
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
        <span key={`plain-${idx}-${cursor}`} className="text-zinc-400">
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
          title={`Assertion [${idx + 1}]: ${claim.verdict.toUpperCase()} (${Math.round(claim.confidence * 100)}% conf)\n[${claim.start_offset}:${claim.end_offset}] • Click to inspect claim findings & citations`}
        >
          <span
            className={`inline-block mr-1 font-mono text-[10px] px-1 py-0.2 rounded border select-none ${style.badge}`}
          >
            {idx + 1}
          </span>
          <span>{claimSubstring}</span>
        </mark>
      );

      cursor = Math.max(cursor, rawEnd);
    }
  });

  // Any remaining plain text after the last claim
  if (cursor < chars.length) {
    segments.push(
      <span key="plain-tail" className="text-zinc-400">
        {chars.slice(cursor).join('')}
      </span>
    );
  }

  const wordCount = originalAnswer.trim().split(/\s+/).length;

  return (
    <div className="flex flex-col h-full bg-[#15181e] border border-zinc-800 rounded-lg overflow-hidden">
      {/* Document Reader Header */}
      <div className="p-3.5 border-b border-zinc-800 bg-[#171a22] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Source Document View
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {claims.length} decomposed spans
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
          <MousePointerClick className="w-3 h-3 text-zinc-500" />
          <span>Click span to inspect</span>
        </div>
      </div>

      {/* Reader Content Body */}
      <div className="flex-1 overflow-y-auto p-5 font-serif text-xs leading-relaxed whitespace-pre-wrap selection:bg-zinc-700 selection:text-white bg-[#13151b]">
        {segments}
      </div>

      {/* Footer stats */}
      <div className="px-3.5 py-2 border-t border-zinc-800/80 bg-[#16181f] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span>{wordCount} words &bull; {originalAnswer.length} chars</span>
        <span>Offsets: [0:{originalAnswer.length}]</span>
      </div>
    </div>
  );
};
