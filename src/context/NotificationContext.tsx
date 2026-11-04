import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: NotificationType = 'info', title?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const item: NotificationItem = { id, type, title, message };

      setNotifications((prev) => [...prev, item]);

      setTimeout(() => {
        removeNotification(id);
      }, 4500);
    },
    [removeNotification]
  );

  const success = useCallback((msg: string, title?: string) => notify(msg, 'success', title), [notify]);
  const error = useCallback((msg: string, title?: string) => notify(msg, 'error', title), [notify]);
  const info = useCallback((msg: string, title?: string) => notify(msg, 'info', title), [notify]);
  const warning = useCallback((msg: string, title?: string) => notify(msg, 'warning', title), [notify]);

  return (
    <NotificationContext.Provider
      value={{ notify, success, error, info, warning, removeNotification }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {notifications.map((n) => {
          const bgColors = {
            success: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
            error: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100',
            warning: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
            info: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
          };

          return (
            <div
              key={n.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 transition-all duration-200 ${bgColors[n.type]}`}
            >
              {icons[n.type]}
              <div className="flex-1 text-sm">
                {n.title && <div className="font-semibold">{n.title}</div>}
                <div className="opacity-90">{n.message}</div>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="opacity-50 hover:opacity-100 transition-opacity p-0.5 rounded"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
