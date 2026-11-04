import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { calendarApi } from '../api';
import { Holiday } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Table, Column } from '../components/common/Table';
import { Calendar as CalendarIcon, Plus, Trash2, Sparkles, Clock } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ holiday_date: '', description: '' });

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await calendarApi.getHolidays();
      setHolidays(data);
    } catch (e: any) {
      notifyError('Failed to load calendar: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.holiday_date || !newHoliday.description.trim()) {
      notifyError('Date and description are required');
      return;
    }
    try {
      await calendarApi.addHoliday(newHoliday);
      success('Holiday added to calendar!');
      setShowAddModal(false);
      setNewHoliday({ holiday_date: '', description: '' });
      loadHolidays();
    } catch (err: any) {
      notifyError(err.message || 'Failed to add holiday');
    }
  };

  const handleDelete = async (date: string) => {
    if (!window.confirm(`Delete holiday for date ${date}?`)) return;
    try {
      await calendarApi.deleteHoliday(date);
      success('Holiday removed');
      loadHolidays();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = holidays.filter((h) => h.holiday_date >= todayStr);
  const nextHoliday = upcoming[0] || null;

  const columns: Column<Holiday>[] = [
    {
      key: 'holiday_date',
      label: 'Holiday Date',
      render: (h) => (
        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
          {new Date(h.holiday_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Observance / Holiday Name',
      render: (h) => (
        <span className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {h.holiday_date === todayStr && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">
              Today
            </span>
          )}
          <span>{h.description}</span>
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Timeline',
      render: (h) => {
        const isPast = h.holiday_date < todayStr;
        return (
          <span className={`text-xs ${isPast ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}`}>
            {isPast ? 'Past Holiday' : 'Upcoming'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Corporate Office Calendar
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official holidays, national observances &amp; scheduled office closures
          </p>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={() => setShowAddModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Holiday
          </Button>
        )}
      </div>

      {/* Next Holiday Banner */}
      {nextHoliday && (
        <Card className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-purple-200 dark:border-purple-900/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Upcoming Holiday
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {nextHoliday.description}
                </h3>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-500 block">Date</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                {new Date(nextHoliday.holiday_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card title="All Scheduled Corporate Holidays" subtitle="Current calendar year">
        <Table
          columns={columns}
          data={holidays}
          loading={loading}
          actions={
            isAdmin
              ? [
                  {
                    label: 'Delete',
                    onClick: (h) => handleDelete(h.holiday_date),
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300',
                  },
                ]
              : []
          }
          emptyMessage="No holidays scheduled in the calendar."
        />
      </Card>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Mark Corporate Holiday"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Holiday Date"
            type="date"
            value={newHoliday.holiday_date}
            onChange={(e) => setNewHoliday({ ...newHoliday, holiday_date: e.target.value })}
            required
          />
          <Input
            label="Observance / Description"
            value={newHoliday.description}
            onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
            placeholder="e.g. Independence Day or Diwali"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarPage;
