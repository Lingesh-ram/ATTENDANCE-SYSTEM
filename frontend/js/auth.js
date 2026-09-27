document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    if (!form) {
        console.error("Login form not found");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usernameInput = form.querySelector(
            'input[name="username"]'
        );

        const passwordInput = form.querySelector(
            'input[name="password"]'
        );

        const message =
            document.getElementById("message") ||
            document.querySelector(".message");

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Determine role from the login page URL.
        const path = window.location.pathname.toLowerCase();

        let role;

        if (path.includes("student")) {
            role = "student";
        } else if (path.includes("staff")) {
            role = "staff";
        } else if (path.includes("admin")) {
            role = "admin";
        }

        if (!role) {
            console.error("Unable to determine login role");
            if (message) {
                message.textContent = "Invalid login page.";
            }
            return;
        }

        try {
            const response = await fetch(
                `/api/auth/${role}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const data = await response.json();

            console.log("Login response:", data);

            if (!response.ok || !data.token || !data.user) {
                throw new Error(
                    data.message || "Invalid credentials"
                );
            }

            // Save authentication data.
            localStorage.setItem("token", data.token);
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );
            localStorage.setItem("role", data.user.role);

            console.log("Login successful:", data.user);

            // Redirect according to role.
            if (data.user.role === "student") {
                window.location.href =
                    "/dashboards/student.html";
            } else if (data.user.role === "staff") {
                window.location.href =
                    "/dashboards/staff.html";
            } else if (data.user.role === "admin") {
                window.location.href =
                    "/dashboards/admin.html";
            } else {
                throw new Error("Unknown user role");
            }

        } catch (error) {
            console.error("Login error:", error);

            if (message) {
                message.textContent = error.message;
            }
        }
    });
});