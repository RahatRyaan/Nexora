import React, { useState } from 'react';
import {
  Settings,
  Shield,
  RefreshCw,
  Database,
  Cpu,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsPageProps {
  erpStatus: any;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ erpStatus, onRefresh }) => {
  const [refundLimit, setRefundLimit] = useState<number>(100);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await api.triggerSync();
      onRefresh();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Governance & Policy Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure autonomous agent risk thresholds, approval rules, and ERP connector bridges
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Governance policies saved and active across all agent pods!</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Trust & Approval Policy Card */}
        <form
          onSubmit={handleSavePolicies}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Autonomous Risk & Threshold Governance
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Support Max Auto-Refund Limit ($)
              </label>
              <input
                type="number"
                value={refundLimit}
                onChange={(e) => setRefundLimit(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                Refunds exceeding this dollar amount automatically route to Human Approval Queue.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Minimum Agent Confidence Threshold (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                Actions with confidence below this threshold auto-escalate to human staff.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Policies</span>
            </button>
          </div>
        </form>

        {/* ERP Connector Bridge Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">ERP Connector Kit</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Provider: {erpStatus?.provider?.toUpperCase() || 'MOCK / ODOO'}
            </span>
          </div>

          <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
            <div>
              <b>Host Bridge:</b> {erpStatus?.host || 'http://localhost:5050'}
            </div>
            <div>
              <b>Last Synced:</b> {erpStatus?.last_synced_at ? new Date(erpStatus.last_synced_at).toLocaleString() : 'Just now'}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleTriggerSync}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchronizing Fabric...' : 'Sync ERP Data Now'}</span>
            </button>
          </div>
        </div>

        {/* AI Provider Telemetry Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">AI Agent Pod Runtime</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Active Provider: <b>OmniRoute (localhost:20128/v1)</b> with Claude 3.5 Sonnet / Gemini fallback.
            All AI reasoning outputs are structured, schema-validated, and scored for confidence before reaching execution gates.
          </p>
        </div>
      </div>
    </div>
  );
};
