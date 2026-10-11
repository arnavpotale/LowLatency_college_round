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
      <div className="rounded-xl border border-zinc-800/80 bg-gradient-to-b from-[#141720] to-[#101218] p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 uppercase tracking-wider font-semibold">
                Autonomous Verification Platform
              </span>
              <span className="text-xs text-zinc-400">• Evidence Grounding</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Audit the Reliability of AI-Generated Claims
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload reference documents, decompose complex answers into discrete verifiable assertions,
              retrieve authoritative evidence passages, and inspect mathematical, clinical, or factual contradictions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/audits/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-md transition active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Audit</span>
            </button>
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Explore Demo Case</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/audits/new')}
          className="p-4 rounded-xl border border-zinc-800/80 bg-[#12141a] hover:bg-[#161822] hover:border-zinc-700 transition cursor-pointer group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Plus className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-zinc-200 group-hover:text-emerald-300 transition flex items-center justify-between">
            <span>New Investigation</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Guided 4-step wizard to upload reference material and test AI answers.
          </p>
        </div>

        <div
          onClick={onLoadDemo}
          className="p-4 rounded-xl border border-zinc-800/80 bg-[#12141a] hover:bg-[#161822] hover:border-zinc-700 transition cursor-pointer group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-zinc-200 group-hover:text-amber-300 transition flex items-center justify-between">
            <span>Pre-Verified Sample</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Metaproterenol clinical protocol with dosage inflation and contraindications.
          </p>
        </div>

        <div
          onClick={() => navigate('/adversarial-lab')}
          className="p-4 rounded-xl border border-zinc-800/80 bg-[#12141a] hover:bg-[#161822] hover:border-zinc-700 transition cursor-pointer group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-zinc-200 group-hover:text-purple-300 transition flex items-center justify-between">
            <span>Adversarial Lab</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Stress-test verifier against negation, numerical drift, and entity shifts.
          </p>
        </div>

        <div
          onClick={() => navigate('/sources')}
          className="p-4 rounded-xl border border-zinc-800/80 bg-[#12141a] hover:bg-[#161822] hover:border-zinc-700 transition cursor-pointer group space-y-2"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Files className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-zinc-200 group-hover:text-blue-300 transition flex items-center justify-between">
            <span>Sources Library</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Review uploaded PDF, DOCX, TXT documents and line-numbered text passages.
          </p>
        </div>
      </div>

      {/* Recent Audits Table Section */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>Investigation Audit History</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Live audit sessions stored in your persistent local SQLite database.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
        </div>

        {/* Audits Table */}
        {isLoading ? (
          <div className="py-12 text-center text-zinc-400 text-xs space-y-2 font-mono">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-zinc-600 border-t-emerald-500 rounded-full" />
            <div>Loading saved audit sessions...</div>
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-zinc-300">No Audits Found</div>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Start a new audit to investigate your reference documents, or load the pre-verified clinical demo sample.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate('/audits/new')}
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-medium text-xs transition"
              >
                Create First Audit
              </button>
              <button
                onClick={onLoadDemo}
                className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition"
              >
                Load Clinical Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60 text-[11px] font-mono text-zinc-400 uppercase">
                  <th className="py-2.5 px-3">Audit Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Claims</th>
                  <th className="py-2.5 px-3">Sources</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
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
                      className="hover:bg-zinc-800/40 cursor-pointer transition group"
                    >
                      <td className="py-3 px-3 font-medium text-zinc-200">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[280px]" title={a.title}>
                            {a.title || 'Untitled Audit'}
                          </span>
                          {a.is_mock && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            isCompleted
                              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                              : a.status === 'failed'
                              ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Clock className="w-3 h-3 text-zinc-400" />
                          )}
                          <span>{a.status.toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono">
                        {claimCount} {claimCount === 1 ? 'claim' : 'claims'}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono">
                        {sourceCount} {sourceCount === 1 ? 'file' : 'files'}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300 transition">
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
