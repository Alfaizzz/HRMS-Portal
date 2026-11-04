import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { ToggleLeft, ToggleRight, RotateCcw, AlertTriangle, X } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const {
    demoMode,
    toggleDemoMode,
    resetDemoData,
    backendOffline,
    dismissOfflineBanner,
    backendUrl,
  } = useDemo();

  return (
    <aside aria-label="Demo status banner">
      {backendOffline && !demoMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Backend Offline:</strong> Cannot reach Spring Boot at{' '}
              <code className="bg-amber-600/30 px-1 py-0.5 rounded">{backendUrl}</code>.
              Switch to Demo Mode to browse full mock data immediately.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDemoMode}
              className="bg-slate-900 text-white px-2.5 py-1 rounded text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Switch to Demo Mode
            </button>
            <button
              onClick={dismissOfflineBanner}
              className="p-1 hover:bg-amber-600/20 rounded cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Persistent quiet toolbar in Demo Mode */}
      {demoMode && (
        <div className="bg-slate-900 text-slate-300 dark:bg-slate-950 dark:border-b dark:border-slate-800 px-4 py-1.5 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Demo Mode Active</span>
            <span className="text-slate-400 hidden sm:inline">
              (In-Memory Mock Database with full CRUD &amp; LocalStorage persistence)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetDemoData}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset sample data to initial state"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Demo Data</span>
            </button>
            <button
              onClick={toggleDemoMode}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-0.5 rounded transition-colors cursor-pointer"
              title="Switch to Real Spring Boot Backend"
            >
              <span>Connect Real API</span>
              <ToggleRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      )}

      {!demoMode && !backendOffline && (
        <div className="bg-blue-900/90 text-blue-100 px-4 py-1 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Targeting Real Backend: <code className="bg-blue-950 px-1 py-0.5 rounded">{backendUrl}</code></span>
          </div>
          <button
            onClick={toggleDemoMode}
            className="inline-flex items-center gap-1 bg-blue-800 hover:bg-blue-700 text-white px-2 py-0.5 rounded transition-colors cursor-pointer text-xs"
          >
            <ToggleLeft className="w-3.5 h-3.5" />
            <span>Switch to Demo Mode</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default DemoBanner;
