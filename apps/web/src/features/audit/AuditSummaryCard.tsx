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
          bg: 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-[#9E2222] dark:text-[#F17575]" />
        };
      case 'medium':
        return {
          bg: 'bg-[#FEF6E9] dark:bg-[#B45309]/25 border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48]',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48]" />
        };
      default:
        return {
          bg: 'bg-[#E8F5EE] dark:bg-[#176B58]/25 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-[#0E6245] dark:text-[#65B89D]" />
        };
    }
  };

  const riskBadge = getRiskBadge(summary.risk_level);

  return (
    <div className="bg-white dark:bg-[#191F1C] rounded-lg border border-[#DCE3DF] dark:border-[#343E38] p-4 flex flex-col gap-3 shadow-xs">
      {/* Simulation Banner Notice */}
      {isMock && (
        <div className="px-3 py-1.5 rounded bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] flex items-center justify-between text-xs text-[#965B0A] dark:text-[#E5AC48]">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong className="font-semibold">Demonstration Mode:</strong> Findings generated via local verified test fixture. Connect live API for dynamic multi-document parsing.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-white dark:bg-[#202824] px-2 py-0.5 rounded text-[#965B0A] dark:text-[#E5AC48] border border-[#F8DCAB] dark:border-[#633910] font-semibold">
            MOCK FIXTURE
          </span>
        </div>
      )}

      {/* Top metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Metric 1: Trust Score */}
        <div
          className="p-3 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex flex-col justify-between cursor-help"
          title="Normalized Trust Score: Supported ÷ (Supported + Contradicted + Unsupported) × 100. Ambiguous and inconclusive assertions are excluded."
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] font-semibold">
              Trust Index
            </span>
            <span className="text-[9px] font-mono text-[#58645F] dark:text-[#A7B2AB]">
              {summary.decisive_claims ?? (summary.supported_claims + summary.contradicted_claims + summary.unsupported_claims)} dec.
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-[#17211D] dark:text-[#EDF2EE]">
              {summary.trust_score !== null && summary.trust_score !== undefined
                ? Math.round(summary.trust_score)
                : 'N/A'}
            </span>
            {summary.trust_score !== null && summary.trust_score !== undefined && (
              <span className="text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">/100</span>
            )}
          </div>
        </div>

        {/* Metric 2: Risk Assessment */}
        <div className="p-3 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] font-semibold">
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
        <div className="p-3 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] font-semibold">
            Assertions
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono text-[#17211D] dark:text-[#EDF2EE]">
              {summary.total_claims}
            </span>
            <span className="text-xs text-[#58645F] dark:text-[#A7B2AB]">decomposed</span>
          </div>
        </div>

        {/* Metric 4: Supported vs Contradicted */}
        <div className="p-3 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] font-semibold">
            Grounding Status
          </span>
          <div className="flex items-center gap-2 mt-1 font-mono text-xs">
            <span className="text-[#0E6245] dark:text-[#65B89D] font-bold">{summary.supported_claims} Sup</span>
            <span className="text-[#C5D0CB] dark:text-[#445149]">&bull;</span>
            <span className="text-[#9E2222] dark:text-[#F17575] font-bold">{summary.contradicted_claims} Cont</span>
          </div>
        </div>

        {/* Metric 5: Unsupported / Ambiguous */}
        <div className="p-3 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] font-semibold">
            Unresolved
          </span>
          <div className="flex items-center gap-2 mt-1 font-mono text-xs">
            <span className="text-[#965B0A] dark:text-[#E5AC48] font-bold">{summary.unsupported_claims} Unsup</span>
            <span className="text-[#C5D0CB] dark:text-[#445149]">&bull;</span>
            <span className="text-[#58645F] dark:text-[#A7B2AB] font-bold">{summary.ambiguous_claims || 0} Amb</span>
          </div>
        </div>

        {/* Metric 6: Inter-source Conflicts */}
        <div className="p-3 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] font-semibold">
            Evidence Conflicts
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {conflicts.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#965B0A] dark:text-[#E5AC48]">
                <GitFork className="w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48]" />
                {conflicts.length} Detected
              </span>
            ) : (
              <span className="text-xs font-mono text-[#58645F] dark:text-[#A7B2AB]">None detected</span>
            )}
          </div>
        </div>
      </div>

      {/* Advisory warnings if present */}
      {(consistencyFindings.length > 0 || safetyFindings.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
          {consistencyFindings.length > 0 && (
            <div className="p-2.5 rounded bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#965B0A] dark:text-[#E5AC48] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#965B0A] dark:text-[#E5AC48]">
                  Consistency Finding ({consistencyFindings.length})
                </p>
                <p className="text-[#17211D] dark:text-[#EDF2EE] text-[11px] mt-0.5">
                  {consistencyFindings[0].description}
                </p>
              </div>
            </div>
          )}

          {safetyFindings.length > 0 && (
            <div className="p-2.5 rounded bg-[#FDF0F0] dark:bg-[#B91C1C]/20 border border-[#F7C5C5] dark:border-[#6B2323] text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#9E2222] dark:text-[#F17575] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#9E2222] dark:text-[#F17575]">
                  Safety Advisory ({safetyFindings.length})
                </p>
                <p className="text-[#17211D] dark:text-[#EDF2EE] text-[11px] mt-0.5">
                  {safetyFindings[0].description}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Takeaway */}
      {summary.key_takeaway && (
        <div className="p-2.5 rounded bg-[#EDF1EF] dark:bg-[#202824] text-xs text-[#17211D] dark:text-[#EDF2EE] border-l-2 border-[#176B58] dark:border-[#65B89D] italic font-serif">
          &ldquo;{summary.key_takeaway}&rdquo;
        </div>
      )}
    </div>
  );
};

