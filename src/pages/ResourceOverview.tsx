import React, { useState } from 'react';
import { attendanceApi, employeeApi } from '../api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Table, Column } from '../components/common/Table';
import { AttendanceRecord, Leave } from '../types';
import { Layers, Search, Clock, Calendar } from 'lucide-react';

export const ResourceOverview: React.FC = () => {
  const [userId, setUserId] = useState('employee');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('Please provide an Employee User ID');
      return;
    }
    setError(null);
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await attendanceApi.getUserResources(userId, startDate, endDate);
      setRecords(data.attendanceRecords || []);
      setLeaves(data.leaves || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resource records');
    } finally {
      setLoading(false);
    }
  };

  const attendanceCols: Column<AttendanceRecord>[] = [
    { key: 'date', label: 'Date', render: (r) => <span className="font-mono tabular-nums">{r.date}</span> },
    { key: 'punch_in_time', label: 'Punch In', render: (r) => <span className="font-mono tabular-nums">{r.punch_in_time}</span> },
    { key: 'punch_out_time', label: 'Punch Out', render: (r) => <span className="font-mono tabular-nums">{r.punch_out_time || '—'}</span> },
    {
      key: 'hours',
      label: 'Duration Worked',
      render: (r) => (
        <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
          {r.hours || 'In Session'}
        </span>
      ),
    },
  ];

  const leaveCols: Column<Leave>[] = [
    { key: 'leave_date', label: 'Leave Date', render: (l) => <span className="font-mono tabular-nums font-semibold">{l.leave_date}</span> },
    { key: 'leave_type', label: 'Leave Category', render: (l) => l.leave_type.replace(/_/g, ' ') },
    { key: 'reason', label: 'Reason', render: (l) => <span className="text-xs text-slate-500">&ldquo;{l.reason}&rdquo;</span> },
    { key: 'status', label: 'Status', render: (l) => <Badge variant={l.status === 'APPROVED' ? 'success' : 'warning'} size="sm">{l.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Resource &amp; Date Range Overview
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Query cross-module employee attendance duration and availed time-off by date range
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleFetch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Staff User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. employee or shivam"
              required
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={loading} icon={<Search className="w-4 h-4" />}>
              Generate Report
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 text-xs border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      )}

      {hasSearched && !loading && (
        <div className="space-y-6">
          <Card
            title={`Attendance Sessions (${records.length})`}
            subtitle={`Punched presence within ${startDate} to ${endDate}`}
          >
            <Table
              columns={attendanceCols}
              data={records}
              emptyMessage="No attendance sessions recorded in this date range."
            />
          </Card>

          <Card
            title={`Approved Leaves (${leaves.length})`}
            subtitle={`Absences within ${startDate} to ${endDate}`}
          >
            <Table
              columns={leaveCols}
              data={leaves}
              emptyMessage="No leaves filed or approved in this date range."
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResourceOverview;
