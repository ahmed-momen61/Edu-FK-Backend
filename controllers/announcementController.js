const { db } = require('../config/db');

const createAnnouncement = (req, res) => {
    const { courseId, title, content } = req.body;


    if (!courseId || !title || !content) {
        return res.status(400).json({ message: "Course ID, title, and content are required." });
    }


    const insertAnnounceQuery = `INSERT INTO ANNOUNCEMENT (COURSE_ID, TITLE, CONTENT) VALUES (?, ?, ?)`;
    db.run(insertAnnounceQuery, [courseId, title, content], function(err) {
        if (err) return res.status(500).json({ error: "Database error." });


        const findStudentsQuery = `SELECT STUDENT_ID FROM ENROLLMENT WHERE COURSE_ID = ?`;
        db.all(findStudentsQuery, [courseId], (err, enrollments) => {
            if (!err && enrollments && enrollments.length > 0) {


                const notificationMessage = `NEW ANNOUNCEMENT in Course ID ${courseId}: ${title}`;


                const notifStmt = db.prepare(`INSERT INTO NOTIFICATION (USER_ID, MESSAGE) VALUES (?, ?)`);

                enrollments.forEach(enrollment => {
                    notifStmt.run(enrollment.STUDENT_ID, notificationMessage);
                });


                notifStmt.finalize();
            }
            res.status(201).json({ message: "Announcement successfully posted." });
        });
    });
};

module.exports = { createAnnouncement };