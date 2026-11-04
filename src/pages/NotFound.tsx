import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { Button } from '../components/common/Button';
import { AlertCircle, Home, LogIn, ToggleRight, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { demoMode, toggleDemoMode } = useDemo();
  const navigate = useNavigate();

  const homePath = user
    ? isAdmin
      ? '/admin/dashboard'
      : '/employee/dashboard'
    : '/login';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2">
        The route you requested does not exist or may have been relocated. If you are experiencing backend connectivity issues, you can toggle into Demo Mode below.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>

        <Link to={homePath}>
          <Button icon={<Home className="w-4 h-4" />}>
            {user ? 'Return to Dashboard' : 'Back to Login'}
          </Button>
        </Link>

        {!demoMode && (
          <Button
            variant="secondary"
            onClick={toggleDemoMode}
            icon={<ToggleRight className="w-4 h-4 text-emerald-500" />}
          >
            Switch to Demo Mode
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotFound;
