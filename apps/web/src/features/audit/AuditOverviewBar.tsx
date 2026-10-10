import React, { useState } from 'react';
import { AuditSummary, ConsistencyFinding, SafetyFinding, ConflictDetail } from '../../types';
import { ShieldAlert, AlertTriangle, AlertCircle, GitFork, ChevronDown, ChevronUp } from 'lucide-react';

interface AuditOverviewBarProps {
  summary: AuditSummary;
  consistencyFindings: ConsistencyFinding[];
  safetyFindings: SafetyFinding[];
  conflicts?: ConflictDetail[];
  isMock: boolean;
  onSelectClaim?: (claimId: string) => void;
  contradictedClaimIds?: string[];
  conflictClaimIds?: string[];
}

export const AuditOverviewBar: React.FC<AuditOverviewBarProps> = ({
  summary,
  consistencyFindings,
  safetyFindings,
  conflicts = [],
  isMock,
  onSelectClaim,
  contradictedClaimIds = [],
  conflictClaimIds = []
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
    <div className="bg-[#14161d] rounded-lg border border-zinc-800/80 text-xs">
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

      {/* Main Single-Line Concise Overview Ribbon */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Overall Trust Index & Claim Tally */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-zinc-400">Trust Index:</span>
            <span className="text-sm font-bold font-mono text-zinc-100">
              {Math.round(summary.trust_score)}%
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-semibold border ${getRiskColor(
                summary.risk_level
              )}`}
            >
              {summary.risk_level} Risk
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Verdict Distribution Pills */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-zinc-300 font-semibold">{summary.total_claims} claims</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-emerald-400">{summary.supported_claims} supported</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-rose-400 font-semibold">{summary.contradicted_claims} contradicted</span>
            {conflicts.length > 0 && (
              <>
                <span className="text-zinc-600">&bull;</span>
                <span className="text-amber-400 font-semibold">{conflicts.length} conflict</span>
              </>
            )}
            {summary.unsupported_claims > 0 && (
              <>
                <span className="text-zinc-600">&bull;</span>
                <span className="text-zinc-400">{summary.unsupported_claims} ungrounded</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Prioritized Findings & Expand Toggle */}
        <div className="flex items-center gap-3">
          {/* Prioritized finding alert badge */}
          {hasAlerts && (
            <div className="flex items-center gap-2">
              {summary.contradicted_claims > 0 && contradictedClaimIds.length > 0 && (
                <button
                  onClick={() => onSelectClaim?.(contradictedClaimIds[0])}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300 text-[11px] hover:bg-rose-900/40 transition"
                  title="Click to inspect contradicted assertion"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Inspect Contradiction</span>
                </button>
              )}

              {conflicts.length > 0 && conflictClaimIds.length > 0 && (
                <button
                  onClick={() => onSelectClaim?.(conflictClaimIds[0])}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 text-[11px] hover:bg-amber-900/40 transition"
                  title="Click to inspect conflicting sources"
                >
                  <GitFork className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect Conflict</span>
                </button>
              )}
            </div>
          )}

          {/* Details toggle button */}
          {(totalFindings > 0 || summary.key_takeaway) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800"
            >
              <span>{showDetails ? 'Hide Notes' : 'Advisories'}</span>
              {showDetails ? (
                <ChevronUp className="w-3 h-3 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              )}
            </button>
          )}
        </div>
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
