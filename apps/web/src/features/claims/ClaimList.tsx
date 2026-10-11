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
      activeClass: 'bg-[#176B58] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#176B58] dark:border-[#65B89D] shadow-xs font-semibold',
      badgeActiveClass: 'bg-[#125546] dark:bg-[#7AC5AC] text-white dark:text-[#0E1A15]',
      hoverClass: 'hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#202824]'
    },
    {
      id: 'supported',
      label: 'Supported',
      count: claims.filter((c) => c.verdict === 'supported').length,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      activeClass: 'bg-[#0E6245] text-white dark:bg-[#65B89D] dark:text-[#0E1A15] border-[#0E6245] dark:border-[#65B89D] shadow-xs font-semibold',
      badgeActiveClass: 'bg-[#084530] text-white dark:bg-[#7AC5AC] dark:text-[#0E1A15]',
      hoverClass: 'hover:text-[#0E6245] dark:hover:text-[#65B89D] hover:bg-[#E8F5EE] dark:hover:bg-[#176B58]/20'
    },
    {
      id: 'contradicted',
      label: 'Contradicted',
      count: claims.filter((c) => c.verdict === 'contradicted').length,
      icon: <XCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-[#9E2222] text-white dark:bg-[#F17575] dark:text-[#191F1C] border-[#9E2222] dark:border-[#F17575] shadow-xs font-semibold',
      badgeActiveClass: 'bg-[#7A1818] text-white dark:bg-[#FCD8D8] dark:text-[#191F1C]',
      hoverClass: 'hover:text-[#9E2222] dark:hover:text-[#F17575] hover:bg-[#FDF0F0] dark:hover:bg-[#B91C1C]/20'
    },
    {
      id: 'unsupported',
      label: 'Unsupported',
      count: claims.filter((c) => c.verdict === 'unsupported').length,
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      activeClass: 'bg-[#965B0A] text-white dark:bg-[#E5AC48] dark:text-[#191F1C] border-[#965B0A] dark:border-[#E5AC48] shadow-xs font-semibold',
      badgeActiveClass: 'bg-[#704205] text-white dark:bg-[#FDE9C8] dark:text-[#191F1C]',
      hoverClass: 'hover:text-[#965B0A] dark:hover:text-[#E5AC48] hover:bg-[#FEF6E9] dark:hover:bg-[#B45309]/20'
    },
    {
      id: 'ambiguous',
      label: 'Ambiguous',
      count: claims.filter((c) => c.verdict === 'ambiguous').length,
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-[#5B32A8] text-white dark:bg-[#B48DEF] dark:text-[#191F1C] border-[#5B32A8] dark:border-[#B48DEF] shadow-xs font-semibold',
      badgeActiveClass: 'bg-[#432380] text-white dark:bg-[#E9DDFB] dark:text-[#191F1C]',
      hoverClass: 'hover:text-[#5B32A8] dark:hover:text-[#B48DEF] hover:bg-[#F4F0FC] dark:hover:bg-[#6D28D9]/20'
    },
    {
      id: 'inconclusive',
      label: 'Inconclusive',
      count: claims.filter((c) => c.verdict === 'inconclusive').length,
      icon: <MinusCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-[#58645F] text-white dark:bg-[#A7B2AB] dark:text-[#191F1C] border-[#58645F] dark:border-[#A7B2AB] shadow-xs font-semibold',
      badgeActiveClass: 'bg-[#3E4743] text-white dark:bg-[#DCE3DF] dark:text-[#191F1C]',
      hoverClass: 'hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EFF3F1] dark:hover:bg-[#202824]'
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB] shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border flex items-center gap-1.5 ${
              filter === cat.id
                ? cat.activeClass
                : `bg-white dark:bg-[#191F1C] border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB] ${cat.hoverClass}`
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 font-mono rounded-full ${
                filter === cat.id ? cat.badgeActiveClass : 'bg-[#EDF1EF] dark:bg-[#202824] text-[#58645F] dark:text-[#A7B2AB]'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="ml-auto text-xs text-[#176B58] dark:text-[#65B89D] hover:underline flex items-center gap-1 shrink-0 px-2 py-1 font-medium"
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
          <div className="p-8 text-center text-[#58645F] dark:text-[#A7B2AB] text-xs rounded-xl border border-dashed border-[#DCE3DF] dark:border-[#343E38] flex flex-col items-center gap-3 bg-white dark:bg-[#191F1C]">
            <p>
              No claims match the selected filter <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE]">({filter})</span>.
            </p>
            <button
              onClick={() => setFilter('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] transition flex items-center gap-1.5 shadow-xs"
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
