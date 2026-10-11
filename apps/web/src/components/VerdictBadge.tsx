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
      bg: 'bg-[#E8F5EE] dark:bg-[#176B58]/25',
      text: 'text-[#0E6245] dark:text-[#65B89D]',
      border: 'border-[#B7E1CA] dark:border-[#2C5E4E]',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3 text-[#0E6245] dark:text-[#65B89D]' : 'w-3.5 h-3.5 text-[#0E6245] dark:text-[#65B89D]'} />
    },
    contradicted: {
      label: 'Contradicted',
      bg: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25',
      text: 'text-[#9E2222] dark:text-[#F17575]',
      border: 'border-[#F7C5C5] dark:border-[#6B2323]',
      icon: <XCircle className={size === 'sm' ? 'w-3 h-3 text-[#9E2222] dark:text-[#F17575]' : 'w-3.5 h-3.5 text-[#9E2222] dark:text-[#F17575]'} />
    },
    unsupported: {
      label: 'Unsupported',
      bg: 'bg-[#FEF6E9] dark:bg-[#B45309]/25',
      text: 'text-[#965B0A] dark:text-[#E5AC48]',
      border: 'border-[#F8DCAB] dark:border-[#633910]',
      icon: <MinusCircle className={size === 'sm' ? 'w-3 h-3 text-[#965B0A] dark:text-[#E5AC48]' : 'w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48]'} />
    },
    ambiguous: {
      label: 'Conflict / Ambiguous',
      bg: 'bg-[#F4F0FC] dark:bg-[#6D28D9]/25',
      text: 'text-[#5B32A8] dark:text-[#B48DEF]',
      border: 'border-[#D5C6F5] dark:border-[#4E2582]',
      icon: <GitFork className={size === 'sm' ? 'w-3 h-3 text-[#5B32A8] dark:text-[#B48DEF]' : 'w-3.5 h-3.5 text-[#5B32A8] dark:text-[#B48DEF]'} />
    },
    inconclusive: {
      label: 'Inconclusive',
      bg: 'bg-[#EFF3F1] dark:bg-[#202824]',
      text: 'text-[#58645F] dark:text-[#A7B2AB]',
      border: 'border-[#DCE3DF] dark:border-[#343E38]',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3 text-[#58645F] dark:text-[#A7B2AB]' : 'w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB]'} />
    }
  };

  const config = configs[verdict] || configs.inconclusive;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border tracking-tight ${padding} ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
