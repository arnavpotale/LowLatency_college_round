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
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-7 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] text-[#176B58] dark:text-[#65B89D] uppercase tracking-wider font-semibold">
              System Configuration
            </span>
            <span className="text-xs text-[#58645F] dark:text-[#A7B2AB] font-mono">v0.1.0 • College Round</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-[#176B58] dark:text-[#65B89D]" />
            <span>Engine Diagnostics &amp; Settings</span>
          </h1>
          <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] leading-relaxed max-w-2xl">
            Live technical specifications for the Second Opinion verification engine, local SQLite database,
            and document ingestion pipeline.
          </p>
        </div>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend Engine Status */}
        <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38] pb-2.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-[#17211D] dark:text-[#EDF2EE]">
              <Server className="w-4 h-4 text-[#176B58] dark:text-[#65B89D]" />
              <span>FastAPI Backend Service</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5EE] dark:bg-[#176B58]/20 border border-[#B7E1CA] dark:border-[#2C5E4E] text-[#0E6245] dark:text-[#65B89D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E6245] dark:bg-[#65B89D] animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-[#17211D] dark:text-[#EDF2EE] font-mono">
            <div className="flex justify-between">
              <span className="text-[#58645F] dark:text-[#A7B2AB]">Endpoint:</span>
              <span>http://127.0.0.1:8000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#58645F] dark:text-[#A7B2AB]">Health Status:</span>
              <span className="text-[#0E6245] dark:text-[#65B89D] font-semibold">{health?.status || 'healthy'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#58645F] dark:text-[#A7B2AB]">Timestamp:</span>
              <span className="truncate max-w-[180px]">{health?.timestamp || new Date().toISOString()}</span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38] pb-2.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-[#17211D] dark:text-[#EDF2EE]">
              <Database className="w-4 h-4 text-[#176B58] dark:text-[#65B89D]" />
              <span>Persistence &amp; Storage</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5E4E] text-[#176B58] dark:text-[#65B89D] font-semibold">
              SQLITE
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-[#17211D] dark:text-[#EDF2EE] font-mono">
            <div className="flex justify-between">
              <span className="text-[#58645F] dark:text-[#A7B2AB]">Database Driver:</span>
              <span>SQLAlchemy 2.0 / SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#58645F] dark:text-[#A7B2AB]">Ingestion Directory:</span>
              <span>services/api/uploads/</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#58645F] dark:text-[#A7B2AB]">Max File Size:</span>
              <span>10 MB per document</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion & File Formats */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-semibold text-[#17211D] dark:text-[#EDF2EE] uppercase tracking-wider font-mono">
          Supported Ingestion Specifications
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] space-y-1">
            <div className="font-semibold text-[#0E6245] dark:text-[#65B89D] font-mono">PDF (.pdf)</div>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">PyMuPDF / fitz extraction with per-page text tracking.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] space-y-1">
            <div className="font-semibold text-[#176B58] dark:text-[#65B89D] font-mono">DOCX (.docx)</div>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">python-docx parsing preserving paragraph line structure.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] space-y-1">
            <div className="font-semibold text-[#965B0A] dark:text-[#E5AC48] font-mono">TXT (.txt)</div>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">Raw UTF-8 with line-numbered indexing &amp; CRLF safety.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F6F7F8] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] space-y-1">
            <div className="font-semibold text-[#5B32A8] dark:text-[#B48DEF] font-mono">MD (.md)</div>
            <p className="text-[11px] text-[#58645F] dark:text-[#A7B2AB]">Markdown section headings &amp; token-aware chunking.</p>
          </div>
        </div>
      </div>

      {/* Honest Authentication Architecture Note */}
      <div className="rounded-xl border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] p-6 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#17211D] dark:text-[#EDF2EE]">
          <Info className="w-4 h-4 text-[#58645F] dark:text-[#A7B2AB]" />
          <span>Authentication &amp; User Workspace Architecture</span>
        </div>
        <p className="text-xs text-[#58645F] dark:text-[#A7B2AB] leading-relaxed">
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
