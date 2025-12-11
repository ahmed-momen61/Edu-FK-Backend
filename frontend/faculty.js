const API = 'http://localhost:3000/api';
let myCourseId = null;

const init = async() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { window.location.href = 'login.html'; return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'faculty') {
        alert("Access Denied.");
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name').innerText = user.fullName;
    document.getElementById('display-name').innerText = user.fullName;
    document.getElementById('display-email').innerText = user.email;

    await checkMyCourse(user.fullName);
    loadSubmissions();
    showSection('home');
};

const showSection = (sectionId) => {
    if (sectionId === 'profile') sectionId = 'home';
    const sections = ['home', 'manage', 'grading'];
    sections.forEach(s => {
        document.getElementById('sec-' + s).classList.add('hidden');
        document.getElementById('link-' + s).classList.remove('active');
    });
    document.getElementById('sec-' + sectionId).classList.remove('hidden');
    document.getElementById('link-' + sectionId).classList.add('active');
};

const checkMyCourse = async(name) => {
    const res = await fetch(API + '/courses/list', { credentials: 'include' });
    const courses = await res.json();
    let myCourse = null;
    for (let i = 0; i < courses.length; i++) {
        if (courses[i].InstructorName === name) { myCourse = courses[i]; break; }
    }
    if (myCourse) {
        myCourseId = myCourse.ID;
        document.getElementById('active-course-box').classList.remove('hidden');
        document.getElementById('course-info').innerText = myCourse.CODE + ': ' + myCourse.TITLE;
        document.getElementById('ann-course-id').value = myCourse.ID;
        loadSchedule();
    } else {
        document.getElementById('create-course-box').classList.remove('hidden');
    }
};

const createCourse = async() => {
    const t = document.getElementById('c-title').value;
    const c = document.getElementById('c-code').value;
    await fetch(API + '/courses/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ title: t, code: c }) });
    alert('Course Created');
    location.reload();
};

const loadSchedule = async() => {
    const res = await fetch(API + '/schedule', { credentials: 'include' });
    const data = await res.json();
    const div = document.getElementById('schedule-list');
    div.innerHTML = data.length ? '' : '<p>No schedule set.</p>';
    data.forEach(s => {
        div.innerHTML += `<div style="border-bottom:1px solid #eee; padding:5px;"><strong>${s.DAY}</strong>: ${s.TIME} (${s.TYPE}) at ${s.LOCATION}</div>`;
    });
};

const addSchedule = async() => {
    if (!myCourseId) return alert("Create a course first!");
    const day = document.getElementById('sched-day').value;
    const time = document.getElementById('sched-time').value;
    const type = document.getElementById('sched-type').value;
    const loc = document.getElementById('sched-loc').value;
    await fetch(API + '/courses/schedule/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ courseId: myCourseId, day: day, time: time, type: type, location: loc }) });
    alert('Schedule Updated');
    loadSchedule();
};

const loadSubmissions = async() => {
    const res = await fetch(API + '/submissions/faculty', { credentials: 'include' });
    const data = await res.json();
    const tbody = document.querySelector('#grading-table tbody');
    tbody.innerHTML = '';

    if (data.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No submissions yet.</td></tr>';
    else {
        data.forEach(s => {
            // Pre-fill inputs with existing GRADE and FEEDBACK
            const existingGrade = s.GRADE !== null ? s.GRADE : '';
            const existingFeedback = s.FEEDBACK !== null ? s.FEEDBACK : '';

            const row = `<tr>
                <td>${s.StudentName}</td>
                <td>${s.CourseTitle}</td>
                <td><a href="#" onclick="alert('Download Path: ${s.FILE_PATH}')">View File</a></td>
                <td>
                    <input type="number" id="g-${s.SubmissionID}" value="${existingGrade}" placeholder="Grade" style="width:70px;">
                </td>
                <td>
                    <input type="text" id="f-${s.SubmissionID}" value="${existingFeedback}" placeholder="Feedback">
                </td>
                <td>
                    <button class="primary-btn" style="padding:5px 10px;" onclick="grade(${s.SubmissionID})">
                        ${s.GRADE ? 'Edit' : 'Save'}
                    </button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }
};

const grade = async(id) => {
    const g = document.getElementById('g-' + id).value;
    const f = document.getElementById('f-' + id).value;
    await fetch(API + '/submissions/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ submissionId: id, grade: g, feedback: f })
    });
    alert('Grade/Feedback Saved Successfully');
    // Reload to reflect changes (e.g. button changes to 'Edit')
    loadSubmissions();
};

const postAnnouncement = async() => {
    if (!myCourseId) return;
    const t = document.getElementById('ann-title').value;
    const c = document.getElementById('ann-content').value;
    await fetch(API + '/announcements/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ courseId: myCourseId, title: t, content: c }) });
    alert('Posted!');
};

const changeMyPassword = async() => {
    const oldP = document.getElementById('my-old-pass').value;
    const newP = document.getElementById('my-new-pass').value;
    const res = await fetch(API + '/profile/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ oldPassword: oldP, newPassword: newP }) });
    const data = await res.json();
    alert(data.message);
};

const logout = () => {
    fetch(API + '/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

init();