# AI KNOTS HRMS

Human Resource Management System for managing employees, attendance, leave, payroll, tasks, goals, departments, devices, events and recruitment workflows.

The project is split into two applications:

- `Backend`: Node.js, Express and MongoDB API
- `Frontend`: React, Vite, TypeScript tooling, Tailwind CSS and Redux Toolkit

## Features

- Role-based authentication for HR and employees
- Employee profiles, departments and employee directory
- Attendance actions and CSV attendance import
- Leave requests and approvals
- Payroll and payslip management
- Task creation, assignment, filtering and status updates
- Goals, events, jobs and candidate management
- Employee device management
- Email notifications through Nodemailer
- Toast notifications and centralized Redux task state
- Profile image upload without storing files in a local upload folder

## Requirements

- Node.js 18 or newer
- npm
- MongoDB database, local or MongoDB Atlas
- Cloudinary credentials for resume and other Cloudinary-backed uploads
- SMTP credentials for email features

## Project Setup

Clone the repository and install dependencies in both applications:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

### Backend environment

Create `Backend/.env`. You can start from `Backend/.env.example`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/hrms
PORT=8000
JWT_SECRET=replace-with-a-long-random-secret

CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=

EMAIL=
EMAIL_PASSWORD=
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
```

Use a MongoDB Atlas connection string when using Atlas. Keep `.env` private and never commit real passwords, API keys or tokens.

### Frontend environment

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

The frontend uses `VITE_API_URL` for API requests. Restart Vite after changing environment variables.

## Running Locally

Open two terminals from the project root.

Start the API:

```bash
cd Backend
npm run dev
```

Start the frontend:

```bash
cd Frontend
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

The backend port is controlled by `PORT`. The frontend URL must use the same backend port, for example `http://localhost:8000`.

## Demo Data

After MongoDB is running and `Backend/.env` is configured:

```bash
cd Backend
node scripts/seedDemoData.js
```

The seed script creates demo records for local development. Review the script before using it against a shared or production database.

## API Overview

The API is mounted under `/api`:

| Area           | Base route         |
| -------------- | ------------------ |
| Authentication | `/api/auth`        |
| Employees      | `/api/employees`   |
| Departments    | `/api/departments` |
| Attendance     | `/api/attendance`  |
| Leave          | `/api/leave`       |
| Payroll        | `/api/payroll`     |
| Payslips       | `/api/payslips`    |
| Tasks          | `/api/tasks`       |
| Goals          | `/api/goals`       |
| Events         | `/api/events`      |
| Jobs           | `/api/jobs`        |
| Candidates     | `/api/candidates`  |
| Devices        | `/api/devices`     |

Protected routes require a bearer token:

```http
Authorization: Bearer <auth-token>
```

Most API responses use this shape:

```json
{
  "status": true,
  "message": "Request completed",
  "data": {}
}
```

## Frontend State and Notifications

Redux Toolkit is configured in `Frontend/src/store`. The task module uses Redux async thunks for fetching, creating, updating and deleting tasks, including loading and error states.

Toastify is mounted globally in `App.tsx`. Shared API error extraction is handled by `Frontend/src/lib/apiError.js`, so backend messages can be shown consistently to users.

## Validation and Uploads

- Profile images must be image files no larger than 2 MB.
- Profile image data is kept in memory and stored as a direct image data URL in the employee record; no local profile upload folder is required.
- Attendance CSV uploads use the backend upload middleware.
- Cloudinary remains required for features that use the Cloudinary-backed upload configuration, such as resumes.

## Useful Commands

### Frontend

```bash
npm run dev       # Start Vite development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

### Backend

```bash
npm run dev       # Start with nodemon
npm start         # Start with nodemon
```

## Troubleshooting

### MongoDB URI is undefined

Make sure `Backend/.env` exists and contains `MONGODB_URI`. The backend loads this file from its own directory, so the frontend `.env` is not used for database configuration.

### Network Error in the frontend

Check that the backend is running, then confirm `Frontend/.env` points to the same port as the backend `PORT` value.

### Unauthorized request

Log in again to refresh the token in browser storage. Confirm the account role has permission for the requested route.

### Upload failure

Check the file type and size first. For Cloudinary-backed uploads, verify the three Cloudinary variables and that the Cloudinary account credentials are active.

## Production Notes

- Use a strong random `JWT_SECRET`.
- Store all secrets in the deployment provider's environment settings.
- Restrict CORS to the deployed frontend origin.
- Use a managed MongoDB database with appropriate network access rules.
- Use durable object storage for profile images if the API is deployed to an ephemeral serverless filesystem.
- Run `npm run build` in `Frontend` before deploying the static frontend.

## License

This project is currently distributed without a project-specific open-source license.
