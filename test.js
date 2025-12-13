const db_access = require('./config/db');
const db = db_access.db;
const db_strings = require('./config/db');
const bcrypt = require('bcryptjs');

const testUsers = [
    { fullName: "Hassan Al-Hakamdar", email: "hassan.admin@tkh.edu.eg", role: "admin", password: "hassan_pass_admin", approved: 1 },
    { fullName: "Dr. Amir Tarek", email: "amir.tarek@tkh.edu.eg", role: "faculty", password: "amir_pass_123", approved: 1 },
    { fullName: "Eng. Mariam Abdelati", email: "mariam.abdelati@tkh.edu.eg", role: "faculty", password: "mariam_pass_123", approved: 1 },
    { fullName: "Eng. Nour", email: "nour.ta@tkh.edu.eg", role: "faculty", password: "nour_pass_123", approved: 1 },
    { fullName: "Dr. Haitham Gawish", email: "haitham.gawish@tkh.edu.eg", role: "faculty", password: "haitham_pass_123", approved: 1 },
    { fullName: "Eng. Karim El Debais", email: "karim.dbais@tkh.edu.eg", role: "faculty", password: "karim_la_pass_123", approved: 1 },
    { fullName: "Dr. Amira", email: "amira.mod@tkh.edu.eg", role: "faculty", password: "amira_pass_123", approved: 1 },
    { fullName: "Eng. Heidy", email: "heidy.la@tkh.edu.eg", role: "faculty", password: "heidy_pass_123", approved: 1 },

    { fullName: "Ahmed Mo'men", email: "aa2301532@tkh.edu.eg", role: "student", password: "ahmed_pass_2023", approved: 1 },
    { fullName: "Karim Abdullah", email: "ka2301533@tkh.edu.eg", role: "student", password: "karim_pass_1", approved: 1 },
    { fullName: "Mohamed Hazem", email: "mh2301534@tkh.edu.eg", role: "student", password: "hazem_pass_2", approved: 1 },
    { fullName: "Mohamed Khaled", email: "mk2301535@tkh.edu.eg", role: "student", password: "khaled_pass_3", approved: 1 },
    { fullName: "Mohamed Rouhi", email: "mr2301536@tkh.edu.eg", role: "student", password: "rouhi_pass_4", approved: 1 },
    { fullName: "Yassin Ahmed", email: "ya2301537@tkh.edu.eg", role: "student", password: "yassin_pass_5", approved: 1 },
    { fullName: "Jana Ashraf", email: "ja2301538@tkh.edu.eg", role: "student", password: "jana_pass_6", approved: 1 },
    { fullName: "Nour Essam", email: "ne2301539@tkh.edu.eg", role: "student", password: "nour_st_pass_7", approved: 1 },
    { fullName: "Ali Rushdy", email: "ar2301540@tkh.edu.eg", role: "student", password: "ali_pass_8", approved: 1 }
];

const courseData = [
    { title: "The Internet and Web", code: "IWT101", instructorId: 2 },
    { title: "Digital Forensics", code: "DF202", instructorId: 5 },
    { title: "Foundation of Networks", code: "FON303", instructorId: 7 },
];

const scheduleData = [
    { courseId: 1, day: "Sunday", type: "Lecture", time: "09:00 AM", location: "Hall 1" },
    { courseId: 2, day: "Sunday", type: "Lab", time: "12:00 PM", location: "Lab A" },
    { courseId: 2, day: "Monday", type: "Lecture", time: "10:30 AM", location: "Hall 2" },
    { courseId: 3, day: "Monday", type: "Lab", time: "02:00 PM", location: "Lab B" },
    { courseId: 3, day: "Tuesday", type: "Lecture", time: "09:00 AM", location: "Hall 3" },
    { courseId: 1, day: "Tuesday", type: "Lab", time: "01:00 PM", location: "Lab C" }
];

db.serialize(() => {
    console.log("Starting Database Seeding...");

    db.run("DROP TABLE IF EXISTS SCHEDULE");
    db.run("DROP TABLE IF EXISTS ANNOUNCEMENT");
    db.run("DROP TABLE IF EXISTS ENROLLMENT");
    db.run("DROP TABLE IF EXISTS COURSES");
    db.run("DROP TABLE IF EXISTS SUBMISSION");
    db.run("DROP TABLE IF EXISTS NOTIFICATION");
    db.run("DROP TABLE IF EXISTS USER");

    db.run(db_strings.createUserTable);
    db.run(db_strings.createCoursesTable);
    db.run(db_strings.createEnrollmentTable);
    db.run(db_access.createSubmissionTable);
    db.run(db_strings.createNotificationTable);
    db.run(db_strings.createAnnouncementTable);
    db.run(db_strings.createScheduleTable, () => {

        console.log("Tables Created.");
        const userStmt = db.prepare("INSERT INTO USER (FULL_NAME, EMAIL, PASSWORD_HASH, ROLE, IS_APPROVED) VALUES (?, ?, ?, ?, ?)");
        testUsers.forEach(user => {
            const passHash = bcrypt.hashSync(user.password, 10);
            userStmt.run(user.fullName, user.email, passHash, user.role, user.approved);
        });

        userStmt.finalize(() => {
            console.log("Users inserted.");
            const courseStmt = db.prepare("INSERT INTO COURSES (TITLE, CODE, INSTRUCTOR_ID) VALUES (?, ?, ?)");
            courseData.forEach(course => {
                courseStmt.run(course.title, course.code, course.instructorId);
            });

            courseStmt.finalize(() => {
                console.log("Courses inserted.");
                const schedStmt = db.prepare("INSERT INTO SCHEDULE (COURSE_ID, DAY, TYPE, TIME, LOCATION) VALUES (?, ?, ?, ?, ?)");
                scheduleData.forEach(s => {
                    schedStmt.run(s.courseId, s.day, s.type, s.time, s.location);
                });

                schedStmt.finalize(() => {
                    console.log("Fixed Schedule inserted.");
                    console.log("Ready.");
                });
            });
        });
    });
});