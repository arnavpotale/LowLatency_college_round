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
    <header className="border-b border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] sticky top-0 z-40">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        {/* Brand & Active Audit Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] flex items-center justify-center text-[#176B58] dark:text-[#65B89D] shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-[#17211D] dark:text-[#EDF2EE] font-sans uppercase">
              Second Opinion
            </span>
          </div>

          <div className="h-4 w-px bg-[#DCE3DF] dark:border-[#343E38] hidden md:block" />

          {auditTitle ? (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#58645F] dark:text-[#A7B2AB] font-sans">
              <span className="text-[11px]">Audit:</span>
              <span className="text-[#17211D] dark:text-[#EDF2EE] font-medium truncate max-w-[280px]">
                {auditTitle}
              </span>
            </div>
          ) : (
            <span className="hidden md:inline text-[11px] font-mono uppercase text-[#58645F] dark:text-[#A7B2AB]">
              Evidence Investigation Workspace
            </span>
          )}
        </div>

        {/* Action Controls & Engine Status */}
        <div className="flex items-center gap-2">
          {/* Engine status indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[11px] font-mono"
            title={health?.status === 'healthy' ? 'FastAPI Deterministic Verification Engine active' : 'Offline Mock Provider active'}
          >
            <Activity className="w-3 h-3 text-[#0E6245] dark:text-[#65B89D]" />
            <span className="text-[#58645F] dark:text-[#A7B2AB]">ENGINE:</span>
            <span className={health?.status === 'healthy' ? 'text-[#0E6245] dark:text-[#65B89D] font-medium' : 'text-[#965B0A] dark:text-[#E5AC48] font-medium'}>
              {health?.status === 'healthy' ? 'LIVE' : 'MOCK'}
            </span>
          </div>

          {/* New Audit Button */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] text-xs font-semibold transition shadow-xs"
            title="Start new evidence audit with source documents and answer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Audit</span>
          </button>

          {/* Quick Demo Pre-load Button */}
          <button
            onClick={onLoadDemo}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#F6F7F8] dark:bg-[#202824] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium border border-[#DCE3DF] dark:border-[#343E38] transition"
            title="Load sample medical & financial contradiction case"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB]" />
            <span>Sample Case</span>
          </button>

          {/* Adversarial Claim Lab Trigger Button */}
          <button
            onClick={onOpenAdversarialLab}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#F6F7F8] dark:bg-[#202824] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium border border-[#DCE3DF] dark:border-[#343E38] transition"
            title="Open the live Adversarial Stress Test Lab"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48]" />
            <span>Adversarial Lab</span>
          </button>

          {/* Export Report Action */}
          {hasCompletedAudit && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F6F7F8] dark:bg-[#202824] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium border border-[#DCE3DF] dark:border-[#343E38] transition"
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
