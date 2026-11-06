CREATE TABLE IF NOT EXISTS departments (
  department_id VARCHAR(100) PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  user_id VARCHAR(100) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email_id VARCHAR(255) NOT NULL UNIQUE,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  salary NUMERIC(15,2) NOT NULL,
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  current_address TEXT,
  permanent_address TEXT,
  blood_group VARCHAR(20),
  dob DATE,
  doj DATE,
  pan_number VARCHAR(20) NOT NULL UNIQUE,
  department_id VARCHAR(100),
  religion VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  nationality VARCHAR(100),
  job_profile VARCHAR(150),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE IF NOT EXISTS bank_details (
  user_id VARCHAR(100) PRIMARY KEY,
  bank_name VARCHAR(255),
  account_number VARCHAR(50) UNIQUE,
  ifsc_code VARCHAR(30),
  branch_name VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS educational_details (
  user_id VARCHAR(100) PRIMARY KEY,
  highschool NUMERIC(5,2),
  secondaryschool NUMERIC(5,2),
  bachelor NUMERIC(5,2),
  postgraduation NUMERIC(5,2),
  others NUMERIC(5,2),
  highschoolname VARCHAR(255),
  secondaryschoolname VARCHAR(255),
  bachelorcollegename VARCHAR(255),
  mastercollegename VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_experience (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  previous_employer VARCHAR(255),
  job_profile VARCHAR(255),
  yoe INTEGER DEFAULT 0,
  dor DATE,
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_assets (
  asset_id VARCHAR(100) PRIMARY KEY,
  asset_name VARCHAR(255),
  asset_type VARCHAR(255),
  asset_issue_date DATE,
  user_id VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_documents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  document_type VARCHAR(100),
  file_path TEXT,
  document_name VARCHAR(255),
  extension VARCHAR(20),
  upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS holidays (
  holiday_date DATE PRIMARY KEY,
  description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(255),
  leave_type VARCHAR(100),
  leave_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS punch_ins (
  punchin_id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(255),
  date DATE,
  punch_in_time VARCHAR(100),
  image_location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  date DATE,
  punch_in_time VARCHAR(255),
  punch_out_time VARCHAR(255),
  hours VARCHAR(50),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  selfie_url TEXT,
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_workspace_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  workspace_name VARCHAR(255) NOT NULL,
  office_latitude DOUBLE PRECISION NOT NULL,
  office_longitude DOUBLE PRECISION NOT NULL,
  geofence_radius_meters INTEGER NOT NULL CHECK (geofence_radius_meters > 0),
  required_hours_per_day NUMERIC(4,2) NOT NULL CHECK (required_hours_per_day > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO attendance_workspace_settings (
  id, workspace_name, office_latitude, office_longitude,
  geofence_radius_meters, required_hours_per_day
)
VALUES (1, 'Head Office', 12.9716, 77.5946, 150, 8)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS profile_pictures (
  user_id VARCHAR(100) PRIMARY KEY,
  path TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resignation (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE,
  remark TEXT,
  date_of_resignation DATE,
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salary_details (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(255),
  date DATE,
  basic_pay NUMERIC(10,2),
  hra NUMERIC(10,2),
  food_allowance NUMERIC(10,2),
  travel_allowance NUMERIC(10,2),
  emp_tax NUMERIC(10,2),
  epf NUMERIC(10,2),
  paye NUMERIC(10,2),
  net_salary NUMERIC(12,2),
  status VARCHAR(50) DEFAULT 'PENDING',
  file_path TEXT,
  FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  totalcopies INTEGER DEFAULT 1,
  availablecopies INTEGER DEFAULT 1,
  shelflocation VARCHAR(255),
  publicationyear INTEGER,
  covercolor VARCHAR(50),
  description TEXT
);

CREATE TABLE IF NOT EXISTS book_issuances (
  id SERIAL PRIMARY KEY,
  bookid INTEGER NOT NULL,
  booktitle VARCHAR(255),
  isbn VARCHAR(255),
  userid VARCHAR(100),
  username VARCHAR(255),
  useremail VARCHAR(255),
  issuedate DATE,
  duedate DATE,
  returndate DATE,
  status VARCHAR(50) DEFAULT 'ISSUED',
  remarks TEXT,
  FOREIGN KEY (bookid) REFERENCES books(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS book_requests (
  id SERIAL PRIMARY KEY,
  bookid INTEGER NOT NULL,
  booktitle VARCHAR(255),
  userid VARCHAR(100),
  username VARCHAR(255),
  useremail VARCHAR(255),
  requestdate DATE,
  status VARCHAR(50) DEFAULT 'PENDING',
  notes TEXT,
  FOREIGN KEY (bookid) REFERENCES books(id) ON DELETE SET NULL
);

INSERT INTO departments (department_id, department_name)
VALUES
  ('HR01', 'Human Resources'),
  ('ENG01', 'Engineering'),
  ('FIN01', 'Finance'),
  ('OPS01', 'Operations')
ON CONFLICT (department_id) DO NOTHING;

INSERT INTO employees (
  user_id, password, first_name, last_name, email_id, mobile_number, salary,
  father_name, mother_name, current_address, permanent_address, blood_group, dob, doj,
  pan_number, department_id, religion, role, nationality, job_profile, status
)
VALUES
  (
    'admin', 'admin123', 'System', 'Administrator', 'admin@company.com', '9876543210', 120000,
    'Robert Vance', 'Eleanor Vance', '100 Innovation Parkway, Suite 400', '100 Innovation Parkway, Suite 400',
    'O+', '1988-06-15', '2020-01-10', 'ABCDE1234F', 'HR01', 'Secular', 'ADMIN', 'Indian',
    'Lead HR Operations & Systems Admin', 'ACTIVE'
  ),
  (
    'employee', 'employee123', 'Alex', 'Johnson', 'employee@company.com', '9123456789', 85000,
    'David Johnson', 'Sarah Johnson', '42 Silicon Avenue, Tech Park', '42 Silicon Avenue, Tech Park',
    'B+', '1995-09-22', '2023-04-15', 'FGHIJ5678K', 'ENG01', 'Secular', 'USER', 'Indian',
    'Senior Full Stack Engineer', 'ACTIVE'
  ),
  (
    'rhea', 'rhea123', 'Rhea', 'Sharma', 'rhea@company.com', '9988776655', 76000,
    'Amit Sharma', 'Nisha Sharma', '15 Green Plaza, Sector 7', '15 Green Plaza, Sector 7',
    'A+', '1994-01-14', '2022-05-12', 'LMNOP3456Q', 'FIN01', 'Hindu', 'USER', 'Indian',
    'Senior Analyst', 'ACTIVE'
  )
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO bank_details (user_id, bank_name, account_number, ifsc_code, branch_name)
VALUES
  ('admin', 'HDFC Bank', '100120034567', 'HDFC0001234', 'Koramangala'),
  ('employee', 'ICICI Bank', '200230045678', 'ICIC0004567', 'Indiranagar'),
  ('rhea', 'Axis Bank', '300340056789', 'UTIB0003456', 'Banjara Hills')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO holidays (holiday_date, description)
VALUES
  ('2026-01-26', 'Republic Day'),
  ('2026-08-15', 'Independence Day'),
  ('2026-10-20', 'Diwali'),
  ('2026-12-25', 'Christmas')
ON CONFLICT (holiday_date) DO NOTHING;

INSERT INTO books (isbn, title, author, category, totalcopies, availablecopies, shelflocation, publicationyear, covercolor, description)
VALUES
  ('978-1-234567-89-0', 'Clean Code', 'Robert C. Martin', 'Engineering', 5, 3, 'A-1', 2008, '#2563eb', 'A handbook of agile software craftsmanship.'),
  ('978-1-987654-32-1', 'The Lean Startup', 'Eric Ries', 'Business', 4, 2, 'B-2', 2011, '#f59e0b', 'How modern companies create new products.')
ON CONFLICT (isbn) DO NOTHING;
