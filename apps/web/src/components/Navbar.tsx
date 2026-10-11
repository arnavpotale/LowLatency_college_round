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
  auditTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onOpenSetup,
  onLoadDemo,
  onOpenReport,
  onOpenAdversarialLab,
  hasCompletedAudit,
  auditTitle
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-[#0f1117] sticky top-0 z-40">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        {/* Brand & Active Audit Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-zinc-100 font-sans uppercase">
              Second Opinion
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden md:block" />

          {auditTitle ? (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 font-sans">
              <span className="text-zinc-500 text-[11px]">Audit:</span>
              <span className="text-zinc-200 font-medium truncate max-w-[280px]">
                {auditTitle}
              </span>
            </div>
          ) : (
            <span className="hidden md:inline text-[11px] font-mono uppercase text-zinc-500">
              Evidence Investigation Workspace
            </span>
          )}
        </div>

        {/* Action Controls & Engine Status */}
        <div className="flex items-center gap-2">
          {/* Engine status indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#13151b] border border-zinc-800 text-[11px] font-mono"
            title={health?.status === 'healthy' ? 'FastAPI Deterministic Verification Engine active' : 'Offline Mock Provider active'}
          >
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
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#13151b] hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition"
            title="Load sample medical & financial contradiction case"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sample Case</span>
          </button>

          {/* Adversarial Claim Lab Trigger Button */}
          <button
            onClick={onOpenAdversarialLab}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#13151b] hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition"
            title="Open the live Adversarial Stress Test Lab"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>Adversarial Lab</span>
          </button>

          {/* Export Report Action */}
          {hasCompletedAudit && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
              title="Inspect and export forensic Markdown audit dossier"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
