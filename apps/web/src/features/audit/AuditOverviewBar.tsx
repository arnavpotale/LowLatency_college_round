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
        return 'text-[#9E2222] dark:text-[#F17575] bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323]';
      case 'medium':
        return 'text-[#965B0A] dark:text-[#E5AC48] bg-[#FEF6E9] dark:bg-[#B45309]/25 border-[#F8DCAB] dark:border-[#633910]';
      default:
        return 'text-[#0E6245] dark:text-[#65B89D] bg-[#E8F5EE] dark:bg-[#176B58]/25 border-[#B7E1CA] dark:border-[#2C5E4E]';
    }
  };

  return (
    <div className="bg-white dark:bg-[#191F1C] rounded-lg border border-[#DCE3DF] dark:border-[#343E38] text-xs overflow-hidden shadow-xs">
      {/* Simulation Notice if in Mock mode */}
      {isMock && (
        <div className="px-4 py-1.5 bg-[#FEF6E9] dark:bg-[#B45309]/20 border-b border-[#F8DCAB] dark:border-[#633910] flex items-center justify-between text-[11px] text-[#965B0A] dark:text-[#E5AC48]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5AC48]" />
            <span>
              <strong className="font-semibold">Demonstration Dataset:</strong> Viewing pre-verified clinical trial and financial case.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-semibold">Sample Fixture</span>
        </div>
      )}

      {/* Row 1: Executive Audit Context & Trust Metric */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#202824]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#17211D] dark:text-[#EDF2EE] text-xs">
              Audit: {title || 'Clinical Guidelines Review'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E8F5EE] dark:bg-[#176B58]/25 text-[#0E6245] dark:text-[#65B89D] border border-[#B7E1CA] dark:border-[#2C5E4E] font-semibold">
              Analysis complete
            </span>
          </div>
          <span className="text-[#C5D0CB] dark:text-[#445149] hidden sm:inline">&bull;</span>
          <span className="text-[#58645F] dark:text-[#A7B2AB] text-[11px] font-mono hidden sm:inline">
            {summary.total_claims} claims investigated &bull; {sourceCount} source{sourceCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {summary && (
            <div
              className="flex items-center gap-2 font-mono text-[11px] cursor-help"
              title="Normalized Trust Score: Supported ÷ (Supported + Contradicted + Unsupported) × 100. Ambiguous and inconclusive assertions are excluded."
            >
              <span className="text-[#58645F] dark:text-[#A7B2AB]">Trust Score:</span>
              <span className="font-bold text-[#17211D] dark:text-[#EDF2EE]">
                {summary.trust_score !== null && summary.trust_score !== undefined
                  ? `${Math.round(summary.trust_score)}%`
                  : 'N/A'}
              </span>
              <span className="text-[10px] text-[#58645F] dark:text-[#A7B2AB]">
                ({summary.decisive_claims ?? (summary.supported_claims + summary.contradicted_claims + summary.unsupported_claims)} decisive)
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold border ${getRiskColor(summary.risk_level)}`}>
                {summary.risk_level} Risk
              </span>
            </div>
          )}

          {(totalFindings > 0 || summary.key_takeaway) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] transition px-2 py-0.5 rounded bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38]"
            >
              <span>{showDetails ? 'Hide Notes' : 'Advisories'}</span>
              {showDetails ? <ChevronUp className="w-3 h-3 text-[#58645F] dark:text-[#A7B2AB]" /> : <ChevronDown className="w-3 h-3 text-[#58645F] dark:text-[#A7B2AB]" />}
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Structured Verdict Counts & Immediate Inspection Triggers */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#191F1C]">
        {/* Verdict Count Cards */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <div className="px-2.5 py-1 rounded bg-[#E8F5EE] dark:bg-[#176B58]/20 border border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D] flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0E6245] dark:text-[#65B89D]" />
            <span>SUPPORTED {summary.supported_claims}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575] flex items-center gap-1.5 font-medium">
            <XCircle className="w-3.5 h-3.5 text-[#9E2222] dark:text-[#F17575]" />
            <span>CONTRADICTED {summary.contradicted_claims}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48] flex items-center gap-1.5 font-medium">
            <MinusCircle className="w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48]" />
            <span>UNSUPPORTED {summary.unsupported_claims}</span>
          </div>

          {conflicts.length > 0 && (
            <div className="px-2.5 py-1 rounded bg-[#F4F0FC] dark:bg-[#6D28D9]/20 border border-[#D5C6F5] dark:border-[#4E2582] text-[#5B32A8] dark:text-[#B48DEF] flex items-center gap-1.5 font-medium">
              <GitFork className="w-3.5 h-3.5 text-[#5B32A8] dark:text-[#B48DEF]" />
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575] text-[11px] font-medium hover:bg-[#FCE8E8] dark:hover:bg-[#B91C1C]/30 transition shadow-xs"
                title="Click to jump directly to contradicted claim"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#9E2222] dark:text-[#F17575]" />
                <span>Jump to Contradiction</span>
              </button>
            )}

            {conflicts.length > 0 && conflictClaimIds.length > 0 && (
              <button
                onClick={() => onSelectClaim?.(conflictClaimIds[0])}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F4F0FC] dark:bg-[#6D28D9]/20 border border-[#D5C6F5] dark:border-[#4E2582] text-[#5B32A8] dark:text-[#B48DEF] text-[11px] font-medium hover:bg-[#EFE8FA] dark:hover:bg-[#6D28D9]/30 transition shadow-xs"
                title="Click to inspect conflicting sources"
              >
                <GitFork className="w-3.5 h-3.5 text-[#5B32A8] dark:text-[#B48DEF]" />
                <span>Jump to Conflict</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expandable Contextual Details Panel */}
      {showDetails && (
        <div className="px-4 py-3 border-t border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#202824] space-y-2.5">
          {/* Key takeaway */}
          {summary.key_takeaway && (
            <div className="text-[11px] text-[#17211D] dark:text-[#EDF2EE] italic border-l-2 border-[#176B58] dark:border-[#65B89D] pl-2.5">
              &ldquo;{summary.key_takeaway}&rdquo;
            </div>
          )}

          {/* Findings list */}
          {totalFindings > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {safetyFindings.map((sf) => (
                <div
                  key={sf.finding_id}
                  className="p-2 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575] text-[11px] flex items-start gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-[#9E2222] dark:text-[#F17575] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{sf.category.replace('_', ' ').toUpperCase()}:</span>{' '}
                    <span className="text-[#17211D] dark:text-[#EDF2EE]">{sf.description}</span>
                  </div>
                </div>
              ))}
              {consistencyFindings.map((cf) => (
                <div
                  key={cf.finding_id}
                  className="p-2 rounded bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48] text-[11px] flex items-start gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{cf.finding_type.replace('_', ' ').toUpperCase()}:</span>{' '}
                    <span className="text-[#17211D] dark:text-[#EDF2EE]">{cf.description}</span>
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

