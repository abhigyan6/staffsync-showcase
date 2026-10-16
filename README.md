# StaffSync

A MERN human resource management application for HR, managers, and employees. Built by **Abhigyan Dwivedi** as a full stack capstone, with a responsive Material UI interface, a teal visual theme, and light/dark modes.

**[Open the live demo](https://staffsync-demo.onrender.com)**

> Demo project · Fictional data only. The free Render service can take about a minute to wake after being idle. Registration allows all three roles for evaluation; this demo must not contain real employee or payroll data.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| HR | `hr@staffsync.demo` | `StaffSync@2026` |
| Manager | `manager@staffsync.demo` | `StaffSync@2026` |
| Employee | `employee@staffsync.demo` | `StaffSync@2026` |

These shared accounts access fictional showcase records. Use manual sign-in on the hosted demo; one-click role cards are available in local development. You can also register as Employee, HR, or Manager.

## Features

| Role | Main workflows |
| --- | --- |
| HR | Manage employees and reporting managers, review leave, monitor and correct attendance, publish announcements, export attendance reports |
| Manager | View direct reports and team attendance, approve team leave, record performance feedback, assign and monitor training, publish announcements |
| Employee | Maintain a personal profile, check in/out, apply for leave and view decisions, read announcements, complete assigned training |

The app also includes in-app notifications, live updates using server-sent events, search and pagination, CSV export, profile photos, responsive navigation, and password changes.

## Stack

- **Frontend:** React, Vite, Material UI, Redux Toolkit, React Router, Axios, Recharts, Phosphor icons
- **Backend:** Node.js, Express, Mongoose, Zod, JWT, bcrypt
- **Database:** MongoDB, with an embedded MongoDB runtime for local development
- **Showcase hosting:** Render Free and MongoDB Atlas Free

## Run locally

Use a Windows, macOS, or Linux computer with **Node.js 22.12+**, npm, Git, and a modern browser. Internet access is needed for dependencies and the first embedded MongoDB download. The embedded database also requires an operating system supported by MongoDB. Phones and tablets can open the hosted demo; this setup runs the server on a computer.

```sh
git clone https://github.com/abhigyan6/staffsync-showcase.git
cd staffsync-showcase
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The API runs on port **4000**.

With `MONGODB_URI` unset, development starts a real embedded MongoDB database and seeds fictional records. Its files persist in `.runtime/mongodb`; it is not a browser mock. A local JWT secret is generated automatically. Runtime data and secrets are excluded from Git.

No `.env` file or MongoDB account is needed for the default local demo. To connect your own database, copy `.env.example` to a new file named `.env` in your editor and set `MONGODB_URI`. Set `SEED_DEMO=false` for a database that should not receive the demo seed. Hosted deployments also require a strong `JWT_SECRET`. Keep credentials server-side and never commit `.env`.

To run the built application locally from one address:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:4000**. Stop any existing development server first so the API port is free. These npm commands work across Windows, macOS and Linux without shell-specific environment assignments.

If startup fails, check your Node version, make sure ports 4000 and 5173 are available, and allow the initial MongoDB download. On systems without a supported MongoDB binary or required system libraries, use a compatible local MongoDB installation or Atlas through `MONGODB_URI`.

## Architecture

```text
client/src/
  components/auth/       Login and registration
  components/employee/   Employee workflows
  components/hr/         HR management views
  components/manager/    Manager workflows
  components/shared/    Role-aware dashboard
  pages/                 Dashboards and product screens
  routes/                Protected frontend routes
  App.jsx                App shell, routing, and theme
  App.css                Responsive styles and tokens
  index.js               React entry point
server/
  config/                Database connection
  controllers/           Module request handlers
  middleware/            Authentication and access checks
  models/                Indexed Mongoose schemas
  routes/                REST endpoints and validation
  services/              Scoping, notifications, and audits
  app.js                 Express setup and static serving
  server.js              Startup and shutdown
render.yaml              Free Render deployment blueprint
```

React calls Express REST APIs. Authentication, authorization, and input validation run before controllers access Mongoose models. Collections represent users, employees, leaves, attendance, announcements, training, notifications, and audits. Managers use the Manager user role and employee reporting relationships.

## Authentication and access

Passwords are hashed with bcrypt. JWT authentication supports HTTP-only cookies and Bearer tokens, with issuer/audience validation and an eight-hour expiry. Protected endpoints check the current account role and active status. Logout and password changes revoke previous sessions.

Managers are scoped to their direct reports; employees access their own records. Salary and address are limited to HR and the employee concerned. The backend validates inputs, limits login attempts and uploads, checks file signatures, and blocks mutations from unapproved browser origins.

Public HR/Manager registration is intentional for this showcase. Restrict privileged registration before using real organizational data. These controls are not a substitute for an independent security review.

## Business rules and limits

- Attendance uses the organization timezone (`Asia/Kolkata` by default). Missing check-in does not automatically count as absence.
- Leave duration uses calendar days, with a maximum of 90 days. HR or the assigned manager can decide; the first decision wins.
- Duplicate daily attendance and overlapping pending/approved leave are blocked.
- Training completion is self-reported. Performance feedback uses manager ratings and comments.
- Notifications are in-app; email/SMS and email password recovery are not implemented.
- Reports support workforce and payroll analysis; the app does not calculate taxes, salaries, or payslips.
- Hosted photos use temporary local storage and can disappear after restarts or redeploys.
- SSO, MFA, multiple organizations, and enterprise load testing are outside this capstone's scope.

## Build and formatting

```sh
npm run build
npm run format:check
```

This showcase contains the runnable application. The automated test suite is maintained separately; test files and browser-test tooling are not included here. Phase documents retain the verification results recorded during development.

## Deploy on Render

Express serves the built frontend and API from one origin. The included `render.yaml` selects the Free Node service and sets `NODE_ENV=production`.

1. Connect your fork or copy to Render and create a Blueprint from `main`.
2. Set `MONGODB_URI` privately to your MongoDB Atlas connection string.
3. Set `CLIENT_ORIGIN` to the exact HTTPS service origin, without a trailing slash.
4. Add the service's outbound IP ranges from Render's Connect panel to Atlas Network Access.
5. Deploy and check `/api/health`, sign-in, registration and the three role workflows.

The blueprint generates `JWT_SECRET` and enables secure cookies. Production startup does not seed or reset records. The free service can sleep, and uploaded photos use temporary storage. Never put real employee data or database credentials in the public repository.

## Credits and copyright

© 2026 Abhigyan Dwivedi. All rights reserved for original StaffSync code and branding. This repository is public for viewing and evaluation; no open-source license is granted. See [NOTICE.md](NOTICE.md).

Open-source libraries, Phosphor icons, and the DM Sans and Instrument Serif fonts retain their respective licenses and copyrights.
