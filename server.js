const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Database Connection
const db_access = require('./config/db');
const db = db_access.db;

// Controllers Import
const authController = require('./controllers/authController');
const submissionController = require('./controllers/submissionController');
const courseController = require('./controllers/courseController');
const notificationController = require('./controllers/notificationController');
const announcementController = require('./controllers/announcementController');

const app = express();
const PORT = 3000;

// Ensure upload directory exists to prevent errors during file submission
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Standard Middleware
app.use(express.json());
app.use(cookieParser());
// Serve the frontend files statically (Connecting Backend with Frontend)
app.use(express.static(path.join(__dirname, 'frontend')));

// Multer Config: Unique filename generation to avoid overwriting files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Initialize DB tables on server startup
db.serialize(() => {
    db.run(db_access.createUserTable);
    db.run(db_access.createCoursesTable);
    db.run(db_access.createEnrollmentTable);
    db.run(db_access.createSubmissionTable);
    db.run(db_access.createNotificationTable);
    db.run(db_access.createAnnouncementTable);
    db.run(db_access.createScheduleTable);
});

// --- Security Middleware ---

// 1. Authentication: Verifies JWT & prevents Session Hijacking (IP/Browser checks)
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Access Denied. Not Authenticated." });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });

        // Security Check: Ensure token is used from the same Browser & IP
        const currentAgent = req.headers['user-agent'] || 'unknown';
        if (decoded.userAgent !== currentAgent) {
            return res.status(403).json({ message: "Security Violation: Browser mismatch." });
        }
        if (decoded.ip !== req.ip) {
            return res.status(403).json({ message: "Security Violation: Device mismatch." });
        }

        req.user = decoded; // Attach user info to request
        next();
    });
};

// 2. Authorization: Role-based access control (RBAC)
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Access forbidden. Admin rights required." });
    next();
};

const isFaculty = (req, res, next) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: "Faculty rights required." });
    next();
};

const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: "Student rights required." });
    next();
};

// --- API Routes ---

// Public Routes (No Token Required)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);

// Protected Admin Routes
app.get('/api/admin/pending', verifyToken, isAdmin, authController.getPendingRequests);
app.post('/api/admin/approve', verifyToken, isAdmin, authController.approveRequest);
app.post('/api/admin/reset-user-password', verifyToken, isAdmin, authController.adminResetUserPassword);
app.post('/api/admin/create-faculty', verifyToken, isAdmin, authController.createFaculty);

// Shared Routes
app.get('/api/profile', verifyToken, authController.getProfile);
app.post('/api/profile/change-password', verifyToken, authController.changePassword);

// Course Management
app.get('/api/schedule', verifyToken, courseController.getSchedule);
app.get('/api/courses/list', verifyToken, courseController.listCourses);
app.post('/api/courses/create', verifyToken, isFaculty, courseController.createCourse);
app.post('/api/courses/schedule/update', verifyToken, isFaculty, courseController.updateSchedule);
app.post('/api/courses/enroll', verifyToken, isStudent, courseController.enrollStudent);
app.get('/api/courses/my-courses', verifyToken, isStudent, courseController.getMyCourses);

// Communication
app.post('/api/announcements/create', verifyToken, isFaculty, announcementController.createAnnouncement);
app.get('/api/notifications', verifyToken, notificationController.getNotifications);

// Submission System (Uploads & Grading)
app.post('/api/submit', verifyToken, isStudent, upload.single('courseWork'), submissionController.submitAssignment);
app.get('/api/submissions/faculty', verifyToken, isFaculty, submissionController.getFacultySubmissions);
app.post('/api/submissions/grade', verifyToken, isFaculty, submissionController.gradeAssignment);
app.get('/api/submissions/mygrades', verifyToken, isStudent, submissionController.getStudentGrades);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});