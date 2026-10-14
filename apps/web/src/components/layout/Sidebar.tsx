import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Ticket,
  Users,
  FileSpreadsheet,
  History,
  Settings,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'approvals' | 'tickets' | 'accounts' | 'invoices' | 'audit' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'approvals',
      label: 'Approval Queue',
      icon: ShieldAlert,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket },
    { id: 'accounts', label: 'Accounts & Fabric', icon: Users },
    { id: 'invoices', label: 'Invoices & ERP', icon: FileSpreadsheet },
    { id: 'audit', label: 'Audit Explorer', icon: History },
    { id: 'settings', label: 'Policy & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col py-6 px-4 space-y-6">
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Autonomous Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Trust Invariant Callout */}
      <div className="mt-auto p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/50 to-slate-50 dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-100/60 dark:border-indigo-900/40 text-xs space-y-1">
        <div className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center">
          🛡️ Trust Governance
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
          All ERP writes strictly require Human-in-the-Loop approval when policies or confidence thresholds are triggered.
        </p>
      </div>
    </aside>
  );
};
