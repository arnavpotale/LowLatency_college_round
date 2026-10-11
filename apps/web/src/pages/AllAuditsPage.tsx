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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE3DF] dark:border-[#343E38]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB] uppercase tracking-wider font-semibold">
              Repository
            </span>
            <span className="text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">
              {audits.length} total sessions
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-[#176B58] dark:text-[#65B89D]" />
            <span>All Audit Sessions</span>
          </h1>
          <p className="text-xs text-[#58645F] dark:text-[#A7B2AB]">
            Browse and inspect all saved claim-verification investigations in your local SQLite store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/audits/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] font-semibold text-xs shadow-xs transition"
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
                  ? 'bg-[#EDF1EF] dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] border border-[#DCE3DF] dark:border-[#343E38] shadow-xs font-semibold'
                  : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B] border border-transparent'
              }`}
            >
              {filter === 'all' ? 'All Sessions' : filter.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#7E8C86] dark:text-[#738078] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 pl-8 pr-3 py-1.5 rounded-md bg-white dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-xs text-[#17211D] dark:text-[#EDF2EE] placeholder-[#7E8C86] dark:placeholder-[#738078] focus:outline-none focus:border-[#176B58] dark:focus:border-[#65B89D]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">
            Loading audit archive...
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#58645F] dark:text-[#A7B2AB] space-y-3">
            <FileText className="w-8 h-8 mx-auto text-[#7E8C86] dark:text-[#738078]" />
            <div>No matching audits found.</div>
            <button
              onClick={() => navigate('/audits/new')}
              className="px-3 py-1.5 rounded-md bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] font-medium text-xs transition inline-block shadow-xs"
            >
              Create New Audit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCE3DF] dark:border-[#343E38] text-[11px] font-mono text-[#58645F] dark:text-[#A7B2AB] uppercase bg-[#EDF1EF] dark:bg-[#202824]">
                  <th className="py-3 px-4">Audit Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Claims</th>
                  <th className="py-3 px-4">Sources</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                        year: 'numeric'
                      })
                    : 'Recent';

                  return (
                    <tr
                      key={a.audit_id}
                      onClick={() => handleOpenAudit(a)}
                      className="hover:bg-[#EAEFEA] dark:hover:bg-[#202824] cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 font-medium text-[#17211D] dark:text-[#EDF2EE]">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-sm" title={a.title}>
                            {a.title || 'Untitled Audit'}
                          </span>
                          {a.is_mock && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#FEF6E9] dark:bg-[#B45309]/25 border border-[#F8DCAB] dark:border-[#633910] text-[#965B0A] dark:text-[#E5AC48]">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                            isCompleted
                              ? 'bg-[#E8F5EE] dark:bg-[#176B58]/25 border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]'
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
                      <td className="py-3.5 px-4 text-[#58645F] dark:text-[#A7B2AB] font-mono">
                        {claimCount} claims
                      </td>
                      <td className="py-3.5 px-4 text-[#58645F] dark:text-[#A7B2AB] font-mono">
                        {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                      </td>
                      <td className="py-3.5 px-4 text-[#58645F] dark:text-[#A7B2AB] font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#176B58] dark:text-[#65B89D] group-hover:underline transition">
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
