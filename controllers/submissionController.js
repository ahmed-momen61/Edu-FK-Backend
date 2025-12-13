const { db } = require('../config/db');


const submitAssignment = (req, res) => {
    const studentId = req.user.id;

    const { assignmentId, instructorId, title } = req.body;


    if (!req.file) return res.status(400).json({ message: "No file uploaded." });


    const query = `INSERT INTO SUBMISSION (ASSIGNMENT_ID, STUDENT_ID, TITLE, FILE_PATH, FILE_TYPE) VALUES (?, ?, ?, ?, ?)`;


    db.run(query, [assignmentId, studentId, title, req.file.path, req.file.mimetype], function(err) {
        if (err) return res.status(500).json({ error: err.message });


        if (instructorId) {
            const notifMsg = `Student ID ${studentId} submitted: ${title}`;
            db.run(`INSERT INTO NOTIFICATION (USER_ID, MESSAGE) VALUES (?, ?)`, [instructorId, notifMsg]);
        }

        res.status(201).json({ message: "Assignment submitted successfully" });
    });
};


const getFacultySubmissions = (req, res) => {
    const instructorId = req.user.id;

    const query = `SELECT S.ID as SubmissionID, S.TITLE, S.ASSIGNMENT_ID, S.SUBMITTED_AT, S.FILE_PATH, S.GRADE, S.FEEDBACK, U.FULL_NAME as StudentName, U.ID as StudentID, C.TITLE as CourseTitle FROM SUBMISSION S JOIN USER U ON S.STUDENT_ID = U.ID JOIN COURSES C ON C.INSTRUCTOR_ID = ? WHERE C.ID = S.ASSIGNMENT_ID`;

    db.all(query, [instructorId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};


const gradeAssignment = (req, res) => {
    const { submissionId, grade, feedback } = req.body;


    if (!submissionId || grade === undefined || !feedback) {
        return res.status(400).json({ message: "Submission ID, grade, and feedback are required." });
    }


    const updateQuery = `UPDATE SUBMISSION SET GRADE = ?, FEEDBACK = ? WHERE ID = ?`;


    db.run(updateQuery, [grade, feedback, submissionId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Submission not found." });


        db.get(`SELECT STUDENT_ID FROM SUBMISSION WHERE ID = ?`, [submissionId], (err, row) => {
            if (row) {
                const studentId = row.STUDENT_ID;
                const notifMsg = `Your assignment (ID ${submissionId}) has been graded. Grade: ${grade}`;
                db.run(`INSERT INTO NOTIFICATION (USER_ID, MESSAGE) VALUES (?, ?)`, [studentId, notifMsg]);
            }
        });

        res.json({ message: "Grade and feedback successfully posted." });
    });
};


const getStudentGrades = (req, res) => {
    const studentId = req.user.id;

    const query = `SELECT S.ID, S.TITLE, S.ASSIGNMENT_ID, S.SUBMITTED_AT, S.GRADE, S.FEEDBACK FROM SUBMISSION S WHERE S.STUDENT_ID = ?`;
    db.all(query, [studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

module.exports = { submitAssignment, getFacultySubmissions, gradeAssignment, getStudentGrades };