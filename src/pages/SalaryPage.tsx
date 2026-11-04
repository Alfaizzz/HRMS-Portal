import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { salaryApi, employeeApi } from '../api';
import { SalaryDetails, User } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Table, Column } from '../components/common/Table';
import {
  DollarSign,
  Plus,
  Printer,
  Download,
  Eye,
  Trash2,
  FileText,
  Calculator,
  Search,
  Building,
} from 'lucide-react';

export const SalaryPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [salaries, setSalaries] = useState<SalaryDetails[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalaryDetails | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    basic_salary: 50000,
    hra: 18000,
    food_allowance: 3500,
    travel_allowance: 5000,
    emp_tax: 2200,
    epf: 3800,
    paye: 1500,
    status: 'PAID' as 'PAID' | 'PENDING' | 'REJECTED',
  });

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const data = isAdmin
        ? await salaryApi.getSalaries()
        : await salaryApi.getSalariesByUserId(user?.user_id || '');
      setSalaries(data);

      if (isAdmin) {
        const emps = await employeeApi.getEmployees();
        setEmployees(emps);
      }
    } catch (err: any) {
      notifyError('Failed to load salary records: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaries();
  }, [user, isAdmin]);

  // Handle employee selection in Add Salary form to auto-fill base salary
  const handleSelectEmployee = (userId: string) => {
    const emp = employees.find((e) => e.user_id === userId);
    setFormData((prev) => ({
      ...prev,
      user_id: userId,
      basic_salary: emp ? Math.round(emp.salary * 0.6) : prev.basic_salary,
      hra: emp ? Math.round(emp.salary * 0.25) : prev.hra,
      food_allowance: 3500,
      travel_allowance: 4500,
      emp_tax: emp ? Math.round(emp.salary * 0.03) : prev.emp_tax,
      epf: emp ? Math.round(emp.salary * 0.05) : prev.epf,
      paye: emp ? Math.round(emp.salary * 0.02) : prev.paye,
    }));
  };

  const grossEarnings =
    Number(formData.basic_salary || 0) +
    Number(formData.hra || 0) +
    Number(formData.food_allowance || 0) +
    Number(formData.travel_allowance || 0);

  const totalDeductions =
    Number(formData.emp_tax || 0) +
    Number(formData.epf || 0) +
    Number(formData.paye || 0);

  const calculatedNet = grossEarnings - totalDeductions;

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) {
      notifyError('Please select a staff member.');
      return;
    }
    try {
      await salaryApi.createSalary({
        user_id: formData.user_id,
        date: formData.date,
        basic_salary: formData.basic_salary,
        hra: formData.hra,
        food_allowance: formData.food_allowance,
        travel_allowance: formData.travel_allowance,
        emp_tax: formData.emp_tax,
        epf: formData.epf,
        paye: formData.paye,
        status: formData.status,
      });

      success('Payroll record created successfully!');
      setShowAddModal(false);
      loadSalaries();
    } catch (err: any) {
      notifyError(err.message || 'Failed to create salary record');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'PAID' | 'PENDING' | 'REJECTED') => {
    try {
      await salaryApi.updateStatus(id, status);
      success(`Salary status updated to ${status}`);
      loadSalaries();
    } catch (err: any) {
      notifyError(err.message || 'Failed to update status');
    }
  };

  const handleDeleteSalary = async (id: number) => {
    if (!window.confirm('Delete this salary record?')) return;
    try {
      await salaryApi.deleteSalary(id);
      success('Salary record removed');
      loadSalaries();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete record');
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const filteredSalaries = salaries.filter((s) => {
    const matchesUser =
      (s.user_name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.user_id.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesUser && matchesStatus;
  });

  const columns: Column<SalaryDetails>[] = [
    {
      key: 'user_name',
      label: 'Staff Member',
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {s.user_name || s.user_id}
          </div>
          <div className="text-xs text-slate-500 font-mono">ID: {s.user_id}</div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Pay Period Date',
      render: (s) => <span className="font-mono tabular-nums">{s.date}</span>,
    },
    {
      key: 'basic_pay',
      label: 'Basic Pay',
      align: 'right',
      render: (s) => `₹${s.basic_pay?.toLocaleString('en-IN')}`,
    },
    {
      key: 'net_salary',
      label: 'Net Pay',
      align: 'right',
      render: (s) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          ₹{s.net_salary?.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => (
        <Badge
          variant={
            s.status === 'PAID'
              ? 'success'
              : s.status === 'REJECTED'
              ? 'danger'
              : 'warning'
          }
          size="sm"
        >
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'slip',
      label: 'Salary Slip',
      align: 'center',
      render: (s) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedSlip(s)}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          View Slip
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isAdmin ? 'Payroll & Salary Management' : 'My Salary & Pay Slips'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Process allowances, generate pay slips & manage employee compensation'
              : 'View compensation history, tax breakdowns & download salary slips'}
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Generate Salary Record
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Payroll Records</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {salaries.length}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Disbursed (Paid)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {salaries.filter((s) => s.status === 'PAID').length}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Approval</span>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {salaries.filter((s) => s.status === 'PENDING').length}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {isAdmin && (
            <div className="flex-1">
              <Input
                placeholder="Search by employee name or ID..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          )}
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PAID', label: 'Paid' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredSalaries}
          actions={
            isAdmin
              ? [
                  {
                    label: 'Mark Paid',
                    onClick: (s) => handleUpdateStatus(s.id, 'PAID'),
                    disabled: (s) => s.status === 'PAID',
                    className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300',
                  },
                  {
                    label: 'Delete',
                    onClick: (s) => handleDeleteSalary(s.id),
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300',
                  },
                ]
              : []
          }
          emptyMessage="No salary records found."
        />
      </Card>

      {/* Modal: Generate Salary (Admin) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Generate Employee Salary Record"
        size="lg"
      >
        <form onSubmit={handleCreateSalary} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Staff Member"
              value={formData.user_id}
              onChange={(e) => handleSelectEmployee(e.target.value)}
              options={[
                { value: '', label: '-- Select Employee --' },
                ...employees.map((e) => ({
                  value: e.user_id,
                  label: `${e.first_name} ${e.last_name} (${e.user_id}) - ₹${e.salary.toLocaleString('en-IN')}`,
                })),
              ]}
              required
            />
            <Input
              label="Pay Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Earnings &amp; Allowances (₹)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Basic Salary"
                type="number"
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="HRA"
                type="number"
                value={formData.hra}
                onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Food Allowance"
                type="number"
                value={formData.food_allowance}
                onChange={(e) => setFormData({ ...formData, food_allowance: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Travel Allowance"
                type="number"
                value={formData.travel_allowance}
                onChange={(e) => setFormData({ ...formData, travel_allowance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
              Gross Earnings: <span className="font-mono tabular-nums">₹{grossEarnings.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-3">
              Deductions (₹)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Employee Tax (TDS)"
                type="number"
                value={formData.emp_tax}
                onChange={(e) => setFormData({ ...formData, emp_tax: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="EPF Contribution"
                type="number"
                value={formData.epf}
                onChange={(e) => setFormData({ ...formData, epf: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="PAYE Deduction"
                type="number"
                value={formData.paye}
                onChange={(e) => setFormData({ ...formData, paye: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="text-right text-xs font-semibold text-rose-700 dark:text-rose-400 mt-2">
              Total Deductions: <span className="font-mono tabular-nums">₹{totalDeductions.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">Calculated Net Pay</span>
              <span className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                ₹{calculatedNet.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-36">
              <Select
                label="Disbursement Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'PAID', label: 'Paid' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={<Calculator className="w-4 h-4" />}>
              Save &amp; Generate Slip
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Printable / Downloadable Salary Slip */}
      {selectedSlip && (
        <Modal
          isOpen={Boolean(selectedSlip)}
          onClose={() => setSelectedSlip(null)}
          title={`Salary Slip — ${selectedSlip.date}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                Ref Slip ID: #{selectedSlip.id}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedSlip(null)}>
                  Close
                </Button>
                <Button onClick={handlePrintSlip} icon={<Printer className="w-4 h-4" />}>
                  Print / Save PDF
                </Button>
              </div>
            </div>
          }
        >
          {/* Printable Container Target */}
          <div
            id="printable-salary-slip"
            className="p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6"
          >
            {/* Slip Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    H
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">HRMS Global Enterprise Inc.</h2>
                    <p className="text-xs text-slate-500">Corporate HQ · 100 Innovation Parkway · Tech City</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Payslip For Period
                </span>
                <span className="text-sm font-bold font-mono">{selectedSlip.date}</span>
                <div className="mt-1">
                  <Badge variant={selectedSlip.status === 'PAID' ? 'success' : 'warning'} size="sm">
                    {selectedSlip.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Employee Meta Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 block">Employee Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedSlip.user_name || selectedSlip.user_id}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Staff User ID</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">
                  {selectedSlip.user_id}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Pay Slip ID</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">
                  SLP-{selectedSlip.id.toString().padStart(6, '0')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Mode</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Direct Bank Transfer</span>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Earnings column */}
              <div>
                <div className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                  <span>Earnings Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 py-2 space-y-1.5">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                    <span className="font-mono tabular-nums font-semibold">
                      ₹{selectedSlip.basic_pay?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</span>
                    <span className="font-mono tabular-nums font-semibold">
                      ₹{selectedSlip.hra?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Food &amp; Meal Allowance</span>
                    <span className="font-mono tabular-nums font-semibold">
                      ₹{selectedSlip.food_allowance?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Travel &amp; Conveyance Allowance</span>
                    <span className="font-mono tabular-nums font-semibold">
                      ₹{selectedSlip.travel_allowance?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <span>Gross Earnings</span>
                  <span className="font-mono tabular-nums">
                    ₹{(
                      Number(selectedSlip.basic_pay || 0) +
                      Number(selectedSlip.hra || 0) +
                      Number(selectedSlip.food_allowance || 0) +
                      Number(selectedSlip.travel_allowance || 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Deductions column */}
              <div>
                <div className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                  <span>Deductions Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 py-2 space-y-1.5">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Tax Deducted at Source (TDS)</span>
                    <span className="font-mono tabular-nums font-semibold text-rose-600">
                      ₹{selectedSlip.emp_tax?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Employees Provident Fund (EPF)</span>
                    <span className="font-mono tabular-nums font-semibold text-rose-600">
                      ₹{selectedSlip.epf?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Professional Tax / PAYE</span>
                    <span className="font-mono tabular-nums font-semibold text-rose-600">
                      ₹{selectedSlip.paye?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400">
                  <span>Total Deductions</span>
                  <span className="font-mono tabular-nums">
                    ₹{(
                      Number(selectedSlip.emp_tax || 0) +
                      Number(selectedSlip.epf || 0) +
                      Number(selectedSlip.paye || 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Net Disbursed Compensation
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Direct Credit confirmed to designated employee bank account
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-100">
                  ₹{selectedSlip.net_salary?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Footer Notice & Signatures */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between text-[11px] text-slate-500">
              <div>
                <p>This is a computer-generated salary slip and requires no physical signature.</p>
                <p className="mt-0.5">HRMS Platform v2.4 · Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <span>Authorized Signatory</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalaryPage;
