# Incident Reporting System (Vanilla + Express)

## Setup
1. npm install
2. npm run start
3. Open http://localhost:4000/pages/index.html

## API Endpoints
- POST /api/signup
- POST /api/login
- GET /api/incidents
- POST /api/incidents
- PUT /api/incidents/:id
- DELETE /api/incidents/:id
- GET /api/admin/users (admin only)

## Default seed admin
- email: admin@example.com
- password: adminpass

## Notes
- JWT token stored in `localStorage` as `incident_token`
- Uses SQLite database at `server/db.sqlite` 
