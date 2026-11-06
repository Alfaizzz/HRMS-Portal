const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const appMode = process.env.APP_MODE || 'demo';
const isRealMode = appMode === 'real';

const { initializeDatabase } = require('./init-db');
const { readData, writeData } = require('./data/store');

const app = express();
const PORT = Number(process.env.PORT || 8080);
const baseUploadsDir = path.join(__dirname, '..', 'uploads');
const uploadDirs = {
  documents: path.join(baseUploadsDir, 'documents'),
  selfies: path.join(baseUploadsDir, 'selfies'),
  profiles: path.join(baseUploadsDir, 'profile-pictures'),
  payslips: path.join(baseUploadsDir, 'pay-slips'),
};

Object.values(uploadDirs).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const corsOptions = {
  origin: true,
  credentials: true,
};

const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirs.documents),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
});

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirs.profiles),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
});

const payslipUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirs.payslips),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(baseUploadsDir));

const isPublicRoute = (req) => {
  const publicPaths = ['/health', '/api/auth/login', '/user/photo', '/uploads'];
  return publicPaths.some((prefix) => req.path === '/health' || req.path.startsWith(prefix));
};

app.use((req, res, next) => {
  if (isPublicRoute(req)) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Missing bearer token.' });
  }

  next();
});

const buildToken = (user) => {
  const payload = {
    userId: user.user_id,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };

  return `hrms_${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
};

const getTokenPayload = (req) => {
  const token = (req.headers.authorization || '').slice('Bearer '.length);
  if (!token.startsWith('hrms_')) return null;

  try {
    const payload = JSON.parse(Buffer.from(token.slice(5), 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

const isWorkspaceAdmin = (req) => getTokenPayload(req)?.role === 'ADMIN';

const DEFAULT_WORKSPACE_SETTINGS = {
  workspace_name: 'Head Office',
  office_latitude: 12.9716,
  office_longitude: 77.5946,
  geofence_radius_meters: 150,
  required_hours_per_day: 8,
};

const getWorkspaceSettings = async () => {
  if (isRealMode) {
    const { query } = require('./db');
    const result = await query(
      `SELECT workspace_name, office_latitude, office_longitude,
              geofence_radius_meters, required_hours_per_day
       FROM attendance_workspace_settings WHERE id = 1`
    );
    if (!result.rows[0]) {
      throw new Error('Workspace settings have not been initialized.');
    }
    return {
      ...result.rows[0],
      office_latitude: Number(result.rows[0].office_latitude),
      office_longitude: Number(result.rows[0].office_longitude),
      geofence_radius_meters: Number(result.rows[0].geofence_radius_meters),
      required_hours_per_day: Number(result.rows[0].required_hours_per_day),
    };
  }

  const settings = readData().workspaceSettings;
  return { ...DEFAULT_WORKSPACE_SETTINGS, ...settings };
};

const distanceInMeters = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const latitudeDifference = radians(latitudeB - latitudeA);
  const longitudeDifference = radians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const validateWorkspaceSettings = (settings) => {
  const workspaceName = String(settings.workspace_name || '').trim();
  const latitude = Number(settings.office_latitude);
  const longitude = Number(settings.office_longitude);
  const radius = Number(settings.geofence_radius_meters);
  const requiredHours = Number(settings.required_hours_per_day);

  if (!workspaceName || workspaceName.length > 255) {
    return { error: 'Workspace name is required and must be 255 characters or fewer.' };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: 'Office latitude must be between -90 and 90.' };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: 'Office longitude must be between -180 and 180.' };
  }
  if (!Number.isInteger(radius) || radius < 10 || radius > 5000) {
    return { error: 'Geofence radius must be a whole number between 10 and 5000 meters.' };
  }
  if (!Number.isFinite(requiredHours) || requiredHours <= 0 || requiredHours > 24) {
    return { error: 'Required daily hours must be greater than 0 and no more than 24.' };
  }

  return {
    value: {
      workspace_name: workspaceName,
      office_latitude: latitude,
      office_longitude: longitude,
      geofence_radius_meters: radius,
      required_hours_per_day: requiredHours,
    },
  };
};

const validateOfficeLocation = (latitude, longitude, settings) => {
  const currentLatitude = Number(latitude);
  const currentLongitude = Number(longitude);
  if (
    !Number.isFinite(currentLatitude) ||
    currentLatitude < -90 ||
    currentLatitude > 90 ||
    !Number.isFinite(currentLongitude) ||
    currentLongitude < -180 ||
    currentLongitude > 180
  ) {
    return { error: 'A valid GPS location is required to record attendance.' };
  }

  const distance = distanceInMeters(
    currentLatitude,
    currentLongitude,
    settings.office_latitude,
    settings.office_longitude
  );
  return {
    distance,
    within: distance <= settings.geofence_radius_meters,
  };
};

const parsePunchInTimestamp = (punchIn) => {
  if (punchIn.punched_at) {
    const punchedAt = new Date(punchIn.punched_at);
    if (!Number.isNaN(punchedAt.getTime())) return punchedAt;
  }

  const dateMatch = String(punchIn.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(punchIn.punch_in_time || '').match(
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

const getEmployee = (db, userId) =>
  db.employees.find((employee) => employee.user_id === userId);

const searchEmployees = (db, query = '') => {
  const q = String(query).trim().toLowerCase();
  const list = db.employees.filter((employee) => employee.status === 'ACTIVE');

  if (!q) return list;

  return list.filter((employee) => {
    const values = [
      employee.user_id,
      employee.first_name,
      employee.last_name,
      employee.email_id,
      employee.job_profile,
      employee.department_id,
    ].join(' ').toLowerCase();

    return values.includes(q);
  });
};

const ensureRecord = (arr, predicate, row) => {
  const existing = arr.findIndex(predicate);

  if (existing !== -1) {
    arr[existing] = { ...arr[existing], ...row };
    return arr[existing];
  }

  arr.push(row);
  return row;
};

app.get('/health', async (_req, res) => {
  const dbStatus = isRealMode ? 'postgres' : 'json';
  if (isRealMode) {
    try {
      const { query } = require('./db');
      await query('SELECT 1');
      return res.json({ status: 'ok', service: 'hrms-backend', port: PORT, database: dbStatus, mode: appMode });
    } catch (error) {
      return res.status(500).json({ status: 'error', service: 'hrms-backend', port: PORT, database: dbStatus, mode: appMode, message: error.message });
    }
  }

  res.json({ status: 'ok', service: 'hrms-backend', port: PORT, database: dbStatus, mode: appMode });
});

app.get('/attendance/workspace', async (_req, res) => {
  try {
    return res.json(await getWorkspaceSettings());
  } catch (error) {
    console.error('Failed to load attendance workspace settings:', error.message);
    return res.status(500).json({ message: 'Failed to load workspace settings.' });
  }
});

app.put('/attendance/workspace', async (req, res) => {
  if (!isWorkspaceAdmin(req)) {
    return res.status(403).json({ message: 'Only administrators can update workspace settings.' });
  }

  const validation = validateWorkspaceSettings(req.body || {});
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const settings = validation.value;
  try {
    if (isRealMode) {
      const { query } = require('./db');
      const result = await query(
        `INSERT INTO attendance_workspace_settings (
           id, workspace_name, office_latitude, office_longitude,
           geofence_radius_meters, required_hours_per_day, updated_at
         )
         VALUES (1, $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           workspace_name = EXCLUDED.workspace_name,
           office_latitude = EXCLUDED.office_latitude,
           office_longitude = EXCLUDED.office_longitude,
           geofence_radius_meters = EXCLUDED.geofence_radius_meters,
           required_hours_per_day = EXCLUDED.required_hours_per_day,
           updated_at = CURRENT_TIMESTAMP
         RETURNING workspace_name, office_latitude, office_longitude,
                   geofence_radius_meters, required_hours_per_day`,
        [
          settings.workspace_name,
          settings.office_latitude,
          settings.office_longitude,
          settings.geofence_radius_meters,
          settings.required_hours_per_day,
        ]
      );
      return res.json({
        ...result.rows[0],
        office_latitude: Number(result.rows[0].office_latitude),
        office_longitude: Number(result.rows[0].office_longitude),
        geofence_radius_meters: Number(result.rows[0].geofence_radius_meters),
        required_hours_per_day: Number(result.rows[0].required_hours_per_day),
      });
    }

    const db = readData();
    db.workspaceSettings = settings;
    writeData(db);
    return res.json(settings);
  } catch (error) {
    console.error('Failed to update attendance workspace settings:', error.message);
    return res.status(500).json({ message: 'Failed to save workspace settings.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const db = readData();

  const allowDemo =
    (username === 'admin' && password === 'admin123') ||
    (username === 'employee' && password === 'employee123');

  if (allowDemo) {
    const user = db.employees.find((employee) => employee.user_id === username) || {
      user_id: username,
      first_name: username === 'admin' ? 'System' : 'Alex',
      last_name: username === 'admin' ? 'Administrator' : 'Johnson',
      email_id: `${username}@company.com`,
      mobile_number: username === 'admin' ? '9876543210' : '9123456789',
      salary: username === 'admin' ? 120000 : 85000,
      father_name: '',
      mother_name: '',
      current_address: '',
      permanent_address: '',
      blood_group: 'O+',
      dob: '1995-01-01',
      doj: '2023-01-01',
      pan_number: username === 'admin' ? 'ABCDE1234F' : 'FGHIJ5678K',
      department_id: username === 'admin' ? 'HR01' : 'ENG01',
      religion: 'Secular',
      role: username === 'admin' ? 'ADMIN' : 'USER',
      nationality: 'Indian',
      job_profile: username === 'admin' ? 'Lead HR Operations & Systems Admin' : 'Senior Full Stack Engineer',
      status: 'ACTIVE',
    };

    const token = buildToken(user);
    return res.json({ token, user });
  }

  const match = db.employees.find(
    (employee) =>
      employee.user_id.toLowerCase() === username.toLowerCase() ||
      employee.email_id.toLowerCase() === username.toLowerCase()
  );

  if (!match || match.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const user = { ...match };
  const token = buildToken(user);
  return res.json({ token, user });
});

app.get('/department', (_req, res) => {
  const db = readData();
  return res.json(db.departments);
});

app.get('/department/', (_req, res) => {
  return res.json(readData().departments);
});

app.get('/department/:id', (req, res) => {
  const db = readData();
  const needed = db.departments.find(
    (department) =>
      department.department_id === req.params.id ||
      department.department_name.toLowerCase() === req.params.id.toLowerCase()
  );

  if (!needed) {
    return res.status(404).json({ message: 'Department not found' });
  }

  return res.json(needed);
});

app.post('/department/create', (req, res) => {
  const db = readData();
  const incoming = req.body;

  if (!incoming.department_id || !incoming.department_name) {
    return res.status(400).json({ message: 'department_id and department_name are required' });
  }

  const exists = db.departments.some((department) => department.department_id === incoming.department_id);
  if (exists) {
    return res.status(409).json({ message: 'Department already exists' });
  }

  db.departments.push({
    department_id: incoming.department_id,
    department_name: incoming.department_name,
  });

  writeData(db);
  return res.status(201).json({ department_id: incoming.department_id, department_name: incoming.department_name });
});

app.put('/department/update/:id', (req, res) => {
  const db = readData();
  const index = db.departments.findIndex((department) => department.department_id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Department not found' });
  }

  db.departments[index] = {
    ...db.departments[index],
    ...req.body,
  };

  writeData(db);
  return res.json(db.departments[index]);
});

app.delete('/department/delete/:id', (req, res) => {
  const db = readData();
  const before = db.departments.length;
  db.departments = db.departments.filter((department) => department.department_id !== req.params.id);

  if (db.departments.length === before) {
    return res.status(404).json({ message: 'Department not found' });
  }

  writeData(db);
  return res.status(204).send();
});

app.get('/user/search', (req, res) => {
  const db = readData();
  const query = (req.query.query || '').toString();
  return res.json(searchEmployees(db, query));
});

app.get('/user/personalDetails/:userId', (req, res) => {
  const db = readData();
  const user = getEmployee(db, req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  return res.json(user);
});

app.post('/user/personalDetails', (req, res) => {
  const db = readData();
  const data = req.body;

  if (!data.user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  const existing = getEmployee(db, data.user_id);
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const newEmployee = {
    user_id: data.user_id,
    password: data.password || 'welcome123',
    first_name: data.first_name || 'New',
    last_name: data.last_name || 'Employee',
    email_id: data.email_id || `${data.user_id}@company.com`,
    mobile_number: data.mobile_number || '9000000000',
    salary: Number(data.salary) || 50000,
    father_name: data.father_name || '',
    mother_name: data.mother_name || '',
    current_address: data.current_address || 'Address line 1',
    permanent_address: data.permanent_address || 'Address line 1',
    blood_group: data.blood_group || 'O+',
    dob: data.dob || '1995-01-01',
    doj: data.doj || new Date().toISOString().slice(0, 10),
    pan_number: data.pan_number || `PAN${Date.now()}`,
    department_id: data.department_id || 'ENG01',
    religion: data.religion || 'Secular',
    role: data.role || 'USER',
    nationality: data.nationality || 'Indian',
    job_profile: data.job_profile || 'Employee',
    status: 'ACTIVE',
  };

  db.employees.push(newEmployee);
  writeData(db);
  return res.status(201).json({ user_id: newEmployee.user_id });
});

app.put('/user/update/personalDetails/:userId', (req, res) => {
  const db = readData();
  const index = db.employees.findIndex((employee) => employee.user_id === req.params.userId);

  if (index === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  db.employees[index] = {
    ...db.employees[index],
    ...req.body,
  };

  writeData(db);
  return res.json(db.employees[index]);
});

app.delete('/user/delete/:userId', (req, res) => {
  const db = readData();
  const user = getEmployee(db, req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  user.status = 'INACTIVE';
  writeData(db);
  return res.status(204).send();
});

app.get('/user/deleted', (_req, res) => {
  const db = readData();
  return res.json(db.employees.filter((employee) => employee.status === 'INACTIVE'));
});

app.post('/user/activate/:userId', (req, res) => {
  const db = readData();
  const user = getEmployee(db, req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  user.status = 'ACTIVE';
  writeData(db);
  return res.json(user);
});

app.get('/user/photo/:userId', (req, res) => {
  const db = readData();
  const user = getEmployee(db, req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const profilePicture = db.profilePictures[req.params.userId];
  if (profilePicture) {
    const target = path.join(__dirname, '..', profilePicture.replace(/^\//, ''));
    if (fs.existsSync(target)) {
      return res.sendFile(target);
    }
  }

  return res.redirect('https://ui-avatars.com/api/?name=' + encodeURIComponent(`${user.first_name} ${user.last_name}`));
});

app.post('/user/upload-picture/:userId', profileUpload.single('file'), (req, res) => {
  const db = readData();
  const user = getEmployee(db, req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const relativePath = `/uploads/profile-pictures/${req.file.filename}`;
  db.profilePictures[req.params.userId] = relativePath;
  writeData(db);
  return res.json({ path: relativePath });
});

app.get('/user/bankDetails/:userId', (req, res) => {
  const db = readData();
  const bankDetails = db.bankDetails[req.params.userId];

  if (!bankDetails) {
    return res.status(404).json({ message: 'Bank details not found' });
  }

  return res.json(bankDetails);
});

app.post('/user/bankDetails', (req, res) => {
  const db = readData();
  const payload = req.body;
  const user = getEmployee(db, payload.user_id);

  if (!user) {
    return res.status(404).json({ message: 'If the user does not exist, bank details cannot be created' });
  }

  db.bankDetails[payload.user_id] = payload;
  writeData(db);
  return res.status(201).json(payload);
});

app.put('/user/update/bankDetails/:userId', (req, res) => {
  const db = readData();
  const key = req.params.userId;
  if (!db.bankDetails[key]) {
    db.bankDetails[key] = { user_id: key };
  }

  db.bankDetails[key] = { ...db.bankDetails[key], ...req.body, user_id: key };
  writeData(db);
  return res.json(db.bankDetails[key]);
});

app.get('/user/educationalDetails/:userId', (req, res) => {
  const db = readData();
  const details = db.education[req.params.userId];

  if (!details) {
    return res.status(404).json({ message: 'Educational details not found' });
  }

  return res.json(details);
});

app.post('/user/educationalDetails', (req, res) => {
  const db = readData();
  const payload = req.body;
  db.education[payload.user_id] = payload;
  writeData(db);
  return res.status(201).json(payload);
});

app.put('/user/update/educationalDetails/:userId', (req, res) => {
  const db = readData();
  const key = req.params.userId;
  db.education[key] = { ...db.education[key], ...req.body, user_id: key };
  writeData(db);
  return res.json(db.education[key]);
});

app.get('/user/experience/:userId', (req, res) => {
  const db = readData();
  const rows = db.experiences[req.params.userId] || [];
  return res.json(rows);
});

app.post('/user/experience', (req, res) => {
  const db = readData();
  const payload = req.body;
  const key = payload.user_id;
  const list = db.experiences[key] || [];
  const next = {
    ...payload,
    id: payload.id || Date.now(),
  };
  list.push(next);
  db.experiences[key] = list;
  writeData(db);
  return res.status(201).json(next);
});

app.put('/user/update/experience/:userId', (req, res) => {
  const db = readData();
  const key = req.params.userId;
  const list = db.experiences[key] || [];
  const next = req.body;
  const payload = { ...next, user_id: key };
  const index = list.findIndex((item) => item.id === next.id || item.user_id === key);

  if (index === -1) {
    list.push(payload);
  } else {
    list[index] = { ...list[index], ...payload };
  }

  db.experiences[key] = list;
  writeData(db);
  return res.json(list);
});

app.get('/user/CompanyAssets/:userId', (req, res) => {
  const db = readData();
  return res.json(db.assets[req.params.userId] || []);
});

app.post('/user/company_assets', (req, res) => {
  const db = readData();
  const payload = req.body;
  const key = payload.user_id;
  const list = db.assets[key] || [];
  list.push(payload);
  db.assets[key] = list;
  writeData(db);
  return res.status(201).json(payload);
});

app.put('/user/update/companyAssets/:userId', (req, res) => {
  const db = readData();
  const key = req.params.userId;
  const payload = req.body;
  const list = db.assets[key] || [];
  const index = list.findIndex((item) => item.asset_id === payload.asset_id);

  if (index === -1) {
    list.push(payload);
  } else {
    list[index] = payload;
  }

  db.assets[key] = list;
  writeData(db);
  return res.json(payload);
});

app.delete('/user/company-asset/:userId', (req, res) => {
  const db = readData();
  const key = req.params.userId;
  const assetId = req.query.asset_id;
  const list = db.assets[key] || [];
  db.assets[key] = list.filter((item) => item.asset_id !== assetId);
  writeData(db);
  return res.status(204).send();
});

app.post('/documents/upload', documentUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const db = readData();
  const payload = {
    id: Date.now(),
    user_id: req.body.userId,
    document_type: req.body.documentType,
    document_name: req.body.document_name || req.file.originalname,
    file_path: `/uploads/documents/${req.file.filename}`,
    extension: path.extname(req.file.originalname).replace('.', ''),
    upload_time: new Date().toISOString(),
  };

  db.documents.push(payload);
  writeData(db);
  return res.json({ message: 'Document uploaded successfully', document: payload });
});

app.get('/documents/users/:userId/documents/download', (req, res) => {
  const db = readData();
  const docs = db.documents.filter((doc) => doc.user_id === req.params.userId);
  return res.json(docs);
});

app.get('/attendance/punchIn', (_req, res) => {
  const db = readData();
  return res.json(db.punchIns);
});

app.post('/attendance/punchIn', async (req, res) => {
  const db = readData();
  const body = req.body;
  const user = getEmployee(db, body.user_id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let settings;
  try {
    settings = await getWorkspaceSettings();
  } catch (error) {
    console.error('Unable to verify attendance workspace:', error.message);
    return res.status(500).json({ message: 'Unable to verify the attendance workspace.' });
  }
  const locationValidation = validateOfficeLocation(body.latitude, body.longitude, settings);
  if (locationValidation.error) {
    return res.status(400).json({ message: locationValidation.error });
  }
  const locationExceptionReason = String(body.location_exception_reason || '').trim();
  if (!locationValidation.within && !locationExceptionReason) {
    return res.status(400).json({
      message: 'A reason is required to clock in outside the office attendance area.',
    });
  }
  if (locationExceptionReason.length > 500) {
    return res.status(400).json({
      message: 'The location exception reason must be 500 characters or fewer.',
    });
  }

  if (db.punchIns.some((punch) => punch.user_id === body.user_id)) {
    return res.status(409).json({ message: 'User already has an active punch-in. Clock out before starting another session.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const punchedAt = new Date();
  const punchIn = {
    punchin_id: Date.now(),
    user_id: body.user_id,
    user_name: `${user.first_name} ${user.last_name}`,
    date: today,
    punch_in_time: punchedAt.toTimeString().split(' ')[0],
    punched_at: punchedAt.toISOString(),
    image_location: body.selfie_url || 'uploads/selfies/default.png',
    latitude: body.latitude,
    longitude: body.longitude,
    outside_office: !locationValidation.within,
    location_exception_reason: locationValidation.within ? undefined : locationExceptionReason,
  };

  db.punchIns.push(punchIn);
  writeData(db);
  return res.status(201).json(punchIn);
});

app.post('/attendance/punchOut', async (req, res) => {
  const db = readData();
  const body = req.body;
  const user = getEmployee(db, body.user_id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let settings;
  try {
    settings = await getWorkspaceSettings();
  } catch (error) {
    console.error('Unable to verify attendance workspace:', error.message);
    return res.status(500).json({ message: 'Unable to verify the attendance workspace.' });
  }
  const locationValidation = validateOfficeLocation(body.latitude, body.longitude, settings);
  if (locationValidation.error) {
    return res.status(400).json({ message: locationValidation.error });
  }
  const locationExceptionReason = String(body.location_exception_reason || '').trim();
  if (!locationValidation.within && !locationExceptionReason) {
    return res.status(400).json({
      message: 'A reason is required to clock out outside the office attendance area.',
    });
  }
  if (locationExceptionReason.length > 500) {
    return res.status(400).json({
      message: 'The location exception reason must be 500 characters or fewer.',
    });
  }

  const punchIndex = db.punchIns.reduce((latestIndex, punch, index) => {
    if (punch.user_id !== body.user_id) return latestIndex;
    if (latestIndex === -1) return index;
    const latestPunch = db.punchIns[latestIndex];
    const currentTime = parsePunchInTimestamp(punch)?.getTime() ?? (Number(punch.punchin_id) || 0);
    const latestTime =
      parsePunchInTimestamp(latestPunch)?.getTime() ?? (Number(latestPunch.punchin_id) || 0);
    return currentTime > latestTime ? index : latestIndex;
  }, -1);
  if (punchIndex === -1) {
    return res.status(404).json({ message: 'No active punch-in found for this user.' });
  }

  const punchIn = db.punchIns[punchIndex];
  const punchedOutAt = new Date();
  const punchedInAt = parsePunchInTimestamp(punchIn);
  const durationSeconds = !punchedInAt
    ? 0
    : Math.max(0, Math.floor((punchedOutAt.getTime() - punchedInAt.getTime()) / 1000));
  const hours = String(Math.floor(durationSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((durationSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(durationSeconds % 60).padStart(2, '0');
  const punchOut = {
    id: Date.now(),
    user_id: body.user_id,
    date: punchIn.date || punchedOutAt.toISOString().slice(0, 10),
    punch_in_time: punchIn.punch_in_time,
    punch_out_time: punchedOutAt.toTimeString().split(' ')[0],
    hours: `${hours}:${minutes}:${seconds}`,
    latitude: punchIn.latitude,
    longitude: punchIn.longitude,
    selfie_url: punchIn.image_location,
    outside_office: punchIn.outside_office,
    location_exception_reason: punchIn.location_exception_reason,
    clock_out_outside_office: !locationValidation.within,
    clock_out_location_exception_reason: locationValidation.within
      ? undefined
      : locationExceptionReason,
  };

  db.attendanceRecords.unshift(punchOut);
  db.punchIns.splice(punchIndex, 1);
  writeData(db);
  return res.status(201).json(punchOut);
});

app.get('/attendance/attendance-records/:userId', (req, res) => {
  const db = readData();
  const records = db.attendanceRecords.filter((record) => record.user_id === req.params.userId);
  return res.json(records);
});

app.get('/user/resources', (req, res) => {
  const db = readData();
  const userId = req.query.user_id;
  const records = db.attendanceRecords.filter((record) => record.user_id === userId);
  const leaves = db.leaves.filter((leave) => leave.user_id === userId);
  return res.json({ attendanceRecords: records, leaves });
});

app.delete('/attendance/punchInImage/:id', (req, res) => {
  const db = readData();
  const before = db.punchIns.length;
  db.punchIns = db.punchIns.filter((punch) => String(punch.punchin_id) !== String(req.params.id));

  if (db.punchIns.length === before) {
    return res.status(404).json({ message: 'Punch in record not found' });
  }

  writeData(db);
  return res.status(204).send();
});

app.get('/leaves/', (_req, res) => {
  const db = readData();
  return res.json(db.leaves);
});

app.post('/leaves/create', (req, res) => {
  const db = readData();
  const payload = req.body;
  const newLeave = {
    id: Date.now(),
    user_id: payload.user_id,
    user_name: payload.user_name || '',
    leave_type: payload.leave_type,
    leave_date: payload.leave_date,
    reason: payload.reason,
    status: 'PENDING',
  };

  db.leaves.push(newLeave);
  writeData(db);
  return res.status(201).json(newLeave);
});

app.put('/leaves/approve/:id', (req, res) => {
  const db = readData();
  const leave = db.leaves.find((item) => String(item.id) === String(req.params.id));

  if (!leave) {
    return res.status(404).json({ message: 'Leave not found' });
  }

  leave.status = 'APPROVED';
  writeData(db);
  return res.json(leave);
});

app.put('/leaves/reject/:id', (req, res) => {
  const db = readData();
  const leave = db.leaves.find((item) => String(item.id) === String(req.params.id));

  if (!leave) {
    return res.status(404).json({ message: 'Leave not found' });
  }

  leave.status = 'REJECTED';
  writeData(db);
  return res.json(leave);
});

app.get('/holiday/:date', (req, res) => {
  const db = readData();
  const holidays = db.holidays.filter((holiday) => holiday.holiday_date === req.params.date);
  return res.json(holidays.length ? holidays : []);
});

app.get('/holiday', (_req, res) => {
  const db = readData();
  return res.json(db.holidays);
});

app.post('/holiday', (req, res) => {
  const db = readData();
  const holiday = req.body;
  if (!holiday.holiday_date || !holiday.description) {
    return res.status(400).json({ message: 'holiday_date and description are required' });
  }

  const exists = db.holidays.some((entry) => entry.holiday_date === holiday.holiday_date);
  if (exists) {
    return res.status(409).json({ message: 'Holiday already exists' });
  }

  db.holidays.push(holiday);
  writeData(db);
  return res.status(201).json(holiday);
});

app.delete('/holiday/delete/:date', (req, res) => {
  const db = readData();
  const before = db.holidays.length;
  db.holidays = db.holidays.filter((holiday) => holiday.holiday_date !== req.params.date);

  if (db.holidays.length === before) {
    return res.status(404).json({ message: 'Holiday not found' });
  }

  writeData(db);
  return res.status(204).send();
});

app.get('/salary/salary-details', (_req, res) => {
  const db = readData();
  return res.json(db.salaries);
});

app.get('/salary/salary-details/:userId', (req, res) => {
  const db = readData();
  return res.json(db.salaries.filter((entry) => entry.user_id === req.params.userId));
});

app.post('/salary/upload', payslipUpload.single('file'), (req, res) => {
  const db = readData();
  const payload = req.body;
  const newEntry = {
    id: Date.now(),
    user_id: payload.user_id,
    user_name: payload.user_name || '',
    date: payload.date || new Date().toISOString().slice(0, 10),
    basic_pay: Number(payload.basic_pay) || 0,
    hra: Number(payload.hra) || 0,
    food_allowance: Number(payload.food_allowance) || 0,
    travel_allowance: Number(payload.travel_allowance) || 0,
    emp_tax: Number(payload.emp_tax) || 0,
    epf: Number(payload.epf) || 0,
    paye: Number(payload.paye) || 0,
    net_salary: Number(payload.net_salary) || 0,
    status: payload.status || 'PENDING',
    file_path: req.file ? `/uploads/pay-slips/${req.file.filename}` : payload.file_path || null,
  };

  db.salaries.push(newEntry);
  writeData(db);
  return res.status(201).json(newEntry);
});

app.put('/salary/salary-status', (req, res) => {
  const db = readData();
  const id = Number(req.query.id);
  const status = String(req.query.status || 'PENDING');
  const salary = db.salaries.find((entry) => entry.id === id);

  if (!salary) {
    return res.status(404).json({ message: 'Salary record not found' });
  }

  salary.status = status;
  writeData(db);
  return res.json(salary);
});

app.delete('/salary/delete', (req, res) => {
  const db = readData();
  const id = Number(req.query.id);
  const before = db.salaries.length;
  db.salaries = db.salaries.filter((entry) => entry.id !== id);

  if (db.salaries.length === before) {
    return res.status(404).json({ message: 'Salary record not found' });
  }

  writeData(db);
  return res.status(204).send();
});

app.get('/library/books', (_req, res) => {
  const db = readData();
  return res.json(db.books);
});

app.post('/library/books', (req, res) => {
  const db = readData();
  const payload = req.body;
  const book = {
    id: Date.now(),
    ...payload,
    totalCopies: Number(payload.totalCopies) || 1,
    availableCopies: Number(payload.availableCopies) || Number(payload.totalCopies) || 1,
  };

  db.books.push(book);
  writeData(db);
  return res.status(201).json(book);
});

app.put('/library/books/:id', (req, res) => {
  const db = readData();
  const index = db.books.findIndex((book) => String(book.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  db.books[index] = { ...db.books[index], ...req.body };
  writeData(db);
  return res.json(db.books[index]);
});

app.delete('/library/books/:id', (req, res) => {
  const db = readData();
  const before = db.books.length;
  db.books = db.books.filter((book) => String(book.id) !== String(req.params.id));

  if (db.books.length === before) {
    return res.status(404).json({ message: 'Book not found' });
  }

  writeData(db);
  return res.status(204).send();
});

app.get('/library/issuances', (req, res) => {
  const db = readData();
  const userId = req.query.userId;
  const list = userId ? db.issuances.filter((entry) => entry.userId === userId) : db.issuances;
  return res.json(list);
});

app.post('/library/issuances', (req, res) => {
  const db = readData();
  const payload = req.body;
  const book = db.books.find((entry) => Number(entry.id) === Number(payload.bookId));

  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const issue = {
    id: Date.now(),
    bookId: Number(payload.bookId),
    bookTitle: book.title,
    isbn: book.isbn,
    userId: payload.userId,
    userName: payload.userName || '',
    userEmail: payload.userEmail || '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: payload.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    returnDate: null,
    status: 'ISSUED',
    remarks: payload.remarks || '',
  };

  db.issuances.push(issue);
  book.availableCopies = Math.max(0, Number(book.availableCopies) - 1);
  writeData(db);
  return res.status(201).json(issue);
});

app.post('/library/issuances/:issuanceId/return', (req, res) => {
  const db = readData();
  const issuance = db.issuances.find((entry) => String(entry.id) === String(req.params.issuanceId));

  if (!issuance) {
    return res.status(404).json({ message: 'Issuance not found' });
  }

  issuance.returnDate = new Date().toISOString().slice(0, 10);
  issuance.status = 'RETURNED';

  const book = db.books.find((entry) => Number(entry.id) === Number(issuance.bookId));
  if (book) {
    book.availableCopies = Number(book.availableCopies) + 1;
  }

  writeData(db);
  return res.json(issuance);
});

app.get('/library/requests', (req, res) => {
  const db = readData();
  const userId = req.query.userId;
  const list = userId ? db.requests.filter((entry) => entry.userId === userId) : db.requests;
  return res.json(list);
});

app.post('/library/requests', (req, res) => {
  const db = readData();
  const payload = req.body;
  const book = db.books.find((entry) => Number(entry.id) === Number(payload.bookId));

  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const request = {
    id: Date.now(),
    bookId: Number(payload.bookId),
    bookTitle: book.title,
    userId: payload.userId,
    userName: payload.userName || '',
    userEmail: payload.userEmail || '',
    requestDate: new Date().toISOString().slice(0, 10),
    status: 'PENDING',
    notes: payload.notes || '',
  };

  db.requests.push(request);
  writeData(db);
  return res.status(201).json(request);
});

app.put('/library/requests/:requestId/status', (req, res) => {
  const db = readData();
  const request = db.requests.find((entry) => String(entry.id) === String(req.params.requestId));

  if (!request) {
    return res.status(404).json({ message: 'Library request not found' });
  }

  request.status = req.body.status || request.status;
  writeData(db);
  return res.json(request);
});

if (isRealMode) {
  initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`HRMS Backend running on http://localhost:${PORT}`);
      console.log(`Mode: ${appMode}`);
      console.log(`Connected to PostgreSQL: ${process.env.DATABASE_URL}`);
    });
  });
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HRMS Backend running on http://localhost:${PORT}`);
    console.log(`Mode: ${appMode}`);
  });
}
