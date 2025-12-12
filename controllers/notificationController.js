<<<<<<< HEAD
const { db } = require('../config/db');
=======
const db_access = require('../config/db.js');
const db = db_access.db;
>>>>>>> 63e917003e7ee29c7dc8af3dd2aadbbad6d6985c

const getNotifications = (req, res) => {
    const userId = req.user.id;

    const query = `SELECT ID, MESSAGE, IS_READ, CREATED_AT FROM NOTIFICATION WHERE USER_ID = ? ORDER BY CREATED_AT DESC`;

    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        db.run(`UPDATE NOTIFICATION SET IS_READ = 1 WHERE USER_ID = ?`, [userId]);
        res.json(rows);
    });
};

module.exports = { getNotifications };