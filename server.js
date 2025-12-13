const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// استيراد ملف الداتا بيز
const db_access = require('./config/db');
const db = db_access.db;

// استيراد الكونترولرز
const authController = require('./controllers/authController');
const submissionController = require('./controllers/submissionController');
const courseController = require('./controllers/courseController');
const notificationController = require('./controllers/notificationController');
const announcementController = require('./controllers/announcementController');

const app = express();
const PORT = 3000;

// إعداد مجلد الرفع
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'frontend')));

// إعداد Multer لرفع الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// تهيئة جداول قاعدة البيانات
db.serialize(() => {
    db.run(db_access.createUserTable);
    db.run(db_access.createCoursesTable);
    db.run(db_access.createEnrollmentTable);
    db.run(db_access.createSubmissionTable);
    db.run(db_access.createNotificationTable);
    db.run(db_access.createAnnouncementTable);
    db.run(db_access.createScheduleTable);
});

// Middleware للتحقق من التوكن وصلاحيات المستخدم
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Access Denied. Not Authenticated." });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });

        const currentAgent = req.headers['user-agent'] || 'unknown';
        if (decoded.userAgent !== currentAgent) {
            return res.status(403).json({ message: "Security Violation: Browser mismatch." });
        }
        if (decoded.ip !== req.ip) {
            return res.status(403).json({ message: "Security Violation: Device mismatch." });
        }

        req.user = decoded;
        next();
    });
};

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

// --- Routes ---

// Auth
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);

// Admin
app.get('/api/admin/pending', verifyToken, isAdmin, authController.getPendingRequests);
app.post('/api/admin/approve', verifyToken, isAdmin, authController.approveRequest);
app.post('/api/admin/reset-user-password', verifyToken, isAdmin, authController.adminResetUserPassword);
app.post('/api/admin/create-faculty', verifyToken, isAdmin, authController.createFaculty);

// Profile
app.get('/api/profile', verifyToken, authController.getProfile);
app.post('/api/profile/change-password', verifyToken, authController.changePassword);

// Courses & Schedule
app.get('/api/schedule', verifyToken, courseController.getSchedule);
app.get('/api/courses/list', verifyToken, courseController.listCourses);
app.post('/api/courses/create', verifyToken, isFaculty, courseController.createCourse);
app.post('/api/courses/schedule/update', verifyToken, isFaculty, courseController.updateSchedule);
app.post('/api/courses/enroll', verifyToken, isStudent, courseController.enrollStudent);
app.get('/api/courses/my-courses', verifyToken, isStudent, courseController.getMyCourses);

// Announcements & Notifications
app.post('/api/announcements/create', verifyToken, isFaculty, announcementController.createAnnouncement);
app.get('/api/notifications', verifyToken, notificationController.getNotifications);

// Submissions
app.post('/api/submit', verifyToken, isStudent, upload.single('courseWork'), submissionController.submitAssignment);
app.get('/api/submissions/faculty', verifyToken, isFaculty, submissionController.getFacultySubmissions);
app.post('/api/submissions/grade', verifyToken, isFaculty, submissionController.gradeAssignment);
app.get('/api/submissions/mygrades', verifyToken, isStudent, submissionController.getStudentGrades);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});