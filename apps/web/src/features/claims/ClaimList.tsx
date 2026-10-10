import React, { useState, useEffect } from 'react';
import { Claim, Evidence } from '../../types';
import { ClaimCard } from './ClaimCard';
import { Filter, CheckCircle2, XCircle, AlertTriangle, HelpCircle, MinusCircle, RotateCcw } from 'lucide-react';

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

  // Auto-scroll to selected claim card when selection changes
  useEffect(() => {
    if (selectedClaimId) {
      const cardEl = document.getElementById(`claim-card-${selectedClaimId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedClaimId]);

  const filteredClaims = claims.filter((c) => {
    if (filter === 'all') return true;
    return c.verdict === filter;
  });

  const categories: Array<{
    id: string;
    label: string;
    count: number;
    icon?: React.ReactNode;
    activeClass: string;
    badgeActiveClass: string;
    hoverClass: string;
  }> = [
    {
      id: 'all',
      label: 'All Claims',
      count: claims.length,
      activeClass: 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30',
      badgeActiveClass: 'bg-indigo-700 text-white',
      hoverClass: 'hover:border-indigo-500/50 hover:text-slate-100'
    },
    {
      id: 'supported',
      label: 'Supported',
      count: claims.filter((c) => c.verdict === 'supported').length,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/30',
      badgeActiveClass: 'bg-emerald-700 text-white',
      hoverClass: 'hover:border-emerald-500/50 hover:text-emerald-300'
    },
    {
      id: 'contradicted',
      label: 'Contradicted',
      count: claims.filter((c) => c.verdict === 'contradicted').length,
      icon: <XCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-600/30',
      badgeActiveClass: 'bg-rose-700 text-white',
      hoverClass: 'hover:border-rose-500/50 hover:text-rose-300'
    },
    {
      id: 'unsupported',
      label: 'Unsupported',
      count: claims.filter((c) => c.verdict === 'unsupported').length,
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      activeClass: 'bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-600/30',
      badgeActiveClass: 'bg-amber-700 text-white',
      hoverClass: 'hover:border-amber-500/50 hover:text-amber-300'
    },
    {
      id: 'ambiguous',
      label: 'Ambiguous',
      count: claims.filter((c) => c.verdict === 'ambiguous').length,
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30',
      badgeActiveClass: 'bg-purple-700 text-white',
      hoverClass: 'hover:border-purple-500/50 hover:text-purple-300'
    },
    {
      id: 'inconclusive',
      label: 'Inconclusive',
      count: claims.filter((c) => c.verdict === 'inconclusive').length,
      icon: <MinusCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-slate-600 text-white border-slate-500 shadow-sm shadow-slate-600/30',
      badgeActiveClass: 'bg-slate-700 text-white',
      hoverClass: 'hover:border-slate-500/50 hover:text-slate-300'
    }
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
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border flex items-center gap-1.5 ${
              filter === cat.id
                ? cat.activeClass
                : `bg-slate-800/80 border-slate-800 text-slate-300 ${cat.hoverClass}`
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 font-mono rounded-full ${
                filter === cat.id ? cat.badgeActiveClass : 'bg-slate-700 text-slate-300'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 px-2 py-1"
            title="Reset filter to show all claims"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Claim Cards List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-800 flex flex-col items-center gap-3">
            <p>
              No claims match the selected filter <span className="font-semibold text-slate-200">({filter})</span>.
            </p>
            <button
              onClick={() => setFilter('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All Claims ({claims.length})</span>
            </button>
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const originalIndex = claims.findIndex((c) => c.claim_id === claim.claim_id);
            return (
              <ClaimCard
                key={claim.claim_id}
                claim={claim}
                claimIndex={originalIndex >= 0 ? originalIndex : undefined}
                evidenceList={evidenceList}
                isSelected={selectedClaimId === claim.claim_id}
                onSelect={() => onSelectClaim(claim.claim_id)}
                onEvidenceClick={onEvidenceClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
