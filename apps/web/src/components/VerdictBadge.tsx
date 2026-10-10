import React from 'react';
import { VerdictCategory } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, MinusCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: VerdictCategory;
  showIcon?: boolean;
  className?: string;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  verdict,
  showIcon = true,
  className = ''
}) => {
  const configs: Record<VerdictCategory, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    supported: {
      label: 'Supported',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    contradicted: {
      label: 'Contradicted',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: <XCircle className="w-3.5 h-3.5" />
    },
    unsupported: {
      label: 'Unsupported',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: <AlertTriangle className="w-3.5 h-3.5" />
    },
    ambiguous: {
      label: 'Ambiguous',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: <HelpCircle className="w-3.5 h-3.5" />
    },
    inconclusive: {
      label: 'Inconclusive',
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      icon: <MinusCircle className="w-3.5 h-3.5" />
    }
  };

  const config = configs[verdict] || configs.inconclusive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
