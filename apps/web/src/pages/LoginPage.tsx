import React, { useState } from 'react';
import { Bot, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@acme-corp.com');
  const [password, setPassword] = useState('AdminPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('AdminPassword123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19] px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#111827] p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="text-center space-y-3">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Bot className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Nexora Admin Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sign in to orchestrate and govern autonomous ERP agent operations
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Login Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Quick Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@acme-corp.com')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 text-left"
            >
              👑 Platform Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('marcus.support@acme-corp.com')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 text-left"
            >
              🎧 Support Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
