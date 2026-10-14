import React, { useState } from 'react';
import {
  History,
  Search,
  Bot,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';

interface AuditPageProps {
  auditLogs: any[];
  onRefresh: () => void;
}

export const AuditPage: React.FC<AuditPageProps> = ({ auditLogs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.actor_name?.toLowerCase().includes(term) ||
      log.resource_type?.toLowerCase().includes(term) ||
      log.trace_id?.toLowerCase().includes(term)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Immutable Audit Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Append-only cryptographic record of all autonomous decisions, human approvals, and ERP executions
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, actor, trace..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-8"></th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Trace ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const isAgent = log.actor_type === 'AI_AGENT';

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        onClick={() => toggleExpand(log._id)}
                        className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5 font-semibold text-slate-900 dark:text-white">
                            {isAgent ? (
                              <Bot className="w-3.5 h-3.5 text-indigo-500" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span>{log.actor_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {log.resource_type} (#{log.resource_id?.substring(log.resource_id.length - 6)})
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.trace_id}</td>
                      </tr>

                      {/* Expandable JSON Diff Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                          <td colSpan={6} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold uppercase text-slate-500">State Before</div>
                                <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                                  {JSON.stringify(log.state_before || {}, null, 2)}
                                </pre>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold uppercase text-slate-500">State After / ERP Result</div>
                                <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                                  {JSON.stringify(log.state_after || {}, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
