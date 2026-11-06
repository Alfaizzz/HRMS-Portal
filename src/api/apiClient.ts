import { isDemoMode } from '../config/demoConfig';
import { mockService } from './mockService';
import {
  Department,
  User,
  BankDetails,
  EducationalDetails,
  Experience,
  CompanyAsset,
  AttendanceRecord,
  PunchInRecord,
  Leave,
  Holiday,
  SalaryDetails,
  Book,
  BookIssuance,
  BookRequest,
} from '../types';

// Real backend base URL from env or fallback to localhost:8080
export const REAL_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Real HTTP helper with JWT injection and error classification
const requestRealBackend = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${REAL_API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('hrms-unauthorized'));
      }
      const errorText = await res.text();
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {}
      throw new Error(
        errorJson?.message || errorJson?.error || errorText || `HTTP ${res.status}`
      );
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (err: any) {
    // If connection refused / network error
    if (
      err.name === 'TypeError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError')
    ) {
      window.dispatchEvent(
        new CustomEvent('hrms-backend-offline', {
          detail: {
            endpoint,
            url,
            message: 'Unable to connect to Spring Boot backend at ' + REAL_API_BASE_URL,
          },
        })
      );
    }
    throw err;
  }
};

// =========================================================================
// UNIFIED APIS (Auto-routes to MockService or Real Backend based on switch)
// =========================================================================

export const authApi = {
  login: async (credentials: { username: string; password?: string }) => {
    if (isDemoMode()) {
      const result = await mockService.login(credentials.username, credentials.password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      return result.user;
    }

    const data = await requestRealBackend<{ token: string; user?: any }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    if (!data.token) throw new Error('No authentication token received');
    localStorage.setItem('token', data.token);

    // Fetch user profile from backend
    try {
      const user = await requestRealBackend<User>(
        `/user/personalDetails/${credentials.username}`
      );
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      const fallbackUser: User = {
        user_id: credentials.username,
        first_name: credentials.username,
        last_name: '',
        email_id: `${credentials.username}@company.com`,
        mobile_number: '',
        salary: 0,
        father_name: '',
        mother_name: '',
        current_address: '',
        permanent_address: '',
        blood_group: 'O+',
        dob: '1995-01-01',
        doj: '2023-01-01',
        pan_number: '',
        department_id: '',
        religion: '',
        role: credentials.username.toLowerCase() === 'admin' ? 'ADMIN' : 'USER',
        nationality: '',
        job_profile: '',
        status: 'ACTIVE',
      };
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated: (): boolean => {
    return Boolean(localStorage.getItem('token') && localStorage.getItem('user'));
  },
};

export const departmentApi = {
  getDepartments: async (): Promise<Department[]> => {
    if (isDemoMode()) return mockService.getDepartments();
    return requestRealBackend<Department[]>('/department/');
  },
  getDepartment: async (id: string): Promise<Department> => {
    if (isDemoMode()) return mockService.getDepartment(id);
    const list = await requestRealBackend<Department[]>(`/department/${id}`);
    return Array.isArray(list) ? list[0] : list;
  },
  addDepartment: async (dept: Department): Promise<Department> => {
    if (isDemoMode()) return mockService.createDepartment(dept);
    await requestRealBackend('/department/create', {
      method: 'POST',
      body: JSON.stringify(dept),
    });
    return dept;
  },
  updateDepartment: async (id: string, dept: Partial<Department>): Promise<Department> => {
    if (isDemoMode()) return mockService.updateDepartment(id, dept);
    await requestRealBackend(`/department/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dept),
    });
    return dept as Department;
  },
  deleteDepartment: async (id: string): Promise<void> => {
    if (isDemoMode()) return mockService.deleteDepartment(id);
    await requestRealBackend(`/department/delete/${id}`, { method: 'DELETE' });
  },
};

export const employeeApi = {
  getEmployees: async (): Promise<User[]> => {
    if (isDemoMode()) return mockService.getEmployees();
    return requestRealBackend<User[]>('/user/search?query=');
  },
  searchEmployees: async (query: string): Promise<User[]> => {
    if (isDemoMode()) return mockService.searchEmployees(query);
    return requestRealBackend<User[]>(`/user/search?query=${encodeURIComponent(query)}`);
  },
  getEmployeeById: async (userId: string): Promise<User> => {
    if (isDemoMode()) return mockService.getEmployeeById(userId);
    return requestRealBackend<User>(`/user/personalDetails/${userId}`);
  },
  createEmployee: async (data: Partial<User>): Promise<{ user_id: string }> => {
    if (isDemoMode()) return mockService.createEmployee(data);
    return requestRealBackend<{ user_id: string }>('/user/personalDetails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateEmployee: async (userId: string, data: Partial<User>): Promise<User> => {
    if (isDemoMode()) return mockService.updateEmployee(userId, data);
    await requestRealBackend(`/user/update/personalDetails/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return data as User;
  },
  deleteEmployee: async (userId: string): Promise<void> => {
    if (isDemoMode()) return mockService.deleteEmployee(userId);
    await requestRealBackend(`/user/delete/${userId}`, { method: 'DELETE' });
  },
  getDeletedEmployees: async (): Promise<User[]> => {
    if (isDemoMode()) return mockService.getDeletedEmployees();
    return requestRealBackend<User[]>('/user/deleted');
  },
  activateEmployee: async (userId: string): Promise<void> => {
    if (isDemoMode()) return mockService.activateEmployee(userId);
    await requestRealBackend(`/user/activate/${userId}`, { method: 'POST' });
  },
};

export const personalDetailsApi = {
  getPersonalDetails: async (userId: string): Promise<User> => {
    if (isDemoMode()) return mockService.getEmployeeById(userId);
    return requestRealBackend<User>(`/user/personalDetails/${userId}`);
  },
  updatePersonalDetails: async (userId: string, data: Partial<User>): Promise<User> => {
    if (isDemoMode()) return mockService.updateEmployee(userId, data);
    await requestRealBackend(`/user/update/personalDetails/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return data as User;
  },
  getProfilePicture: async (userId: string): Promise<string | null> => {
    if (isDemoMode()) return mockService.getProfilePicture(userId);
    return `${REAL_API_BASE_URL}/user/photo/${userId}`;
  },
  uploadProfilePicture: async (userId: string, file: File): Promise<string> => {
    if (isDemoMode()) return mockService.uploadProfilePicture(userId, file);
    const formData = new FormData();
    formData.append('file', file);
    return requestRealBackend(`/user/upload-picture/${userId}`, {
      method: 'POST',
      body: formData,
    });
  },
};

export const bankDetailsApi = {
  getBankDetails: async (userId: string): Promise<BankDetails> => {
    if (isDemoMode()) return mockService.getBankDetails(userId);
    return requestRealBackend<BankDetails>(`/user/bankDetails/${userId}`);
  },
  updateBankDetails: async (userId: string, data: Partial<BankDetails>): Promise<BankDetails> => {
    if (isDemoMode()) return mockService.updateBankDetails(userId, data);
    await requestRealBackend(`/user/update/bankDetails/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return data as BankDetails;
  },
  addBankDetails: async (data: BankDetails): Promise<BankDetails> => {
    if (isDemoMode()) return mockService.updateBankDetails(data.user_id, data);
    return requestRealBackend<BankDetails>('/user/bankDetails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const educationApi = {
  getEducation: async (userId: string): Promise<EducationalDetails> => {
    if (isDemoMode()) return mockService.getEducationalDetails(userId);
    return requestRealBackend<EducationalDetails>(`/user/educationalDetails/${userId}`);
  },
  updateEducation: async (
    userId: string,
    data: Partial<EducationalDetails>
  ): Promise<EducationalDetails> => {
    if (isDemoMode()) return mockService.updateEducationalDetails(userId, data);
    await requestRealBackend(`/user/update/educationalDetails/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return data as EducationalDetails;
  },
  addEducation: async (data: EducationalDetails): Promise<EducationalDetails> => {
    if (isDemoMode()) return mockService.updateEducationalDetails(data.user_id, data);
    return requestRealBackend<EducationalDetails>('/user/educationalDetails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const experienceApi = {
  getExperience: async (userId: string): Promise<Experience[]> => {
    if (isDemoMode()) return mockService.getExperience(userId);
    const res = await requestRealBackend<any>(`/user/experience/${userId}`);
    return Array.isArray(res) ? res : res ? [res] : [];
  },
  updateExperience: async (userId: string, data: Experience | Experience[]): Promise<Experience[]> => {
    if (isDemoMode()) return mockService.updateExperience(userId, data);
    const exp = Array.isArray(data) ? data[0] : data;
    await requestRealBackend(`/user/update/experience/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(exp),
    });
    return Array.isArray(data) ? data : [data];
  },
  addExperience: async (data: Experience): Promise<Experience> => {
    if (isDemoMode()) {
      await mockService.updateExperience(data.user_id, data);
      return data;
    }
    return requestRealBackend<Experience>('/user/experience', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const assetsApi = {
  getAssets: async (userId: string): Promise<CompanyAsset[]> => {
    if (isDemoMode()) return mockService.getAssets(userId);
    const res = await requestRealBackend<any>(`/user/CompanyAssets/${userId}`);
    return Array.isArray(res) ? res : res ? [res] : [];
  },
  addAsset: async (asset: CompanyAsset): Promise<CompanyAsset> => {
    if (isDemoMode()) return mockService.addAsset(asset);
    return requestRealBackend<CompanyAsset>('/user/company_assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    });
  },
  updateAsset: async (userId: string, asset: CompanyAsset): Promise<CompanyAsset> => {
    if (isDemoMode()) return mockService.updateAsset(userId, asset);
    await requestRealBackend(`/user/update/companyAssets/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    });
    return asset;
  },
  deleteAsset: async (userId: string, assetId: string): Promise<void> => {
    if (isDemoMode()) return mockService.deleteAsset(userId, assetId);
    await requestRealBackend(`/user/company-asset/${userId}?asset_id=${assetId}`, {
      method: 'DELETE',
    });
  },
};

export const documentsApi = {
  getDocuments: async (userId: string): Promise<any[]> => {
    if (isDemoMode()) return [];
    try {
      return await requestRealBackend<any[]>(`/documents/users/${userId}/documents/download`);
    } catch {
      return [];
    }
  },
  uploadDocument: async (data: {
    userId: string;
    documentType: string;
    document_name: string;
    file: File;
  }): Promise<string> => {
    if (isDemoMode()) return 'Document uploaded in demo mode';
    const formData = new FormData();
    formData.append('userId', data.userId);
    formData.append('documentType', data.documentType);
    formData.append('document_name', data.document_name);
    formData.append('file', data.file);
    return requestRealBackend('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

export const attendanceApi = {
  punchIn: async (data: {
    user_id: string;
    latitude: number;
    longitude: number;
    selfie_base64?: string;
  }): Promise<any> => {
    if (isDemoMode()) return mockService.punchIn(data);
    return requestRealBackend('/attendance/punchIn', {
      method: 'POST',
      body: JSON.stringify({
        user_id: data.user_id,
        latitude: data.latitude,
        longitude: data.longitude,
        selfie_url: data.selfie_base64,
      }),
    });
  },
  punchOut: async (data: {
    user_id: string;
    latitude: number;
    longitude: number;
  }): Promise<any> => {
    if (isDemoMode()) return mockService.punchOut(data);
    return requestRealBackend('/attendance/punchOut', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getPunchIns: async (): Promise<PunchInRecord[]> => {
    if (isDemoMode()) return mockService.getPunchIns();
    return requestRealBackend<PunchInRecord[]>('/attendance/punchIn');
  },
  getAttendanceRecords: async (
    userId?: string,
    date?: string | null
  ): Promise<AttendanceRecord[]> => {
    if (isDemoMode()) return mockService.getAttendanceRecords(userId, date);
    const query = date ? `?date=${date}` : '';
    return requestRealBackend<AttendanceRecord[]>(
      `/attendance/attendance-records/${userId}${query}`
    );
  },
  getUserResources: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ attendanceRecords: AttendanceRecord[]; leaves: Leave[] }> => {
    if (isDemoMode()) {
      const records = await mockService.getAttendanceRecords(userId);
      const leaves = (await mockService.getLeaves()).filter((l) => l.user_id === userId);
      return { attendanceRecords: records, leaves };
    }
    return requestRealBackend(`/user/resources?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`);
  },
  deletePunchIn: async (id: number): Promise<void> => {
    if (isDemoMode()) return mockService.deletePunchIn(id);
    await requestRealBackend(`/attendance/punchInImage/${id}`, { method: 'DELETE' });
  },
};

export const leaveApi = {
  getLeaves: async (): Promise<Leave[]> => {
    if (isDemoMode()) return mockService.getLeaves();
    return requestRealBackend<Leave[]>('/leaves/');
  },
  createLeave: async (data: Omit<Leave, 'id' | 'status'>): Promise<Leave> => {
    if (isDemoMode()) return mockService.createLeave(data);
    await requestRealBackend('/leaves/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return data as Leave;
  },
  approveLeave: async (id: number): Promise<void> => {
    if (isDemoMode()) return mockService.approveLeave(id);
    await requestRealBackend(`/leaves/approve/${id}`, { method: 'PUT' });
  },
  rejectLeave: async (id: number): Promise<void> => {
    if (isDemoMode()) return mockService.rejectLeave(id);
    await requestRealBackend(`/leaves/reject/${id}`, { method: 'PUT' });
  },
};

export const calendarApi = {
  getHolidays: async (): Promise<Holiday[]> => {
    if (isDemoMode()) return mockService.getHolidays();
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await requestRealBackend<Holiday[] | Holiday>(`/holiday/${today}`);
      return Array.isArray(res) ? res : [res];
    } catch {
      return [];
    }
  },
  addHoliday: async (holiday: Holiday): Promise<Holiday> => {
    if (isDemoMode()) return mockService.addHoliday(holiday);
    await requestRealBackend('/holiday', {
      method: 'POST',
      body: JSON.stringify(holiday),
    });
    return holiday;
  },
  deleteHoliday: async (date: string): Promise<void> => {
    if (isDemoMode()) return mockService.deleteHoliday(date);
    await requestRealBackend(`/holiday/delete/${date}`, { method: 'DELETE' });
  },
};

export const salaryApi = {
  getSalaries: async (): Promise<SalaryDetails[]> => {
    if (isDemoMode()) return mockService.getSalaries();
    return requestRealBackend<SalaryDetails[]>('/salary/salary-details');
  },
  getSalariesByUserId: async (userId: string): Promise<SalaryDetails[]> => {
    if (isDemoMode()) return mockService.getSalariesByUserId(userId);
    return requestRealBackend<SalaryDetails[]>(`/salary/salary-details/${userId}`);
  },
  createSalary: async (data: any): Promise<SalaryDetails> => {
    if (isDemoMode()) return mockService.createSalary(data);
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return requestRealBackend('/salary/upload', {
      method: 'POST',
      body: formData,
    });
  },
  updateStatus: async (id: number, status: 'PENDING' | 'PAID' | 'REJECTED'): Promise<void> => {
    if (isDemoMode()) return mockService.updateSalaryStatus(id, status);
    await requestRealBackend(`/salary/salary-status/?id=${id}&status=${status}`, {
      method: 'PUT',
    });
  },
  deleteSalary: async (id: number): Promise<void> => {
    if (isDemoMode()) return mockService.deleteSalary(id);
    await requestRealBackend(`/salary/delete?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================
// Library Management Module API
// ============================================

export const libraryApi = {
  getBooks: async (): Promise<Book[]> => {
    if (isDemoMode()) return mockService.getBooks();
    try {
      return await requestRealBackend<Book[]>('/library/books');
    } catch {
      // Graceful fallback to demo library if backend module not yet deployed
      return mockService.getBooks();
    }
  },
  addBook: async (book: Omit<Book, 'id'>): Promise<Book> => {
    if (isDemoMode()) return mockService.addBook(book);
    try {
      return await requestRealBackend<Book>('/library/books', {
        method: 'POST',
        body: JSON.stringify(book),
      });
    } catch {
      return mockService.addBook(book);
    }
  },
  updateBook: async (id: number, book: Partial<Book>): Promise<Book> => {
    if (isDemoMode()) return mockService.updateBook(id, book);
    try {
      return await requestRealBackend<Book>(`/library/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(book),
      });
    } catch {
      return mockService.updateBook(id, book);
    }
  },
  deleteBook: async (id: number): Promise<void> => {
    if (isDemoMode()) return mockService.deleteBook(id);
    try {
      await requestRealBackend(`/library/books/${id}`, { method: 'DELETE' });
    } catch {
      return mockService.deleteBook(id);
    }
  },
  getIssuances: async (userId?: string): Promise<BookIssuance[]> => {
    if (isDemoMode()) return mockService.getBookIssuances(userId);
    try {
      const q = userId ? `?userId=${userId}` : '';
      return await requestRealBackend<BookIssuance[]>(`/library/issuances${q}`);
    } catch {
      return mockService.getBookIssuances(userId);
    }
  },
  issueBook: async (data: {
    bookId: number;
    userId: string;
    dueDate: string;
    remarks?: string;
  }): Promise<BookIssuance> => {
    if (isDemoMode()) return mockService.issueBook(data);
    try {
      return await requestRealBackend<BookIssuance>('/library/issuances', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return mockService.issueBook(data);
    }
  },
  returnBook: async (issuanceId: number): Promise<BookIssuance> => {
    if (isDemoMode()) return mockService.returnBook(issuanceId);
    try {
      return await requestRealBackend<BookIssuance>(`/library/issuances/${issuanceId}/return`, {
        method: 'POST',
      });
    } catch {
      return mockService.returnBook(issuanceId);
    }
  },
  getRequests: async (userId?: string): Promise<BookRequest[]> => {
    if (isDemoMode()) return mockService.getBookRequests(userId);
    try {
      const q = userId ? `?userId=${userId}` : '';
      return await requestRealBackend<BookRequest[]>(`/library/requests${q}`);
    } catch {
      return mockService.getBookRequests(userId);
    }
  },
  requestBook: async (data: {
    bookId: number;
    userId: string;
    notes?: string;
  }): Promise<BookRequest> => {
    if (isDemoMode()) return mockService.requestBook(data);
    try {
      return await requestRealBackend<BookRequest>('/library/requests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return mockService.requestBook(data);
    }
  },
  updateRequestStatus: async (
    requestId: number,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<BookRequest> => {
    if (isDemoMode()) return mockService.updateRequestStatus(requestId, status);
    try {
      return await requestRealBackend<BookRequest>(`/library/requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch {
      return mockService.updateRequestStatus(requestId, status);
    }
  },
};
