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
      <div className="p-8 text-center text-[#58645F] dark:text-[#A7B2AB] text-xs italic bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-lg">
        No answer submitted yet. Enter an AI answer above to begin audit.
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <div className="p-5 rounded-lg bg-white dark:bg-[#191F1C] font-serif text-xs text-[#17211D] dark:text-[#EDF2EE] leading-relaxed whitespace-pre-wrap border border-[#DCE3DF] dark:border-[#343E38]">
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
      bg: 'bg-[#E8F5EE] text-[#0E6245] dark:bg-[#176B58]/30 dark:text-[#65B89D]',
      hover: 'hover:bg-[#D6EFE3] dark:hover:bg-[#176B58]/45',
      border: 'border-b-2 border-[#0E6245] dark:border-[#65B89D]',
      activeRing: 'ring-2 ring-[#176B58] dark:ring-[#65B89D] bg-[#D6EFE3] dark:bg-[#176B58]/50 font-medium',
      badge: 'bg-[#E8F5EE] dark:bg-[#176B58]/40 text-[#0E6245] dark:text-[#65B89D] border-[#B7E1CA] dark:border-[#2C5E4E]'
    },
    contradicted: {
      bg: 'bg-[#FDF0F0] text-[#9E2222] dark:bg-[#B91C1C]/30 dark:text-[#F17575]',
      hover: 'hover:bg-[#FCD8D8] dark:hover:bg-[#B91C1C]/45',
      border: 'border-b-2 border-[#9E2222] dark:border-[#F17575]',
      activeRing: 'ring-2 ring-[#9E2222] dark:ring-[#F17575] bg-[#FCD8D8] dark:bg-[#B91C1C]/50 font-medium',
      badge: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/40 text-[#9E2222] dark:text-[#F17575] border-[#F7C5C5] dark:border-[#6B2323]'
    },
    unsupported: {
      bg: 'bg-[#FEF6E9] text-[#965B0A] dark:bg-[#B45309]/30 dark:text-[#E5AC48]',
      hover: 'hover:bg-[#FDE9C8] dark:hover:bg-[#B45309]/45',
      border: 'border-b-2 border-dashed border-[#965B0A] dark:border-[#E5AC48]',
      activeRing: 'ring-2 ring-[#965B0A] dark:ring-[#E5AC48] bg-[#FDE9C8] dark:bg-[#B45309]/50 font-medium',
      badge: 'bg-[#FEF6E9] dark:bg-[#B45309]/40 text-[#965B0A] dark:text-[#E5AC48] border-[#F8DCAB] dark:border-[#633910]'
    },
    ambiguous: {
      bg: 'bg-[#F4F0FC] text-[#5B32A8] dark:bg-[#6D28D9]/30 dark:text-[#B48DEF]',
      hover: 'hover:bg-[#E9DDFB] dark:hover:bg-[#6D28D9]/45',
      border: 'border-b-2 border-[#5B32A8] dark:border-[#B48DEF]',
      activeRing: 'ring-2 ring-[#5B32A8] dark:ring-[#B48DEF] bg-[#E9DDFB] dark:bg-[#6D28D9]/50 font-medium',
      badge: 'bg-[#F4F0FC] dark:bg-[#6D28D9]/40 text-[#5B32A8] dark:text-[#B48DEF] border-[#D5C6F5] dark:border-[#4E2582]'
    },
    inconclusive: {
      bg: 'bg-[#EFF3F1] text-[#58645F] dark:bg-[#343E38]/50 dark:text-[#A7B2AB]',
      hover: 'hover:bg-[#DCE3DF] dark:hover:bg-[#343E38]/70',
      border: 'border-b-2 border-[#58645F] dark:border-[#A7B2AB]',
      activeRing: 'ring-2 ring-[#58645F] dark:ring-[#A7B2AB] bg-[#DCE3DF] dark:bg-[#343E38] font-medium',
      badge: 'bg-[#EFF3F1] dark:bg-[#343E38] text-[#58645F] dark:text-[#A7B2AB] border-[#DCE3DF] dark:border-[#445149]'
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
        <span key={`plain-${idx}-${cursor}`} className="text-[#17211D] dark:text-[#EDF2EE]">
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
      <span key="plain-tail" className="text-[#17211D] dark:text-[#EDF2EE]">
        {chars.slice(cursor).join('')}
      </span>
    );
  }

  const wordCount = originalAnswer.trim().split(/\s+/).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-lg overflow-hidden shadow-xs">
      {/* Document Reader Header */}
      <div className="p-3 border-b border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#202824] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE]">
            Submitted Answer Document
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border border-[#DCE3DF] dark:border-[#343E38]">
            {claims.length} claims
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
          <MousePointerClick className="w-3 h-3 text-[#58645F] dark:text-[#A7B2AB]" />
          <span>Click sentence to investigate</span>
        </div>
      </div>

      {/* Reader Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-sans text-xs leading-relaxed whitespace-pre-wrap selection:bg-[#EAEFEA] dark:selection:bg-[#26302B] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE]">
        {segments}
      </div>

      {/* Footer stats */}
      <div className="px-3.5 py-1.5 border-t border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#202824] flex items-center justify-between text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
        <span>{wordCount} words &bull; {originalAnswer.length} chars</span>
        <span>Offsets: [0:{originalAnswer.length}] Unicode code-points</span>
      </div>
    </div>
  );
};

