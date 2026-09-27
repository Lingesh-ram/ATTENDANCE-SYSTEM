requireRole("staff");

document.getElementById("logout").onclick = logout;
document.getElementById("exportBtn").onclick = downloadLedger;


// ========================================
// LOAD STAFF DASHBOARD
// ========================================
async function load() {
    try {

        // ========================================
        // LOAD COURSES
        // ========================================
        const c = await api("/staff/courses");

        const courseDropdown = document.getElementById("course");
        const enrollmentCourseDropdown =
            document.getElementById("enrollmentCourse");

        const courseOptions = c.courses.map(x => `
            <option value="${x.id}">
                ${x.class_name || "Class"} -
                ${x.course_code} -
                ${x.course_name}
            </option>
        `).join("");

        // Attendance session course dropdown
        if (courseDropdown) {
            courseDropdown.innerHTML =
                courseOptions ||
                `<option value="">No subjects available</option>`;
        }

        // Enrollment course dropdown
        if (enrollmentCourseDropdown) {
            enrollmentCourseDropdown.innerHTML =
                `<option value="">Select Class / Subject</option>` +
                courseOptions;
        }


        // ========================================
        // LOAD STUDENTS
        // ========================================
        const studentData = await api("/staff/students");

        const studentDropdown =
            document.getElementById("enrollmentStudent");

        if (studentDropdown) {

            studentDropdown.innerHTML =
                `<option value="">Select Student</option>` +

                studentData.students.map(student => `
                    <option value="${student.id}">
                        ${student.student_code}
                    </option>
                `).join("");
        }


        // ========================================
        // LOAD SESSIONS
        // ========================================
        const s = await api("/staff/sessions");

        document.getElementById("sessions").innerHTML =
            s.sessions.map(x => `
                <div class="session">

                    <b>
                        ${x.class_name || ""} -
                        ${x.course_code} -
                        ${x.course_name || ""}
                    </b>

                    — ${x.status}

                    <br>

                    Expires:
                    ${new Date(x.expires_at).toLocaleString()}

                    ${
                        x.status === "active"
                        ? `<button onclick="closeSession(${x.id})">
                               Close
                           </button>`
                        : ""
                    }

                </div>
            `).join("") || "No sessions";


        // ========================================
        // LOAD ATTENDANCE RECORDS
        // ========================================
        const r = await api("/staff/attendance");

        document.getElementById("records").innerHTML =
            r.records.map(x => `
                <div class="record">
                    ${x.student_code}
                    —
                    ${x.full_name || ""}
                    —
                    ${x.course_code}
                    —
                    ${x.status}
                    —
                    ${new Date(x.marked_at).toLocaleString()}
                </div>
            `).join("") || "No records";


    } catch (e) {

        console.error("Dashboard load error:", e);

        alert(e.message);
    }
}


// ========================================
// ADD CLASS / SUBJECT
// ========================================
document
    .getElementById("courseForm")
    ?.addEventListener("submit", async e => {

        e.preventDefault();

        const className =
            document.getElementById("className").value.trim();

        const courseCode =
            document.getElementById("courseCode").value.trim();

        const courseName =
            document.getElementById("courseName").value.trim();

        const msg =
            document.getElementById("courseMsg");


        if (!className || !courseCode || !courseName) {

            msg.textContent =
                "❌ Please fill all fields.";

            return;
        }


        msg.textContent = "Adding...";


        try {

            await api("/staff/courses", {

                method: "POST",

                body: JSON.stringify({
                    class_name: className,
                    course_code: courseCode,
                    course_name: courseName
                })
            });


            msg.textContent =
                "✅ Class and subject added successfully!";


            document
                .getElementById("courseForm")
                .reset();


            // Reload dropdowns
            await load();


        } catch (error) {

            console.error("Add course error:", error);

            msg.textContent =
                "❌ " + error.message;
        }
    });


// ========================================
// ASSIGN ALL STUDENTS TO CLASS / SUBJECT
// ========================================
document
    .getElementById("enrollmentForm")
    ?.addEventListener("submit", async e => {

        e.preventDefault();

        const courseId =
            document.getElementById("enrollmentCourse").value;

        const msg =
            document.getElementById("enrollmentMsg");

        if (!courseId) {
            msg.textContent =
                "❌ Please select a class/subject.";

            return;
        }

        msg.textContent =
            "Assigning all students...";

        try {

            const data = await api(
                "/staff/enrollments/all",
                {
                    method: "POST",

                    body: JSON.stringify({
                        course_id: Number(courseId)
                    })
                }
            );

            msg.textContent =
                `✅ ${data.added} students assigned successfully! ` +
                `Already assigned: ${data.alreadyAssigned}`;

        } catch (error) {

            console.error(
                "Assign all students error:",
                error
            );

            msg.textContent =
                "❌ " + error.message;
        }
    });

// ========================================
// CREATE ATTENDANCE SESSION
// ========================================
document
    .getElementById("sessionForm")
    ?.addEventListener("submit", async e => {

        e.preventDefault();

        try {

            await api("/sessions/create", {

                method: "POST",

                body: JSON.stringify({

                    course_id:
                        Number(
                            document.getElementById("course").value
                        ),

                    duration_minutes:
                        Number(
                            document.getElementById("duration").value
                        )
                })
            });


            document.getElementById("sessionMsg")
                .textContent =
                "Session started.";

            await load();


        } catch (e) {

            document.getElementById("sessionMsg")
                .textContent =
                e.message;
        }

    });


// ========================================
// CLOSE SESSION
// ========================================
async function closeSession(id) {

    try {

        await api(`/sessions/${id}/close`, {

            method: "POST"

        });

        await load();

    } catch (e) {

        alert(e.message);

    }
}


// ========================================
// INITIAL LOAD
// ========================================
load();


// Refresh dashboard every 10 seconds
setInterval(load, 10000);