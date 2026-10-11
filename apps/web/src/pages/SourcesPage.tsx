import React, { useEffect, useState } from 'react';
import { AuditResponse, Source } from '../types';
import { apiClient } from '../services/api';
import {
  Files,
  FileText,
  Search
} from 'lucide-react';

interface SourcesPageProps {
  activeAudit: AuditResponse | null;
  onSelectAudit?: (audit: AuditResponse) => void;
}

export const SourcesPage: React.FC<SourcesPageProps> = ({ activeAudit }) => {
  const [sourcesList, setSourcesList] = useState<{ source: Source; auditTitle: string; auditId: string }[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function loadAllSources() {
      setIsLoading(true);
      try {
        const audits = await apiClient.listAudits();
        const combined: { source: Source; auditTitle: string; auditId: string }[] = [];

        // Include sources from backend audits
        audits.forEach((a) => {
          (a.sources || []).forEach((s) => {
            combined.push({ source: s, auditTitle: a.title || 'Untitled Audit', auditId: a.audit_id });
          });
        });

        // Also ensure activeAudit sources are represented
        if (activeAudit && activeAudit.sources) {
          activeAudit.sources.forEach((s) => {
            if (!combined.some((item) => item.source.source_id === s.source_id)) {
              combined.push({ source: s, auditTitle: activeAudit.title || 'Untitled Audit', auditId: activeAudit.audit_id });
            }
          });
        }

        if (mounted) {
          setSourcesList(combined);
          if (combined.length > 0) setSelectedSource(combined[0].source);
        }
      } catch (err) {
        console.error('Failed to load sources library:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadAllSources();
    return () => {
      mounted = false;
    };
  }, [activeAudit]);

  const filteredSources = sourcesList.filter((item) =>
    item.source.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.auditTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-blue-900/40 bg-gradient-to-b from-[#121624] to-[#0f121d] p-7 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-300 uppercase tracking-wider font-semibold">
              Grounding Repository
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {sourcesList.length} total reference documents
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Files className="w-6 h-6 text-blue-400" />
            <span>Sources &amp; Reference Material Library</span>
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            Inspect ingested reference files across your audits. Documents are parsed with line-number
            traceability and chunked for hybrid BM25 and vector retrieval.
          </p>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sources List (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-800/80 bg-[#12141a] p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300">Attached Documents</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 pl-8 pr-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-zinc-400 font-mono">Loading sources...</div>
          ) : filteredSources.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-zinc-400" />
              <div>No reference documents found.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSources.map((item) => {
                const isSelected = selectedSource?.source_id === item.source.source_id;
                const ext = item.source.file_type.toUpperCase();

                return (
                  <div
                    key={item.source.source_id}
                    onClick={() => setSelectedSource(item.source)}
                    className={`p-3 rounded-lg border cursor-pointer transition text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-800/80'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {ext}
                        </span>
                        <span className="font-semibold text-zinc-200 truncate">
                          {item.source.filename}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {item.source.char_count} chars
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                      <span>Audit:</span>
                      <span className="text-zinc-300 font-medium truncate">{item.auditTitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Source Content Preview (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-5">
          {selectedSource ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                      {selectedSource.file_type.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-100">{selectedSource.filename}</h3>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-3">
                    <span>ID: {selectedSource.source_id.slice(0, 8)}...</span>
                    <span>Length: {selectedSource.char_count} characters</span>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>PARSED CONTENT SNIPPET / EXTRACT</span>
                  <span className="text-emerald-400">✓ Ingestion Verified</span>
                </div>
                <div className="p-4 rounded-lg bg-[#0d0f14] border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {selectedSource.raw_content || selectedSource.content_snippet || 'No preview available.'}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-zinc-400">
              Select a source from the list to preview its extracted text.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
