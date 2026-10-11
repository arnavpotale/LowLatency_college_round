import React, { useState } from 'react';
import { AuditSummary, ConsistencyFinding, SafetyFinding, ConflictDetail } from '../../types';
import { ShieldAlert, AlertTriangle, AlertCircle, GitFork, ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface AuditOverviewBarProps {
  summary: AuditSummary;
  consistencyFindings: ConsistencyFinding[];
  safetyFindings: SafetyFinding[];
  conflicts?: ConflictDetail[];
  isMock: boolean;
  onSelectClaim?: (claimId: string) => void;
  contradictedClaimIds?: string[];
  conflictClaimIds?: string[];
  title?: string;
  sourceCount?: number;
}

export const AuditOverviewBar: React.FC<AuditOverviewBarProps> = ({
  summary,
  consistencyFindings,
  safetyFindings,
  conflicts = [],
  isMock,
  onSelectClaim,
  contradictedClaimIds = [],
  conflictClaimIds = [],
  title,
  sourceCount = 1
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const totalFindings = consistencyFindings.length + safetyFindings.length;
  const hasAlerts = summary.contradicted_claims > 0 || conflicts.length > 0 || totalFindings > 0;

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/80';
      case 'medium':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/80';
      default:
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/80';
    }
  };

  return (
    <div className="bg-[#12141a] rounded-lg border border-zinc-800/80 text-xs overflow-hidden">
      {/* Simulation Notice if in Mock mode */}
      {isMock && (
        <div className="px-4 py-1.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>
              <strong className="text-zinc-300 font-medium">Demonstration Dataset:</strong> Viewing pre-verified clinical trial and financial case.
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase">Sample Fixture</span>
        </div>
      )}

      {/* Row 1: Executive Audit Context & Trust Metric */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 bg-[#14161f]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-100 text-xs">
              Audit: {title || 'Clinical Guidelines Review'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-emerald-400 border border-emerald-900/60">
              Analysis complete
            </span>
          </div>
          <span className="text-zinc-600 hidden sm:inline">&bull;</span>
          <span className="text-zinc-400 text-[11px] font-mono hidden sm:inline">
            {summary.total_claims} claims investigated &bull; {sourceCount} source{sourceCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-400">Trust Score:</span>
            <span className="font-bold text-zinc-100">{Math.round(summary.trust_score)}%</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold border ${getRiskColor(summary.risk_level)}`}>
              {summary.risk_level} Risk
            </span>
          </div>

          {(totalFindings > 0 || summary.key_takeaway) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
            >
              <span>{showDetails ? 'Hide Notes' : 'Advisories'}</span>
              {showDetails ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Structured Verdict Counts & Immediate Inspection Triggers */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#111319]">
        {/* Verdict Count Cards */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <div className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SUPPORTED {summary.supported_claims}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-1.5 font-medium">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>CONTRADICTED {summary.contradicted_claims}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-amber-950/30 border border-amber-800/60 text-amber-300 flex items-center gap-1.5 font-medium">
            <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>UNSUPPORTED {summary.unsupported_claims}</span>
          </div>

          {conflicts.length > 0 && (
            <div className="px-2.5 py-1 rounded bg-purple-950/40 border border-purple-800/60 text-purple-300 flex items-center gap-1.5 font-medium">
              <GitFork className="w-3.5 h-3.5 text-purple-400" />
              <span>CONFLICTS {conflicts.length}</span>
            </div>
          )}
        </div>

        {/* Prioritized Jump Actions */}
        {hasAlerts && (
          <div className="flex items-center gap-2">
            {summary.contradicted_claims > 0 && contradictedClaimIds.length > 0 && (
              <button
                onClick={() => onSelectClaim?.(contradictedClaimIds[0])}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/50 border border-rose-800 text-rose-200 text-[11px] font-medium hover:bg-rose-900/60 transition shadow-sm"
                title="Click to jump directly to contradicted claim"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Jump to Contradiction</span>
              </button>
            )}

            {conflicts.length > 0 && conflictClaimIds.length > 0 && (
              <button
                onClick={() => onSelectClaim?.(conflictClaimIds[0])}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/50 border border-purple-800 text-purple-200 text-[11px] font-medium hover:bg-purple-900/60 transition shadow-sm"
                title="Click to inspect conflicting sources"
              >
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                <span>Jump to Conflict</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expandable Contextual Details Panel */}
      {showDetails && (
        <div className="px-4 py-3 border-t border-zinc-800/80 bg-[#12141a] space-y-2.5 animate-in fade-in duration-150">
          {/* Key takeaway */}
          {summary.key_takeaway && (
            <div className="text-[11px] text-zinc-300 italic font-serif border-l-2 border-zinc-600 pl-2.5">
              &ldquo;{summary.key_takeaway}&rdquo;
            </div>
          )}

          {/* Findings list */}
          {totalFindings > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {safetyFindings.map((sf) => (
                <div
                  key={sf.finding_id}
                  className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300 text-[11px] flex items-start gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{sf.category.replace('_', ' ').toUpperCase()}:</span>{' '}
                    <span className="text-zinc-300">{sf.description}</span>
                  </div>
                </div>
              ))}
              {consistencyFindings.map((cf) => (
                <div
                  key={cf.finding_id}
                  className="p-2 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300 text-[11px] flex items-start gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{cf.finding_type.replace('_', ' ').toUpperCase()}:</span>{' '}
                    <span className="text-zinc-300">{cf.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
