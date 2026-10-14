import React from 'react';
import {
  Ticket,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  Users,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardProps {
  stats: any;
  onNavigateToApprovals: () => void;
  onNavigateToTickets: () => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({
  stats,
  onNavigateToApprovals,
  onNavigateToTickets,
}) => {
  const kpi = stats?.kpi || {
    total_tickets: 3,
    auto_resolved_percentage: 82,
    average_confidence: 0.94,
    pending_approvals: 1,
    hours_saved: 18,
    total_accounts: 4,
    total_deals: 2,
    total_invoices: 3,
  };

  const categories = stats?.breakdowns?.categories || {
    REFUND_REQUEST: 1,
    PLAN_CHANGE: 1,
    BILLING: 1,
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operations & Agent Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry and human-in-the-loop governance across all autonomous agent pods
          </p>
        </div>

        {kpi.pending_approvals > 0 && (
          <button
            onClick={onNavigateToApprovals}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{kpi.pending_approvals} Action{kpi.pending_approvals > 1 ? 's' : ''} Awaiting Approval</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Tickets */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Interactions</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.total_tickets}</div>
          <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Live synced with ERP
          </div>
        </div>

        {/* Auto Resolution Rate */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Auto-Resolution Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.auto_resolved_percentage}%</div>
          <div className="text-xs text-slate-500">Tier-1 & 2 automated triage</div>
        </div>

        {/* Avg Confidence */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Agent Confidence</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {(kpi.average_confidence * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">Threshold: $\ge$ 85% policy pass</div>
        </div>

        {/* Hours Saved */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Engineering Hours Saved</span>
            <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.hours_saved} hrs</div>
          <div className="text-xs text-slate-500">~18 mins / automated action</div>
        </div>
      </div>

      {/* Pod Status & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Pod Status Cards */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Agent Pod Telemetry</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Shared Data Fabric</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Support Pod */}
            <div className="p-4 rounded-xl border border-sky-200/60 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                  Support Pod
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Customer Support & Triage</div>
              <div className="text-xs text-slate-500">Live order status, refunds & escalations</div>
            </div>

            {/* Sales Pod */}
            <div className="p-4 rounded-xl border border-violet-200/60 dark:border-violet-900/40 bg-violet-50/30 dark:bg-violet-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                  Sales SDR Pod
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pipeline & Lead Ops</div>
              <div className="text-xs text-slate-500">Enrichment, intent scoring & CRM sync</div>
            </div>

            {/* Finance Pod */}
            <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  Finance Ops Pod
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reconciliation & Audit</div>
              <div className="text-xs text-slate-500">3-way PO match (100% human-approved)</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Interaction Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(categories).map(([cat, count]: [string, any]) => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>{cat.replace(/_/g, ' ')}</span>
                  <span>{count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, count * 33)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
