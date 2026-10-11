import React from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse } from '../types';
import {
  Shield,
  LayoutDashboard,
  FolderGit2,
  Files,
  FileCheck,
  FlaskConical,
  Settings as SettingsIcon,
  Plus,
  PlayCircle,
  Download,
  ChevronRight,
  User,
  Layers,
  Sparkles
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  activeAudit: AuditResponse | null;
  onSelectAudit?: (audit: AuditResponse) => void;
  onLoadDemo: () => void;
  onOpenReportModal?: () => void;
  isEngineOnline: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeAudit,
  onLoadDemo,
  onOpenReportModal,
  isEngineOnline
}) => {
  const { currentPath, navigate } = useRouter();

  const isNavActive = (path: string) => {
    if (path === '/dashboard' && (currentPath === '/' || currentPath === '/dashboard')) return true;
    return currentPath.startsWith(path);
  };

  // Generate breadcrumb items
  const getBreadcrumbs = () => {
    if (currentPath === '/' || currentPath === '/dashboard') {
      return [{ label: 'Workspace', path: '/dashboard' }, { label: 'Overview' }];
    }
    if (currentPath === '/audits/new') {
      return [{ label: 'Audits', path: '/audits' }, { label: 'New Audit Wizard' }];
    }
    if (currentPath === '/audits') {
      return [{ label: 'Workspace', path: '/dashboard' }, { label: 'All Audits' }];
    }
    if (currentPath.startsWith('/audits/')) {
      const title = activeAudit?.title || 'Audit Session';
      if (currentPath.includes('/overview')) {
        return [{ label: 'Audits', path: '/audits' }, { label: title, path: `/audits/${activeAudit?.audit_id}/overview` }, { label: 'Overview' }];
      }
      if (currentPath.includes('/investigate')) {
        return [{ label: 'Audits', path: '/audits' }, { label: title, path: `/audits/${activeAudit?.audit_id}/overview` }, { label: 'Investigation Workspace' }];
      }
      if (currentPath.includes('/processing')) {
        return [{ label: 'Audits', path: '/audits' }, { label: title }, { label: 'Verification In-Progress' }];
      }
      return [{ label: 'Audits', path: '/audits' }, { label: title }];
    }
    if (currentPath.startsWith('/adversarial-lab')) {
      return [{ label: 'Investigate', path: '/adversarial-lab' }, { label: 'Adversarial Stress Lab' }];
    }
    if (currentPath.startsWith('/sources')) {
      return [{ label: 'Workspace', path: '/dashboard' }, { label: 'Sources & Reference Library' }];
    }
    if (currentPath.startsWith('/reports')) {
      return [{ label: 'Workspace', path: '/dashboard' }, { label: 'Audit Reports' }];
    }
    if (currentPath.startsWith('/settings')) {
      return [{ label: 'System', path: '/settings' }, { label: 'Engine Diagnostics & Settings' }];
    }
    return [{ label: 'Workspace', path: '/dashboard' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen w-screen bg-[#0d0f14] text-zinc-100 overflow-hidden font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-zinc-800/80 bg-[#101218] select-none">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/80">
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
                SECOND OPINION
              </div>
              <div className="text-[10px] text-zinc-400 font-mono tracking-wide">
                EVIDENCE AUDITOR
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            v0.1
          </span>
        </div>

        {/* Action Button: New Audit */}
        <div className="p-3 border-b border-zinc-800/60">
          <button
            onClick={() => navigate('/audits/new')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-medium text-xs shadow-sm transition active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create New Audit</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {/* Active Audit Context (if loaded) */}
          {activeAudit && (
            <div className="px-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-zinc-400" />
                <span>Active Investigation</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs space-y-2">
                <div className="font-medium text-zinc-200 line-clamp-1" title={activeAudit.title}>
                  {activeAudit.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>{activeAudit.claims?.length || 0} claims</span>
                  <span>{activeAudit.sources?.length || 0} sources</span>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={() => navigate(`/audits/${activeAudit.audit_id}/overview`)}
                    className={`flex-1 px-2 py-1 rounded text-[11px] font-medium border text-center transition ${
                      currentPath.includes('/overview')
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => navigate(`/audits/${activeAudit.audit_id}/investigate`)}
                    className={`flex-1 px-2 py-1 rounded text-[11px] font-medium border text-center transition ${
                      currentPath.includes('/investigate')
                        ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section: WORKSPACE */}
          <div className="space-y-0.5">
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Workspace
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/dashboard')
                  ? 'bg-zinc-800/90 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-zinc-400" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/audits')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                currentPath === '/audits'
                  ? 'bg-zinc-800/90 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <FolderGit2 className="w-4 h-4 text-zinc-400" />
              <span>All Audits</span>
            </button>
            <button
              onClick={() => navigate('/sources')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/sources')
                  ? 'bg-zinc-800/90 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Files className="w-4 h-4 text-zinc-400" />
              <span>Sources Library</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/reports')
                  ? 'bg-zinc-800/90 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <FileCheck className="w-4 h-4 text-zinc-400" />
              <span>Audit Reports</span>
            </button>
          </div>

          {/* Section: INVESTIGATE */}
          <div className="space-y-0.5">
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Investigate
            </div>
            <button
              onClick={() => navigate('/adversarial-lab')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/adversarial-lab')
                  ? 'bg-purple-950/60 border border-purple-800/60 text-purple-200 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                <span>Adversarial Lab</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/50 border border-purple-700/60 text-purple-300">
                8 tests
              </span>
            </button>
          </div>

          {/* Section: SYSTEM */}
          <div className="space-y-0.5">
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              System
            </div>
            <button
              onClick={() => navigate('/settings')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/settings')
                  ? 'bg-zinc-800/90 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <SettingsIcon className="w-4 h-4 text-zinc-400" />
              <span>Diagnostics &amp; Engine</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Auditor Profile & Engine Status */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#0d0f14] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">ENGINE STATUS</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEngineOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-amber-500'
                }`}
              />
              <span className={isEngineOnline ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                {isEngineOnline ? 'ONLINE' : 'CLIENT MOCK'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-zinc-900/70 border border-zinc-800/80">
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-mono">
              <User className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="overflow-hidden leading-tight">
              <div className="text-xs font-medium text-zinc-200 truncate">Compliance Auditor</div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">Local SQLite Session</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f14]">
        {/* Top Contextual Header */}
        <header className="h-14 px-6 flex-shrink-0 flex items-center justify-between border-b border-zinc-800/80 bg-[#101218]/80 backdrop-blur-sm z-10">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />}
                {crumb.path ? (
                  <button
                    onClick={() => navigate(crumb.path!)}
                    className="text-zinc-400 hover:text-zinc-200 transition font-medium truncate max-w-[200px]"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-zinc-100 font-semibold truncate max-w-[260px]">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Quick Contextual Actions */}
          <div className="flex items-center gap-2.5">
            {/* Demo Sample Loader */}
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-700/80 bg-zinc-900/80 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition"
              title="Load pre-verified clinical protocol sample audit"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Clinical Demo</span>
            </button>

            {/* Export Report action if active audit exists */}
            {activeAudit && activeAudit.status === 'completed' && onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-700/80 bg-zinc-900/80 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Export Report</span>
              </button>
            )}

            {/* Jump to Investigation Workspace shortcut if on Overview */}
            {activeAudit && currentPath.includes('/overview') && (
              <button
                onClick={() => navigate(`/audits/${activeAudit.audit_id}/investigate`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-medium shadow-sm transition"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Open Workspace</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
