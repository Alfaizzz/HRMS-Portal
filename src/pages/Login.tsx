import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { useNotification } from '../context/NotificationContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Shield, User as UserIcon, Lock, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { DEMO_ADMIN_CREDENTIALS, DEMO_EMPLOYEE_CREDENTIALS } from '../config/demoConfig';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemoAdmin, loginAsDemoEmployee } = useAuth();
  const { demoMode, toggleDemoMode } = useDemo();
  const { success, error: notifyError } = useNotification();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      notifyError('Please enter your User ID or Username');
      return;
    }

    setLoading(true);
    try {
      const user = await login({ username, password });
      success(`Welcome back, ${user.first_name}!`);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } catch (err: any) {
      notifyError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setUsername(DEMO_ADMIN_CREDENTIALS.username);
    setPassword(DEMO_ADMIN_CREDENTIALS.password);
    setLoading(true);
    try {
      const user = await loginAsDemoAdmin();
      success(`Logged in as Administrator (${user.first_name})`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      notifyError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEmployee = async () => {
    setUsername(DEMO_EMPLOYEE_CREDENTIALS.username);
    setPassword(DEMO_EMPLOYEE_CREDENTIALS.password);
    setLoading(true);
    try {
      const user = await loginAsDemoEmployee();
      success(`Logged in as Employee (${user.first_name})`);
      navigate('/employee/dashboard', { replace: true });
    } catch (err: any) {
      notifyError(err.message || 'Employee login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xl shadow-md mb-3">
            H
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            HRMS Enterprise Suite
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Human Resource Management, Payroll, Attendance &amp; Library
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Demo Credentials Quick Switcher */}
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Demo Login</span>
              </span>
              <button
                type="button"
                onClick={toggleDemoMode}
                className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:underline"
              >
                Mode: <strong className={demoMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600'}>{demoMode ? 'Demo' : 'Real API'}</strong>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickAdmin}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={handleQuickEmployee}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Employee</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="User ID or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or employee"
              icon={<UserIcon className="w-4 h-4" />}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to HRMS
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
            <span>Demo credentials: </span>
            <code className="text-slate-600 dark:text-slate-300 font-mono">admin / admin123</code>
            <span> · </span>
            <code className="text-slate-600 dark:text-slate-300 font-mono">employee / employee123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
