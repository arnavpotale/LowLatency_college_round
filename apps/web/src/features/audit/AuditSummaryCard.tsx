import React from 'react';
import { AuditSummary, ConsistencyFinding, SafetyFinding } from '../../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface AuditSummaryCardProps {
  summary: AuditSummary;
  consistencyFindings: ConsistencyFinding[];
  safetyFindings: SafetyFinding[];
  isMock: boolean;
}

export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({
  summary,
  consistencyFindings,
  safetyFindings,
  isMock
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 50) return 'text-amber-400 stroke-amber-400';
    return 'text-rose-400 stroke-rose-400';
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
        };
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
        };
    }
  };

  const riskBadge = getRiskBadge(summary.risk_level);

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col gap-5">
      {/* Simulation Banner Notice */}
      {isMock && (
        <div className="px-3.5 py-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Simulation Mode:</strong> Findings generated via mock verification pipeline adhering to the final shared schema contract.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-indigo-500/20 px-2 py-0.5 rounded">
            Mock Active
          </span>
        </div>
      )}

      {/* Top metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trust Score */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={getScoreColor(summary.trust_score)}
                strokeDasharray={`${summary.trust_score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={`absolute text-sm font-bold font-mono ${getScoreColor(summary.trust_score)}`}>
              {Math.round(summary.trust_score)}%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audit Trust Score
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Penalty-weighted evidence alignment
            </p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Risk Level
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${riskBadge.bg}`}>
                {riskBadge.icon}
                {summary.risk_level} Risk
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-white">
              {summary.total_claims}
            </p>
            <p className="text-[11px] text-slate-400">Claims Evaluated</p>
          </div>
        </div>

        {/* Multi-category breakdown */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Verdict Distribution
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="font-bold">{summary.supported_claims}</span> Sup
            </div>
            <div className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <span className="font-bold">{summary.contradicted_claims}</span> Cont
            </div>
            <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="font-bold">{summary.unsupported_claims}</span> Unsup
            </div>
          </div>
        </div>
      </div>

      {/* Findings Warnings (if any) */}
      {(consistencyFindings.length > 0 || safetyFindings.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {consistencyFindings.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">
                  Consistency Finding ({consistencyFindings.length})
                </p>
                <p className="text-slate-300 mt-0.5">
                  {consistencyFindings[0].description}
                </p>
              </div>
            </div>
          )}

          {safetyFindings.length > 0 && (
            <div className="p-3.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">
                  Safety & Liability Advisory ({safetyFindings.length})
                </p>
                <p className="text-slate-300 mt-0.5">
                  {safetyFindings[0].description}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* High-level takeaway */}
      {summary.key_takeaway && (
        <div className="p-3 rounded-lg bg-slate-950 text-xs text-slate-300 border-l-4 border-indigo-500 italic">
          "{summary.key_takeaway}"
        </div>
      )}
    </div>
  );
};
