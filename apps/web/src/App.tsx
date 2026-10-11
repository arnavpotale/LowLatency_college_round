import React, { useState, useEffect } from 'react';
import { RouterProvider, useRouter } from './router/RouterContext';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { CreateAuditPage } from './pages/CreateAuditPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { AuditOverviewPage } from './pages/AuditOverviewPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { AllAuditsPage } from './pages/AllAuditsPage';
import { AdversarialLabPage } from './pages/AdversarialLabPage';
import { SourcesPage } from './pages/SourcesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportPreviewModal } from './features/reports/ReportPreviewModal';
import { apiClient } from './services/api';
import { AuditResponse, HealthResponse } from './types';
import { MOCK_INITIAL_AUDIT } from './mocks/sampleData';

const AppContent: React.FC = () => {
  const { currentPath, navigate, params } = useRouter();

  const [activeAudit, setActiveAudit] = useState<AuditResponse>(MOCK_INITIAL_AUDIT);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');

  // Initial health check on mount
  useEffect(() => {
    async function checkHealth() {
      const h = await apiClient.getHealth();
      setHealth(h);
    }
    checkHealth();
  }, []);

  // Sync audit from URL if auditId changes in params
  useEffect(() => {
    const urlAuditId = params.auditId;
    if (urlAuditId && urlAuditId !== activeAudit.audit_id) {
      if (urlAuditId === 'aud_demo_89f1a23') {
        setActiveAudit(MOCK_INITIAL_AUDIT);
      } else {
        apiClient
          .getAudit(urlAuditId)
          .then((loaded) => {
            setActiveAudit(loaded);
            if (loaded.claims?.length > 0) {
              setSelectedClaimId(loaded.claims[0].claim_id);
            }
          })
          .catch((err) => {
            console.warn(`Could not load audit ${urlAuditId} from backend:`, err);
          });
      }
    }
  }, [params.auditId, activeAudit.audit_id]);

  // Set default selected claim on audit change
  useEffect(() => {
    if (activeAudit.claims?.length > 0 && !selectedClaimId) {
      setSelectedClaimId(activeAudit.claims[0].claim_id);
    }
  }, [activeAudit.claims, selectedClaimId]);

  // Load demo case action
  const handleLoadDemo = () => {
    setActiveAudit(MOCK_INITIAL_AUDIT);
    setSelectedClaimId(MOCK_INITIAL_AUDIT.claims[0]?.claim_id || null);
    navigate(`/audits/${MOCK_INITIAL_AUDIT.audit_id}/overview`);
  };

  // Open report modal action
  const handleOpenReportModal = async () => {
    try {
      if (activeAudit.audit_id === 'aud_demo_89f1a23') {
        // Pre-compile markdown for demo audit
        const mockMd = `# Second Opinion — Audit Report: ${activeAudit.title}\n\n` +
          `**Audit ID:** ${activeAudit.audit_id}\n` +
          `**Status:** ${activeAudit.status.toUpperCase()}\n` +
          `**Trust Score:** ${Math.round((activeAudit.summary?.trust_score || 0) * 100)}%\n\n` +
          `## Executive Findings\n${activeAudit.summary?.key_takeaway || 'Analysis complete.'}\n\n` +
          `## Investigated Claims\n` +
          activeAudit.claims.map((c, i) =>
            `### Claim [${i + 1}]: ${c.verdict.toUpperCase()}\n` +
            `> "${c.claim_text}"\n\n` +
            `* **Explanation:** ${c.explanation}\n` +
            (c.human_review ? `* **Auditor Override:** ${c.human_review.action} by ${c.human_review.reviewer}\n` : '')
          ).join('\n') +
          `\n\n## Sources\n` +
          activeAudit.sources.map(s => `- **${s.filename}** (${s.char_count} chars)`).join('\n');
        setReportMarkdown(mockMd);
      } else {
        const md = await apiClient.getReport(activeAudit.audit_id);
        setReportMarkdown(md);
      }
      setIsReportModalOpen(true);
    } catch (err: any) {
      console.error('Failed to open report modal:', err);
    }
  };

  // Human Review Auditor Callback
  const handleSaveReview = async (
    claimId: string,
    action: string,
    notes: string,
    reviewer: string
  ) => {
    try {
      if (!activeAudit.is_mock) {
        const updated = await apiClient.submitHumanReview(activeAudit.audit_id, claimId, {
          action,
          notes,
          reviewer
        });
        setActiveAudit(updated);
      } else {
        // Local state update for mock demonstration mode
        setActiveAudit((prev) => {
          const newClaims = prev.claims.map((c) => {
            if (c.claim_id !== claimId) return c;
            let newVerdict = c.verdict;
            if (action === 'override_supported') newVerdict = 'supported';
            else if (action === 'override_contradicted') newVerdict = 'contradicted';
            else if (action === 'override_unsupported') newVerdict = 'unsupported';

            return {
              ...c,
              verdict: newVerdict,
              human_review: {
                action,
                notes,
                reviewer,
                reviewed_at: new Date().toISOString(),
                original_verdict: c.human_review?.original_verdict || c.verdict
              }
            };
          });

          return {
            ...prev,
            claims: newClaims
          };
        });
      }
    } catch (err: any) {
      console.error('Failed to submit human review:', err);
      throw err;
    }
  };

  const isEngineOnline = health?.status === 'healthy';

  // Route Dispatcher
  const renderCurrentPage = () => {
    // 1. Dashboard
    if (currentPath === '/' || currentPath === '/dashboard') {
      return (
        <DashboardPage
          onSelectAudit={(a) => setActiveAudit(a)}
          onLoadDemo={handleLoadDemo}
        />
      );
    }

    // 2. Create Audit Wizard
    if (currentPath === '/audits/new') {
      return (
        <CreateAuditPage
          onAuditCreated={(a) => {
            setActiveAudit(a);
          }}
          onLoadDemo={handleLoadDemo}
        />
      );
    }

    // 3. All Audits Repository
    if (currentPath === '/audits') {
      return (
        <AllAuditsPage
          onSelectAudit={(a) => setActiveAudit(a)}
          onLoadDemo={handleLoadDemo}
        />
      );
    }

    // 4. Verification In-Progress
    if (currentPath.startsWith('/audits/') && currentPath.endsWith('/processing')) {
      return (
        <ProcessingPage
          onAuditCompleted={(completedAudit) => {
            setActiveAudit(completedAudit);
          }}
        />
      );
    }

    // 5. Audit Results Overview
    if (currentPath.startsWith('/audits/') && currentPath.endsWith('/overview')) {
      return (
        <AuditOverviewPage
          audit={activeAudit}
          onSelectClaim={(cid) => setSelectedClaimId(cid)}
          onOpenReportModal={handleOpenReportModal}
        />
      );
    }

    // 6. Claim Investigation Workspace
    if (currentPath.startsWith('/audits/') && (currentPath.includes('/investigate') || currentPath.includes('/claims'))) {
      return (
        <InvestigationPage
          audit={activeAudit}
          selectedClaimId={selectedClaimId}
          onSelectClaim={(cid) => setSelectedClaimId(cid)}
          onSaveReview={handleSaveReview}
          onOpenReportModal={handleOpenReportModal}
        />
      );
    }

    // 7. Adversarial Lab
    if (currentPath.startsWith('/adversarial-lab')) {
      return <AdversarialLabPage />;
    }

    // 8. Sources Library
    if (currentPath.startsWith('/sources')) {
      return (
        <SourcesPage
          activeAudit={activeAudit}
          onSelectAudit={(a) => setActiveAudit(a)}
        />
      );
    }

    // 9. Reports Archive
    if (currentPath.startsWith('/reports')) {
      return <ReportsPage activeAudit={activeAudit} />;
    }

    // 10. Settings & Diagnostics
    if (currentPath.startsWith('/settings')) {
      return <SettingsPage />;
    }

    // Fallback: Dashboard
    return (
      <DashboardPage
        onSelectAudit={(a) => setActiveAudit(a)}
        onLoadDemo={handleLoadDemo}
      />
    );
  };

  return (
    <AppShell
      activeAudit={activeAudit}
      onSelectAudit={(a) => setActiveAudit(a)}
      onLoadDemo={handleLoadDemo}
      onOpenReportModal={handleOpenReportModal}
      isEngineOnline={isEngineOnline}
    >
      {renderCurrentPage()}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportPreviewModal
          isOpen={isReportModalOpen}
          reportMarkdown={reportMarkdown}
          audit={activeAudit}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
};

export default App;
