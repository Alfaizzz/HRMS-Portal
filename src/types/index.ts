export interface Department {
  department_id: string;
  department_name: string;
}

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email_id: string;
  mobile_number: string;
  salary: number;
  father_name: string;
  mother_name: string;
  current_address: string;
  permanent_address: string;
  blood_group: string;
  dob: string;
  doj: string;
  pan_number: string;
  department_id: string;
  religion: string;
  role: 'ADMIN' | 'USER';
  nationality: string;
  job_profile: string;
  status: 'ACTIVE' | 'INACTIVE';
  password?: string;
  profile_picture?: string;
}

export interface BankDetails {
  user_id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
}

export interface EducationalDetails {
  user_id: string;
  highschool: number;
  secondaryschool: number;
  bachelor: number;
  postgraduation: number;
  others: number;
  highschoolname: string;
  secondaryschoolname: string;
  bachelorcollegename: string;
  mastercollegename: string;
}

export interface Experience {
  id?: number;
  user_id: string;
  previous_employer: string;
  job_profile: string;
  yoe: number;
  dor: string;
}

export interface CompanyAsset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  asset_issue_date: string;
  user_id: string;
}

export interface UserDocument {
  id: number;
  user_id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  extension: string;
  upload_time: string;
}

export interface PunchInRecord {
  punchin_id: number;
  user_id: string;
  user_name: string;
  date: string;
  punch_in_time: string;
  image_location: string;
  latitude?: number;
  longitude?: number;
}

export interface AttendanceRecord {
  id: number;
  user_id: string;
  date: string;
  punch_in_time: string;
  punch_out_time: string | null;
  hours?: string;
  latitude?: number;
  longitude?: number;
  selfie_url?: string;
}

export type LeaveType = 
  | 'CASUAL_LEAVE'
  | 'SICK_LEAVE'
  | 'EARNED_LEAVE'
  | 'MATERNITY_LEAVE'
  | 'PATERNITY_LEAVE'
  | 'COMPENSATORY_OFF'
  | 'BEREAVEMENT_LEAVE'
  | 'UNPAID_LEAVE';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Leave {
  id: number;
  user_id: string;
  user_name?: string;
  leave_type: LeaveType;
  leave_date: string;
  reason: string;
  status: LeaveStatus;
}

export interface Holiday {
  holiday_date: string;
  description: string;
}

export type SalaryStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface SalaryDetails {
  id: number;
  user_id: string;
  user_name?: string;
  date: string;
  basic_pay: number;
  hra: number;
  food_allowance: number;
  travel_allowance: number;
  emp_tax: number;
  epf: number;
  paye: number;
  net_salary: number;
  status: SalaryStatus;
  file_path?: string | null;
}

export interface Resignation {
  id: number;
  user_id: string;
  user_name?: string;
  email?: string;
  date_of_resignation: string;
  remark: string;
}

// ============================================
// Library Management Types
// ============================================

export type BookStatus = 'AVAILABLE' | 'ISSUED' | 'RESERVED';

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  publicationYear?: number;
  coverColor?: string;
  description?: string;
}

export type IssuanceStatus = 'ISSUED' | 'RETURNED' | 'OVERDUE';

export interface BookIssuance {
  id: number;
  bookId: number;
  bookTitle: string;
  isbn: string;
  userId: string;
  userName: string;
  userEmail: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: IssuanceStatus;
  remarks?: string;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface BookRequest {
  id: number;
  bookId: number;
  bookTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestDate: string;
  status: RequestStatus;
  notes?: string;
}
