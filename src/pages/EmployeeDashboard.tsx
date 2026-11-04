import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  attendanceApi,
  leaveApi,
  salaryApi,
  libraryApi,
  calendarApi,
} from '../api';
import {
  Clock,
  FileText,
  DollarSign,
  BookOpen,
  Calendar,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Building2,
  Download,
} from 'lucide-react';
import { AttendanceRecord, Leave, SalaryDetails, BookIssuance, Holiday } from '../types';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord | null>(null);
  const [activePunchIn, setActivePunchIn] = useState<boolean>(false);
  const [upcomingLeaves, setUpcomingLeaves] = useState<Leave[]>([]);
  const [latestSalary, setLatestSalary] = useState<SalaryDetails | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BookIssuance[]>([]);
  const [nextHoliday, setNextHoliday] = useState<Holiday | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadEmployeeData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [recordsRes, punchInsRes, leavesRes, salariesRes, issuancesRes, holidaysRes] =
          await Promise.allSettled([
            attendanceApi.getAttendanceRecords(user.user_id),
            attendanceApi.getPunchIns(),
            leaveApi.getLeaves(),
            salaryApi.getSalariesByUserId(user.user_id),
            libraryApi.getIssuances(user.user_id),
            calendarApi.getHolidays(),
          ]);

        if (!mounted) return;

        const records = recordsRes.status === 'fulfilled' ? recordsRes.value : [];
        const punchIns = punchInsRes.status === 'fulfilled' ? punchInsRes.value : [];
        const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value : [];
        const salaries = salariesRes.status === 'fulfilled' ? salariesRes.value : [];
        const issuances = issuancesRes.status === 'fulfilled' ? issuancesRes.value : [];
        const holidays = holidaysRes.status === 'fulfilled' ? holidaysRes.value : [];

        // Check active punchin today
        const isPunchedIn = punchIns.some((p) => p.user_id === user.user_id);
        setActivePunchIn(isPunchedIn);
        setRecentAttendance(records[0] || null);

        // Filter user leaves
        const myLeaves = leaves.filter((l) => l.user_id === user.user_id);
        setUpcomingLeaves(myLeaves.slice(0, 3));

        // Latest salary
        setLatestSalary(salaries[0] || null);

        // Active borrowed books
        setBorrowedBooks(issuances.filter((i) => i.status === 'ISSUED'));

        // Next holiday
        const todayStr = new Date().toISOString().split('T')[0];
        const upcomingHolidays = holidays
          .filter((h) => h.holiday_date >= todayStr)
          .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
        setNextHoliday(upcomingHolidays[0] || null);
      } catch (e) {
        console.error('Failed to load employee dashboard:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEmployeeData();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header Profile Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-lg shadow-sm">
            {user?.first_name ? user.first_name[0] : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome, {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.job_profile || 'Staff Member'} · Dept: {user?.department_id || 'Engineering'} · ID: <span className="font-mono">{user?.user_id}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/attendance/mark')}
            icon={<Clock className="w-3.5 h-3.5" />}
          >
            {activePunchIn ? 'Punch Out' : 'Punch In with Selfie'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/library')}
            icon={<BookOpen className="w-3.5 h-3.5" />}
          >
            Browse Library
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Today&apos;s Status</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={activePunchIn ? 'success' : 'neutral'} size="md">
              {activePunchIn ? 'Clocked In' : 'Not Clocked In'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {recentAttendance
              ? `Last punch: ${recentAttendance.punch_in_time} (${recentAttendance.date})`
              : 'No check-in yet today'}
          </div>
        </Card>

        {/* Latest Salary */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Latest Net Salary</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
            {latestSalary ? `₹${latestSalary.net_salary.toLocaleString('en-IN')}` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{latestSalary ? latestSalary.date : 'Pending cycle'}</span>
            <Link to="/salary" className="text-blue-600 dark:text-blue-400 hover:underline">
              View Slip
            </Link>
          </div>
        </Card>

        {/* Borrowed Books */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Library Books Issued</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
            {borrowedBooks.length} {borrowedBooks.length === 1 ? 'Book' : 'Books'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{borrowedBooks.length > 0 ? 'Active reading' : 'No active loans'}</span>
            <Link to="/library" className="text-purple-600 dark:text-purple-400 hover:underline">
              Details
            </Link>
          </div>
        </Card>

        {/* Upcoming Holiday */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Next Holiday</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {nextHoliday ? nextHoliday.description : 'None soon'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {nextHoliday ? nextHoliday.holiday_date : 'Regular schedule'}
          </div>
        </Card>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Books Currently Issued to Employee */}
          <Card
            title="My Borrowed Library Books"
            subtitle="Books in your possession from the company technical library"
            action={
              <Link to="/library" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Browse catalogue
              </Link>
            }
          >
            {borrowedBooks.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p>You do not have any borrowed books right now.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate('/library')}
                >
                  Explore Books &amp; Request
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {borrowedBooks.map((b) => (
                  <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {b.bookTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        ISBN: <span className="font-mono">{b.isbn}</span> · Issued:{' '}
                        <span className="font-mono">{b.issueDate}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Due Date</span>
                        <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {b.dueDate}
                        </span>
                      </div>
                      <Badge variant="info" size="sm">Issued</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Leaves */}
          <Card
            title="My Leave Applications"
            subtitle="Recent and upcoming leave requests"
            action={
              <Link to="/leaves" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Apply for leave
              </Link>
            }
          >
            {upcomingLeaves.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                No leave requests found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingLeaves.map((l) => (
                  <div key={l.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {l.leave_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {l.leave_date} · &ldquo;{l.reason}&rdquo;
                      </div>
                    </div>
                    <Badge
                      variant={
                        l.status === 'APPROVED'
                          ? 'success'
                          : l.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {l.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Shortcuts */}
        <div className="space-y-6">
          <Card title="Quick Actions">
            <div className="space-y-2">
              <Link
                to="/attendance/mark"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Punch In / Out with Camera</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/salary"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span>Download Salary Slip</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/leaves"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Apply for Time Off</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/library"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>Request a Technical Book</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>View Personal &amp; Bank Profile</span>
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

export default EmployeeDashboard;
