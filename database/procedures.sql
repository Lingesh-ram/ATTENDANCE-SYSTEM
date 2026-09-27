USE student_attendance;
DELIMITER //
CREATE PROCEDURE expire_old_sessions()
BEGIN
 UPDATE attendance_sessions SET status='expired'
 WHERE status='active' AND expires_at <= NOW();
END//
DELIMITER ;