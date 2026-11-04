import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { departmentApi, employeeApi } from '../api';
import { Department, User } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Table, Column } from '../components/common/Table';
import { Building2, Plus, Edit2, Trash2, Search, Users } from 'lucide-react';

export const DepartmentManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    department_id: '',
    department_name: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [depts, emps] = await Promise.all([
        departmentApi.getDepartments(),
        employeeApi.getEmployees(),
      ]);
      setDepartments(depts);
      setEmployees(emps);
    } catch (e: any) {
      notifyError('Failed to load departments: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingDept(null);
    setFormData({ department_id: '', department_name: '' });
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      department_id: dept.department_id,
      department_name: dept.department_name,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id.trim() || !formData.department_name.trim()) {
      notifyError('Both Department ID and Name are required.');
      return;
    }

    try {
      if (editingDept) {
        await departmentApi.updateDepartment(editingDept.department_id, formData);
        success(`Department ${formData.department_name} updated successfully!`);
      } else {
        await departmentApi.addDepartment(formData);
        success(`Department ${formData.department_name} created successfully!`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to save department');
    }
  };

  const handleDelete = async (dept: Department) => {
    const memberCount = employees.filter((e) => e.department_id === dept.department_id).length;
    if (memberCount > 0) {
      if (
        !window.confirm(
          `Warning: ${memberCount} employee(s) belong to this department. Are you sure you want to delete ${dept.department_name}?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Delete department "${dept.department_name}"?`)) return;
    }

    try {
      await departmentApi.deleteDepartment(dept.department_id);
      success(`Department "${dept.department_name}" deleted.`);
      loadData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete department');
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.department_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Department>[] = [
    {
      key: 'department_id',
      label: 'Department ID',
      render: (d) => <span className="font-mono font-semibold">{d.department_id}</span>,
    },
    {
      key: 'department_name',
      label: 'Department Name',
      render: (d) => <span className="font-medium text-slate-900 dark:text-slate-100">{d.department_name}</span>,
    },
    {
      key: 'staff_count',
      label: 'Active Staff',
      render: (d) => {
        const count = employees.filter((e) => e.department_id === d.department_id).length;
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>{count} {count === 1 ? 'member' : 'members'}</span>
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
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Department Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize organization units, teams, and employee department assignments
          </p>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={openAddModal} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Department
          </Button>
        )}
      </div>

      {/* Main Table Card */}
      <Card>
        <div className="mb-4">
          <Input
            placeholder="Search departments by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <Table
          columns={columns}
          data={filteredDepts}
          loading={loading}
          actions={
            isAdmin
              ? [
                  {
                    label: 'Edit',
                    onClick: openEditModal,
                    icon: <Edit2 className="w-3.5 h-3.5" />,
                  },
                  {
                    label: 'Delete',
                    onClick: handleDelete,
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300',
                  },
                ]
              : []
          }
          emptyMessage="No departments found."
        />
      </Card>

      {/* Modal: Add / Edit Department */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDept ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department ID"
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            placeholder="e.g. ENG01 or HR01"
            disabled={Boolean(editingDept)}
            required
          />
          <Input
            label="Department Name"
            value={formData.department_name}
            onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
            placeholder="e.g. Software Engineering"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentManagement;
