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
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0" />
        <span>Autopsy analysis pending or unavailable for this claim.</span>
      </div>
    );
  }

  const categoryLabels: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    quantity_mismatch: {
      label: 'Numerical Discrepancy',
      badge: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
      icon: <FileWarning className="w-3.5 h-3.5" />
    },
    rate_frequency: {
      label: 'Rate Interval Dilation',
      badge: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
      icon: <ArrowRightLeft className="w-3.5 h-3.5" />
    },
    polarity_negation: {
      label: 'Polarity / Negation Inversion',
      badge: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
      icon: <FileWarning className="w-3.5 h-3.5" />
    },
    direct_contradiction: {
      label: 'Factual Contradiction',
      badge: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
      icon: <AlertCircle className="w-3.5 h-3.5" />
    },
    conflicting_sources: {
      label: 'Inter-Source Conflict',
      badge: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
      icon: <ArrowRightLeft className="w-3.5 h-3.5" />
    },
    missing_evidence: {
      label: 'Ungrounded Assertion',
      badge: 'bg-zinc-800 border-zinc-700 text-zinc-300',
      icon: <Search className="w-3.5 h-3.5" />
    },
    insufficient_context: {
      label: 'Insufficient Corroboration',
      badge: 'bg-stone-900 border-stone-700 text-stone-300',
      icon: <HelpCircle className="w-3.5 h-3.5" />
    },
    verified_match: {
      label: 'Grounded Alignment',
      badge: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
      icon: <CheckCircle className="w-3.5 h-3.5" />
    }
  };

  const cat = categoryLabels[autopsy.issue_type] || {
    label: autopsy.issue_type.replace('_', ' ').toUpperCase(),
    badge: 'bg-zinc-800 border-zinc-700 text-zinc-300',
    icon: <AlertCircle className="w-3.5 h-3.5" />
  };

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-[#12141a] p-4 space-y-3.5">
      {/* Autopsy Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
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
        <div className="text-[11px] text-zinc-300 font-sans italic border-l-2 border-zinc-600 pl-2.5">
          &ldquo;{claimText}&rdquo;
        </div>
      )}

      {/* Problematic Phrase Callout if present */}
      {autopsy.problematic_phrase && (
        <div className="p-3 rounded bg-[#0a0c10] border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold block">
            Divergent Phrase in Answer:
          </span>
          <p className="font-mono text-xs text-rose-200 font-semibold bg-rose-950/40 px-2 py-1 rounded border border-rose-900/50">
            &ldquo;{autopsy.problematic_phrase}&rdquo;
          </p>
        </div>
      )}

      {/* Forensic Element Comparison */}
      {(autopsy.claim_elements.length > 0 || autopsy.evidence_elements.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded bg-[#0f1117] border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium block mb-1">
              Asserted Tokens / Data
            </span>
            <div className="space-y-1">
              {autopsy.claim_elements.length > 0 ? (
                autopsy.claim_elements.map((el, i) => (
                  <span
                    key={i}
                    className="inline-block font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60 mr-1.5 mb-1"
                  >
                    {el}
                  </span>
                ))
              ) : (
                <span className="text-zinc-500 italic text-[11px]">None isolated</span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#0f1117] border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium block mb-1">
              Contrasting Source Facts
            </span>
            <div className="space-y-1">
              {autopsy.evidence_elements.length > 0 ? (
                autopsy.evidence_elements.map((el, i) => (
                  <span
                    key={i}
                    className="inline-block font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 mr-1.5 mb-1"
                  >
                    {el}
                  </span>
                ))
              ) : (
                <span className="text-zinc-500 italic text-[11px]">No contradictory elements</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Explanation */}
      <div className="text-xs text-zinc-300 leading-relaxed pt-0.5">
        <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium block mb-0.5">
          Diagnosis:
        </span>
        <p className="text-zinc-200">{autopsy.diagnosis}</p>
      </div>
    </div>
  );
};
