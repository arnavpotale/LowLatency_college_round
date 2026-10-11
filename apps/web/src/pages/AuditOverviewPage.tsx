import React from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse, Claim } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import {
  PlayCircle,
  Download,
  ShieldAlert,
  ArrowRight,
  Layers,
  UserCheck
} from 'lucide-react';

interface AuditOverviewPageProps {
  audit: AuditResponse;
  onSelectClaim: (claimId: string) => void;
  onOpenReportModal: () => void;
}

export const AuditOverviewPage: React.FC<AuditOverviewPageProps> = ({
  audit,
  onSelectClaim,
  onOpenReportModal
}) => {
  const { navigate } = useRouter();

  const claims = audit.claims || [];
  const sources = audit.sources || [];
  const verdicts = audit.verdicts || {};

  const supportedCount = verdicts.supported ?? claims.filter((c) => c.verdict === 'supported').length;
  const contradictedCount = verdicts.contradicted ?? claims.filter((c) => c.verdict === 'contradicted').length;
  const unsupportedCount = verdicts.unsupported ?? claims.filter((c) => c.verdict === 'unsupported').length;
  const ambiguousCount = (verdicts.ambiguous ?? 0) + (verdicts.inconclusive ?? 0);

  const decisiveCount = audit.summary?.decisive_claims ?? (supportedCount + contradictedCount + unsupportedCount);
  const trustScore = audit.summary?.trust_score;
  const riskLevel = audit.summary?.risk_level ?? (contradictedCount > 0 ? 'high' : 'medium');

  const handleRowClick = (claim: Claim) => {
    onSelectClaim(claim.claim_id);
    navigate(`/audits/${audit.audit_id}/investigate`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-7 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5EE] dark:bg-[#176B58]/25 border border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D] uppercase tracking-wider font-semibold">
                Analysis Complete
              </span>
              {audit.is_mock && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEF6E9] dark:bg-[#B45309]/25 border border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48] font-semibold">
                  Demo Sample Fixture
                </span>
              )}
              <span className="text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">
                {claims.length} claims · {sources.length} {sources.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#17211D] dark:text-[#EDF2EE]">
              {audit.title || 'Audit Results Overview'}
            </h1>
            {audit.notes && (
              <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] max-w-2xl">{audit.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#202824] hover:bg-[#EDF1EF] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB]" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => navigate(`/audits/${audit.audit_id}/investigate`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] font-semibold text-xs shadow-xs transition"
            >
              <PlayCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Investigate Claims Workspace</span>
            </button>
          </div>
        </div>

        {/* Executive Takeaway */}
        {audit.summary?.key_takeaway && (
          <div className="p-3.5 rounded-lg bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#17211D] dark:text-[#EDF2EE] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#965B0A] dark:text-[#E5AC48] flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-[#17211D] dark:text-[#EDF2EE]">Executive Takeaway: </strong>
              <span className="text-[#58645F] dark:text-[#A7B2AB]">{audit.summary.key_takeaway}</span>
            </div>
          </div>
        )}
      </div>

      {/* Verdict Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Supported */}
        <div className="p-4 rounded-xl border border-[#B7E1CA] dark:border-[#2C5E4E] bg-[#E8F5EE] dark:bg-[#176B58]/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#0E6245] dark:text-[#65B89D] font-semibold">
            Supported
          </div>
          <div className="text-2xl font-bold text-[#0E6245] dark:text-[#65B89D]">{supportedCount}</div>
          <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB]">Corroborated by source</div>
        </div>

        {/* Contradicted */}
        <div className="p-4 rounded-xl border border-[#F7C5C5] dark:border-[#6B2323] bg-[#FDF0F0] dark:bg-[#B91C1C]/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9E2222] dark:text-[#F17575] font-semibold">
            Contradicted
          </div>
          <div className="text-2xl font-bold text-[#9E2222] dark:text-[#F17575]">{contradictedCount}</div>
          <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB]">Direct factual conflicts</div>
        </div>

        {/* Unsupported */}
        <div className="p-4 rounded-xl border border-[#F8DCAB] dark:border-[#633910] bg-[#FEF6E9] dark:bg-[#B45309]/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#965B0A] dark:text-[#E5AC48] font-semibold">
            Unsupported
          </div>
          <div className="text-2xl font-bold text-[#965B0A] dark:text-[#E5AC48]">{unsupportedCount}</div>
          <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB]">Unverified / ungrounded</div>
        </div>

        {/* Ambiguous / Inconclusive */}
        <div className="p-4 rounded-xl border border-[#D5C6F5] dark:border-[#4E2582] bg-[#F4F0FC] dark:bg-[#6D28D9]/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#5B32A8] dark:text-[#B48DEF] font-semibold">
            Ambiguous
          </div>
          <div className="text-2xl font-bold text-[#5B32A8] dark:text-[#B48DEF]">{ambiguousCount}</div>
          <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB]">Partial or conflicting</div>
        </div>

        {/* Trust Score */}
        <div
          className="p-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] space-y-1 col-span-2 md:col-span-1 shadow-xs cursor-help"
          title="Trust Score Formula: Supported ÷ (Supported + Contradicted + Unsupported) × 100. Ambiguous and inconclusive assertions are excluded from coverage denominator."
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] font-semibold">
            <span>Trust Score</span>
            <span className="text-[9px] font-normal lowercase tracking-normal text-[#58645F] dark:text-[#A7B2AB]">
              {decisiveCount} decisive
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#17211D] dark:text-[#EDF2EE]">
              {trustScore !== null && trustScore !== undefined ? `${Math.round(trustScore)}%` : 'N/A'}
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                riskLevel === 'high'
                  ? 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]'
                  : 'bg-[#E8F5EE] dark:bg-[#176B58]/25 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]'
              }`}
            >
              {riskLevel} Risk
            </span>
          </div>
          <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB]">
            {decisiveCount > 0
              ? `${supportedCount} of ${decisiveCount} assertions corroborated`
              : 'No decisive assertions'}
          </div>
        </div>
      </div>

      {/* Claim Register Table */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE3DF] dark:border-[#343E38]">
          <div>
            <h2 className="text-sm font-semibold text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#176B58] dark:text-[#65B89D]" />
              <span>Claim Register ({claims.length} Assertions)</span>
            </h2>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">
              Click any claim to open its detailed investigation workspace with exact text highlighting and source citations.
            </p>
          </div>
          <button
            onClick={() => navigate(`/audits/${audit.audit_id}/investigate`)}
            className="flex items-center gap-1.5 text-xs text-[#176B58] dark:text-[#65B89D] hover:underline font-medium transition"
          >
            <span>Open Split Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE3DF] dark:border-[#343E38] text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB] uppercase bg-[#EDF1EF] dark:bg-[#202824]">
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3">Decomposed Assertion</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Evidence</th>
                <th className="py-2.5 px-3">Forensic Flag</th>
                <th className="py-2.5 px-3">Review</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE3DF] dark:divide-[#343E38]">
              {claims.map((cl, idx) => {
                const evCount = cl.evidence_ids?.length || 0;
                const autopsyIssue = cl.autopsy?.issue_type;
                const humanReview = cl.human_review;

                return (
                  <tr
                    key={cl.claim_id}
                    onClick={() => handleRowClick(cl)}
                    className="hover:bg-[#EAEFEA] dark:hover:bg-[#202824] cursor-pointer transition group"
                  >
                    <td className="py-3 px-3 font-mono text-[#58645F] dark:text-[#A7B2AB]">
                      [{String(idx + 1).padStart(2, '0')}]
                    </td>
                    <td className="py-3 px-3 font-medium text-[#17211D] dark:text-[#EDF2EE] max-w-md">
                      <div className="line-clamp-2 leading-relaxed">
                        {cl.claim_text}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <VerdictBadge verdict={cl.verdict} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {evCount > 0 ? (
                        <span className="text-[#58645F] dark:text-[#A7B2AB]">{evCount} passages</span>
                      ) : (
                        <span className="text-[#965B0A] dark:text-[#E5AC48]">0 (ungrounded)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {autopsyIssue ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#17211D] dark:text-[#EDF2EE]">
                          {autopsyIssue.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-[#7E8C86] dark:text-[#738078]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {humanReview ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E8F5EE] dark:bg-[#176B58]/25 border border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]">
                          <UserCheck className="w-3 h-3 text-[#0E6245] dark:text-[#65B89D]" />
                          <span>Audited</span>
                        </span>
                      ) : (
                        <span className="text-[#7E8C86] dark:text-[#738078] text-[10px] font-mono">Machine</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#176B58] dark:text-[#65B89D] group-hover:underline transition">
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

