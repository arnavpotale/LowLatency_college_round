import React, { useState } from 'react';
import { Claim } from '../../types';
import { VerdictBadge } from '../../components/VerdictBadge';
import { Search, GitFork, UserCheck } from 'lucide-react';

interface ClaimLedgerProps {
  claims: Claim[];
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
}

export const ClaimLedger: React.FC<ClaimLedgerProps> = ({
  claims,
  selectedClaimId,
  onSelectClaim
}) => {
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredClaims = claims.filter((c) => {
    if (filterVerdict !== 'all' && c.verdict !== filterVerdict) {
      if (filterVerdict === 'reviewed' && !c.human_review) return false;
      if (filterVerdict === 'conflict' && !c.conflict && c.verdict !== 'ambiguous') return false;
      if (filterVerdict !== 'reviewed' && filterVerdict !== 'conflict') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.claim_text.toLowerCase().includes(q) ||
        c.explanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filterButtons = [
    { id: 'all', label: 'All', count: claims.length },
    { id: 'contradicted', label: 'Contradicted', count: claims.filter((c) => c.verdict === 'contradicted').length },
    { id: 'ambiguous', label: 'Conflicts', count: claims.filter((c) => c.verdict === 'ambiguous' || c.conflict).length },
    { id: 'supported', label: 'Supported', count: claims.filter((c) => c.verdict === 'supported').length },
    { id: 'unsupported', label: 'Unsupported', count: claims.filter((c) => c.verdict === 'unsupported').length },
    { id: 'reviewed', label: 'Audited', count: claims.filter((c) => !!c.human_review).length }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] rounded-lg overflow-hidden shadow-xs">
      {/* Header & Filter Controls */}
      <div className="p-3 border-b border-[#DCE3DF] dark:border-[#343E38] space-y-2.5 bg-[#EDF1EF] dark:bg-[#202824]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE]">
              Claim Ledger
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border border-[#DCE3DF] dark:border-[#343E38]">
              {claims.length} assertions
            </span>
          </div>
          <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono">Select to inspect</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#7E8C86] dark:text-[#738078] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter claims by keyword..."
            className="w-full pl-8 pr-3 py-1.5 rounded bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D] font-sans"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {filterButtons.map((btn) => {
            const isSelected = filterVerdict === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setFilterVerdict(btn.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] font-semibold shadow-xs'
                    : 'bg-white dark:bg-[#191F1C] text-[#58645F] dark:text-[#A7B2AB] border-[#DCE3DF] dark:border-[#343E38] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
                }`}
              >
                <span>{btn.label}</span>
                {btn.count > 0 && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'opacity-80' : 'text-[#7E8C86] dark:text-[#738078]'}`}>
                    ({btn.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Claim Ledger List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#DCE3DF] dark:divide-[#343E38] bg-white dark:bg-[#191F1C]">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim, idx) => {
            const isSelected = selectedClaimId === claim.claim_id;

            return (
              <div
                key={claim.claim_id}
                onClick={() => onSelectClaim(claim.claim_id)}
                className={`p-3.5 cursor-pointer transition flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#EDF1EF] dark:bg-[#202824] border-l-2 border-l-[#176B58] dark:border-l-[#65B89D]'
                    : 'hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
                }`}
              >
                {/* Meta Row: Claim Index, Verdict, Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-semibold">
                      [{idx + 1}]
                    </span>
                    <VerdictBadge verdict={claim.verdict} size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Conflict Badge */}
                    {(claim.conflict || claim.verdict === 'ambiguous') && (
                      <span
                        title="Inter-source conflict detected"
                        className="p-1 rounded bg-[#F4F0FC] dark:bg-[#6D28D9]/25 text-[#5B32A8] dark:text-[#B48DEF] border border-[#D5C6F5] dark:border-[#4E2582] flex items-center"
                      >
                        <GitFork className="w-3 h-3" />
                      </span>
                    )}

                    {/* Human Review Badge */}
                    {claim.human_review && (
                      <span
                        title={`Audited by ${claim.human_review.reviewer}: ${claim.human_review.action}`}
                        className="p-1 rounded bg-[#E8F5EE] dark:bg-[#176B58]/25 text-[#0E6245] dark:text-[#65B89D] border border-[#B7E1CA] dark:border-[#2C5E4E] flex items-center"
                      >
                        <UserCheck className="w-3 h-3" />
                      </span>
                    )}

                    <span className="font-mono text-[10px] text-[#58645F] dark:text-[#A7B2AB] bg-white dark:bg-[#191F1C] px-1.5 py-0.5 rounded border border-[#DCE3DF] dark:border-[#343E38]">
                      {Math.round(claim.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Claim Statement */}
                <p className="font-sans text-xs text-[#17211D] dark:text-[#EDF2EE] leading-snug line-clamp-2">
                  &ldquo;{claim.claim_text}&rdquo;
                </p>

                {/* Explanation snippet */}
                <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-sans truncate">
                  {claim.explanation}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-[#58645F] dark:text-[#A7B2AB] italic">
            No claims matching filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

