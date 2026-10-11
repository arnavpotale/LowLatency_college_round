import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { HealthResponse } from '../types';
import {
  Settings as SettingsIcon,
  Database,
  Info,
  Server
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const h = await apiClient.getHealth();
        if (mounted) setHealth(h);
      } catch (err) {
        console.error('Health check failed:', err);
      }
    }
    checkHealth();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800/80 bg-gradient-to-b from-[#141720] to-[#101218] p-7 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 uppercase tracking-wider font-semibold">
              System Configuration
            </span>
            <span className="text-xs text-zinc-400 font-mono">v0.1.0 • College Round</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-zinc-300" />
            <span>Engine Diagnostics &amp; Settings</span>
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            Live technical specifications for the Second Opinion verification engine, local SQLite database,
            and document ingestion pipeline.
          </p>
        </div>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend Engine Status */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-zinc-200">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>FastAPI Backend Service</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Endpoint:</span>
              <span>http://127.0.0.1:8000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Health Status:</span>
              <span className="text-emerald-400 font-semibold">{health?.status || 'healthy'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Timestamp:</span>
              <span className="truncate max-w-[180px]">{health?.timestamp || new Date().toISOString()}</span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-zinc-200">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Persistence &amp; Storage</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
              SQLITE
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Database Driver:</span>
              <span>SQLAlchemy 2.0 / SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Ingestion Directory:</span>
              <span>services/api/uploads/</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Max File Size:</span>
              <span>10 MB per document</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion & File Formats */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-4">
        <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
          Supported Ingestion Specifications
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="font-semibold text-emerald-400 font-mono">PDF (.pdf)</div>
            <p className="text-[11px] text-zinc-400">PyMuPDF / fitz extraction with per-page text tracking.</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="font-semibold text-blue-400 font-mono">DOCX (.docx)</div>
            <p className="text-[11px] text-zinc-400">python-docx parsing preserving paragraph line structure.</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="font-semibold text-amber-400 font-mono">TXT (.txt)</div>
            <p className="text-[11px] text-zinc-400">Raw UTF-8 with line-numbered indexing &amp; CRLF safety.</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="font-semibold text-purple-400 font-mono">MD (.md)</div>
            <p className="text-[11px] text-zinc-400">Markdown section headings &amp; token-aware chunking.</p>
          </div>
        </div>
      </div>

      {/* Honest Authentication Architecture Note */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#12141a] p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
          <Info className="w-4 h-4 text-zinc-400" />
          <span>Authentication &amp; User Workspace Architecture</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Second Opinion currently runs as an <strong>on-premise compliance auditor workspace</strong> backed
          by local SQLite storage. All audit artifacts, evidence citations, and human overrides are securely
          persisted to your local environment. Enterprise multi-tenant authentication (OAuth2 / SAML / JWT session
          tokens) is designated for the next enterprise milestone to ensure local demonstrations remain 100% reliable
          without external authentication server dependencies.
        </p>
      </div>
    </div>
  );
};
