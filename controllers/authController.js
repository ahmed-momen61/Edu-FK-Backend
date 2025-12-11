const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// استخدام Destructuring عشان نجيب الـ db صح زي الـ Travel App
const { db } = require('../config/db');

const signToken = (id, role, req) => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip;
    return jwt.sign({ id, role, userAgent, ip }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
};

const register = (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (role === 'faculty' || role === 'admin') {
        return res.status(403).json({ message: "Faculty/Admin accounts must be created by an existing Admin only." });
    }

    const approvedStatus = 0;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const query = `INSERT INTO USER (FULL_NAME, EMAIL, PASSWORD_HASH, ROLE, IS_APPROVED) VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [fullName, email, hash, role, approvedStatus], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ message: "Email already exists" });
            return res.status(500).json({ error: err.message });
        }

        const adminId = 1;
        const notifMsg = `NEW REGISTRATION REQUEST: User ${fullName} (${email}) requires approval.`;

        db.run(`INSERT INTO NOTIFICATION (USER_ID, MESSAGE) VALUES (?, ?)`, [adminId, notifMsg]);

        res.status(201).json({ message: "Registration successful. Please wait for admin approval to log in." });
    });
};

const login = (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM USER WHERE EMAIL = ?`;

    db.get(query, [email], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        if (user.IS_APPROVED === 0) {
            return res.status(401).json({ message: "Your account is currently pending admin approval." });
        }

        const isMatch = bcrypt.compareSync(password, user.PASSWORD_HASH);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = signToken(user.ID, user.ROLE, req);

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600000
        });

        res.json({
            message: "Login successful",
            user: { id: user.ID, email: user.EMAIL, role: user.ROLE, fullName: user.FULL_NAME }
        });
    });
};

const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
};

const getPendingRequests = (req, res) => {
    const query = `SELECT ID, FULL_NAME, EMAIL, CREATED_AT FROM USER WHERE IS_APPROVED = 0 AND ROLE = 'student'`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

const approveRequest = (req, res) => {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "User ID is required." });

    db.run(`UPDATE USER SET IS_APPROVED = 1 WHERE ID = ? AND IS_APPROVED = 0`, [userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0) {
            return res.status(404).json({ message: "User not found or already approved." });
        }

        const studentNotifMsg = "Your registration request has been approved! You can now log in.";
        db.run(`INSERT INTO NOTIFICATION (USER_ID, MESSAGE) VALUES (?, ?)`, [userId, studentNotifMsg]);

        res.json({ message: `User ID ${userId} has been approved successfully.` });
    });
};

const getProfile = (req, res) => {
    const userId = req.user.id;

    db.get(`SELECT ID, FULL_NAME, EMAIL, ROLE, CREATED_AT FROM USER WHERE ID = ?`, [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "User not found" });

        let courseQuery = "";
        if (user.ROLE === 'student') {
            courseQuery = `SELECT C.TITLE, C.CODE FROM COURSES C JOIN ENROLLMENT E ON C.ID = E.COURSE_ID WHERE E.STUDENT_ID = ?`;
        } else if (user.ROLE === 'faculty') {
            courseQuery = `SELECT TITLE, CODE FROM COURSES WHERE INSTRUCTOR_ID = ?`;
        }

        if (courseQuery) {
            db.all(courseQuery, [userId], (err, courses) => {
                user.courses = courses || [];
                res.json(user);
            });
        } else {
            user.courses = [];
            res.json(user);
        }
    });
};

const changePassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Old password and new password are required." });
    }

    db.get(`SELECT PASSWORD_HASH FROM USER WHERE ID = ?`, [userId], (err, row) => {
        if (err || !row) return res.status(500).json({ error: "User not found." });

        const isMatch = bcrypt.compareSync(oldPassword, row.PASSWORD_HASH);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect old password." });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);
        db.run(`UPDATE USER SET PASSWORD_HASH = ? WHERE ID = ?`, [newHash, userId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Password changed successfully." });
        });
    });
};

const adminResetUserPassword = (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).json({ message: "User ID and new temporary password are required." });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    db.run(`UPDATE USER SET PASSWORD_HASH = ? WHERE ID = ?`, [newHash, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0) return res.status(404).json({ message: "User not found." });

        res.json({ message: "Password reset successfully." });
    });
};

const createFaculty = (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const approved = 1;

    const query = `INSERT INTO USER (FULL_NAME, EMAIL, PASSWORD_HASH, ROLE, IS_APPROVED) VALUES (?, ?, ?, 'faculty', ?)`;

    db.run(query, [fullName, email, hash, approved], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ message: "Email already exists" });
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Faculty account created successfully." });
    });
};


module.exports = {
    register,
    login,
    logout,
    getPendingRequests,
    approveRequest,
    getProfile,
    changePassword,
    adminResetUserPassword,
    createFaculty
};