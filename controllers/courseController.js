<<<<<<< HEAD
const { db } = require('../config/db');

const listCourses = (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = "";
    let params = [];

    if (userRole === 'faculty') {
        query = `SELECT C.ID, C.TITLE, C.CODE, U.FULL_NAME AS InstructorName FROM COURSES C JOIN USER U ON C.INSTRUCTOR_ID = U.ID WHERE C.INSTRUCTOR_ID = ?`;
        params = [userId];
    } else {
        query = `SELECT C.ID, C.TITLE, C.CODE, U.FULL_NAME AS InstructorName FROM COURSES C JOIN USER U ON C.INSTRUCTOR_ID = U.ID`;
    }

    db.all(query, params, (err, rows) => {
=======
const db_access = require('../config/db.js');
const db = db_access.db;

const listCourses = (req, res) => {
    const query = `SELECT C.ID, C.TITLE, C.CODE, U.FULL_NAME AS InstructorName 
                   FROM COURSES C JOIN USER U ON C.INSTRUCTOR_ID = U.ID`;

    db.all(query, [], (err, rows) => {
>>>>>>> 63e917003e7ee29c7dc8af3dd2aadbbad6d6985c
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};

<<<<<<< HEAD
const getSchedule = (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    let query = "";
    let params = [];

    if (userRole === 'student') {
        query = `SELECT S.DAY, S.TYPE, S.TIME, S.LOCATION, C.TITLE, C.CODE FROM SCHEDULE S JOIN COURSES C ON S.COURSE_ID = C.ID JOIN ENROLLMENT E ON C.ID = E.COURSE_ID WHERE E.STUDENT_ID = ?`;
        params = [userId];
    } else if (userRole === 'faculty') {
        query = `SELECT S.DAY, S.TYPE, S.TIME, S.LOCATION, C.TITLE, C.CODE FROM SCHEDULE S JOIN COURSES C ON S.COURSE_ID = C.ID WHERE C.INSTRUCTOR_ID = ?`;
        params = [userId];
    } else {
        query = `SELECT S.DAY, S.TYPE, S.TIME, S.LOCATION, C.TITLE, C.CODE FROM SCHEDULE S JOIN COURSES C ON S.COURSE_ID = C.ID`;
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        res.json(rows);
    });
};

=======
>>>>>>> 63e917003e7ee29c7dc8af3dd2aadbbad6d6985c
const createCourse = (req, res) => {
    const { title, code } = req.body;
    const instructorId = req.user.id;

    if (!title || !code) return res.status(400).json({ message: "Course title and code are required." });

<<<<<<< HEAD
    db.get(`SELECT ID FROM COURSES WHERE INSTRUCTOR_ID = ?`, [instructorId], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });

        if (row) {
            return res.status(403).json({ message: "You already have a course. You cannot create another one." });
        }

        const query = `INSERT INTO COURSES (TITLE, CODE, INSTRUCTOR_ID) VALUES (?, ?, ?)`;
        db.run(query, [title, code, instructorId], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ message: "Course code must be unique." });
                return res.status(500).json({ error: "Database error." });
            }
            res.status(201).json({ message: "Course created successfully", courseId: this.lastID });
        });
    });
};

const updateSchedule = (req, res) => {
    const { courseId, day, type, time, location } = req.body;

    db.get(`SELECT INSTRUCTOR_ID FROM COURSES WHERE ID = ?`, [courseId], (err, row) => {
        if (err || !row) return res.status(404).json({ message: "Course not found." });

        if (row.INSTRUCTOR_ID !== req.user.id) {
            return res.status(403).json({ message: "You can only edit your own course schedule." });
        }

        const insertQuery = `INSERT INTO SCHEDULE (COURSE_ID, DAY, TYPE, TIME, LOCATION) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertQuery, [courseId, day, type, time, location], (err) => {
            if (err) return res.status(500).json({ error: "Database error." });
            res.json({ message: "Schedule updated successfully." });
        });
=======
    const query = `INSERT INTO COURSES (TITLE, CODE, INSTRUCTOR_ID) VALUES (?, ?, ?)`;

    db.run(query, [title, code, instructorId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ message: "Course code must be unique." });
            return res.status(500).json({ error: "Database error." });
        }
        res.status(201).json({ message: "Course created successfully", courseId: this.lastID });
>>>>>>> 63e917003e7ee29c7dc8af3dd2aadbbad6d6985c
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
<<<<<<< HEAD
        db.run(enrollQuery, [studentId, courseId], function(err) {
=======
        db.run(enrollQuery, [studentId, courseId], (err) => {
>>>>>>> 63e917003e7ee29c7dc8af3dd2aadbbad6d6985c
            if (err) return res.status(500).json({ error: "Database error." });
            res.status(201).json({ message: "Enrollment successful." });
        });
    });
};

const getMyCourses = (req, res) => {
    const studentId = req.user.id;

<<<<<<< HEAD
    const query = `SELECT C.ID, C.TITLE, C.CODE, U.FULL_NAME as Instructor FROM COURSES C JOIN ENROLLMENT E ON C.ID = E.COURSE_ID JOIN USER U ON C.INSTRUCTOR_ID = U.ID WHERE E.STUDENT_ID = ?`;
=======
    const query = `SELECT C.ID, C.TITLE, C.CODE, U.FULL_NAME as Instructor 
                   FROM COURSES C JOIN ENROLLMENT E ON C.ID = E.COURSE_ID 
                   JOIN USER U ON C.INSTRUCTOR_ID = U.ID 
                   WHERE E.STUDENT_ID = ?`;
>>>>>>> 63e917003e7ee29c7dc8af3dd2aadbbad6d6985c

    db.all(query, [studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
};

<<<<<<< HEAD
module.exports = { listCourses, createCourse, updateSchedule, enrollStudent, getMyCourses, getSchedule };
=======
module.exports = { listCourses, createCourse, enrollStudent, getMyCourses };
>>>>>>> 63e917003e7ee29c7dc8af3dd2aadbbad6d6985c
