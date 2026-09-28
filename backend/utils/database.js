const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "student_attendance",

  connectionLimit: 10,
  dateStrings: false,

  // Aiven MySQL requires SSL
  ssl: process.env.DB_HOST
    ? {
        rejectUnauthorized: false
      }
    : undefined
});

module.exports = pool;