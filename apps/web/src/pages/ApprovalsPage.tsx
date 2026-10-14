import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Edit3,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ApprovalsPageProps {
  approvals: any[];
  onRefresh: () => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ approvals, onRefresh }) => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_APPROVAL');
  const [activeModalAction, setActiveModalAction] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'reject' | 'edit' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editNote, setEditNote] = useState('');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredApprovals = approvals.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const handleApprove = async (action: any) => {
    setLoadingActionId(action._id);
    setFeedbackMsg(null);
    try {
      const res = await api.approveAction(action._id, user?.name);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Action approved! Executed write-back to ERP (${res.message})` });
        onRefresh();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error?.message || 'Approval failed' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!activeModalAction || !rejectReason) return;
    setLoadingActionId(activeModalAction._id);
    try {
      const res = await api.rejectAction(activeModalAction._id, rejectReason, user?.name);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Action proposal successfully rejected' });
        setActiveModalAction(null);
        setModalType(null);
        setRejectReason('');
        onRefresh();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!activeModalAction) return;
    setLoadingActionId(activeModalAction._id);
    try {
      const payload = {
        ...activeModalAction.output_payload,
        credit_amount: editAmount,
        refund_amount: editAmount,
      };
      const res = await api.editAction(activeModalAction._id, payload, editNote);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Action proposal modified successfully' });
        setActiveModalAction(null);
        setModalType(null);
        onRefresh();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleRollback = async (action: any) => {
    if (!window.confirm('Are you sure you want to rollback this executed action? This will apply a compensation record.')) {
      return;
    }
    setLoadingActionId(action._id);
    try {
      const res = await api.rollbackAction(action._id, user?.name);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Action rolled back and compensation record recorded' });
        onRefresh();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Human Approval Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Governing high-stakes autonomous agent decisions before ERP write-back
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {['PENDING_APPROVAL', 'EXECUTED', 'REJECTED', 'ALL'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === s
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Approval Cards List */}
      {filteredApprovals.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Approval Queue is Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No agent actions currently require human intervention. All actions within policy thresholds are running autonomously.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((action) => {
            const isPending = action.status === 'PENDING_APPROVAL';
            const isExecuted = action.status === 'EXECUTED';
            const isRejected = action.status === 'REJECTED';
            const isRolledBack = action.status === 'ROLLED_BACK';

            return (
              <div
                key={action._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Top Row: Badges & Confidence */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {action.agent_type}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {action.action_type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Trace: {action.trace_id}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Confidence Meter Badge */}
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{(action.confidence * 100).toFixed(0)}% Confidence</span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isPending
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : isExecuted
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : isRejected
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {action.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* AI Reasoning / Explainability Rationale */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>AI Reasoning & ERP Grounding:</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {action.reasoning}
                  </p>
                </div>

                {/* ERP Write-Back Diff Preview */}
                <div className="text-xs space-y-1 font-mono">
                  <span className="font-sans font-semibold text-slate-700 dark:text-slate-300">Proposed ERP Write-Back Payload:</span>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto text-[11px]">
                    {JSON.stringify(action.output_payload, null, 2)}
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="text-xs text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Queued {new Date(action.created_at).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => {
                            setActiveModalAction(action);
                            setModalType('edit');
                            setEditAmount(action.output_payload.credit_amount || action.output_payload.refund_amount || 150);
                            setEditNote('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveModalAction(action);
                            setModalType('reject');
                            setRejectReason('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleApprove(action)}
                          disabled={loadingActionId === action._id}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{loadingActionId === action._id ? 'Writing to ERP...' : 'Approve & Write to Odoo'}</span>
                        </button>
                      </>
                    )}

                    {isExecuted && action.reversible && (
                      <button
                        onClick={() => handleRollback(action)}
                        disabled={loadingActionId === action._id}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback Reversible Action</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Edit or Reject */}
      {modalType && activeModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {modalType === 'reject' ? 'Reject Proposed Action' : 'Edit Proposed Parameters'}
            </h3>

            {modalType === 'reject' ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Provide mandatory rationale for audit record:
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Request exceeds allowable quarterly credit limit."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Refund/Credit Amount ($)</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Operator Modification Note</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="e.g. Adjusted to standard $100 goodwill credit."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setActiveModalAction(null);
                  setModalType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={modalType === 'reject' ? handleRejectSubmit : handleEditSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
