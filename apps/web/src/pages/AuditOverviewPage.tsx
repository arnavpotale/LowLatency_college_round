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

  const trustScore = audit.summary?.trust_score ?? 0;
  const riskLevel = audit.summary?.risk_level ?? (contradictedCount > 0 ? 'high' : 'medium');

  const handleRowClick = (claim: Claim) => {
    onSelectClaim(claim.claim_id);
    navigate(`/audits/${audit.audit_id}/investigate`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800/80 bg-gradient-to-b from-[#141720] to-[#101218] p-7 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 uppercase tracking-wider font-semibold">
                Analysis Complete
              </span>
              {audit.is_mock && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-semibold">
                  Demo Sample Fixture
                </span>
              )}
              <span className="text-xs text-zinc-400 font-mono">
                {claims.length} claims · {sources.length} {sources.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {audit.title || 'Audit Results Overview'}
            </h1>
            {audit.notes && (
              <p className="text-xs text-zinc-400 max-w-2xl">{audit.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-700/80 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => navigate(`/audits/${audit.audit_id}/investigate`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-md transition"
            >
              <PlayCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Investigate Claims Workspace</span>
            </button>
          </div>
        </div>

        {/* Executive Takeaway */}
        {audit.summary?.key_takeaway && (
          <div className="p-3 rounded-lg bg-[#0f1117] border border-zinc-800/80 text-xs text-zinc-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-zinc-200">Executive Takeaway: </strong>
              {audit.summary.key_takeaway}
            </div>
          </div>
        )}
      </div>

      {/* Verdict Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Supported */}
        <div className="p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            Supported
          </div>
          <div className="text-2xl font-bold text-emerald-300">{supportedCount}</div>
          <div className="text-[10px] text-emerald-500/80">Corroborated by source</div>
        </div>

        {/* Contradicted */}
        <div className="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400">
            Contradicted
          </div>
          <div className="text-2xl font-bold text-rose-300">{contradictedCount}</div>
          <div className="text-[10px] text-rose-500/80">Direct factual conflicts</div>
        </div>

        {/* Unsupported */}
        <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
            Unsupported
          </div>
          <div className="text-2xl font-bold text-amber-300">{unsupportedCount}</div>
          <div className="text-[10px] text-amber-500/80">Unverified / ungrounded</div>
        </div>

        {/* Ambiguous / Inconclusive */}
        <div className="p-4 rounded-xl border border-purple-900/50 bg-purple-950/20 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400">
            Ambiguous
          </div>
          <div className="text-2xl font-bold text-purple-300">{ambiguousCount}</div>
          <div className="text-[10px] text-purple-500/80">Partial or conflicting</div>
        </div>

        {/* Trust Score */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#12141a] space-y-1 col-span-2 md:col-span-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Trust Score
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-100">
              {Math.round(trustScore * 100)}%
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                riskLevel === 'high'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              }`}
            >
              {riskLevel} Risk
            </span>
          </div>
          <div className="text-[10px] text-zinc-400">Deterministic balance</div>
        </div>
      </div>

      {/* Claim Register Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>Claim Register ({claims.length} Assertions)</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Click any claim to open its detailed investigation workspace with exact text highlighting and source citations.
            </p>
          </div>
          <button
            onClick={() => navigate(`/audits/${audit.audit_id}/investigate`)}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
          >
            <span>Open Split Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/60 text-[11px] font-mono text-zinc-400 uppercase">
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3">Decomposed Assertion</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Evidence</th>
                <th className="py-2.5 px-3">Forensic Flag</th>
                <th className="py-2.5 px-3">Review</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {claims.map((cl, idx) => {
                const evCount = cl.evidence_ids?.length || 0;
                const autopsyIssue = cl.autopsy?.issue_type;
                const humanReview = cl.human_review;

                return (
                  <tr
                    key={cl.claim_id}
                    onClick={() => handleRowClick(cl)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3 px-3 font-mono text-zinc-400">
                      [{String(idx + 1).padStart(2, '0')}]
                    </td>
                    <td className="py-3 px-3 font-medium text-zinc-200 max-w-md">
                      <div className="line-clamp-2 leading-relaxed">
                        {cl.claim_text}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <VerdictBadge verdict={cl.verdict} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-400">
                      {evCount > 0 ? (
                        <span className="text-zinc-300">{evCount} passages</span>
                      ) : (
                        <span className="text-amber-400">0 (ungrounded)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {autopsyIssue ? (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {autopsyIssue.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {humanReview ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Audited</span>
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[10px] font-mono">Machine</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300 transition">
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
