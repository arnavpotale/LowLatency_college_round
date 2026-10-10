import React from 'react';
import { ShieldCheck, Activity, Sparkles, FileText } from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  health: HealthResponse | null;
  onLoadDemo: () => void;
  onOpenReport?: () => void;
  hasCompletedAudit: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onLoadDemo,
  onOpenReport,
  hasCompletedAudit
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Second Opinion
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v0.1.0 Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI Answer Verification & Fact-Auditing Platform
            </p>
          </div>
        </div>

        {/* Action Controls & Health Status */}
        <div className="flex items-center gap-3">
          {/* Health status badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">API:</span>
            <span className={health?.status === 'healthy' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {health?.status === 'healthy' ? 'Connected' : 'Client Mock'}
            </span>
          </div>

          {/* Quick Demo Pre-load Button */}
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Load sample medical & financial contradiction case"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Demo Case</span>
          </button>

          {/* Report Button (if audit completed) */}
          {hasCompletedAudit && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition"
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
