import React from 'react';
import { HealthResponse } from '../types';
import { Shield, Sparkles, FileText, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  health: HealthResponse | null;
  onLoadDemo: () => void;
  onOpenReport: () => void;
  hasCompletedAudit: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onLoadDemo,
  onOpenReport,
  hasCompletedAudit,
}) => {
  const isHealthy = health?.status === 'ok';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                Second Opinion
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                v0.1.0 Prototype
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden xs:block">
              AI Answer Verification & Fact-Auditing Platform
            </p>
          </div>
        </div>

        {/* Right Actions & Health Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* API Health Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {isHealthy ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">API:</span>
            <span>{isHealthy ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Load Demo */}
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="whitespace-nowrap">Load Demo</span>
          </button>

          {/* View Report */}
          <button
            onClick={onOpenReport}
            disabled={!hasCompletedAudit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              hasCompletedAudit
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Audit Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};