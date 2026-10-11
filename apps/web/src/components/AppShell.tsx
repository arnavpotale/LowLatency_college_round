import React from 'react';
import { useRouter } from '../router/RouterContext';
import { AuditResponse } from '../types';
import { useTheme } from '../theme/ThemeContext';
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
  Sparkles,
  Sun,
  Moon,
  Laptop
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
  const { mode, setMode } = useTheme();

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
    <div className="flex h-screen w-screen bg-[#F6F7F8] dark:bg-[#111614] text-[#17211D] dark:text-[#EDF2EE] overflow-hidden font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] select-none transition-colors duration-150">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38]">
          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EBF5F1] dark:bg-[#19332A] border border-[#BCD8CD] dark:border-[#2C5245] flex items-center justify-center text-[#176B58] dark:text-[#65B89D] group-hover:border-[#176B58] transition">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-[#17211D] dark:text-[#EDF2EE] flex items-center gap-1.5">
                SECOND OPINION
              </div>
              <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono tracking-wide">
                EVIDENCE AUDITOR
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB]">
            v0.1
          </span>
        </div>

        {/* Action Button: New Audit */}
        <div className="p-3 border-b border-[#DCE3DF] dark:border-[#343E38]">
          <button
            onClick={() => navigate('/audits/new')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] font-medium text-xs shadow-xs transition active:scale-[0.99]"
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
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB] mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#58645F] dark:text-[#A7B2AB]" />
                <span>Active Investigation</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-xs space-y-2">
                <div className="font-medium text-[#17211D] dark:text-[#EDF2EE] line-clamp-1" title={activeAudit.title}>
                  {activeAudit.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#58645F] dark:text-[#A7B2AB] font-mono">
                  <span>{activeAudit.claims?.length || 0} claims</span>
                  <span>{activeAudit.sources?.length || 0} sources</span>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={() => navigate(`/audits/${activeAudit.audit_id}/overview`)}
                    className={`flex-1 px-2 py-1 rounded text-[11px] font-medium border text-center transition ${
                      currentPath.includes('/overview')
                        ? 'bg-white dark:bg-[#191F1C] border-[#BCD8CD] dark:border-[#65B89D] text-[#176B58] dark:text-[#65B89D] shadow-xs'
                        : 'bg-[#F6F7F8] dark:bg-[#191F1C]/60 border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => navigate(`/audits/${activeAudit.audit_id}/investigate`)}
                    className={`flex-1 px-2 py-1 rounded text-[11px] font-medium border text-center transition ${
                      currentPath.includes('/investigate')
                        ? 'bg-white dark:bg-[#191F1C] border-[#BCD8CD] dark:border-[#65B89D] text-[#176B58] dark:text-[#65B89D] shadow-xs'
                        : 'bg-[#F6F7F8] dark:bg-[#191F1C]/60 border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE]'
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
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB]">
              Workspace
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/dashboard')
                  ? 'bg-[#EDF1EF] dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] font-semibold border border-[#DCE3DF] dark:border-[#343E38]'
                  : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#58645F] dark:text-[#A7B2AB]" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/audits')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                currentPath === '/audits'
                  ? 'bg-[#EDF1EF] dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] font-semibold border border-[#DCE3DF] dark:border-[#343E38]'
                  : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
              }`}
            >
              <FolderGit2 className="w-4 h-4 text-[#58645F] dark:text-[#A7B2AB]" />
              <span>All Audits</span>
            </button>
            <button
              onClick={() => navigate('/sources')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/sources')
                  ? 'bg-[#EDF1EF] dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] font-semibold border border-[#DCE3DF] dark:border-[#343E38]'
                  : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
              }`}
            >
              <Files className="w-4 h-4 text-[#58645F] dark:text-[#A7B2AB]" />
              <span>Sources Library</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/reports')
                  ? 'bg-[#EDF1EF] dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] font-semibold border border-[#DCE3DF] dark:border-[#343E38]'
                  : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
              }`}
            >
              <FileCheck className="w-4 h-4 text-[#58645F] dark:text-[#A7B2AB]" />
              <span>Audit Reports</span>
            </button>
          </div>

          {/* Section: INVESTIGATE */}
          <div className="space-y-0.5">
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB]">
              Investigate
            </div>
            <button
              onClick={() => navigate('/adversarial-lab')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/adversarial-lab')
                  ? 'bg-[#F4F0FC] dark:bg-[#6D28D9]/20 border border-[#D5C6F5] dark:border-[#4E2582] text-[#5B32A8] dark:text-[#B48DEF] font-semibold'
                  : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-4 h-4 text-[#5B32A8] dark:text-[#B48DEF]" />
                <span>Adversarial Lab</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EDF1EF] dark:bg-[#202824] border border-[#DCE3DF] dark:border-[#343E38] text-[#58645F] dark:text-[#A7B2AB]">
                10 tests
              </span>
            </button>
          </div>

          {/* Section: SYSTEM */}
          <div className="space-y-0.5">
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-[#58645F] dark:text-[#A7B2AB]">
              System
            </div>
            <button
              onClick={() => navigate('/settings')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                isNavActive('/settings')
                  ? 'bg-[#EDF1EF] dark:bg-[#202824] text-[#17211D] dark:text-[#EDF2EE] font-semibold border border-[#DCE3DF] dark:border-[#343E38]'
                  : 'text-[#58645F] dark:text-[#A7B2AB] hover:text-[#17211D] dark:hover:text-[#EDF2EE] hover:bg-[#EAEFEA] dark:hover:bg-[#26302B]'
              }`}
            >
              <SettingsIcon className="w-4 h-4 text-[#58645F] dark:text-[#A7B2AB]" />
              <span>Diagnostics &amp; Engine</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Auditor Profile & Engine Status */}
        <div className="p-3 border-t border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#141A17] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#58645F] dark:text-[#A7B2AB]">ENGINE STATUS</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEngineOnline ? 'bg-[#176B58] dark:bg-[#65B89D]' : 'bg-[#965B0A] dark:bg-[#E5AC48]'
                }`}
              />
              <span className={isEngineOnline ? 'text-[#176B58] dark:text-[#65B89D] font-medium' : 'text-[#965B0A] dark:text-[#E5AC48]'}>
                {isEngineOnline ? 'ONLINE' : 'CLIENT MOCK'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-white dark:bg-[#191F1C] border border-[#DCE3DF] dark:border-[#343E38]">
            <div className="w-6 h-6 rounded-full bg-[#EDF1EF] dark:bg-[#202824] flex items-center justify-center text-[#58645F] dark:text-[#A7B2AB] text-xs font-mono">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden leading-tight">
              <div className="text-xs font-medium text-[#17211D] dark:text-[#EDF2EE] truncate">Compliance Auditor</div>
              <div className="text-[10px] text-[#58645F] dark:text-[#A7B2AB] font-mono truncate">Local SQLite Session</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F6F7F8] dark:bg-[#111614]">
        {/* Top Contextual Header */}
        <header className="h-14 px-6 flex-shrink-0 flex items-center justify-between border-b border-[#DCE3DF] dark:border-[#343E38] bg-white/95 dark:bg-[#191F1C]/90 backdrop-blur-sm z-10">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#7E8C86] dark:text-[#738078] flex-shrink-0" />}
                {crumb.path ? (
                  <button
                    onClick={() => navigate(crumb.path!)}
                    className="text-[#58645F] hover:text-[#17211D] dark:text-[#A7B2AB] dark:hover:text-[#EDF2EE] transition font-medium truncate max-w-[200px]"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#17211D] dark:text-[#EDF2EE] font-semibold truncate max-w-[260px]">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Quick Contextual Actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme Mode Segmented Pill */}
            <div className="flex items-center rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-[#EDF1EF] dark:bg-[#202824] p-0.5 text-xs mr-1">
              <button
                onClick={() => setMode('light')}
                className={`p-1.5 rounded transition ${
                  mode === 'light'
                    ? 'bg-white text-[#17211D] shadow-xs'
                    : 'text-[#58645F] hover:text-[#17211D] dark:text-[#A7B2AB] dark:hover:text-[#EDF2EE]'
                }`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMode('dark')}
                className={`p-1.5 rounded transition ${
                  mode === 'dark'
                    ? 'bg-[#191F1C] text-[#EDF2EE] shadow-xs'
                    : 'text-[#58645F] hover:text-[#17211D] dark:text-[#A7B2AB] dark:hover:text-[#EDF2EE]'
                }`}
                title="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMode('system')}
                className={`p-1.5 rounded transition ${
                  mode === 'system'
                    ? 'bg-white text-[#17211D] dark:bg-[#191F1C] dark:text-[#EDF2EE] shadow-xs'
                    : 'text-[#58645F] hover:text-[#17211D] dark:text-[#A7B2AB] dark:hover:text-[#EDF2EE]'
                }`}
                title="System Theme"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Demo Sample Loader */}
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] hover:bg-[#EDF1EF] dark:hover:bg-[#202824] text-xs font-medium transition shadow-xs"
              title="Load pre-verified clinical protocol sample audit"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#965B0A] dark:text-[#E5AC48]" />
              <span>Load Clinical Demo</span>
            </button>

            {/* Export Report action if active audit exists */}
            {activeAudit && activeAudit.status === 'completed' && onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#DCE3DF] dark:border-[#343E38] bg-white dark:bg-[#191F1C] text-[#17211D] dark:text-[#EDF2EE] hover:bg-[#EDF1EF] dark:hover:bg-[#202824] text-xs font-medium transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#58645F] dark:text-[#A7B2AB]" />
                <span>Export Report</span>
              </button>
            )}

            {/* Jump to Investigation Workspace shortcut if on Overview */}
            {activeAudit && currentPath.includes('/overview') && (
              <button
                onClick={() => navigate(`/audits/${activeAudit.audit_id}/investigate`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#176B58] hover:bg-[#125546] dark:bg-[#65B89D] dark:hover:bg-[#7AC5AC] text-white dark:text-[#0E1A15] text-xs font-medium shadow-xs transition"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Open Workspace</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-[#F6F7F8] dark:bg-[#111614] text-[#17211D] dark:text-[#EDF2EE]">
          {children}
        </main>
      </div>
    </div>
  );
};
