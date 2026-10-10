import React from 'react';
import { ShieldCheck, Activity, Sparkles, FileText, FlaskConical, Plus } from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  health: HealthResponse | null;
  onOpenSetup: () => void;
  onLoadDemo: () => void;
  onOpenReport?: () => void;
  onOpenAdversarialLab: () => void;
  hasCompletedAudit: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onOpenSetup,
  onLoadDemo,
  onOpenReport,
  onOpenAdversarialLab,
  hasCompletedAudit
}) => {
  return (
    <header className="border-b border-zinc-800 bg-[#12141a]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-zinc-200" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
              Second Opinion
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700">
              Evidence Workspace
            </span>
          </div>
        </div>

        {/* Action Controls & Health Status */}
        <div className="flex items-center gap-2">
          {/* Engine status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-zinc-500">ENGINE:</span>
            <span className={health?.status === 'healthy' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {health?.status === 'healthy' ? 'LIVE' : 'MOCK'}
            </span>
          </div>

          {/* New Audit Button */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-200 hover:bg-white text-zinc-900 text-xs font-semibold transition shadow-sm"
            title="Start new evidence audit with source documents and answer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Audit</span>
          </button>

          {/* Quick Demo Pre-load Button */}
          <button
            onClick={onLoadDemo}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition"
            title="Load sample medical & financial contradiction case"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sample Case</span>
          </button>

          {/* Adversarial Claim Lab Trigger Button */}
          <button
            onClick={onOpenAdversarialLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition shadow-sm"
            title="Open the live Adversarial Stress Test Lab"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>Adversarial Lab</span>
          </button>

          {/* Report Button (if audit completed) */}
          {hasCompletedAudit && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
