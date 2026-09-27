const router = require("express").Router();
const db = require("../utils/database");
const ExcelJS = require("exceljs");
const auth = require("../middleware/auth");
const role = require("../middleware/roles");

// ========================================
// STAFF AUTHENTICATION
// ========================================
router.use(auth, role("staff"));


// ========================================
// GET STAFF COURSES
// ========================================
router.get("/courses", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT
                id,
                course_code,
                course_name,
                class_name,
                staff_id
             FROM courses
             WHERE staff_id = (
                 SELECT id
                 FROM staff
                 WHERE user_id = ?
             )
             ORDER BY class_name, course_code`,
            [req.user.id]
        );

        res.json({
            courses: rows
        });

    } catch (error) {
        console.error("Load courses error:", error);

        res.status(500).json({
            message: "Failed to load courses"
        });
    }
});


// ========================================
// ADD CLASS / SUBJECT
// ========================================
router.post("/courses", async (req, res) => {
    try {

        const {
            course_code,
            course_name,
            class_name
        } = req.body;


        // Validate input
        if (
            !course_code ||
            !course_name ||
            !class_name
        ) {
            return res.status(400).json({
                message:
                    "Class name, subject code and subject name are required"
            });
        }


        // Get logged-in staff ID
        const [staffRows] = await db.execute(
            `SELECT id
             FROM staff
             WHERE user_id = ?`,
            [req.user.id]
        );


        if (staffRows.length === 0) {
            return res.status(404).json({
                message: "Staff account not found"
            });
        }


        const staffId = staffRows[0].id;


        // Insert course
        const [result] = await db.execute(
            `INSERT INTO courses
                (
                    course_code,
                    course_name,
                    class_name,
                    staff_id
                )
             VALUES (?, ?, ?, ?)`,
            [
                course_code,
                course_name,
                class_name,
                staffId
            ]
        );


        res.status(201).json({
            message:
                "Class and subject added successfully",

            courseId:
                result.insertId
        });


    } catch (error) {

        console.error(
            "Add course error:",
            error
        );


        // Duplicate subject code
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                message:
                    "This subject code already exists"
            });
        }


        res.status(500).json({
            message:
                "Failed to add class and subject"
        });
    }
});


// ========================================
// GET STUDENTS
// ========================================
router.get("/students", async (req, res) => {
    try {

        const [students] = await db.execute(
            `SELECT
                id,
                student_code
             FROM students
             ORDER BY student_code`
        );


        res.json({
            students
        });


    } catch (error) {

        console.error(
            "Load students error:",
            error
        );


        res.status(500).json({
            message:
                "Failed to load students"
        });
    }
});


// ========================================
// ASSIGN STUDENT TO CLASS / SUBJECT
// ========================================
router.post("/enrollments", async (req, res) => {
    try {

        const {
            student_id,
            course_id
        } = req.body;


        // Validate input
        if (!student_id || !course_id) {

            return res.status(400).json({
                message:
                    "Student and class/subject are required"
            });
        }


        // Get logged-in staff ID
        const [staffRows] = await db.execute(
            `SELECT id
             FROM staff
             WHERE user_id = ?`,
            [req.user.id]
        );


        if (staffRows.length === 0) {

            return res.status(404).json({
                message:
                    "Staff account not found"
            });
        }


        const staffId =
            staffRows[0].id;


        // Make sure the course belongs
        // to this staff member
        const [courseRows] = await db.execute(
            `SELECT
                id,
                course_code,
                course_name,
                class_name
             FROM courses
             WHERE id = ?
             AND staff_id = ?`,
            [
                course_id,
                staffId
            ]
        );


        if (courseRows.length === 0) {

            return res.status(403).json({
                message:
                    "You can only assign students to your own subjects"
            });
        }


        // Check student exists
        const [studentRows] = await db.execute(
            `SELECT id
             FROM students
             WHERE id = ?`,
            [student_id]
        );


        if (studentRows.length === 0) {

            return res.status(404).json({
                message:
                    "Student not found"
            });
        }


        // Check existing enrollment
        const [existing] = await db.execute(
            `SELECT id
             FROM enrollments
             WHERE student_id = ?
             AND course_id = ?`,
            [
                student_id,
                course_id
            ]
        );


        if (existing.length > 0) {

            return res.status(409).json({
                message:
                    "Student is already assigned to this subject"
            });
        }


        // Create enrollment
        const [result] = await db.execute(
            `INSERT INTO enrollments
                (
                    student_id,
                    course_id
                )
             VALUES (?, ?)`,
            [
                student_id,
                course_id
            ]
        );


        res.status(201).json({
            message:
                "Student assigned successfully",

            enrollmentId:
                result.insertId
        });


    } catch (error) {

        console.error(
            "Enrollment error:",
            error
        );


        // Handle duplicate enrollment
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                message:
                    "Student is already assigned to this subject"
            });
        }


        res.status(500).json({
            message:
                "Failed to assign student"
        });
    }
});
// ========================================
// ASSIGN ALL STUDENTS TO CLASS / SUBJECT
// ========================================
router.post("/enrollments/all", async (req, res) => {
    try {

        const { course_id } = req.body;

        // Check course ID
        if (!course_id) {
            return res.status(400).json({
                message: "Please select a class/subject"
            });
        }


        // ----------------------------------------
        // Get logged-in staff ID
        // ----------------------------------------
        const [staffRows] = await db.execute(
            `SELECT id
             FROM staff
             WHERE user_id = ?`,
            [req.user.id]
        );

        if (staffRows.length === 0) {
            return res.status(404).json({
                message: "Staff account not found"
            });
        }

        const staffId = staffRows[0].id;


        // ----------------------------------------
        // Make sure course belongs to staff
        // ----------------------------------------
        const [courseRows] = await db.execute(
            `SELECT
                id,
                course_code,
                course_name,
                class_name
             FROM courses
             WHERE id = ?
             AND staff_id = ?`,
            [course_id, staffId]
        );

        if (courseRows.length === 0) {
            return res.status(403).json({
                message:
                    "You can only assign students to your own subjects"
            });
        }


        // ----------------------------------------
        // Get ALL students
        // ----------------------------------------
        const [students] = await db.execute(
            `SELECT id
             FROM students
             ORDER BY id`
        );


        if (students.length === 0) {
            return res.status(404).json({
                message: "No students found"
            });
        }


        // ----------------------------------------
        // Assign students
        // ----------------------------------------
        let added = 0;
        let alreadyAssigned = 0;


        for (const student of students) {

            const [existing] = await db.execute(
                `SELECT id
                 FROM enrollments
                 WHERE student_id = ?
                 AND course_id = ?`,
                [
                    student.id,
                    course_id
                ]
            );


            if (existing.length > 0) {

                alreadyAssigned++;

                continue;
            }


            await db.execute(
                `INSERT INTO enrollments
                    (student_id, course_id)
                 VALUES (?, ?)`,
                [
                    student.id,
                    course_id
                ]
            );


            added++;
        }


        // ----------------------------------------
        // Response
        // ----------------------------------------
        res.status(201).json({

            message:
                "All students processed successfully",

            added: added,

            alreadyAssigned:
                alreadyAssigned,

            totalStudents:
                students.length
        });


    } catch (error) {

        console.error(
            "Assign all students error:",
            error
        );


        res.status(500).json({
            message:
                "Failed to assign all students"
        });
    }
});

// ========================================
// GET ATTENDANCE SESSIONS
// ========================================
router.get("/sessions", async (req, res) => {
    try {

        const [rows] = await db.execute(
            `SELECT
                s.id,
                s.started_at,
                s.expires_at,
                s.status,
                c.course_code,
                c.course_name,
                c.class_name
             FROM attendance_sessions s
             JOIN courses c
                 ON c.id = s.course_id
             WHERE s.started_by = ?
             ORDER BY s.started_at DESC
             LIMIT 50`,
            [req.user.id]
        );


        res.json({
            sessions: rows
        });


    } catch (error) {

        console.error(
            "Load sessions error:",
            error
        );


        res.status(500).json({
            message:
                "Failed to load sessions"
        });
    }
});


// ========================================
// GET ATTENDANCE RECORDS
// ========================================
router.get("/attendance", async (req, res) => {
    try {

        const [rows] = await db.execute(
            `SELECT
                st.student_code,
                u.full_name,
                c.course_code,
                c.course_name,
                c.class_name,
                a.status,
                a.marked_at
             FROM attendance a

             JOIN students st
                 ON st.id = a.student_id

             JOIN users u
                 ON u.id = st.user_id

             JOIN attendance_sessions x
                 ON x.id = a.session_id

             JOIN courses c
                 ON c.id = x.course_id

             WHERE c.staff_id = (
                 SELECT id
                 FROM staff
                 WHERE user_id = ?
             )

             ORDER BY a.marked_at DESC
             LIMIT 500`,
            [req.user.id]
        );


        res.json({
            records: rows
        });


    } catch (error) {

        console.error(
            "Load attendance error:",
            error
        );


        res.status(500).json({
            message:
                "Failed to load attendance"
        });
    }
});


// ========================================
// EXPORT ATTENDANCE TO EXCEL
// ========================================
router.get("/attendance/export", async (req, res) => {
    try {

        const [rows] = await db.execute(
            `SELECT
                st.student_code,
                u.full_name,
                c.course_code,
                c.course_name,
                c.class_name,
                a.status,
                a.marked_at

             FROM attendance a

             JOIN students st
                 ON st.id = a.student_id

             JOIN users u
                 ON u.id = st.user_id

             JOIN attendance_sessions x
                 ON x.id = a.session_id

             JOIN courses c
                 ON c.id = x.course_id

             WHERE c.staff_id = (
                 SELECT id
                 FROM staff
                 WHERE user_id = ?
             )

             ORDER BY a.marked_at DESC`,
            [req.user.id]
        );


        // Create workbook
        const workbook =
            new ExcelJS.Workbook();


        const worksheet =
            workbook.addWorksheet(
                "Attendance Ledger"
            );


        // Excel columns
        worksheet.columns = [

            {
                header: "Student ID",
                key: "student_code",
                width: 18
            },

            {
                header: "Student Name",
                key: "full_name",
                width: 25
            },

            {
                header: "Class",
                key: "class_name",
                width: 20
            },

            {
                header: "Subject Code",
                key: "course_code",
                width: 18
            },

            {
                header: "Subject",
                key: "course_name",
                width: 30
            },

            {
                header: "Status",
                key: "status",
                width: 15
            },

            {
                header: "Marked At",
                key: "marked_at",
                width: 25
            }

        ];


        // Add rows
        rows.forEach(row => {

            worksheet.addRow(row);

        });


        // Response headers
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );


        res.setHeader(
            "Content-Disposition",
            'attachment; filename="attendance-ledger.xlsx"'
        );


        // Send Excel file
        await workbook.xlsx.write(res);

        res.end();


    } catch (error) {

        console.error(
            "Excel export error:",
            error
        );


        res.status(500).json({
            message:
                "Failed to export attendance"
        });
    }
});


// ========================================
// EXPORT ROUTER
// ========================================
module.exports = router;