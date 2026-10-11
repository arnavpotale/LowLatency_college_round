import React, { useEffect, useState } from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse } from '../types';
import { apiClient } from '../services/api';
import {
  FolderGit2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText
} from 'lucide-react';

interface AllAuditsPageProps {
  onSelectAudit: (audit: AuditResponse) => void;
  onLoadDemo?: () => void;
}

export const AllAuditsPage: React.FC<AllAuditsPageProps> = ({
  onSelectAudit
}) => {
  const { navigate } = useRouter();
  const [audits, setAudits] = useState<AuditResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'created'>('all');

  useEffect(() => {
    let mounted = true;
    async function fetchAudits() {
      setIsLoading(true);
      try {
        const list = await apiClient.listAudits();
        if (mounted) setAudits(list);
      } catch (err) {
        console.error('Failed to load audits:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchAudits();
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

  const filteredAudits = audits.filter((a) => {
    const matchesSearch = (a.title || 'Untitled Audit').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 uppercase tracking-wider font-semibold">
              Repository
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {audits.length} total sessions
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-zinc-300" />
            <span>All Audit Sessions</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Browse and inspect all saved claim-verification investigations in your local SQLite store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/audits/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Audit</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['all', 'completed', 'created'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                statusFilter === filter
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              {filter === 'all' ? 'All Sessions' : filter.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 pl-8 pr-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-400 font-mono">
            Loading audit archive...
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400 space-y-3">
            <FileText className="w-8 h-8 mx-auto text-zinc-400" />
            <div>No matching audits found.</div>
            <button
              onClick={() => navigate('/audits/new')}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-medium text-xs transition inline-block"
            >
              Create New Audit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60 text-[11px] font-mono text-zinc-400 uppercase bg-zinc-900/50">
                  <th className="py-3 px-4">Audit Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Claims</th>
                  <th className="py-3 px-4">Sources</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                        year: 'numeric'
                      })
                    : 'Recent';

                  return (
                    <tr
                      key={a.audit_id}
                      onClick={() => handleOpenAudit(a)}
                      className="hover:bg-zinc-800/40 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 font-medium text-zinc-200">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-sm" title={a.title}>
                            {a.title || 'Untitled Audit'}
                          </span>
                          {a.is_mock && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950/60 border border-amber-800 text-amber-300">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            isCompleted
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
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
                      <td className="py-3.5 px-4 text-zinc-400 font-mono">
                        {claimCount} claims
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono">
                        {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300 transition">
                          <span>Open</span>
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
