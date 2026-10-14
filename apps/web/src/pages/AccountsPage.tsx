import React, { useState } from 'react';
import {
  Users,
  Building2,
  TrendingUp,
  Ticket,
  FileSpreadsheet,
  HeartPulse,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

interface AccountsPageProps {
  accounts: any[];
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ accounts }) => {
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Shared Data Fabric: Accounts 360
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Unified real-time context connecting customer sales pipeline, support tickets, and ERP invoices
        </p>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const isHighRisk = acc.health_score < 60;
          const isMediumRisk = acc.health_score >= 60 && acc.health_score < 80;

          return (
            <div
              key={acc._id}
              onClick={() => setSelectedAccount(acc)}
              className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4 hover:border-indigo-500 transition-all"
            >
              {/* Top Row: Name & Tier */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{acc.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{acc.industry || 'Enterprise'}</span>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {acc.tier}
                </span>
              </div>

              {/* Health Score Progress Meter */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    <span>Health Score</span>
                  </span>
                  <span
                    className={
                      isHighRisk
                        ? 'text-rose-600 dark:text-rose-400'
                        : isMediumRisk
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {acc.health_score}/100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isHighRisk ? 'bg-rose-500' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${acc.health_score}%` }}
                  ></div>
                </div>
              </div>

              {/* Cross-Pod Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                  <div className="text-[10px] text-slate-500">Open Deals</div>
                  <div className="font-bold text-slate-900 dark:text-white">{acc.open_deals_count || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                  <div className="text-[10px] text-slate-500">Active Tickets</div>
                  <div className="font-bold text-slate-900 dark:text-white">{acc.open_tickets_count || 0}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                  <div className="text-[10px] text-slate-500">Overdue Inv</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400">{acc.overdue_invoices_count || 0}</div>
                </div>
              </div>

              {/* ERP Link */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Odoo Partner #{acc.erp_id}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center">
                  Shared Fabric <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
