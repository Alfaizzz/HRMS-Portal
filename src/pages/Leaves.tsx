import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { leaveApi } from '../api';
import { Leave, LeaveType } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Table, Column } from '../components/common/Table';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'CASUAL_LEAVE', label: 'Casual Leave' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'EARNED_LEAVE', label: 'Earned Leave / Annual Vacation' },
  { value: 'COMPENSATORY_OFF', label: 'Compensatory Off' },
  { value: 'BEREAVEMENT_LEAVE', label: 'Bereavement Leave' },
  { value: 'MATERNITY_LEAVE', label: 'Maternity Leave' },
  { value: 'PATERNITY_LEAVE', label: 'Paternity Leave' },
  { value: 'UNPAID_LEAVE', label: 'Unpaid Leave / LOP' },
];

export const Leaves: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: 'CASUAL_LEAVE' as LeaveType,
    leave_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
  });

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const data = await leaveApi.getLeaves();
      const scoped = isAdmin ? data : data.filter((l) => l.user_id === user?.user_id);
      setLeaves(scoped);
    } catch (e: any) {
      notifyError('Failed to load leaves: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [user, isAdmin]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.reason.trim()) {
      notifyError('Please state a reason for your leave request.');
      return;
    }

    try {
      await leaveApi.createLeave({
        user_id: user.user_id,
        leave_type: formData.leave_type,
        leave_date: formData.leave_date,
        reason: formData.reason,
      });

      success('Leave application submitted for approval!');
      setShowApplyModal(false);
      setFormData({
        leave_type: 'CASUAL_LEAVE',
        leave_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: '',
      });
      loadLeaves();
    } catch (err: any) {
      notifyError(err.message || 'Failed to submit leave');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await leaveApi.approveLeave(id);
      success('Leave application approved!');
      loadLeaves();
    } catch (err: any) {
      notifyError(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await leaveApi.rejectLeave(id);
      success('Leave application rejected.');
      loadLeaves();
    } catch (err: any) {
      notifyError(err.message || 'Failed to reject');
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  const columns: Column<Leave>[] = [
    ...(isAdmin
      ? [
          {
            key: 'user_name',
            label: 'Applicant',
            render: (l: Leave) => (
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {l.user_name || l.user_id}
                </div>
                <div className="text-xs text-slate-500 font-mono">ID: {l.user_id}</div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'leave_type',
      label: 'Leave Category',
      render: (l) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {l.leave_type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'leave_date',
      label: 'Leave Date',
      render: (l) => <span className="font-mono tabular-nums font-semibold">{l.leave_date}</span>,
    },
    {
      key: 'reason',
      label: 'Reason for Absence',
      render: (l) => <span className="text-xs text-slate-600 dark:text-slate-400">&ldquo;{l.reason}&rdquo;</span>,
    },
    {
      key: 'status',
      label: 'Approval Status',
      render: (l) => (
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isAdmin ? 'Leave & Absence Management' : 'My Leave Requests'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track annual leaves, casual time-off, sick days &amp; manager authorizations
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowApplyModal(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Apply for Leave
        </Button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Pending Authorization</span>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {leaves.filter((l) => l.status === 'PENDING').length}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Approved Absences</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {leaves.filter((l) => l.status === 'APPROVED').length}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Total Requests</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {leaves.length}
          </div>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredLeaves}
          loading={loading}
          actions={
            isAdmin
              ? [
                  {
                    label: 'Approve',
                    onClick: (l) => handleApprove(l.id),
                    disabled: (l) => l.status !== 'PENDING',
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                    className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300',
                  },
                  {
                    label: 'Reject',
                    onClick: (l) => handleReject(l.id),
                    disabled: (l) => l.status !== 'PENDING',
                    icon: <XCircle className="w-3.5 h-3.5" />,
                    className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300',
                  },
                ]
              : []
          }
          emptyMessage="No leave records found."
        />
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <Select
            label="Leave Type"
            value={formData.leave_type}
            onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as LeaveType })}
            options={LEAVE_TYPES}
            required
          />

          <Input
            label="Leave Date"
            type="date"
            value={formData.leave_date}
            onChange={(e) => setFormData({ ...formData, leave_date: e.target.value })}
            required
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
              Reason / Justification
            </label>
            <textarea
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Attending doctor appointment or family emergency..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Leave Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leaves;
