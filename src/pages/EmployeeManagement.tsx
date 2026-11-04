import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  employeeApi,
  departmentApi,
  bankDetailsApi,
  educationApi,
  experienceApi,
  assetsApi,
} from '../api';
import {
  User,
  Department,
  BankDetails,
  EducationalDetails,
  Experience,
  CompanyAsset,
} from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Table, Column } from '../components/common/Table';
import {
  Users,
  Plus,
  Eye,
  Trash2,
  Search,
  UserCheck,
  UserX,
  Building2,
  Briefcase,
  GraduationCap,
  Landmark,
  Laptop,
} from 'lucide-react';

export const EmployeeManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error: notifyError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active view: 'active' | 'add' | 'ex-employees'
  const [activeTab, setActiveTab] = useState<'active' | 'add' | 'ex-employees'>('active');

  const [employees, setEmployees] = useState<User[]>([]);
  const [exEmployees, setExEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Employee Details Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBank, setUserBank] = useState<BankDetails | null>(null);
  const [userEdu, setUserEdu] = useState<EducationalDetails | null>(null);
  const [userExp, setUserExp] = useState<Experience[]>([]);
  const [userAssets, setUserAssets] = useState<CompanyAsset[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Multi-step Registration Form
  const [formStep, setFormStep] = useState<'personal' | 'bank' | 'edu' | 'exp' | 'assets'>('personal');
  const [newEmp, setNewEmp] = useState<Partial<User>>({
    first_name: '',
    last_name: '',
    email_id: '',
    mobile_number: '',
    department_id: '',
    job_profile: '',
    salary: 60000,
    role: 'USER',
    blood_group: 'O+',
    dob: '1995-05-15',
    doj: new Date().toISOString().split('T')[0],
    pan_number: '',
    father_name: '',
    mother_name: '',
    current_address: '',
    permanent_address: '',
    nationality: 'Indian',
    religion: 'Secular',
  });

  const [newBank, setNewBank] = useState<Partial<BankDetails>>({
    bank_name: 'HDFC Bank',
    account_number: '',
    ifsc_code: 'HDFC0001234',
    branch_name: 'Tech City Branch',
  });

  const [newEdu, setNewEdu] = useState<Partial<EducationalDetails>>({
    highschool: 90,
    secondaryschool: 88,
    bachelor: 85,
    highschoolname: '',
    bachelorcollegename: '',
  });

  const [newExp, setNewExp] = useState<Partial<Experience>>({
    previous_employer: '',
    job_profile: '',
    yoe: 2,
    dor: '',
  });

  const [newAsset, setNewAsset] = useState<Partial<CompanyAsset>>({
    asset_name: 'MacBook Pro 14"',
    asset_type: 'Laptop Hardware',
    asset_id: '',
    asset_issue_date: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, exEmps, depts] = await Promise.all([
        employeeApi.getEmployees(),
        employeeApi.getDeletedEmployees(),
        departmentApi.getDepartments(),
      ]);
      setEmployees(emps);
      setExEmployees(exEmps);
      setDepartments(depts);
      if (depts.length > 0 && !newEmp.department_id) {
        setNewEmp((prev) => ({ ...prev, department_id: depts[0].department_id }));
      }
    } catch (e: any) {
      notifyError('Failed to load employee directory: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // View full details of an employee
  const handleViewEmployee = async (emp: User) => {
    setSelectedUser(emp);
    setDetailsLoading(true);
    try {
      const [bank, edu, exp, assets] = await Promise.all([
        bankDetailsApi.getBankDetails(emp.user_id),
        educationApi.getEducation(emp.user_id),
        experienceApi.getExperience(emp.user_id),
        assetsApi.getAssets(emp.user_id),
      ]);
      setUserBank(bank);
      setUserEdu(edu);
      setUserExp(exp);
      setUserAssets(assets);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Delete employee (Soft delete / Deactivate)
  const handleDeleteEmployee = async (userId: string) => {
    if (!window.confirm(`Deactivate employee account ${userId}? They will be moved to Ex-Employees.`)) {
      return;
    }
    try {
      await employeeApi.deleteEmployee(userId);
      success(`Employee ${userId} moved to Ex-Employees directory.`);
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete employee');
    }
  };

  // Reactivate Ex-Employee
  const handleActivateEmployee = async (userId: string) => {
    try {
      await employeeApi.activateEmployee(userId);
      success(`Employee ${userId} reactivated successfully!`);
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to reactivate employee');
    }
  };

  // Submit complete onboarding
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.first_name || !newEmp.last_name || !newEmp.email_id) {
      notifyError('Please complete all required personal details');
      return;
    }

    try {
      const res = await employeeApi.createEmployee(newEmp);
      const generatedId = res.user_id;

      // Save related entities
      if (newBank.account_number) {
        await bankDetailsApi.addBankDetails({
          ...newBank,
          user_id: generatedId,
        } as BankDetails);
      }

      if (newEdu.highschool) {
        await educationApi.addEducation({
          ...newEdu,
          user_id: generatedId,
        } as EducationalDetails);
      }

      if (newExp.previous_employer) {
        await experienceApi.addExperience({
          ...newExp,
          user_id: generatedId,
        } as Experience);
      }

      if (newAsset.asset_id) {
        await assetsApi.addAsset({
          ...newAsset,
          user_id: generatedId,
        } as CompanyAsset);
      }

      success(`Employee onboarding completed! Generated ID: ${generatedId}`);
      setActiveTab('active');
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Registration failed');
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.user_id.toLowerCase().includes(q) ||
      e.email_id.toLowerCase().includes(q) ||
      e.department_id.toLowerCase().includes(q) ||
      e.job_profile.toLowerCase().includes(q)
    );
  });

  const employeeColumns: Column<User>[] = [
    {
      key: 'name',
      label: 'Staff Member',
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 dark:ring-slate-700">
            {e.first_name[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {e.first_name} {e.last_name}
            </div>
            <div className="text-xs text-slate-500 font-mono">ID: {e.user_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'job_profile',
      label: 'Designation / Role',
      render: (e) => (
        <div>
          <div className="text-sm text-slate-800 dark:text-slate-200">{e.job_profile}</div>
          <div className="text-xs text-slate-400">Dept: {e.department_id}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (e) => (
        <div className="text-xs">
          <div className="text-slate-800 dark:text-slate-200">{e.email_id}</div>
          <div className="text-slate-400 font-mono">{e.mobile_number}</div>
        </div>
      ),
    },
    {
      key: 'salary',
      label: 'Annual CTC',
      align: 'right',
      render: (e) => (
        <span className="font-mono tabular-nums font-semibold">
          ₹{(e.salary * 12).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (e) => <Badge variant="success" size="sm">Active</Badge>,
    },
  ];

  const exEmployeeColumns: Column<User>[] = [
    {
      key: 'name',
      label: 'Ex-Employee',
      render: (e) => (
        <div>
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            {e.first_name} {e.last_name}
          </div>
          <div className="text-xs text-slate-500 font-mono">ID: {e.user_id}</div>
        </div>
      ),
    },
    {
      key: 'department_id',
      label: 'Department',
    },
    {
      key: 'email_id',
      label: 'Email',
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="danger" size="sm">Inactive</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Employee Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Directory, profiles, onboarding registration &amp; ex-employee records
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setActiveTab(activeTab === 'add' ? 'active' : 'add')}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              {activeTab === 'add' ? 'View Directory' : 'Onboard New Employee'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Active Staff ({employees.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'add'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Onboarding Form</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('ex-employees')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'ex-employees'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Ex-Employees ({exEmployees.length})</span>
          </button>
        )}
      </div>

      {/* Tab 1: Active Directory */}
      {activeTab === 'active' && (
        <Card>
          <div className="mb-4">
            <Input
              placeholder="Search staff by name, user ID, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <Table
            columns={employeeColumns}
            data={filteredEmployees}
            loading={loading}
            actions={[
              {
                label: 'View Profile',
                onClick: handleViewEmployee,
                icon: <Eye className="w-3.5 h-3.5" />,
              },
              ...(isAdmin
                ? [
                    {
                      label: 'Deactivate',
                      onClick: (e: User) => handleDeleteEmployee(e.user_id),
                      icon: <Trash2 className="w-3.5 h-3.5" />,
                      className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300',
                    },
                  ]
                : []),
            ]}
            emptyMessage="No employees found matching query."
          />
        </Card>
      )}

      {/* Tab 2: Onboard New Employee Multi-step */}
      {activeTab === 'add' && isAdmin && (
        <Card title="New Employee Onboarding" subtitle="Add complete employee records">
          <form onSubmit={handleCompleteRegistration} className="space-y-6">
            {/* Step sub-navigation */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFormStep('personal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  formStep === 'personal'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                1. Personal Details
              </button>
              <button
                type="button"
                onClick={() => setFormStep('bank')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  formStep === 'bank'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                2. Bank Account
              </button>
              <button
                type="button"
                onClick={() => setFormStep('edu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  formStep === 'edu'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                3. Education
              </button>
              <button
                type="button"
                onClick={() => setFormStep('exp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  formStep === 'exp'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                4. Experience
              </button>
              <button
                type="button"
                onClick={() => setFormStep('assets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  formStep === 'assets'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                5. Company Assets
              </button>
            </div>

            {/* Step 1: Personal */}
            {formStep === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={newEmp.first_name}
                    onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={newEmp.last_name}
                    onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Corporate Email"
                    type="email"
                    value={newEmp.email_id}
                    onChange={(e) => setNewEmp({ ...newEmp, email_id: e.target.value })}
                    helperText="User ID will automatically derive from the email prefix (e.g. john.doe@company.com -> john.doe)"
                    required
                  />
                  <Input
                    label="Mobile Number"
                    value={newEmp.mobile_number}
                    onChange={(e) => setNewEmp({ ...newEmp, mobile_number: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Department"
                    value={newEmp.department_id}
                    onChange={(e) => setNewEmp({ ...newEmp, department_id: e.target.value })}
                    options={departments.map((d) => ({
                      value: d.department_id,
                      label: `${d.department_name} (${d.department_id})`,
                    }))}
                  />
                  <Input
                    label="Job Profile / Title"
                    value={newEmp.job_profile}
                    onChange={(e) => setNewEmp({ ...newEmp, job_profile: e.target.value })}
                    placeholder="e.g. Senior Backend Engineer"
                    required
                  />
                  <Input
                    label="Monthly Base Salary (₹)"
                    type="number"
                    value={newEmp.salary}
                    onChange={(e) => setNewEmp({ ...newEmp, salary: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={newEmp.dob}
                    onChange={(e) => setNewEmp({ ...newEmp, dob: e.target.value })}
                  />
                  <Input
                    label="Date of Joining"
                    type="date"
                    value={newEmp.doj}
                    onChange={(e) => setNewEmp({ ...newEmp, doj: e.target.value })}
                  />
                  <Input
                    label="PAN Card Number"
                    value={newEmp.pan_number}
                    onChange={(e) => setNewEmp({ ...newEmp, pan_number: e.target.value })}
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => setFormStep('bank')}>
                    Next: Bank Details →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Bank */}
            {formStep === 'bank' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Bank Name"
                    value={newBank.bank_name}
                    onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })}
                  />
                  <Input
                    label="Account Number"
                    value={newBank.account_number}
                    onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
                    placeholder="e.g. 50100291827"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="IFSC Code"
                    value={newBank.ifsc_code}
                    onChange={(e) => setNewBank({ ...newBank, ifsc_code: e.target.value })}
                    placeholder="HDFC0001234"
                  />
                  <Input
                    label="Branch Name"
                    value={newBank.branch_name}
                    onChange={(e) => setNewBank({ ...newBank, branch_name: e.target.value })}
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setFormStep('personal')}>
                    ← Back to Personal
                  </Button>
                  <Button type="button" onClick={() => setFormStep('edu')}>
                    Next: Education →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Education */}
            {formStep === 'edu' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Bachelor Degree College"
                    value={newEdu.bachelorcollegename}
                    onChange={(e) => setNewEdu({ ...newEdu, bachelorcollegename: e.target.value })}
                    placeholder="e.g. National Institute of Technology"
                  />
                  <Input
                    label="Bachelor Aggregate (%)"
                    type="number"
                    value={newEdu.bachelor}
                    onChange={(e) => setNewEdu({ ...newEdu, bachelor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="High School Name"
                    value={newEdu.highschoolname}
                    onChange={(e) => setNewEdu({ ...newEdu, highschoolname: e.target.value })}
                  />
                  <Input
                    label="High School Score (%)"
                    type="number"
                    value={newEdu.highschool}
                    onChange={(e) => setNewEdu({ ...newEdu, highschool: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setFormStep('bank')}>
                    ← Back to Bank
                  </Button>
                  <Button type="button" onClick={() => setFormStep('exp')}>
                    Next: Experience →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {formStep === 'exp' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Previous Employer"
                    value={newExp.previous_employer}
                    onChange={(e) => setNewExp({ ...newExp, previous_employer: e.target.value })}
                    placeholder="e.g. Acme Tech Solutions"
                  />
                  <Input
                    label="Previous Job Profile"
                    value={newExp.job_profile}
                    onChange={(e) => setNewExp({ ...newExp, job_profile: e.target.value })}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Years of Experience"
                    type="number"
                    value={newExp.yoe}
                    onChange={(e) => setNewExp({ ...newExp, yoe: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Date of Relief / Exit"
                    type="date"
                    value={newExp.dor}
                    onChange={(e) => setNewExp({ ...newExp, dor: e.target.value })}
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setFormStep('edu')}>
                    ← Back to Education
                  </Button>
                  <Button type="button" onClick={() => setFormStep('assets')}>
                    Next: Company Assets →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Company Assets */}
            {formStep === 'assets' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Asset Name"
                    value={newAsset.asset_name}
                    onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                    placeholder="e.g. MacBook Pro M3"
                  />
                  <Input
                    label="Asset Serial ID / Tag"
                    value={newAsset.asset_id}
                    onChange={(e) => setNewAsset({ ...newAsset, asset_id: e.target.value })}
                    placeholder="e.g. AST-MAC-982"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Asset Type"
                    value={newAsset.asset_type}
                    onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                    placeholder="e.g. Laptop Hardware"
                  />
                  <Input
                    label="Issue Date"
                    type="date"
                    value={newAsset.asset_issue_date}
                    onChange={(e) => setNewAsset({ ...newAsset, asset_issue_date: e.target.value })}
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setFormStep('exp')}>
                    ← Back to Experience
                  </Button>
                  <Button type="submit" variant="success">
                    Save &amp; Complete Onboarding
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* Tab 3: Ex-Employees (Admin) */}
      {activeTab === 'ex-employees' && isAdmin && (
        <Card title="Ex-Employees Directory" subtitle="Deactivated or resigned staff records">
          <Table
            columns={exEmployeeColumns}
            data={exEmployees}
            actions={[
              {
                label: 'Reactivate',
                onClick: (e: User) => handleActivateEmployee(e.user_id),
                className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300',
              },
            ]}
            emptyMessage="No ex-employees currently recorded."
          />
        </Card>
      )}

      {/* Modal: Full Employee Profile Details */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`Employee Profile — ${selectedUser.first_name} ${selectedUser.last_name}`}
          size="lg"
        >
          {detailsLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">Loading profile details...</div>
          ) : (
            <div className="space-y-6 text-xs">
              {/* Header card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center text-lg font-bold">
                  {selectedUser.first_name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-slate-500">{selectedUser.job_profile} · Dept: {selectedUser.department_id}</p>
                  <p className="font-mono text-slate-400 mt-0.5">ID: {selectedUser.user_id}</p>
                </div>
                <Badge variant={selectedUser.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {selectedUser.status}
                </Badge>
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Personal Information</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3">
                  <div>
                    <span className="text-slate-500 block">Email Address</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedUser.email_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mobile Phone</span>
                    <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{selectedUser.mobile_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Monthly Base Salary</span>
                    <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">₹{selectedUser.salary?.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date of Joining</span>
                    <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{selectedUser.doj}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PAN Number</span>
                    <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{selectedUser.pan_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Blood Group</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedUser.blood_group}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {userBank && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Bank &amp; Disbursement</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3">
                    <div>
                      <span className="text-slate-500 block">Bank Name</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{userBank.bank_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Number</span>
                      <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{userBank.account_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">IFSC Code</span>
                      <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{userBank.ifsc_code}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Branch</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{userBank.branch_name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Assets */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Assigned Hardware &amp; Assets</span>
                </h4>
                {userAssets.length === 0 ? (
                  <p className="py-2 text-slate-500">No hardware assigned.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 py-2">
                    {userAssets.map((ast) => (
                      <div key={ast.asset_id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{ast.asset_name}</span>
                          <span className="text-slate-500 ml-2 font-mono">({ast.asset_id})</span>
                        </div>
                        <span className="text-slate-500 font-mono">Issued: {ast.asset_issue_date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default EmployeeManagement;
