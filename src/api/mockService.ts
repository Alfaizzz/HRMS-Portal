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
  Resignation,
  WorkspaceSettings,
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_BANK_DETAILS,
  INITIAL_EDUCATION,
  INITIAL_EXPERIENCE,
  INITIAL_ASSETS,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVES,
  INITIAL_PUNCH_INS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_SALARIES,
  INITIAL_BOOKS,
  INITIAL_BOOK_ISSUANCES,
  INITIAL_BOOK_REQUESTS,
  INITIAL_RESIGNATIONS,
} from './mockData';

const MOCK_STORAGE_KEY = 'hrms_mock_database_v2';

interface MockDatabaseState {
  departments: Department[];
  employees: User[];
  bankDetails: Record<string, BankDetails>;
  education: Record<string, EducationalDetails>;
  experiences: Record<string, Experience[]>;
  assets: Record<string, CompanyAsset[]>;
  holidays: Holiday[];
  leaves: Leave[];
  punchIns: PunchInRecord[];
  attendanceRecords: AttendanceRecord[];
  salaries: SalaryDetails[];
  books: Book[];
  issuances: BookIssuance[];
  requests: BookRequest[];
  resignations: Resignation[];
  profilePictures: Record<string, string>;
  workspaceSettings: WorkspaceSettings;
}

const INITIAL_WORKSPACE_SETTINGS: WorkspaceSettings = {
  workspace_name: 'Head Office',
  office_latitude: 12.9716,
  office_longitude: 77.5946,
  geofence_radius_meters: 150,
  required_hours_per_day: 8,
};

const distanceInMeters = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(latitudeB - latitudeA);
  const longitudeDifference = radians(longitudeB - longitudeA);
  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const getMockOfficeDistance = (latitude: number, longitude: number): number => {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('A valid GPS location is required to record attendance.');
  }
  return distanceInMeters(
    latitude,
    longitude,
    db.workspaceSettings.office_latitude,
    db.workspaceSettings.office_longitude
  );
};

const parseMockPunchInTimestamp = (punchIn: PunchInRecord): Date | null => {
  if (punchIn.punched_at) {
    const punchedAt = new Date(punchIn.punched_at);
    if (!Number.isNaN(punchedAt.getTime())) return punchedAt;
  }

  const dateMatch = punchIn.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = punchIn.punch_in_time.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i
  );
  if (!dateMatch || !timeMatch) return null;

  let hours = Number(timeMatch[1]);
  const meridiem = timeMatch[4]?.toUpperCase();
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem === 'PM' ? 12 : 0);
  }
  const punchedAt = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    hours,
    Number(timeMatch[2]),
    Number(timeMatch[3] || 0)
  );
  return Number.isNaN(punchedAt.getTime()) ? null : punchedAt;
};

const getInitialState = (): MockDatabaseState => ({
  departments: [...INITIAL_DEPARTMENTS],
  employees: [...INITIAL_EMPLOYEES],
  bankDetails: { ...INITIAL_BANK_DETAILS },
  education: { ...INITIAL_EDUCATION },
  experiences: { ...INITIAL_EXPERIENCE },
  assets: { ...INITIAL_ASSETS },
  holidays: [...INITIAL_HOLIDAYS],
  leaves: [...INITIAL_LEAVES],
  punchIns: [...INITIAL_PUNCH_INS],
  attendanceRecords: [...INITIAL_ATTENDANCE_RECORDS],
  salaries: [...INITIAL_SALARIES],
  books: [...INITIAL_BOOKS],
  issuances: [...INITIAL_BOOK_ISSUANCES],
  requests: [...INITIAL_BOOK_REQUESTS],
  resignations: [...INITIAL_RESIGNATIONS],
  profilePictures: {},
  workspaceSettings: INITIAL_WORKSPACE_SETTINGS,
});

const loadState = (): MockDatabaseState => {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      saveState(initial);
      return initial;
    }
    return {
      ...getInitialState(),
      ...JSON.parse(raw),
    };
  } catch (err) {
    console.error('Error loading mock database state from localStorage:', err);
    return getInitialState();
  }
};

const saveState = (state: MockDatabaseState): void => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving mock database state:', err);
  }
};

let db = loadState();

export const resetMockDatabase = (): void => {
  db = getInitialState();
  saveState(db);
};

// Helper delay to simulate clean async latency
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockService = {
  // ================= Auth =================
  login: async (username: string, password?: string) => {
    await delay();
    const cleanUser = username.trim().toLowerCase();
    const emp = db.employees.find(
      (e) =>
        e.user_id.toLowerCase() === cleanUser ||
        e.email_id.toLowerCase() === cleanUser
    );

    if (cleanUser === 'admin' && (!password || password === 'admin123')) {
      const admin = db.employees.find((e) => e.role === 'ADMIN') || db.employees[0];
      return {
        token: `mock_jwt_admin_${Date.now()}`,
        user: { ...admin, role: 'ADMIN' as const },
      };
    }

    if (cleanUser === 'employee' && (!password || password === 'employee123')) {
      const regular = db.employees.find((e) => e.user_id === 'employee') || db.employees[1];
      return {
        token: `mock_jwt_employee_${Date.now()}`,
        user: { ...regular, role: 'USER' as const },
      };
    }

    if (emp) {
      return {
        token: `mock_jwt_${emp.user_id}_${Date.now()}`,
        user: emp,
      };
    }

    throw new Error('Invalid credentials. In Demo Mode, use admin / admin123 or employee / employee123.');
  },

  // ================= Departments =================
  getDepartments: async (): Promise<Department[]> => {
    await delay();
    return [...db.departments];
  },

  getDepartment: async (idOrName: string): Promise<Department> => {
    await delay();
    const found = db.departments.find(
      (d) =>
        d.department_id.toLowerCase() === idOrName.toLowerCase() ||
        d.department_name.toLowerCase() === idOrName.toLowerCase()
    );
    if (!found) throw new Error(`Department '${idOrName}' not found`);
    return found;
  },

  createDepartment: async (dept: Department): Promise<Department> => {
    await delay();
    if (db.departments.some((d) => d.department_id === dept.department_id)) {
      throw new Error(`Department with ID ${dept.department_id} already exists`);
    }
    db.departments.push(dept);
    saveState(db);
    return dept;
  },

  updateDepartment: async (id: string, dept: Partial<Department>): Promise<Department> => {
    await delay();
    const idx = db.departments.findIndex((d) => d.department_id === id);
    if (idx === -1) throw new Error(`Department ${id} not found`);
    db.departments[idx] = { ...db.departments[idx], ...dept };
    saveState(db);
    return db.departments[idx];
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await delay();
    db.departments = db.departments.filter((d) => d.department_id !== id);
    saveState(db);
  },

  // ================= Employees =================
  getEmployees: async (): Promise<User[]> => {
    await delay();
    return db.employees.filter((e) => e.status === 'ACTIVE');
  },

  searchEmployees: async (query: string): Promise<User[]> => {
    await delay();
    if (!query || !query.trim()) {
      return db.employees.filter((e) => e.status === 'ACTIVE');
    }
    const q = query.toLowerCase().trim();
    return db.employees.filter(
      (e) =>
        e.status === 'ACTIVE' &&
        (e.first_name.toLowerCase().includes(q) ||
          e.last_name.toLowerCase().includes(q) ||
          e.user_id.toLowerCase().includes(q) ||
          e.email_id.toLowerCase().includes(q) ||
          e.job_profile.toLowerCase().includes(q) ||
          e.department_id.toLowerCase().includes(q))
    );
  },

  getEmployeeById: async (userId: string): Promise<User> => {
    await delay();
    const found = db.employees.find((e) => e.user_id === userId);
    if (!found) throw new Error(`Employee with ID ${userId} not found`);
    return found;
  },

  createEmployee: async (data: Partial<User>): Promise<{ user_id: string }> => {
    await delay();
    const emailPrefix = data.email_id ? data.email_id.split('@')[0] : `emp${Date.now().toString().slice(-4)}`;
    const userId = data.user_id || emailPrefix;

    if (db.employees.some((e) => e.user_id === userId)) {
      throw new Error(`User with ID ${userId} already exists.`);
    }

    const newEmp: User = {
      user_id: userId,
      first_name: data.first_name || 'New',
      last_name: data.last_name || 'Employee',
      email_id: data.email_id || `${userId}@company.com`,
      mobile_number: data.mobile_number || '9000000000',
      salary: Number(data.salary) || 50000,
      father_name: data.father_name || '',
      mother_name: data.mother_name || '',
      current_address: data.current_address || 'Address line 1',
      permanent_address: data.permanent_address || 'Address line 1',
      blood_group: data.blood_group || 'O+',
      dob: data.dob || '1995-01-01',
      doj: data.doj || new Date().toISOString().split('T')[0],
      pan_number: data.pan_number || `PAN${Math.random().toString().slice(2, 8).toUpperCase()}`,
      department_id: data.department_id || 'ENG01',
      religion: data.religion || 'Secular',
      role: data.role || 'USER',
      nationality: data.nationality || 'Indian',
      job_profile: data.job_profile || 'Software Developer',
      status: 'ACTIVE',
    };

    db.employees.push(newEmp);
    saveState(db);
    return { user_id: userId };
  },

  updateEmployee: async (userId: string, data: Partial<User>): Promise<User> => {
    await delay();
    const idx = db.employees.findIndex((e) => e.user_id === userId);
    if (idx === -1) throw new Error(`User ${userId} not found`);
    db.employees[idx] = { ...db.employees[idx], ...data };
    saveState(db);
    return db.employees[idx];
  },

  deleteEmployee: async (userId: string): Promise<void> => {
    await delay();
    const idx = db.employees.findIndex((e) => e.user_id === userId);
    if (idx !== -1) {
      db.employees[idx].status = 'INACTIVE';
      saveState(db);
    }
  },

  getDeletedEmployees: async (): Promise<User[]> => {
    await delay();
    return db.employees.filter((e) => e.status === 'INACTIVE');
  },

  activateEmployee: async (userId: string): Promise<void> => {
    await delay();
    const idx = db.employees.findIndex((e) => e.user_id === userId);
    if (idx !== -1) {
      db.employees[idx].status = 'ACTIVE';
      saveState(db);
    }
  },

  // ================= Profile Picture =================
  uploadProfilePicture: async (userId: string, base64OrFile: string | File): Promise<string> => {
    await delay();
    let url = '';
    if (typeof base64OrFile === 'string') {
      url = base64OrFile;
    } else {
      url = URL.createObjectURL(base64OrFile);
    }
    db.profilePictures[userId] = url;
    saveState(db);
    return url;
  },

  getProfilePicture: async (userId: string): Promise<string | null> => {
    await delay();
    return db.profilePictures[userId] || null;
  },

  // ================= Employee Details Subsections =================
  getBankDetails: async (userId: string): Promise<BankDetails> => {
    await delay();
    return (
      db.bankDetails[userId] || {
        user_id: userId,
        bank_name: 'HDFC Bank',
        account_number: '50100' + Math.floor(100000000 + Math.random() * 900000000),
        ifsc_code: 'HDFC0001234',
        branch_name: 'Corporate City Branch',
      }
    );
  },

  updateBankDetails: async (userId: string, data: Partial<BankDetails>): Promise<BankDetails> => {
    await delay();
    const updated = {
      ...(db.bankDetails[userId] || { user_id: userId }),
      ...data,
      user_id: userId,
    } as BankDetails;
    db.bankDetails[userId] = updated;
    saveState(db);
    return updated;
  },

  getEducationalDetails: async (userId: string): Promise<EducationalDetails> => {
    await delay();
    return (
      db.education[userId] || {
        user_id: userId,
        highschool: 90,
        secondaryschool: 88,
        bachelor: 85,
        postgraduation: 0,
        others: 0,
        highschoolname: 'St. Mary High School',
        secondaryschoolname: 'National Junior College',
        bachelorcollegename: 'State Technical University',
        mastercollegename: '',
      }
    );
  },

  updateEducationalDetails: async (
    userId: string,
    data: Partial<EducationalDetails>
  ): Promise<EducationalDetails> => {
    await delay();
    const updated = {
      ...(db.education[userId] || { user_id: userId }),
      ...data,
      user_id: userId,
    } as EducationalDetails;
    db.education[userId] = updated;
    saveState(db);
    return updated;
  },

  getExperience: async (userId: string): Promise<Experience[]> => {
    await delay();
    return db.experiences[userId] || [];
  },

  updateExperience: async (userId: string, data: Experience | Experience[]): Promise<Experience[]> => {
    await delay();
    const list = Array.isArray(data) ? data : [data];
    db.experiences[userId] = list.map((item, idx) => ({
      ...item,
      id: item.id || idx + 1,
      user_id: userId,
    }));
    saveState(db);
    return db.experiences[userId];
  },

  getAssets: async (userId: string): Promise<CompanyAsset[]> => {
    await delay();
    return db.assets[userId] || [];
  },

  addAsset: async (asset: CompanyAsset): Promise<CompanyAsset> => {
    await delay();
    const userId = asset.user_id;
    if (!db.assets[userId]) db.assets[userId] = [];
    db.assets[userId].push(asset);
    saveState(db);
    return asset;
  },

  updateAsset: async (userId: string, asset: CompanyAsset): Promise<CompanyAsset> => {
    await delay();
    if (!db.assets[userId]) db.assets[userId] = [];
    const idx = db.assets[userId].findIndex((a) => a.asset_id === asset.asset_id);
    if (idx !== -1) {
      db.assets[userId][idx] = asset;
    } else {
      db.assets[userId].push(asset);
    }
    saveState(db);
    return asset;
  },

  deleteAsset: async (userId: string, assetId: string): Promise<void> => {
    await delay();
    if (db.assets[userId]) {
      db.assets[userId] = db.assets[userId].filter((a) => a.asset_id !== assetId);
      saveState(db);
    }
  },

  // ================= Attendance =================
  getWorkspaceSettings: async (): Promise<WorkspaceSettings> => {
    await delay();
    return { ...db.workspaceSettings };
  },

  updateWorkspaceSettings: async (
    settings: WorkspaceSettings
  ): Promise<WorkspaceSettings> => {
    await delay();
    const workspaceName = settings.workspace_name.trim();
    if (!workspaceName || workspaceName.length > 255) {
      throw new Error('Workspace name is required and must be 255 characters or fewer.');
    }
    if (
      !Number.isFinite(settings.office_latitude) ||
      settings.office_latitude < -90 ||
      settings.office_latitude > 90 ||
      !Number.isFinite(settings.office_longitude) ||
      settings.office_longitude < -180 ||
      settings.office_longitude > 180
    ) {
      throw new Error('Enter valid office coordinates.');
    }
    if (
      !Number.isInteger(settings.geofence_radius_meters) ||
      settings.geofence_radius_meters < 10 ||
      settings.geofence_radius_meters > 5000
    ) {
      throw new Error('Attendance radius must be between 10 and 5000 meters.');
    }
    if (
      !Number.isFinite(settings.required_hours_per_day) ||
      settings.required_hours_per_day <= 0 ||
      settings.required_hours_per_day > 24
    ) {
      throw new Error('Required daily hours must be greater than 0 and no more than 24.');
    }
    db.workspaceSettings = { ...settings, workspace_name: workspaceName };
    saveState(db);
    return { ...db.workspaceSettings };
  },

  punchIn: async (data: {
    user_id: string;
    latitude: number;
    longitude: number;
    selfie_base64?: string;
    location_exception_reason?: string;
  }): Promise<PunchInRecord> => {
    await delay();
    const distance = getMockOfficeDistance(data.latitude, data.longitude);
    const outsideOffice = distance > db.workspaceSettings.geofence_radius_meters;
    const exceptionReason = data.location_exception_reason?.trim() || '';
    if (outsideOffice && !exceptionReason) {
      throw new Error('A reason is required to clock in outside the office attendance area.');
    }
    if (exceptionReason.length > 500) {
      throw new Error('The location exception reason must be 500 characters or fewer.');
    }
    const today = new Date().toISOString().split('T')[0];
    const existing = db.punchIns.find((p) => p.user_id === data.user_id);
    if (existing) {
      throw new Error('User already has an active punch-in. Clock out before starting another session.');
    }

    const emp = db.employees.find((e) => e.user_id === data.user_id);
    const punchedAt = new Date();
    const nowTime = punchedAt.toTimeString().split(' ')[0];

    const newPunchIn: PunchInRecord = {
      punchin_id: Date.now(),
      user_id: data.user_id,
      user_name: emp ? `${emp.first_name} ${emp.last_name}` : data.user_id,
      date: today,
      punch_in_time: nowTime,
      punched_at: punchedAt.toISOString(),
      image_location: data.selfie_base64 || 'https://via.placeholder.com/150',
      latitude: data.latitude,
      longitude: data.longitude,
      outside_office: outsideOffice,
      location_exception_reason: outsideOffice ? exceptionReason : undefined,
    };

    db.punchIns.push(newPunchIn);
    saveState(db);
    return newPunchIn;
  },

  punchOut: async (data: {
    user_id: string;
    latitude: number;
    longitude: number;
    location_exception_reason?: string;
  }): Promise<AttendanceRecord> => {
    await delay();
    const distance = getMockOfficeDistance(data.latitude, data.longitude);
    const outsideOffice = distance > db.workspaceSettings.geofence_radius_meters;
    const exceptionReason = data.location_exception_reason?.trim() || '';
    if (outsideOffice && !exceptionReason) {
      throw new Error('A reason is required to clock out outside the office attendance area.');
    }
    if (exceptionReason.length > 500) {
      throw new Error('The location exception reason must be 500 characters or fewer.');
    }
    const punchInIndex = db.punchIns.reduce((latestIndex, punch, index) => {
      if (punch.user_id !== data.user_id) return latestIndex;
      if (latestIndex === -1) return index;
      const latestPunch = db.punchIns[latestIndex];
      const currentTime =
        parseMockPunchInTimestamp(punch)?.getTime() ??
        (Number(punch.punchin_id) || 0);
      const latestTime =
        parseMockPunchInTimestamp(latestPunch)?.getTime() ?? (Number(latestPunch.punchin_id) || 0);
      return currentTime > latestTime ? index : latestIndex;
    }, -1);

    if (punchInIndex === -1) {
      throw new Error('No active punch-in found for this user.');
    }

    const punchIn = db.punchIns[punchInIndex];
    const punchOutTime = new Date().toTimeString().split(' ')[0];

    // Compute working duration
    const punchedInAt = parseMockPunchInTimestamp(punchIn);
    const diffSec = punchedInAt
      ? Math.max(0, Math.floor((Date.now() - punchedInAt.getTime()) / 1000))
      : 0;
    const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const secs = String(diffSec % 60).padStart(2, '0');
    const hoursFormatted = `${hrs}:${mins}:${secs}`;

    const newRecord: AttendanceRecord = {
      id: Date.now(),
      user_id: data.user_id,
      date: punchIn.date || new Date().toISOString().split('T')[0],
      punch_in_time: punchIn.punch_in_time,
      punch_out_time: punchOutTime,
      hours: hoursFormatted,
      latitude: data.latitude,
      longitude: data.longitude,
      selfie_url: punchIn.image_location,
      outside_office: punchIn.outside_office,
      location_exception_reason: punchIn.location_exception_reason,
      clock_out_outside_office: outsideOffice,
      clock_out_location_exception_reason: outsideOffice ? exceptionReason : undefined,
    };

    db.attendanceRecords.unshift(newRecord);
    // Remove from active punchins
    db.punchIns.splice(punchInIndex, 1);
    saveState(db);

    return newRecord;
  },

  getPunchIns: async (): Promise<PunchInRecord[]> => {
    await delay();
    return [...db.punchIns];
  },

  getAttendanceRecords: async (userId?: string, date?: string | null): Promise<AttendanceRecord[]> => {
    await delay();
    let res = [...db.attendanceRecords];
    if (userId) {
      res = res.filter((r) => r.user_id === userId);
    }
    if (date) {
      res = res.filter((r) => r.date === date);
    }
    return res;
  },

  deletePunchIn: async (punchinId: number): Promise<void> => {
    await delay();
    db.punchIns = db.punchIns.filter((p) => p.punchin_id !== punchinId);
    saveState(db);
  },

  // ================= Leaves =================
  getLeaves: async (): Promise<Leave[]> => {
    await delay();
    return [...db.leaves];
  },

  createLeave: async (data: Omit<Leave, 'id' | 'status'>): Promise<Leave> => {
    await delay();
    const emp = db.employees.find((e) => e.user_id === data.user_id);
    const newLeave: Leave = {
      id: Date.now(),
      user_id: data.user_id,
      user_name: emp ? `${emp.first_name} ${emp.last_name}` : data.user_id,
      leave_type: data.leave_type,
      leave_date: data.leave_date,
      reason: data.reason,
      status: 'PENDING',
    };
    db.leaves.unshift(newLeave);
    saveState(db);
    return newLeave;
  },

  approveLeave: async (id: number): Promise<void> => {
    await delay();
    const found = db.leaves.find((l) => l.id === id);
    if (found) {
      found.status = 'APPROVED';
      saveState(db);
    }
  },

  rejectLeave: async (id: number): Promise<void> => {
    await delay();
    const found = db.leaves.find((l) => l.id === id);
    if (found) {
      found.status = 'REJECTED';
      saveState(db);
    }
  },

  // ================= Holidays / Calendar =================
  getHolidays: async (): Promise<Holiday[]> => {
    await delay();
    return [...db.holidays];
  },

  addHoliday: async (holiday: Holiday): Promise<Holiday> => {
    await delay();
    if (db.holidays.some((h) => h.holiday_date === holiday.holiday_date)) {
      throw new Error('A holiday is already marked for this date');
    }
    db.holidays.push(holiday);
    db.holidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
    saveState(db);
    return holiday;
  },

  deleteHoliday: async (date: string): Promise<void> => {
    await delay();
    db.holidays = db.holidays.filter((h) => h.holiday_date !== date);
    saveState(db);
  },

  // ================= Salaries =================
  getSalaries: async (): Promise<SalaryDetails[]> => {
    await delay();
    return [...db.salaries];
  },

  getSalariesByUserId: async (userId: string): Promise<SalaryDetails[]> => {
    await delay();
    return db.salaries.filter((s) => s.user_id === userId);
  },

  createSalary: async (data: any): Promise<SalaryDetails> => {
    await delay();
    const basic = Number(data.basic_salary || data.basic_pay || 0);
    const hra = Number(data.hra || 0);
    const food = Number(data.food_allowance || 0);
    const travel = Number(data.travel_allowance || 0);
    const tax = Number(data.emp_tax || 0);
    const epf = Number(data.epf || 0);
    const paye = Number(data.paye || 0);

    const net = basic + hra + food + travel - (tax + epf + paye);

    const emp = db.employees.find((e) => e.user_id === data.user_id);

    const newSalary: SalaryDetails = {
      id: Date.now(),
      user_id: data.user_id,
      user_name: emp ? `${emp.first_name} ${emp.last_name}` : data.user_id,
      date: data.date,
      basic_pay: basic,
      hra,
      food_allowance: food,
      travel_allowance: travel,
      emp_tax: tax,
      epf,
      paye,
      net_salary: net,
      status: data.status || 'PENDING',
      file_path: data.slip ? 'uploaded_slip.pdf' : null,
    };

    db.salaries.unshift(newSalary);
    saveState(db);
    return newSalary;
  },

  updateSalaryStatus: async (id: number, status: 'PENDING' | 'PAID' | 'REJECTED'): Promise<void> => {
    await delay();
    const found = db.salaries.find((s) => s.id === id);
    if (found) {
      found.status = status;
      saveState(db);
    }
  },

  deleteSalary: async (id: number): Promise<void> => {
    await delay();
    db.salaries = db.salaries.filter((s) => s.id !== id);
    saveState(db);
  },

  // ================= Library Management =================
  getBooks: async (): Promise<Book[]> => {
    await delay();
    return [...db.books];
  },

  addBook: async (data: Omit<Book, 'id'>): Promise<Book> => {
    await delay();
    const newBook: Book = {
      ...data,
      id: Date.now(),
      availableCopies: data.availableCopies ?? data.totalCopies,
    };
    db.books.unshift(newBook);
    saveState(db);
    return newBook;
  },

  updateBook: async (id: number, data: Partial<Book>): Promise<Book> => {
    await delay();
    const idx = db.books.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error(`Book with ID ${id} not found`);
    db.books[idx] = { ...db.books[idx], ...data };
    saveState(db);
    return db.books[idx];
  },

  deleteBook: async (id: number): Promise<void> => {
    await delay();
    db.books = db.books.filter((b) => b.id !== id);
    saveState(db);
  },

  getBookIssuances: async (userId?: string): Promise<BookIssuance[]> => {
    await delay();
    if (userId) {
      return db.issuances.filter((i) => i.userId === userId);
    }
    return [...db.issuances];
  },

  issueBook: async (data: {
    bookId: number;
    userId: string;
    dueDate: string;
    remarks?: string;
  }): Promise<BookIssuance> => {
    await delay();
    const book = db.books.find((b) => b.id === data.bookId);
    if (!book) throw new Error('Book not found');
    if (book.availableCopies <= 0) {
      throw new Error(`"${book.title}" has no copies available for issuance.`);
    }

    const emp = db.employees.find((e) => e.user_id === data.userId);
    if (!emp) throw new Error(`Employee ${data.userId} not found`);

    // Decrease available copies
    book.availableCopies -= 1;

    const newIssuance: BookIssuance = {
      id: Date.now(),
      bookId: book.id,
      bookTitle: book.title,
      isbn: book.isbn,
      userId: emp.user_id,
      userName: `${emp.first_name} ${emp.last_name}`,
      userEmail: emp.email_id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      status: 'ISSUED',
      remarks: data.remarks || '',
    };

    db.issuances.unshift(newIssuance);
    saveState(db);
    return newIssuance;
  },

  returnBook: async (issuanceId: number): Promise<BookIssuance> => {
    await delay();
    const issuance = db.issuances.find((i) => i.id === issuanceId);
    if (!issuance) throw new Error('Issuance record not found');

    issuance.status = 'RETURNED';
    issuance.returnDate = new Date().toISOString().split('T')[0];

    // Increase available copies back
    const book = db.books.find((b) => b.id === issuance.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    saveState(db);
    return issuance;
  },

  getBookRequests: async (userId?: string): Promise<BookRequest[]> => {
    await delay();
    if (userId) {
      return db.requests.filter((r) => r.userId === userId);
    }
    return [...db.requests];
  },

  requestBook: async (data: {
    bookId: number;
    userId: string;
    notes?: string;
  }): Promise<BookRequest> => {
    await delay();
    const book = db.books.find((b) => b.id === data.bookId);
    if (!book) throw new Error('Book not found');

    const emp = db.employees.find((e) => e.user_id === data.userId);
    if (!emp) throw new Error('Employee not found');

    const newReq: BookRequest = {
      id: Date.now(),
      bookId: book.id,
      bookTitle: book.title,
      userId: emp.user_id,
      userName: `${emp.first_name} ${emp.last_name}`,
      userEmail: emp.email_id,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      notes: data.notes || '',
    };

    db.requests.unshift(newReq);
    saveState(db);
    return newReq;
  },

  updateRequestStatus: async (
    requestId: number,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<BookRequest> => {
    await delay();
    const req = db.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = status;
    if (status === 'APPROVED') {
      // Auto-issue for 30 days
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      try {
        await mockService.issueBook({
          bookId: req.bookId,
          userId: req.userId,
          dueDate,
          remarks: 'Approved from employee request',
        });
      } catch (e) {
        console.warn('Auto-issue failed on approve:', e);
      }
    }

    saveState(db);
    return req;
  },
};
