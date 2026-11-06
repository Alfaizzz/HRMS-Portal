# HRMS Portal Backend

This is a standalone Express backend for the HRMS React frontend. It provides the API routes expected by the app, keeps business data in JSON files for easy local setup, and can be run independently from the frontend.

## Requirements

- Node.js 18+

## Setup

1. Open a terminal in this folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Choose the backend mode:
   - Demo mode:
     ```bash
     copy .env.demo .env
     ```
   - Real PostgreSQL mode:
     ```bash
     copy .env.real .env
     ```
4. Start the backend:
   ```bash
   npm run dev
   ```

The app runs on:
- http://localhost:8080

## Modes

### Demo mode
- `APP_MODE=demo`
- Uses the local JSON file store in `src/data/db.json`
- Good for offline development and UI demos

### Real database mode
- `APP_MODE=real`
- Uses PostgreSQL via `DATABASE_URL`
- Required for production-like data persistence

## Included modules

- Authentication
- Departments
- Employees and profile data
- Bank details, education, experience, assets
- Attendance and leave tracking
- Attendance workspace settings (office coordinates, geofence radius, and daily hours target)
- Calendar holidays
- Salary management
- Library management
- Document uploads

## Frontend integration

The frontend is already prepared to call the backend when demo mode is disabled. Set this in the frontend:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Then switch demo mode off from the UI.

## Attendance workspace

Administrators can edit the single attendance workspace from **Attendance → Workspace**. It stores the office coordinates, an attendance radius (default 150 meters), and required hours per day (default 8). Clock-ins and clock-outs from outside the configured radius require a reason and are marked in attendance records. Short sessions remain clockable and are flagged below target in attendance history.

Live mode stores these settings in PostgreSQL. Restart the backend after updating the schema so the `attendance_workspace_settings` table is initialized.
