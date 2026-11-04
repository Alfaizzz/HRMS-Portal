import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  employeeApi,
  attendanceApi,
  leaveApi,
  salaryApi,
  libraryApi,
  calendarApi,
} from '../api';
import {
  Users,
  Clock,
  FileText,
  DollarSign,
  BookOpen,
  Calendar,
  Building2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { Leave, PunchInRecord, Holiday } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    activePunchInsToday: 0,
    pendingLeaves: 0,
    pendingSalaries: 0,
    issuedBooks: 0,
  });

  const [recentPunchIns, setRecentPunchIns] = useState<PunchInRecord[]>([]);
  const [pendingLeavesList, setPendingLeavesList] = useState<Leave[]>([]);
  const [nextHoliday, setNextHoliday] = useState<Holiday | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [employees, punchins, leaves, salaries, issuances, holidays] =
          await Promise.allSettled([
            employeeApi.getEmployees(),
            attendanceApi.getPunchIns(),
            leaveApi.getLeaves(),
            salaryApi.getSalaries(),
            libraryApi.getIssuances(),
            calendarApi.getHolidays(),
          ]);

        if (!mounted) return;

        const empList = employees.status === 'fulfilled' ? employees.value : [];
        const punchList = punchins.status === 'fulfilled' ? punchins.value : [];
        const leaveList = leaves.status === 'fulfilled' ? leaves.value : [];
        const salList = salaries.status === 'fulfilled' ? salaries.value : [];
        const issList = issuances.status === 'fulfilled' ? issuances.value : [];
        const holList = holidays.status === 'fulfilled' ? holidays.value : [];

        const pendingLeaves = leaveList.filter((l) => l.status === 'PENDING');
        const pendingSalaries = salList.filter((s) => s.status === 'PENDING');
        const activeLoans = issList.filter((i) => i.status === 'ISSUED');

        const todayStr = new Date().toISOString().split('T')[0];
        const upcomingHolidays = holList
          .filter((h) => h.holiday_date >= todayStr)
          .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

        setMetrics({
          totalEmployees: empList.length,
          activePunchInsToday: punchList.length,
          pendingLeaves: pendingLeaves.length,
          pendingSalaries: pendingSalaries.length,
          issuedBooks: activeLoans.length,
        });

        setRecentPunchIns(punchList.slice(0, 5));
        setPendingLeavesList(pendingLeaves.slice(0, 4));
        setNextHoliday(upcomingHolidays[0] || null);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleApproveLeave = async (id: number) => {
    try {
      await leaveApi.approveLeave(id);
      setPendingLeavesList((prev) => prev.filter((l) => l.id !== id));
      setMetrics((prev) => ({ ...prev, pendingLeaves: Math.max(0, prev.pendingLeaves - 1) }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectLeave = async (id: number) => {
    try {
      await leaveApi.rejectLeave(id);
      setPendingLeavesList((prev) => prev.filter((l) => l.id !== id));
      setMetrics((prev) => ({ ...prev, pendingLeaves: Math.max(0, prev.pendingLeaves - 1) }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {user?.first_name || 'Admin'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operations Console · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/employees/add')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Employee
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/library')}
            icon={<BookOpen className="w-3.5 h-3.5" />}
          >
            Manage Library
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Link to="/employees/list" className="block group">
          <Card className="hover:border-slate-400 dark:hover:border-slate-600 transition-all p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Staff</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
              {loading ? '—' : metrics.totalEmployees}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
              <span>View Directory</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        <Link to="/attendance/active-punchins" className="block group">
          <Card className="hover:border-slate-400 dark:hover:border-slate-600 transition-all p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Today</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
              {loading ? '—' : metrics.activePunchInsToday}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
              <span>Live Punch-ins</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        <Link to="/leaves" className="block group">
          <Card className="hover:border-slate-400 dark:hover:border-slate-600 transition-all p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Leaves</span>
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
              {loading ? '—' : metrics.pendingLeaves}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-amber-500 transition-colors">
              <span>Needs Approval</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        <Link to="/salary/list" className="block group">
          <Card className="hover:border-slate-400 dark:hover:border-slate-600 transition-all p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Payroll</span>
              <DollarSign className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
              {loading ? '—' : metrics.pendingSalaries}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-purple-500 transition-colors">
              <span>Review Slips</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        <Link to="/library" className="block group col-span-2 sm:col-span-1">
          <Card className="hover:border-slate-400 dark:hover:border-slate-600 transition-all p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Loans</span>
              <BookOpen className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
              {loading ? '—' : metrics.issuedBooks}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-rose-500 transition-colors">
              <span>Library Module</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Pending Action Items & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Live Punchins & Leaves to Review */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Leaves Request Widget */}
          <Card
            title="Leave Requests Awaiting Approval"
            subtitle="Review, approve, or reject employee leave applications"
            action={
              <Link to="/leaves" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                View all leaves
              </Link>
            }
          >
            {pendingLeavesList.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                No leave requests pending approval right now.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingLeavesList.map((leave) => (
                  <div key={leave.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {leave.user_name || leave.user_id}
                        </span>
                        <Badge variant="warning" size="sm">
                          {leave.leave_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Date: <span className="font-mono tabular-nums">{leave.leave_date}</span> · &ldquo;{leave.reason}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveLeave(leave.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectLeave(leave.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Live Attendance */}
          <Card
            title="Live Active Punch-ins (Today)"
            subtitle="Staff currently clocked into the workspace"
            action={
              <Link to="/attendance/active-punchins" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                View all active
              </Link>
            }
          >
            {recentPunchIns.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                No active punch-ins currently recorded for today.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPunchIns.map((p) => (
                  <div key={p.punchin_id} className="py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                        {p.user_name ? p.user_name[0] : 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {p.user_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {p.user_id}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success" size="sm">Punched In</Badge>
                      <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                        {p.punch_in_time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Modules & Holiday Spotlight */}
        <div className="space-y-6">
          {/* Upcoming Holiday */}
          <Card title="Upcoming Office Holiday">
            {nextHoliday ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {nextHoliday.description}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      {new Date(nextHoliday.holiday_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-indigo-500 shrink-0" />
                </div>
                <div className="pt-2">
                  <Link
                    to="/calendar"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>View full corporate calendar</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No upcoming holidays scheduled.</p>
            )}
          </Card>

          {/* Quick Module Shortcuts */}
          <Card title="System Management Modules">
            <div className="space-y-2">
              <Link
                to="/departments"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <Building2 className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                  <span>Departments Management</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/attendance/mark"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                  <span>Mark Attendance (Selfie Camera)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/salary/add"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <DollarSign className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                  <span>Generate Salary Record</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/library"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                  <span>Library &amp; Book Loans</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/resources"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <FileText className="w-4 h-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" />
                  <span>Resource &amp; Date Range Overview</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
