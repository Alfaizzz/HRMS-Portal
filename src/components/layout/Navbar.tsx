import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { useDemo } from '../../context/DemoContext';
import {
  Users,
  Building2,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  BookOpen,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  UserCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { demoMode, toggleDemoMode } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/employees', label: 'Employees', icon: <Users className="w-4 h-4" /> },
        { to: '/departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
        { to: '/attendance', label: 'Attendance', icon: <Clock className="w-4 h-4" /> },
        { to: '/leaves', label: 'Leaves', icon: <FileText className="w-4 h-4" /> },
        { to: '/salary', label: 'Payroll', icon: <DollarSign className="w-4 h-4" /> },
        { to: '/library', label: 'Library', icon: <BookOpen className="w-4 h-4" /> },
        { to: '/calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
      ]
    : [
        { to: '/employee/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: '/profile', label: 'My Profile', icon: <UserCheck className="w-4 h-4" /> },
        { to: '/attendance', label: 'Attendance', icon: <Clock className="w-4 h-4" /> },
        { to: '/leaves', label: 'Leaves', icon: <FileText className="w-4 h-4" /> },
        { to: '/salary', label: 'My Salary', icon: <DollarSign className="w-4 h-4" /> },
        { to: '/library', label: 'Library', icon: <BookOpen className="w-4 h-4" /> },
        { to: '/calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
      ];

  const isActive = (path: string) => {
    if (path === '/admin/dashboard' || path === '/employee/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Wordmark Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link
              to={isAdmin ? '/admin/dashboard' : '/employee/dashboard'}
              className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-slate-900 dark:text-white shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm shadow-xs">
                H
              </div>
              <span>HRMS</span>
            </Link>
          </div>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Theme, Demo Switch, User Info & Logout) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Mode Badge */}
            <button
              onClick={toggleDemoMode}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-colors ${
                demoMode
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Click to toggle between Demo Mode and Real Backend"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{demoMode ? 'Demo' : 'Live'}</span>
            </button>

            <ThemeToggle />

            {user && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 group text-left cursor-pointer"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs font-bold ring-1 ring-slate-300 dark:ring-slate-600">
                    {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 leading-tight">
                      {isAdmin && <Shield className="w-2.5 h-2.5 text-blue-500" />}
                      <span>{user.role}</span>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-5 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                toggleDemoMode();
                setMobileMenuOpen(false);
              }}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
            >
              Toggle Demo Mode: {demoMode ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-rose-600 hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
