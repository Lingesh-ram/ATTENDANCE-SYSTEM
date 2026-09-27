# Student Attendance System

A role-based attendance system with separate Student, Staff, and Admin logins.

## Stack
- Frontend: HTML/CSS/Vanilla JavaScript
- Backend: Node.js + Express
- Database: MySQL
- Authentication: JWT + bcrypt
- Export: ExcelJS
- Optional geofencing: browser GPS coordinates + Haversine distance

## Setup

1. Install Node.js and MySQL.
2. Create the database:
   ```sql
   SOURCE database/schema.sql;
   SOURCE database/seed.sql;
   ```
3. Copy `.env.example` to `backend/.env` and configure MySQL.
4. Install dependencies:
   ```bash
   npm install --prefix backend
   ```
5. Start:
   ```bash
   npm start
   ```
6. Open:
   `http://localhost:5000`

## Demo accounts

The seed script creates:
- Student: `student1` / `Student@123`
- Staff: `staff1` / `Staff@123`
- Admin: `admin1` / `Admin@123`

Change these credentials before production use.

## Geofencing

Set `ATTENDANCE_RADIUS_METERS` in `.env`. A course can also have latitude/longitude coordinates. The student browser asks for location only when marking attendance. If a course has no coordinates, GPS validation is skipped.

## Production notes

Use HTTPS for browser geolocation, rotate JWT secrets, use a managed database or encrypted database connection, add CSRF/rate limiting as appropriate, and never use the demo passwords in production.
