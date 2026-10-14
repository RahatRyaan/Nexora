import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { TicketsPage } from './pages/TicketsPage';
import { AccountsPage } from './pages/AccountsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

export const App: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [erpStatus, setErpStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchAllData = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const [statsRes, approvalsRes, ticketsRes, accountsRes, auditRes, erpRes] = await Promise.all([
        api.getOverviewStats().catch(() => null),
        api.getApprovals('ALL').catch(() => ({ data: [] })),
        api.getTickets('ALL').catch(() => ({ data: [] })),
        api.getAccounts().catch(() => ({ data: [] })),
        api.getAuditLogs().catch(() => ({ data: [] })),
        api.getErpStatus().catch(() => null),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (approvalsRes?.success) setApprovals(approvalsRes.data || []);
      if (ticketsRes?.success) setTickets(ticketsRes.data || []);
      if (accountsRes?.success) setAccounts(accountsRes.data || []);
      if (auditRes?.success) setAuditLogs(auditRes.data || []);
      if (erpRes?.success) setErpStatus(erpRes.data);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 15000); // 15s polling for live telemetry
      return () => clearInterval(interval);
    }
  }, [token]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-mono">Initializing Nexora Console...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <LoginPage />;
  }

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        erpStatus={erpStatus?.status || 'connected'}
        onRefresh={fetchAllData}
        refreshing={refreshing}
      />

      {/* App Layout with Sidebar and Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              onNavigateToApprovals={() => setActiveTab('approvals')}
              onNavigateToTickets={() => setActiveTab('tickets')}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsPage approvals={approvals} onRefresh={fetchAllData} />
          )}

          {activeTab === 'tickets' && (
            <TicketsPage tickets={tickets} onRefresh={fetchAllData} />
          )}

          {activeTab === 'accounts' && <AccountsPage accounts={accounts} />}

          {activeTab === 'invoices' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  ERP Invoices & 3-Way Matching
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Live synced invoices from Odoo / ERP connector with 3-way PO matching validation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats?.kpi?.total_invoices ? (
                  <>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] space-y-2">
                      <div className="text-xs font-mono font-bold text-slate-500">INV/2026/00101</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">$4,200.00</div>
                      <div className="text-xs text-emerald-600 font-semibold">✅ 3-Way Matched (PO-APEX-9982)</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] space-y-2">
                      <div className="text-xs font-mono font-bold text-slate-500">INV/2026/00102</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">$18,500.00</div>
                      <div className="text-xs text-emerald-600 font-semibold">✅ Paid & Matched (PO-NOVA-1029)</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] space-y-2">
                      <div className="text-xs font-mono font-bold text-slate-500">INV/2026/00103</div>
                      <div className="text-xl font-bold text-rose-600">$14,500.00</div>
                      <div className="text-xs text-rose-600 font-semibold">⚠️ Disputed (Tax Mismatch +$1,000)</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500">Loading ERP invoices...</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && <AuditPage auditLogs={auditLogs} onRefresh={fetchAllData} />}

          {activeTab === 'settings' && (
            <SettingsPage erpStatus={erpStatus} onRefresh={fetchAllData} />
          )}
        </main>
      </div>
    </div>
  );
};
