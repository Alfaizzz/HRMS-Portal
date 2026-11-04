-- =============================================================================
-- COMPLETE MYSQL SCHEMA & SEED DATA SCRIPT FOR HRMS & ONBOARDING SYSTEM
-- Compatible with MySQL 8.0+ / MySQL Workbench
-- =============================================================================

CREATE DATABASE IF NOT EXISTS hrms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hrms_db;

-- 1. DEPARTMENTS
DROP TABLE IF EXISTS book_issuances;
DROP TABLE IF EXISTS book_requests;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS resignation;
DROP TABLE IF EXISTS profile_picture;
DROP TABLE IF EXISTS attendance_record;
DROP TABLE IF EXISTS punch_out;
DROP TABLE IF EXISTS punch_in;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS leaves;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS user_documents;
DROP TABLE IF EXISTS CompanyAssets;
DROP TABLE IF EXISTS salary_details;
DROP TABLE IF EXISTS bankDetails;
DROP TABLE IF EXISTS EducationalDetails;
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS loginUser;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    department_id VARCHAR(100) PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. EMPLOYEES
-- NOTE: user_id is derived from the username prefix of the email (e.g., 'admin' from 'admin@company.com')
CREATE TABLE employees (
    user_id VARCHAR(100) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email_id VARCHAR(255) NOT NULL UNIQUE,
    mobile_number VARCHAR(20) NOT NULL UNIQUE,
    salary DECIMAL(15,2) NOT NULL,
    father_name VARCHAR(255) NOT NULL,
    mother_name VARCHAR(255) NOT NULL,
    current_address VARCHAR(255) NOT NULL,
    permanent_address VARCHAR(255) NOT NULL,
    blood_group VARCHAR(20) NOT NULL,
    dob DATE NOT NULL,
    doj DATE NOT NULL,
    pan_number VARCHAR(20) NOT NULL UNIQUE,
    department_id VARCHAR(100),
    religion VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMIN' or 'USER'
    nationality VARCHAR(100) NOT NULL,
    job_profile VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. LOGIN USER (Spring Security credentials)
CREATE TABLE loginUser (
    user_id VARCHAR(100) PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. WORK EXPERIENCE
CREATE TABLE experience (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    previous_employer VARCHAR(255),
    job_profile VARCHAR(255),
    yoe INT DEFAULT 0,
    dor DATE,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. EDUCATIONAL DETAILS
CREATE TABLE EducationalDetails (
    user_id VARCHAR(100) PRIMARY KEY,
    highschool DECIMAL(5,2),
    secondaryschool DECIMAL(5,2),
    bachelor DECIMAL(5,2),
    postgraduation DECIMAL(5,2),
    others DECIMAL(5,2),
    highschoolname VARCHAR(255),
    secondaryschoolname VARCHAR(255),
    bachelorcollegename VARCHAR(255),
    mastercollegename VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. BANK DETAILS
CREATE TABLE bankDetails (
    user_id VARCHAR(100) PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. COMPANY ASSETS
CREATE TABLE CompanyAssets (
    asset_id VARCHAR(100) PRIMARY KEY,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(255) NOT NULL,
    asset_issue_date DATE,
    user_id VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. USER DOCUMENTS
CREATE TABLE user_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(100) NOT NULL,
    document_type VARCHAR(100),
    file_path TEXT,
    document_name VARCHAR(255),
    extension VARCHAR(20),
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. CORPORATE HOLIDAYS
CREATE TABLE holidays (
    holiday_date DATE NOT NULL PRIMARY KEY,
    description VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. LEAVES
CREATE TABLE leaves (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    leave_type VARCHAR(100) NOT NULL,
    leave_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. ATTENDANCE (Live and historical)
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    punch_in_time TIMESTAMP NULL,
    punch_in_location TEXT,
    punch_out_time TIMESTAMP NULL,
    punch_out_location TEXT,
    status VARCHAR(50),
    selfie_path TEXT,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. PUNCH IN (Active Clock-ins)
CREATE TABLE punch_in (
    punchin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    date VARCHAR(20) NOT NULL,
    punch_in_time VARCHAR(100) NOT NULL,
    image_location TEXT,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. PUNCH OUT
CREATE TABLE punch_out (
    punchout_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    punchin_id BIGINT NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    date VARCHAR(20) NOT NULL,
    punch_out_time VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. ATTENDANCE RECORDS (Consolidated Historical Logs)
CREATE TABLE attendance_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    date VARCHAR(20) NOT NULL,
    punch_in_time VARCHAR(255) NOT NULL,
    punch_out_time VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. PROFILE PICTURE
CREATE TABLE profile_picture (
    user_id VARCHAR(100) PRIMARY KEY,
    path TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. RESIGNATION
CREATE TABLE resignation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL UNIQUE,
    remark TEXT,
    date_of_resignation DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. SALARY DETAILS & SLIPS
CREATE TABLE salary_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    basic_pay DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) DEFAULT 0.00,
    food_allowance DECIMAL(10,2) DEFAULT 0.00,
    travel_allowance DECIMAL(10,2) DEFAULT 0.00,
    emp_tax DECIMAL(10,2) DEFAULT 0.00,
    epf DECIMAL(10,2) DEFAULT 0.00,
    paye DECIMAL(10,2) DEFAULT 0.00,
    net_salary DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    file_path TEXT,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- NEW MODULE: LIBRARY MANAGEMENT
-- =============================================================================

-- 18. BOOKS CATALOGUE
CREATE TABLE books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    shelf_location VARCHAR(100) DEFAULT 'Main Shelf',
    publication_year INT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. BOOK ISSUANCES (Loans to Employees)
CREATE TABLE book_issuances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED', -- 'ISSUED', 'RETURNED', 'OVERDUE'
    remarks TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. BOOK REQUESTS
CREATE TABLE book_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    request_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    notes TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES employees(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- SAMPLE SEED DATA FOR DEMO & TESTING
-- =============================================================================

-- Departments
INSERT INTO departments (department_id, department_name) VALUES
('HR01', 'Human Resources'),
('ENG01', 'Software Engineering'),
('DES01', 'Product Design & UX'),
('FIN01', 'Finance & Accounts'),
('OPS01', 'Operations & IT');

-- Employees
-- User ID logic: Derived from prefix before '@' in email
INSERT INTO employees (user_id, password, first_name, last_name, email_id, mobile_number, salary, father_name, mother_name, current_address, permanent_address, blood_group, dob, doj, pan_number, department_id, religion, role, nationality, job_profile, status) VALUES
('admin', 'admin123', 'System', 'Administrator', 'admin@company.com', '9876543210', 120000.00, 'Robert Vance', 'Eleanor Vance', '100 Innovation Parkway, Suite 400', '100 Innovation Parkway, Suite 400', 'O+', '1988-06-15', '2020-01-10', 'ABCDE1234F', 'HR01', 'Secular', 'ADMIN', 'Indian', 'Lead HR Operations & Admin', 'ACTIVE'),
('employee', 'employee123', 'Alex', 'Johnson', 'employee@company.com', '9123456789', 85000.00, 'David Johnson', 'Sarah Johnson', '42 Silicon Avenue, Tech Park', '42 Silicon Avenue, Tech Park', 'B+', '1995-09-22', '2023-04-15', 'FGHIJ5678K', 'ENG01', 'Secular', 'USER', 'Indian', 'Senior Full Stack Engineer', 'ACTIVE'),
('shivam', 'shivam123', 'Shivam', 'Verma', 'shivam@company.com', '9811223344', 78000.00, 'Anil Verma', 'Sunita Verma', 'B-12, Sector 62, Tech City', 'B-12, Sector 62, Tech City', 'A+', '1996-03-12', '2023-08-01', 'KLMNO9012P', 'ENG01', 'Hindu', 'USER', 'Indian', 'Backend Java & Spring Boot Developer', 'ACTIVE'),
('priya', 'priya123', 'Priya', 'Sharma', 'priya@company.com', '9711556677', 82000.00, 'Rajesh Sharma', 'Kavita Sharma', 'Flat 402, Green Glen Layout', 'Flat 402, Green Glen Layout', 'O-', '1994-11-05', '2022-11-15', 'QRSTU3456V', 'DES01', 'Hindu', 'USER', 'Indian', 'Lead Product Designer', 'ACTIVE'),
('rahul', 'rahul123', 'Rahul', 'Mehta', 'rahul@company.com', '9922334455', 72000.00, 'Suresh Mehta', 'Rekha Mehta', 'Tower 3, Brigade Gateway', 'Tower 3, Brigade Gateway', 'AB+', '1997-01-20', '2024-02-01', 'WXYZA7890B', 'FIN01', 'Jain', 'USER', 'Indian', 'Senior Financial Analyst', 'ACTIVE');

-- Login User
INSERT INTO loginUser (user_id, role, password, status) VALUES
('admin', 'ADMIN', 'admin123', 'ACTIVE'),
('employee', 'USER', 'employee123', 'ACTIVE'),
('shivam', 'USER', 'shivam123', 'ACTIVE'),
('priya', 'USER', 'priya123', 'ACTIVE'),
('rahul', 'USER', 'rahul123', 'ACTIVE');

-- Bank Details
INSERT INTO bankDetails (user_id, bank_name, account_number, ifsc_code, branch_name) VALUES
('admin', 'HDFC Bank', '50100492817261', 'HDFC0001234', 'Cyber City Branch'),
('employee', 'ICICI Bank', '001201589234', 'ICIC0000012', 'Tech Park East'),
('shivam', 'State Bank of India', '30981245789', 'SBIN0004567', 'Sector 62 Branch');

-- Educational Details
INSERT INTO EducationalDetails (user_id, highschool, secondaryschool, bachelor, postgraduation, others, highschoolname, secondaryschoolname, bachelorcollegename, mastercollegename) VALUES
('admin', 91.50, 88.00, 84.50, 86.00, 0.00, 'St. Xavier High School', 'Delhi Public School', 'Delhi University', 'XLRI Jamshedpur'),
('employee', 94.00, 92.50, 89.00, 0.00, 0.00, 'Kendriya Vidyalaya', 'National Public School', 'Indian Institute of Information Technology', 'N/A');

-- Experience
INSERT INTO experience (user_id, previous_employer, job_profile, yoe, dor) VALUES
('admin', 'Global Enterprise Corp', 'HR Business Partner', 5, '2019-12-15'),
('employee', 'CloudNative Solutions', 'Frontend Software Engineer', 3, '2023-03-31');

-- Company Assets
INSERT INTO CompanyAssets (asset_id, asset_name, asset_type, asset_issue_date, user_id) VALUES
('AST-MAC-001', 'MacBook Pro 16" M3 Max', 'Laptop Hardware', '2020-01-15', 'admin'),
('AST-ACC-042', 'Dell UltraSharp 27" 4K Monitor', 'Display Peripherals', '2020-01-15', 'admin'),
('AST-MAC-088', 'MacBook Pro 14" M2 Pro', 'Laptop Hardware', '2023-04-16', 'employee'),
('AST-KBD-109', 'Logitech MX Master 3S', 'Input Hardware', '2023-04-16', 'employee');

-- Holidays
INSERT INTO holidays (holiday_date, description) VALUES
('2026-01-01', "New Year's Day"),
('2026-01-26', 'Republic Day'),
('2026-03-04', 'Holi Festival of Colors'),
('2026-04-03', 'Good Friday'),
('2026-05-01', 'International Workers Day'),
('2026-08-15', 'Independence Day'),
('2026-10-02', 'Mahatma Gandhi Jayanti'),
('2026-10-20', 'Dussehra (Vijayadashami)'),
('2026-11-08', 'Diwali (Deepavali)'),
('2026-12-25', 'Christmas Day');

-- Leaves
INSERT INTO leaves (user_id, leave_type, leave_date, reason, status) VALUES
('employee', 'CASUAL_LEAVE', '2026-11-12', 'Family celebration and personal errands', 'APPROVED'),
('employee', 'SICK_LEAVE', '2026-10-14', 'Seasonal viral flu and rest', 'APPROVED'),
('shivam', 'COMPENSATORY_OFF', '2026-11-02', 'Comp-off against scheduled weekend deployment', 'PENDING'),
('priya', 'EARNED_LEAVE', '2026-11-20', 'Annual family vacation trip', 'PENDING');

-- Attendance Historical Records
INSERT INTO attendance_record (user_id, date, punch_in_time, punch_out_time) VALUES
('employee', '2026-10-26', '09:05:12', '18:12:44'),
('employee', '2026-10-25', '08:58:20', '17:55:10'),
('employee', '2026-10-24', '09:15:30', '18:30:15'),
('shivam', '2026-10-26', '09:20:00', '18:25:00');

-- Salary Details
INSERT INTO salary_details (user_id, date, basic_pay, hra, food_allowance, travel_allowance, emp_tax, epf, paye, net_salary, status, file_path) VALUES
('employee', '2026-09-30', 55000.00, 20000.00, 4000.00, 6000.00, 2500.00, 4200.00, 1800.00, 76500.00, 'PAID', 'salary_slip_employee_2026_09.pdf'),
('employee', '2026-08-31', 55000.00, 20000.00, 4000.00, 6000.00, 2500.00, 4200.00, 1800.00, 76500.00, 'PAID', 'salary_slip_employee_2026_08.pdf'),
('shivam', '2026-09-30', 50000.00, 18000.00, 3500.00, 5000.00, 2200.00, 3800.00, 1500.00, 69000.00, 'PAID', NULL),
('priya', '2026-09-30', 52000.00, 19000.00, 4000.00, 5500.00, 2300.00, 4000.00, 1600.00, 72600.00, 'PAID', NULL),
('employee', '2026-10-31', 55000.00, 20000.00, 4000.00, 6000.00, 2500.00, 4200.00, 1800.00, 76500.00, 'PENDING', NULL);

-- Library Books
INSERT INTO books (isbn, title, author, category, total_copies, available_copies, shelf_location, publication_year, description) VALUES
('978-1449373320', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'Architecture & Distributed Systems', 4, 2, 'Shelf A-12 (Systems)', 2017, 'The definitive guide to the principles and algorithms underlying modern large-scale distributed databases and stream processors.'),
('978-0132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Software Engineering & Craftsmanship', 5, 3, 'Shelf B-04 (Practices)', 2008, 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.'),
('978-0134494166', 'Clean Architecture: A Craftsman’s Guide', 'Robert C. Martin', 'Architecture & Design Patterns', 3, 1, 'Shelf B-05 (Practices)', 2017, 'By applying universal rules of software architecture, you can dramatically improve developer productivity throughout the life of any software system.'),
('978-0201616224', 'The Pragmatic Programmer: Your Journey to Mastery', 'David Thomas & Andrew Hunt', 'Career & Programming Philosophy', 3, 0, 'Shelf C-01 (Foundations)', 2019, 'Essential wisdom for developers covering topics ranging from career advice to architectural techniques to keeping code flexible and reusable.'),
('978-1492043454', 'Building Microservices: Designing Fine-Grained Systems', 'Sam Newman', 'Cloud & Infrastructure', 3, 2, 'Shelf A-15 (Systems)', 2021, 'Practical guidance for building, managing, and scaling systems based on microservices architectures.'),
('978-1950538270', 'Staff Engineer: Leadership Beyond the Management Track', 'Will Larson', 'Engineering Leadership', 2, 1, 'Shelf D-02 (Leadership)', 2021, 'A comprehensive roadmap for individual contributors navigating technical leadership roles at modern tech firms.');

-- Library Issuances (Active and Returned Loans)
INSERT INTO book_issuances (book_id, user_id, issue_date, due_date, return_date, status, remarks) VALUES
(4, 'employee', '2026-10-10', '2026-11-10', NULL, 'ISSUED', 'Studying for engineering leadership cycle'),
(1, 'shivam', '2026-10-15', '2026-11-15', NULL, 'ISSUED', 'Reference material for distributed caching architecture'),
(2, 'priya', '2026-09-01', '2026-09-30', '2026-09-28', 'RETURNED', 'Completed reading');

-- Library Book Requests
INSERT INTO book_requests (book_id, user_id, request_date, status, notes) VALUES
(1, 'employee', '2026-10-24', 'PENDING', 'Need this for the upcoming database sharding spike in Q4.');
