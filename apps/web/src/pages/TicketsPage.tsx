import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  PlusCircle,
  MessageSquare,
  Sparkles,
  Zap,
  Send,
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TicketsPageProps {
  tickets: any[];
  onRefresh: () => void;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ tickets, onRefresh }) => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [simSubject, setSimSubject] = useState('');
  const [simMessage, setSimMessage] = useState('');
  const [simEmail, setSimEmail] = useState('sarah.connor@apexlogistics.com');
  const [simulating, setSimulating] = useState(false);
  const [replying, setReplying] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const handleSimulateIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      await api.intakeTicket({
        email: simEmail,
        subject: simSubject,
        message: simMessage,
        channel: 'CHAT',
      });
      setShowSimulateModal(false);
      setSimSubject('');
      setSimMessage('');
      onRefresh();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await api.replyTicket(selectedTicket._id, replyText, user?.name);
      if (res.success) {
        setSelectedTicket(res.data);
        setReplyText('');
        onRefresh();
      }
    } catch (err: any) {
      alert(`Failed to send reply: ${err.message}`);
    } finally {
      setReplying(false);
    }
  };

  const loadScenario = (subject: string, message: string, email: string) => {
    setSimSubject(subject);
    setSimMessage(message);
    setSimEmail(email);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Ticket Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Autonomous triage, ERP context-grounded AI drafts, and human conversation timelines
          </p>
        </div>

        <button
          onClick={() => setShowSimulateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Simulate Inbound Ticket</span>
        </button>
      </div>

      {/* Main Grid: Ticket List + Conversation Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ticket List */}
        <div className="lg:col-span-6 space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {['ALL', 'PENDING_APPROVAL', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'].map((s) => (
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

          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-500 text-xs">
                No tickets matching active filter.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?._id === ticket._id;

                return (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 dark:border-indigo-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {ticket.ticket_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {ticket.category?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          {(ticket.confidence_score * 100).toFixed(0)}%
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ticket.status === 'RESOLVED'
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                              : ticket.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                              : ticket.status === 'ESCALATED'
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                              : 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
                          }`}
                        >
                          {ticket.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ticket.subject}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {ticket.resolution_summary || ticket.messages?.[0]?.content || 'No description available'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Ticket Conversation Timeline & Details */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm flex flex-col min-h-[500px]">
          {selectedTicket ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Top Details */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedTicket.ticket_number}
                  </span>
                  <span className="text-xs text-slate-500">{selectedTicket.channel} Channel</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  {selectedTicket.subject}
                </h3>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-2">
                {selectedTicket.messages?.map((msg: any, idx: number) => {
                  const isBot = msg.sender_type === 'AI_BOT';
                  const isCustomer = msg.sender_type === 'CUSTOMER';

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        isBot
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200 ml-4'
                          : isCustomer
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-4'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 ml-4'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1">
                          {isBot ? <Bot className="w-3.5 h-3.5 text-indigo-500" /> : <User className="w-3.5 h-3.5" />}
                          <span>{msg.sender_name}</span>
                        </div>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an operator reply or override..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendReply}
                  disabled={replying || !replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              <span>Select a ticket on the left to inspect conversation timeline</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Simulate Inbound Ticket */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>Simulate Inbound Ticket (AI Triage Test)</span>
            </h3>

            {/* Quick Demo Scenario Buttons */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Load Enterprise Scenario:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    loadScenario(
                      'Delayed air shipment on SO0142 - Need compensation',
                      'We ordered router hardware 14 days ago and tracking is stuck. We request a $150 freight refund immediately.',
                      'sarah.connor@apexlogistics.com'
                    )
                  }
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-[11px]"
                >
                  📦 <b>Refund ($150)</b>
                  <div className="text-[10px] text-slate-500 truncate">Triggers Approval Queue</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadScenario(
                      'Seat upgrade for clinical medical team',
                      'Please provision 25 additional user seats on our Enterprise plan before next week.',
                      'marcus.vance@novatech-med.io'
                    )
                  }
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-[11px]"
                >
                  🚀 <b>Seat Upgrade</b>
                  <div className="text-[10px] text-slate-500 truncate">Safe Action Auto-approved</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadScenario(
                      'Tax rate error on invoice INV/2026/00103',
                      'The tax line shows 12% instead of the contracted 8.5% rate. Please fix.',
                      'd.chen@omnicloud.net'
                    )
                  }
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-[11px]"
                >
                  🧾 <b>Tax Dispute</b>
                  <div className="text-[10px] text-slate-500 truncate">Auto-escalates to Human</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSimulateIntake} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Email</label>
                <input
                  type="email"
                  required
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                <input
                  type="text"
                  required
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  placeholder="e.g. Delayed shipment on order SO0142"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Inbound Message</label>
                <textarea
                  required
                  rows={4}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="Type customer message or click a scenario above..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {simulating ? 'Processing with AI Pod...' : 'Run Support Pod Triage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
