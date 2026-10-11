import React, { useEffect, useState } from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse } from '../types';
import { apiClient } from '../services/api';
import {
  Plus,
  Sparkles,
  FlaskConical,
  Files,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  Search
} from 'lucide-react';

interface DashboardPageProps {
  onSelectAudit: (audit: AuditResponse) => void;
  onLoadDemo: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectAudit,
  onLoadDemo
}) => {
  const { navigate } = useRouter();
  const [audits, setAudits] = useState<AuditResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    async function loadAudits() {
      setIsLoading(true);
      try {
        const list = await apiClient.listAudits();
        if (mounted) {
          setAudits(list);
        }
      } catch (err) {
        console.error('Failed to load audits on dashboard:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadAudits();
    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenAudit = (audit: AuditResponse) => {
    onSelectAudit(audit);
    if (audit.status === 'completed') {
      navigate(`/audits/${audit.audit_id}/overview`);
    } else {
      navigate(`/audits/${audit.audit_id}/investigate`);
    }
  };

  const filteredAudits = audits.filter((a) =>
    (a.title || 'Untitled Audit').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome & Primary CTA Banner */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5245] text-[#176B58] dark:text-[#65B89D] uppercase tracking-wider font-semibold">
                Autonomous Verification Platform
              </span>
              <span className="text-xs text-[#58645F] dark:text-[#A7B2AB]">• Evidence Grounding</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#17211D] dark:text-[#EDF2EE]">
              Audit the Reliability of AI-Generated Claims
            </h1>
            <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] leading-relaxed">
              Upload reference documents, decompose complex answers into discrete verifiable assertions,
              retrieve authoritative evidence passages, and inspect mathematical, clinical, or factual contradictions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/audits/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] font-semibold text-xs shadow-xs transition active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Audit</span>
            </button>
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#202824] hover:bg-[#EDF1EF] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] font-medium text-xs transition shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#965B0A] dark:text-[#E5AC48]" />
              <span>Explore Demo Case</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/audits/new')}
          className="p-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] hover:border-[#BCD8CD] dark:hover:border-[#445149] transition cursor-pointer group space-y-2 shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5245] flex items-center justify-center text-[#176B58] dark:text-[#65B89D]">
            <Plus className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#17211D] dark:text-[#EDF2EE] group-hover:text-[#176B58] dark:group-hover:text-[#65B89D] transition flex items-center justify-between">
            <span>New Investigation</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] leading-normal">
            Guided 4-step wizard to upload reference material and test AI answers.
          </p>
        </div>

        <div
          onClick={onLoadDemo}
          className="p-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] hover:border-[#BCD8CD] dark:hover:border-[#445149] transition cursor-pointer group space-y-2 shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] flex items-center justify-center text-[#965B0A] dark:text-[#E5AC48]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#17211D] dark:text-[#EDF2EE] group-hover:text-[#965B0A] dark:group-hover:text-[#E5AC48] transition flex items-center justify-between">
            <span>Pre-Verified Sample</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] leading-normal">
            Metaproterenol clinical protocol with dosage inflation and contraindications.
          </p>
        </div>

        <div
          onClick={() => navigate('/adversarial-lab')}
          className="p-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] hover:border-[#BCD8CD] dark:hover:border-[#445149] transition cursor-pointer group space-y-2 shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F4F0FC] dark:bg-[#6D28D9]/20 border border-[#D5C6F5] dark:border-[#4E2582] flex items-center justify-center text-[#5B32A8] dark:text-[#B48DEF]">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#17211D] dark:text-[#EDF2EE] group-hover:text-[#5B32A8] dark:group-hover:text-[#B48DEF] transition flex items-center justify-between">
            <span>Adversarial Lab</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] leading-normal">
            Stress-test verifier against negation, numerical drift, and entity shifts.
          </p>
        </div>

        <div
          onClick={() => navigate('/sources')}
          className="p-4 rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] hover:bg-[#EAEFEA] dark:hover:bg-[#202824] hover:border-[#BCD8CD] dark:hover:border-[#445149] transition cursor-pointer group space-y-2 shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5245] flex items-center justify-center text-[#176B58] dark:text-[#65B89D]">
            <Files className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#17211D] dark:text-[#EDF2EE] group-hover:text-[#176B58] dark:group-hover:text-[#65B89D] transition flex items-center justify-between">
            <span>Sources Library</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] leading-normal">
            Review uploaded PDF, DOCX, TXT documents and line-numbered text passages.
          </p>
        </div>
      </div>

      {/* Recent Audits Table Section */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE3DF] dark:border-[#343E38]">
          <div>
            <h2 className="text-sm font-semibold text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#176B58] dark:text-[#65B89D]" />
              <span>Investigation Audit History</span>
            </h2>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">
              Live audit sessions stored in your persistent local SQLite database.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7E8C86] dark:text-[#738078] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 rounded-md bg-white dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D]"
              />
            </div>
          </div>
        </div>

        {/* Audits Table */}
        {isLoading ? (
          <div className="py-12 text-center text-[#58645F] dark:text-[#A7B2AB] text-xs space-y-2 font-mono">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-[#DCE3DF] border-t-[#176B58] dark:border-[#343E38] dark:border-t-[#65B89D] rounded-full" />
            <div>Loading saved audit sessions...</div>
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] mx-auto flex items-center justify-center text-[#58645F] dark:text-[#A7B2AB]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#17211D] dark:text-[#EDF2EE]">No Audits Found</div>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB] max-w-sm mx-auto">
              Start a new audit to investigate your reference documents, or load the pre-verified clinical demo sample.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate('/audits/new')}
                className="px-3 py-1.5 rounded-md bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] font-medium text-xs transition shadow-xs"
              >
                Create First Audit
              </button>
              <button
                onClick={onLoadDemo}
                className="px-3 py-1.5 rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#202824] hover:bg-[#EDF1EF] dark:hover:bg-[#26302B] text-[#17211D] dark:text-[#EDF2EE] text-xs font-medium transition shadow-xs"
              >
                Load Clinical Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCE3DF] dark:border-[#343E38] text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB] uppercase bg-[#EDF1EF] dark:bg-[#202824]">
                  <th className="py-2.5 px-3">Audit Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Claims</th>
                  <th className="py-2.5 px-3">Sources</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3DF] dark:divide-[#343E38]">
                {filteredAudits.map((a) => {
                  const isCompleted = a.status === 'completed';
                  const claimCount = a.claims?.length || 0;
                  const sourceCount = a.sources?.length || 0;
                  const dateStr = a.created_at
                    ? new Date(a.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Recent';

                  return (
                    <tr
                      key={a.audit_id}
                      onClick={() => handleOpenAudit(a)}
                      className="hover:bg-[#EAEFEA] dark:hover:bg-[#202824] cursor-pointer transition group"
                    >
                      <td className="py-3 px-3 font-medium text-[#17211D] dark:text-[#EDF2EE]">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[280px]" title={a.title}>
                            {a.title || 'Untitled Audit'}
                          </span>
                          {a.is_mock && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#FEF6E9] dark:bg-[#B45309]/20 border border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48]">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            isCompleted
                              ? 'bg-[#E8F5EE] dark:bg-[#176B58]/25 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]'
                              : a.status === 'failed'
                              ? 'bg-[#FDF0F0] dark:bg-[#B91C1C]/25 border-[#F7C5C5] dark:border-[#6B2323] text-[#9E2222] dark:text-[#F17575]'
                              : 'bg-[#EDF1EF] dark:bg-[#202824] border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB]'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3 text-[#0E6245] dark:text-[#65B89D]" />
                          ) : (
                            <Clock className="w-3 h-3 text-[#58645F] dark:text-[#A7B2AB]" />
                          )}
                          <span>{a.status.toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#58645F] dark:text-[#A7B2AB] font-mono">
                        {claimCount} {claimCount === 1 ? 'claim' : 'claims'}
                      </td>
                      <td className="py-3 px-3 text-[#58645F] dark:text-[#A7B2AB] font-mono">
                        {sourceCount} {sourceCount === 1 ? 'file' : 'files'}
                      </td>
                      <td className="py-3 px-3 text-[#58645F] dark:text-[#A7B2AB] font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#176B58] dark:text-[#65B89D] group-hover:underline transition">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
