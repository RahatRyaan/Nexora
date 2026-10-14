import React from 'react';
import { Bot, Sun, Moon, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  erpStatus?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ erpStatus = 'connected', onRefresh, refreshing = false }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Nexora
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Agentic ERP
              </span>
            </div>
          </div>
        </div>

        {/* Right Navigation & Status */}
        <div className="flex items-center space-x-4">
          {/* ERP Connector Indicator */}
          <div className="hidden sm:flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className={`w-2 h-2 rounded-full ${erpStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-slate-700 dark:text-slate-300">
              {erpStatus === 'connected' ? 'ERP Fabric Active' : 'ERP Offline'}
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                title="Sync ERP Data"
                className="ml-1 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden md:block text-right">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">{user.name}</div>
                <div className="text-[10px] text-slate-500">{user.role}</div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
