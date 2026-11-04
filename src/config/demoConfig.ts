import { User } from '../types';

export const DEMO_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  role: 'ADMIN' as const,
};

export const DEMO_EMPLOYEE_CREDENTIALS = {
  username: 'employee',
  password: 'employee123',
  role: 'USER' as const,
};

export const DEMO_ADMIN_USER: User = {
  user_id: 'admin',
  first_name: 'System',
  last_name: 'Administrator',
  email_id: 'admin@company.com',
  mobile_number: '9876543210',
  salary: 120000,
  father_name: 'Robert Vance',
  mother_name: 'Eleanor Vance',
  current_address: '100 Innovation Parkway, Suite 400',
  permanent_address: '100 Innovation Parkway, Suite 400',
  blood_group: 'O+',
  dob: '1988-06-15',
  doj: '2020-01-10',
  pan_number: 'ABCDE1234F',
  department_id: 'HR01',
  religion: 'Secular',
  role: 'ADMIN',
  nationality: 'Indian',
  job_profile: 'Lead HR Operations & Systems Admin',
  status: 'ACTIVE',
};

export const DEMO_EMPLOYEE_USER: User = {
  user_id: 'employee',
  first_name: 'Alex',
  last_name: 'Johnson',
  email_id: 'employee@company.com',
  mobile_number: '9123456789',
  salary: 85000,
  father_name: 'David Johnson',
  mother_name: 'Sarah Johnson',
  current_address: '42 Silicon Avenue, Tech Park',
  permanent_address: '42 Silicon Avenue, Tech Park',
  blood_group: 'B+',
  dob: '1995-09-22',
  doj: '2023-04-15',
  pan_number: 'FGHIJ5678K',
  department_id: 'ENG01',
  religion: 'Secular',
  role: 'USER',
  nationality: 'Indian',
  job_profile: 'Senior Full Stack Engineer',
  status: 'ACTIVE',
};

export const REAL_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const DEMO_STORAGE_KEY = 'hrms_demo_mode_active';

export const isDemoMode = (): boolean => {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  if (stored === null) {
    // Default to true so presentations and sandbox runs are immediately 100% functional
    return true;
  }
  return stored === 'true';
};

export const setDemoMode = (enabled: boolean): void => {
  localStorage.setItem(DEMO_STORAGE_KEY, enabled ? 'true' : 'false');
  // Dispatch a custom storage event so all tabs/listeners update immediately
  window.dispatchEvent(new Event('hrms-demo-mode-changed'));
};
