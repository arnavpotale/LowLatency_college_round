import React from 'react';
import { ClaimAutopsy } from '../../types';
import { Search, AlertCircle, CheckCircle, ArrowRightLeft, FileWarning, HelpCircle } from 'lucide-react';

interface ClaimAutopsyCardProps {
  autopsy?: ClaimAutopsy;
  claimText?: string;
}

export const ClaimAutopsyCard: React.FC<ClaimAutopsyCardProps> = ({ autopsy, claimText }) => {
  if (!autopsy) {
    return (
      <div className="p-4 rounded-lg bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#58645F] dark:text-[#A7B2AB] flex items-center gap-2 shadow-xs">
        <HelpCircle className="w-4 h-4 text-[#7E8C86] dark:text-[#738078] shrink-0" />
        <span>Autopsy analysis pending or unavailable for this claim.</span>
      </div>
    );
  }

  const categoryLabels: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    quantity_mismatch: {
      label: 'Numerical Discrepancy',
      badge: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]',
      icon: <FileWarning className="w-3.5 h-3.5" />
    },
    rate_frequency: {
      label: 'Rate Interval Dilation',
      badge: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]',
      icon: <ArrowRightLeft className="w-3.5 h-3.5" />
    },
    polarity_negation: {
      label: 'Polarity / Negation Inversion',
      badge: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]',
      icon: <FileWarning className="w-3.5 h-3.5" />
    },
    direct_contradiction: {
      label: 'Factual Contradiction',
      badge: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]',
      icon: <AlertCircle className="w-3.5 h-3.5" />
    },
    conflicting_sources: {
      label: 'Inter-Source Conflict',
      badge: 'bg-[#F4F0FC] dark:bg-[#6D28D9]/25 border-[#D5C6F5] dark:border-[#4E2582] text-[#5B32A8] dark:text-[#B48DEF]',
      icon: <ArrowRightLeft className="w-3.5 h-3.5" />
    },
    missing_evidence: {
      label: 'Ungrounded Assertion',
      badge: 'bg-[#FEF6E9] dark:bg-[#B45309]/25 border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48]',
      icon: <Search className="w-3.5 h-3.5" />
    },
    insufficient_context: {
      label: 'Insufficient Corroboration',
      badge: 'bg-[#EDF1EF] dark:bg-[#202824] border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB]',
      icon: <HelpCircle className="w-3.5 h-3.5" />
    },
    verified_match: {
      label: 'Grounded Alignment',
      badge: 'bg-[#E8F5EE] dark:bg-[#176B58]/25 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]',
      icon: <CheckCircle className="w-3.5 h-3.5" />
    }
  };

  const cat = categoryLabels[autopsy.issue_type] || {
    label: autopsy.issue_type.replace('_', ' ').toUpperCase(),
    badge: 'bg-[#EDF1EF] dark:bg-[#202824] border-[#DCE3DF] dark:border-[#343E38] text-[#17211D] dark:text-[#EDF2EE]',
    icon: <AlertCircle className="w-3.5 h-3.5" />
  };

  return (
    <div className="rounded-lg border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-4 space-y-3.5 shadow-xs">
      {/* Autopsy Header */}
      <div className="flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#17211D] dark:text-[#EDF2EE]">
            Claim Autopsy
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${cat.badge}`}
        >
          {cat.icon}
          <span>{cat.label}</span>
        </span>
      </div>

      {claimText && (
        <div className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-sans italic border-l-2 border-[#176B58] dark:border-[#65B89D] pl-2.5">
          &ldquo;{claimText}&rdquo;
        </div>
      )}

      {/* Problematic Phrase Callout if present */}
      {autopsy.problematic_phrase && (
        <div className="p-3 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border border-[#F7C5C5] dark:border-[#6B2323] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E2222] dark:text-[#F17575] font-semibold block">
            Divergent Phrase in Answer:
          </span>
          <p className="font-mono text-xs text-[#9E2222] dark:text-[#F17575] font-semibold px-2 py-1 rounded bg-white dark:bg-[#191F1C] border border-[#F7C5C5] dark:border-[#6B2323]">
            &ldquo;{autopsy.problematic_phrase}&rdquo;
          </p>
        </div>
      )}

      {/* Forensic Element Comparison */}
      {(autopsy.claim_elements.length > 0 || autopsy.evidence_elements.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38]">
            <span className="text-[10px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB] font-semibold block mb-1">
              Asserted Tokens / Data
            </span>
            <div className="space-y-1">
              {autopsy.claim_elements.length > 0 ? (
                autopsy.claim_elements.map((el, i) => (
                  <span
                    key={i}
                    className="inline-block font-mono text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] border border-[#DCE3DF] dark:border-[#343E38] mr-1.5 mb-1"
                  >
                    {el}
                  </span>
                ))
              ) : (
                <span className="text-[#7E8C86] dark:text-[#738078] italic text-[11px]">None isolated</span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38]">
            <span className="text-[10px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB] font-semibold block mb-1">
              Contrasting Source Facts
            </span>
            <div className="space-y-1">
              {autopsy.evidence_elements.length > 0 ? (
                autopsy.evidence_elements.map((el, i) => (
                  <span
                    key={i}
                    className="inline-block font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#E8F5EE] dark:bg-[#176B58]/30 text-[#0E6245] dark:text-[#65B89D] border border-[#B7E1CA] dark:border-[#2C5E4E] mr-1.5 mb-1"
                  >
                    {el}
                  </span>
                ))
              ) : (
                <span className="text-[#7E8C86] dark:text-[#738078] italic text-[11px]">No contradictory elements</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Explanation */}
      <div className="text-xs text-[#17211D] dark:text-[#EDF2EE] leading-relaxed pt-0.5">
        <span className="text-[10px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB] font-semibold block mb-0.5">
          Diagnosis:
        </span>
        <p className="text-[#17211D] dark:text-[#EDF2EE]">{autopsy.diagnosis}</p>
      </div>
    </div>
  );
};

