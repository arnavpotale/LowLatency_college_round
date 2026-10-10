import React, { useState } from 'react';
import { Claim, Evidence } from '../../types';
import { ClaimCard } from './ClaimCard';
import { Filter } from 'lucide-react';

interface ClaimListProps {
  claims: Claim[];
  evidenceList: Evidence[];
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
  onEvidenceClick?: (evidenceId: string) => void;
}

export const ClaimList: React.FC<ClaimListProps> = ({
  claims,
  evidenceList,
  selectedClaimId,
  onSelectClaim,
  onEvidenceClick
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredClaims = claims.filter((c) => {
    if (filter === 'all') return true;
    return c.verdict === filter;
  });

  const categories: Array<{ id: string; label: string; count: number }> = [
    { id: 'all', label: 'All', count: claims.length },
    { id: 'supported', label: 'Supported', count: claims.filter((c) => c.verdict === 'supported').length },
    { id: 'contradicted', label: 'Contradicted', count: claims.filter((c) => c.verdict === 'contradicted').length },
    { id: 'unsupported', label: 'Unsupported', count: claims.filter((c) => c.verdict === 'unsupported').length },
    { id: 'ambiguous', label: 'Ambiguous', count: claims.filter((c) => c.verdict === 'ambiguous').length },
    { id: 'inconclusive', label: 'Inconclusive', count: claims.filter((c) => c.verdict === 'inconclusive').length }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              filter === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1 rounded-full ${filter === cat.id ? 'bg-indigo-700' : 'bg-slate-700'}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Claim Cards List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-dashed border-slate-800">
            No claims match the selected filter ({filter}).
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <ClaimCard
              key={claim.claim_id}
              claim={claim}
              evidenceList={evidenceList}
              isSelected={selectedClaimId === claim.claim_id}
              onSelect={() => onSelectClaim(claim.claim_id)}
              onEvidenceClick={onEvidenceClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
