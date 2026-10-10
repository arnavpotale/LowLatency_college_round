import React from 'react';
import { VerdictCategory } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, GitFork, MinusCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: VerdictCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  verdict,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const configs: Record<VerdictCategory, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    supported: {
      label: 'Supported',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      border: 'border-emerald-800/60',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    contradicted: {
      label: 'Contradicted',
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      border: 'border-rose-800/60',
      icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    unsupported: {
      label: 'Unsupported',
      bg: 'bg-zinc-900',
      text: 'text-zinc-400',
      border: 'border-zinc-700',
      icon: <MinusCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    ambiguous: {
      label: 'Conflict / Ambiguous',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      border: 'border-amber-800/60',
      icon: <GitFork className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    },
    inconclusive: {
      label: 'Inconclusive',
      bg: 'bg-stone-900',
      text: 'text-stone-300',
      border: 'border-stone-700',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    }
  };

  const config = configs[verdict] || configs.inconclusive;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border tracking-tight ${padding} ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
