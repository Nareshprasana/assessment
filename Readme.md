# Performance Review App

A full-stack performance review workspace for managing employees, review cycles, feedback assignments, and employee feedback submissions. The app uses a React frontend, an Express API, and MongoDB through Mongoose.

## Features

- Select an admin or employee user from live database records
- Admin dashboard with employee, review, assignment, and activity totals
- Add and remove employee records
- Create review cycles and assign reviewers
- Prevent employees from reviewing themselves
- Employee dashboard for pending and completed feedback tasks
- Submit feedback and track completion progress
- Seed script with sample admin, employees, review, and assignment data

## Tech Stack

- Frontend: React 19, Vite, CSS
- Backend: Node.js, Express, CORS
- Database: MongoDB, Mongoose

## Design Approach

The application is designed around two clear workspaces: an admin workspace for managing review operations and an employee workspace for completing feedback tasks. Instead of showing static demo content, the interface prioritizes live database data so users can immediately see real employees, reviews, assignments, and completion status.

The admin experience focuses on visibility and control. Summary cards show the current state of the review process, activity cards highlight recent assignment updates, and forms are placed near the related directory and review pipeline so admins can create records and see the impact quickly.

The employee experience focuses on action. Pending feedback tasks are presented first, with completed reviews and incoming feedback requests kept nearby for context. Progress indicators and status labels help employees understand what still needs attention without searching through multiple pages.

The visual design uses dashboard-style panels, clear hierarchy, role badges, status badges, and responsive grids. This keeps the app readable on different screen sizes while making the most important actions easy to find.

## Project Structure

```text
performance-review-app/
  client/        React + Vite frontend
  server/        Express API and MongoDB models
  Readme.md      Project documentation
```

## Prerequisites

Install these before running the project:

- Node.js
- npm
- MongoDB running locally

The backend currently connects to:

```text
mongodb://localhost:27017/sampledb
```

You can change this connection string in `server/db.js` if your MongoDB setup is different.

## Installation

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

## Seed the Database

From the `server` folder, run:

```bash
node seed.js
```

This creates:

- `Admin User` with role `ADMIN`
- `Alice Smith` with role `EMPLOYEE`
- `Bob Jones` with role `EMPLOYEE`
- One sample annual review
- One feedback assignment

## Run the App

Start the backend API:

```bash
cd server
node index.js
```

The API runs at:

```text
http://localhost:3000
```

In a second terminal, start the frontend:

```bash
cd client
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## API Overview

Admin routes:

- `GET /api/admin/dashboard` - get employees, reviews, and assignments
- `GET /api/admin/employees` - list users
- `POST /api/admin/employees` - create a user
- `DELETE /api/admin/employees/:id` - delete a non-admin employee
- `GET /api/admin/reviews` - list reviews with feedback requests
- `POST /api/admin/reviews` - create a review
- `POST /api/admin/assign` - assign an existing review to a reviewer
- `POST /api/admin/assign-review` - create a review and assignment together

Employee routes:

- `GET /api/employee/tasks/:userId` - get assigned feedback tasks
- `GET /api/employee/summary/:userId` - get assigned reviews and reviews about the user
- `PUT /api/employee/feedback/:taskId` - submit feedback for a task

## Useful Commands

Frontend:

```bash
npm run dev
npm run build
```

Backend:

```bash
node index.js
node seed.js
```

## Notes

- Keep MongoDB running before starting the backend.
- The frontend expects the API at `http://localhost:3000/api`.
- The server package does not currently define a `start` script, so run it with `node index.js`.
- Admin users cannot be deleted from the UI or API.
