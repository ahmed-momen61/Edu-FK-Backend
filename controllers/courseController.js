const db_access = require('../config/db.js');
const db = db_access.db;

const listCourses = (req, res) => {
    const query = `SELECT C.ID, C.TITLE, C.CODE, U.FULL_NAME AS InstructorName 
                   FROM COURSES C JOIN USER U ON C.INSTRUCTOR_ID = U.ID`;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};

const createCourse = (req, res) => {
    const { title, code } = req.body;
    const instructorId = req.user.id;

    if (!title || !code) return res.status(400).json({ message: "Course title and code are required." });

    const query = `INSERT INTO COURSES (TITLE, CODE, INSTRUCTOR_ID) VALUES (?, ?, ?)`;

    db.run(query, [title, code, instructorId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ message: "Course code must be unique." });
            return res.status(500).json({ error: "Database error." });
        }
        res.status(201).json({ message: "Course created successfully", courseId: this.lastID });
    });
};

const enrollStudent = (req, res) => {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (!courseId) return res.status(400).json({ message: "Course ID is required." });

    const checkQuery = `SELECT 1 FROM ENROLLMENT WHERE STUDENT_ID = ? AND COURSE_ID = ?`;
    db.get(checkQuery, [studentId, courseId], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (row) return res.status(400).json({ message: "Student is already enrolled." });

        const enrollQuery = `INSERT INTO ENROLLMENT (STUDENT_ID, COURSE_ID) VALUES (?, ?)`;
        db.run(enrollQuery, [studentId, courseId], (err) => {
            if (err) return res.status(500).json({ error: "Database error." });
            res.status(201).json({ message: "Enrollment successful." });
        });
    });
};

const getMyCourses = (req, res) => {
    const studentId = req.user.id;

    const query = `SELECT C.ID, C.TITLE, C.CODE, U.FULL_NAME as Instructor 
                   FROM COURSES C JOIN ENROLLMENT E ON C.ID = E.COURSE_ID 
                   JOIN USER U ON C.INSTRUCTOR_ID = U.ID 
                   WHERE E.STUDENT_ID = ?`;

    db.all(query, [studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};

module.exports = { listCourses, createCourse, enrollStudent, getMyCourses };