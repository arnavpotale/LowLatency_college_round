import React from 'react';
import { ShieldCheck, Activity, Sparkles, FileText, FlaskConical } from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  health: HealthResponse | null;
  onLoadDemo: () => void;
  onOpenReport?: () => void;
  onOpenAdversarialLab: () => void;
  hasCompletedAudit: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onLoadDemo,
  onOpenReport,
  onOpenAdversarialLab,
  hasCompletedAudit
}) => {
  return (
    <header className="border-b border-zinc-800 bg-[#12141a]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
                Second Opinion
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Evidence Workspace
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block">
              Forensic Claim Decomposition &amp; Multi-Source Evidence Auditing
            </p>
          </div>
        </div>

        {/* Action Controls & Health Status */}
        <div className="flex items-center gap-2.5">
          {/* Health status badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-zinc-500 font-mono">ENGINE:</span>
            <span className={health?.status === 'healthy' ? 'text-emerald-400 font-mono font-medium' : 'text-amber-400 font-mono font-medium'}>
              {health?.status === 'healthy' ? 'API LIVE' : 'CLIENT MOCK'}
            </span>
          </div>

          {/* Quick Demo Pre-load Button */}
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/80 transition"
            title="Load sample medical & financial contradiction case"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Load Demo Case</span>
          </button>

          {/* Adversarial Claim Lab Trigger Button */}
          <button
            onClick={onOpenAdversarialLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-600/80 transition shadow-sm"
            title="Open the live Adversarial Stress Test Lab"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Adversarial Lab</span>
            <span className="text-[10px] font-mono bg-zinc-900 px-1 py-0.2 rounded text-zinc-400 border border-zinc-700">
              8 Tests
            </span>
          </button>

          {/* Report Button (if audit completed) */}
          {hasCompletedAudit && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-medium shadow-sm transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Report</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
