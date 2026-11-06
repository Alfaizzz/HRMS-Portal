import React, { createContext, useContext, useState, useEffect } from 'react';
import { isDemoMode, setDemoMode as persistDemoMode } from '../config/demoConfig';
import { REAL_API_BASE_URL } from '../api/apiClient';
import { resetMockDatabase } from '../api/mockService';
import { useNotification } from './NotificationContext';

interface DemoContextType {
  demoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (val: boolean) => void;
  resetDemoData: () => void;
  backendUrl: string;
  backendOffline: boolean;
  dismissOfflineBanner: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demoMode, setDemoModeState] = useState<boolean>(isDemoMode);
  const [backendOffline, setBackendOffline] = useState<boolean>(false);
  const { info, warning, success } = useNotification();

  useEffect(() => {
    const handleStorageChange = () => {
      setDemoModeState(isDemoMode());
    };
    window.addEventListener('hrms-demo-mode-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    const handleBackendOffline = (e: any) => {
      if (!isDemoMode()) {
        setBackendOffline(true);
        warning(
          'The HRMS backend is not responding. You can toggle to Demo Mode for instant presentation.',
          'Backend Offline'
        );
      }
    };
    window.addEventListener('hrms-backend-offline', handleBackendOffline);

    return () => {
      window.removeEventListener('hrms-demo-mode-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('hrms-backend-offline', handleBackendOffline);
    };
  }, [warning]);

  const toggleDemoMode = () => {
    const next = !demoMode;
    persistDemoMode(next);
    setDemoModeState(next);
    setBackendOffline(false);
    if (next) {
      info('Switched to Demo Mode (using mock APIs and demo data).');
    } else {
      info(`Switched to Real Backend Mode (targeting ${REAL_API_BASE_URL}).`);
    }
  };

  const setDemoMode = (val: boolean) => {
    persistDemoMode(val);
    setDemoModeState(val);
    setBackendOffline(false);
  };

  const resetDemoData = () => {
    resetMockDatabase();
    success('Demo data restored to pristine initial state.');
  };

  const dismissOfflineBanner = () => {
    setBackendOffline(false);
  };

  return (
    <DemoContext.Provider
      value={{
        demoMode,
        toggleDemoMode,
        setDemoMode,
        resetDemoData,
        backendUrl: REAL_API_BASE_URL,
        backendOffline,
        dismissOfflineBanner,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
