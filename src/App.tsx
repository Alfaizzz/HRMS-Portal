import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { DemoProvider } from './context/DemoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Lazy loading all pages for optimized code splitting
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const DepartmentManagement = lazy(() => import('./pages/DepartmentManagement'));
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'));
const AttendanceManagement = lazy(() => import('./pages/AttendanceManagement'));
const Leaves = lazy(() => import('./pages/Leaves'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SalaryPage = lazy(() => import('./pages/SalaryPage'));
const LibraryManagement = lazy(() => import('./pages/LibraryManagement'));
const ResourceOverview = lazy(() => import('./pages/ResourceOverview'));
const ProfileViewPage = lazy(() => import('./pages/ProfileViewPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected route guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root index redirect
const RootRedirect: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/employee/dashboard'} replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <DemoProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                    <div className="w-8 h-8 border-3 border-slate-300 dark:border-slate-700 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                  </div>
                }
              >
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<RootRedirect />} />

                  {/* Authenticated routes inside AppLayout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Admin Dashboard */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Employee Dashboard */}
                    <Route path="/employee/dashboard" element={<EmployeeDashboard />} />

                    {/* Departments (Admin only) */}
                    <Route
                      path="/departments"
                      element={
                        <ProtectedRoute adminOnly>
                          <DepartmentManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* Employee Management */}
                    <Route
                      path="/employees"
                      element={
                        <ProtectedRoute adminOnly>
                          <EmployeeManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/employees/*"
                      element={
                        <ProtectedRoute adminOnly>
                          <EmployeeManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* Attendance Module */}
                    <Route path="/attendance" element={<AttendanceManagement />} />
                    <Route path="/attendance/*" element={<AttendanceManagement />} />

                    {/* Leaves Module */}
                    <Route path="/leaves" element={<Leaves />} />

                    {/* Calendar & Holidays */}
                    <Route path="/calendar" element={<CalendarPage />} />

                    {/* Payroll & Salary */}
                    <Route path="/salary" element={<SalaryPage />} />
                    <Route path="/salary/*" element={<SalaryPage />} />

                    {/* Library Management (New Feature) */}
                    <Route path="/library" element={<LibraryManagement />} />

                    {/* Cross-Module Resource Overview (Admin only) */}
                    <Route
                      path="/resources"
                      element={
                        <ProtectedRoute adminOnly>
                          <ResourceOverview />
                        </ProtectedRoute>
                      }
                    />

                    {/* Profile */}
                    <Route path="/profile" element={<ProfileViewPage />} />

                    {/* 404 inside layout */}
                    <Route path="/404" element={<NotFound />} />
                  </Route>

                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </DemoProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
