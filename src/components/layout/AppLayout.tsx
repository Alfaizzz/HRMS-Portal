import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import DemoBanner from '../common/DemoBanner';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <DemoBanner />
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading view...</p>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} HRMS Unified Enterprise System. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Spring Boot 3.2.x</span>
            <span>·</span>
            <span>MySQL 8.0</span>
            <span>·</span>
            <span>React 19 + Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
