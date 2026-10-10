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

Requires **Node.js 22.12+** and npm. Internet access is needed for dependencies and the first embedded MongoDB download.

```sh
git clone https://github.com/abhigyan6/staffsync-showcase.git
cd staffsync-showcase
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The API runs on port **4000**.

With `MONGODB_URI` unset, development starts a real embedded MongoDB database and seeds fictional records. Its files persist in `.runtime/mongodb`; it is not a browser mock. A local JWT secret is generated automatically. Runtime data and secrets are excluded from Git.

To connect your own database, run `cp .env.example .env` and set `MONGODB_URI` in `.env`. Set `SEED_DEMO=false` for a database that should not receive the demo seed. Hosted deployments also require a strong `JWT_SECRET`. Keep credentials server-side and never commit `.env`.

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
tests/                   API and browser workflow tests
render.yaml              Free Render deployment blueprint
```

React calls Express REST APIs. Authentication, authorization, and input validation run before controllers access Mongoose models. Collections represent users, employees, leaves, attendance, announcements, training, notifications, and audits. Managers use the Manager user role and employee reporting relationships. Compatibility entry points remain because existing routes, imports, and Docker configuration use them.

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

## Verification

```sh
npm test
npm run build
npm run format:check
```

API tests use an isolated temporary database and cover authorization, team isolation, leave concurrency, attendance uniqueness, training ownership, announcements, session revocation, and validation.

Browser workflow tests start an isolated frontend, API, and database:

```sh
npx playwright install chromium
npm run test:browser
```

On macOS they can use installed Google Chrome; `PLAYWRIGHT_CHROME_PATH` selects an existing executable.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Free Render blueprint and environment setup. Express serves the built frontend and API from one origin. Health status is available at `/api/health`.

Docker and Compose configuration are also included:

```sh
# First set a strong JWT_SECRET in .env.
docker compose up --build -d
docker compose exec app npm run setup:hr
```

Open **http://localhost:4000**. Compose persists MongoDB and uploads in Docker volumes. Configure HTTPS, secure cookies, authenticated database access, backups, and durable upload storage for real deployments.

## Credits and copyright

© 2026 Abhigyan Dwivedi. All rights reserved for original StaffSync code and branding. This repository is public for viewing and evaluation; no open-source license is granted. See [NOTICE.md](NOTICE.md).

Open-source libraries, Phosphor icons, and the DM Sans and Instrument Serif fonts retain their respective licenses and copyrights.
