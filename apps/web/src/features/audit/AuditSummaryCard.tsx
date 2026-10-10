import React from 'react';
import { AuditSummary, ConsistencyFinding, SafetyFinding, ConflictDetail } from '../../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Info, GitFork } from 'lucide-react';

interface AuditSummaryCardProps {
  summary: AuditSummary;
  consistencyFindings: ConsistencyFinding[];
  safetyFindings: SafetyFinding[];
  conflicts?: ConflictDetail[];
  isMock: boolean;
  onOpenAdversarialLab?: () => void;
}

export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({
  summary,
  consistencyFindings,
  safetyFindings,
  conflicts = [],
  isMock
}) => {
  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-rose-950/70 border-rose-800 text-rose-300',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        };
      case 'medium':
        return {
          bg: 'bg-amber-950/70 border-amber-800 text-amber-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        };
      default:
        return {
          bg: 'bg-emerald-950/70 border-emerald-800 text-emerald-300',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        };
    }
  };

  const riskBadge = getRiskBadge(summary.risk_level);

  return (
    <div className="bg-[#15181e] rounded-lg border border-zinc-800 p-4 flex flex-col gap-3">
      {/* Simulation Banner Notice */}
      {isMock && (
        <div className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700/70 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              <strong className="text-zinc-200">Demonstration Mode:</strong> Findings generated via local verified test fixture. Connect live API for dynamic multi-document parsing.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">
            MOCK FIXTURE
          </span>
        </div>
      )}

      {/* Top metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Metric 1: Trust Score */}
        <div className="p-3 rounded bg-[#171a22] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Trust Index
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {Math.round(summary.trust_score)}
            </span>
            <span className="text-xs text-zinc-500 font-mono">/100</span>
          </div>
        </div>

        {/* Metric 2: Risk Assessment */}
        <div className="p-3 rounded bg-[#171a22] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Risk Profile
          </span>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border uppercase tracking-wider ${riskBadge.bg}`}
            >
              {riskBadge.icon}
              {summary.risk_level}
            </span>
          </div>
        </div>

        {/* Metric 3: Assertions Audited */}
        <div className="p-3 rounded bg-[#171a22] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Assertions
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {summary.total_claims}
            </span>
            <span className="text-xs text-zinc-500">decomposed</span>
          </div>
        </div>

        {/* Metric 4: Supported vs Contradicted */}
        <div className="p-3 rounded bg-[#171a22] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Grounding Status
          </span>
          <div className="flex items-center gap-2 mt-1 font-mono text-xs">
            <span className="text-emerald-400 font-bold">{summary.supported_claims} Sup</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-rose-400 font-bold">{summary.contradicted_claims} Cont</span>
          </div>
        </div>

        {/* Metric 5: Unsupported / Ambiguous */}
        <div className="p-3 rounded bg-[#171a22] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Unresolved
          </span>
          <div className="flex items-center gap-2 mt-1 font-mono text-xs">
            <span className="text-amber-400 font-bold">{summary.unsupported_claims} Unsup</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-400 font-bold">{summary.ambiguous_claims || 0} Amb</span>
          </div>
        </div>

        {/* Metric 6: Inter-source Conflicts */}
        <div className="p-3 rounded bg-[#171a22] border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Evidence Conflicts
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {conflicts.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-300">
                <GitFork className="w-3.5 h-3.5 text-amber-400" />
                {conflicts.length} Detected
              </span>
            ) : (
              <span className="text-xs font-mono text-zinc-400">None detected</span>
            )}
          </div>
        </div>
      </div>

      {/* Advisory warnings if present */}
      {(consistencyFindings.length > 0 || safetyFindings.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
          {consistencyFindings.length > 0 && (
            <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/60 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">
                  Consistency Finding ({consistencyFindings.length})
                </p>
                <p className="text-zinc-300 text-[11px] mt-0.5">
                  {consistencyFindings[0].description}
                </p>
              </div>
            </div>
          )}

          {safetyFindings.length > 0 && (
            <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/60 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">
                  Safety Advisory ({safetyFindings.length})
                </p>
                <p className="text-zinc-300 text-[11px] mt-0.5">
                  {safetyFindings[0].description}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Takeaway */}
      {summary.key_takeaway && (
        <div className="p-2.5 rounded bg-[#171a22] text-xs text-zinc-300 border-l-2 border-zinc-400 italic font-serif">
          &ldquo;{summary.key_takeaway}&rdquo;
        </div>
      )}
    </div>
  );
};
