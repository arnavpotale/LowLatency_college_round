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
    <div className="flex flex-col h-full bg-[#12141a] border border-zinc-800/80 rounded-lg overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2.5 bg-[#14161f]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Claim Ledger
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {claims.length} assertions
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Select to inspect</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter claims by keyword..."
            className="w-full pl-8 pr-3 py-1.5 rounded bg-[#0f1117] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
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
                    ? 'bg-zinc-200 text-zinc-900 border-zinc-200 font-semibold shadow-sm'
                    : 'bg-[#0f1117] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{btn.label}</span>
                {btn.count > 0 && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    ({btn.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Claim Ledger List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 bg-[#0f1117]">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim, idx) => {
            const isSelected = selectedClaimId === claim.claim_id;

            return (
              <div
                key={claim.claim_id}
                onClick={() => onSelectClaim(claim.claim_id)}
                className={`p-3.5 cursor-pointer transition flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#171a24] border-l-2 border-l-zinc-300'
                    : 'hover:bg-[#13151d]'
                }`}
              >
                {/* Meta Row: Claim Index, Verdict, Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-zinc-400 font-semibold">
                      [{idx + 1}]
                    </span>
                    <VerdictBadge verdict={claim.verdict} size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Conflict Badge */}
                    {(claim.conflict || claim.verdict === 'ambiguous') && (
                      <span
                        title="Inter-source conflict detected"
                        className="p-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 flex items-center"
                      >
                        <GitFork className="w-3 h-3" />
                      </span>
                    )}

                    {/* Human Review Badge */}
                    {claim.human_review && (
                      <span
                        title={`Audited by ${claim.human_review.reviewer}: ${claim.human_review.action}`}
                        className="p-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center"
                      >
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                      </span>
                    )}

                    <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      {Math.round(claim.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Claim Statement */}
                <p className="font-sans text-xs text-zinc-200 leading-snug line-clamp-2">
                  &ldquo;{claim.claim_text}&rdquo;
                </p>

                {/* Explanation snippet */}
                <p className="text-[11px] text-zinc-400 font-sans truncate">
                  {claim.explanation}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500 italic">
            No claims matching filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
