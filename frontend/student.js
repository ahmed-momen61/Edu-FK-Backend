const API = 'http://localhost:3000/api';
let scheduleDataCache = [];

const init = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'student') {
        alert("Access Denied.");
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name').innerText = user.fullName;

    // ✅ FIX: Fill Profile Data correctly
    document.getElementById('display-name').innerText = user.fullName;
    document.getElementById('display-email').innerText = user.email;

    loadAllData();
    showSection('home');
};

const showSection = (sectionId) => {


    const sections = ['home', 'schedule', 'enrollment', 'mycourses', 'grades', 'profile'];

    sections.forEach(s => {
        const el = document.getElementById('sec-' + s);
        if (el) el.classList.add('hidden');

        const link = document.getElementById('link-' + s);
        if (link) link.classList.remove('active');
    });

    const target = document.getElementById('sec-' + sectionId);
    if (target) target.classList.remove('hidden');

    const targetLink = document.getElementById('link-' + sectionId);
    if (targetLink) targetLink.classList.add('active');
};

const loadAllData = () => {
    loadNotifications();
    loadScheduleData();
    loadAllCourses();
    loadMyCourses();
    loadGrades();
};

const loadNotifications = async() => {
    try {
        const res = await fetch(API + '/notifications', { credentials: 'include' });
        const data = await res.json();
        const list = document.getElementById('notif-list');
        list.innerHTML = data.length ? data.map(n => `<div class="notif-item"><strong>${n.MESSAGE}</strong><br><small>${n.CREATED_AT}</small></div>`).join('') : 'No notifications.';
    } catch (e) {}
};

const loadScheduleData = async() => {
    try {
        const res = await fetch(API + '/schedule', { credentials: 'include' });
        const data = await res.json();
        scheduleDataCache = data;

        renderCalendar();

        const tbody = document.querySelector('#schedule-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No classes enrolled yet.</td></tr>';
            } else {
                const dayOrder = { "Sunday": 1, "Monday": 2, "Tuesday": 3, "Wednesday": 4, "Thursday": 5, "Friday": 6, "Saturday": 7 };
                data.sort((a, b) => dayOrder[a.DAY] - dayOrder[b.DAY]);

                data.forEach(s => {
                    const row = `<tr>
                        <td><strong>${s.DAY}</strong></td>
                        <td>${s.TIME}</td>
                        <td>${s.CODE}: ${s.TITLE}</td>
                        <td><span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:12px;">${s.TYPE}</span></td>
                        <td>${s.LOCATION}</td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (err) { console.error(err); }
};

const renderCalendar = () => {
    const grid = document.getElementById('calendar-grid');
    const detailsDiv = document.getElementById('schedule-details');
    if (!grid) return;
    grid.innerHTML = '';
    detailsDiv.innerHTML = '<h4 style="color:#666;">Select a day above or check the list below.</h4>';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        const currentDay = today.getDay();
        const dayDiff = i - currentDay;
        d.setDate(today.getDate() + dayDiff);

        const isToday = (i === currentDay) ? 'today' : '';
        const dayName = days[i];

        const html = `<div class="calendar-day ${isToday}" onclick="showDayDetails('${dayNamesFull[i]}')">
                   <span class="day-name">${dayName}</span>
                   <span class="day-date">${d.getDate()}</span>
                   </div>`;
        grid.innerHTML += html;

        if (isToday) showDayDetails(dayNamesFull[i]);
    }
};

const showDayDetails = (dayName) => {
    const detailsDiv = document.getElementById('schedule-details');
    if (!detailsDiv || !scheduleDataCache) return;

    const events = scheduleDataCache.filter(e => e.DAY === dayName);
    if (events.length > 0) {
        detailsDiv.innerHTML = `<h4 style="color:#e64a19; margin-bottom:10px;">${dayName}'s Schedule:</h4>`;
        events.forEach(e => {
            detailsDiv.innerHTML += `<div style="padding:5px; border-bottom:1px solid #eee;">
                <strong>${e.TIME}</strong> | ${e.CODE} (${e.TYPE}) <br> <span style="color:#666;">📍 ${e.LOCATION}</span>
            </div>`;
        });
    } else {
        detailsDiv.innerHTML = `<h4 style="color:#666;">No classes on ${dayName}.</h4>`;
    }
};

const loadAllCourses = async() => {
    const res = await fetch(API + '/courses/list', { credentials: 'include' });
    const data = await res.json();
    const tbody = document.querySelector('#all-courses tbody');
    tbody.innerHTML = '';
    data.forEach(c => {
        tbody.innerHTML += `<tr><td><strong>${c.ID}</strong></td><td>${c.CODE}</td><td>${c.TITLE}</td><td>${c.InstructorName}</td></tr>`;
    });
};

const enroll = async() => {
    const id = document.getElementById('enroll-id').value;
    const res = await fetch(API + '/courses/enroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ courseId: id }) });
    alert((await res.json()).message);
    loadAllCourses();
    loadMyCourses();
    loadScheduleData();
};

const loadMyCourses = async() => {
    const res = await fetch(API + '/courses/my-courses', { credentials: 'include' });
    const data = await res.json();
    const div = document.getElementById('my-courses-grid');
    div.innerHTML = '';
    data.forEach(c => {
        div.innerHTML += `<div class="section-card">
            <div class="section-header">${c.CODE}</div>
            <div class="section-body"><h4>${c.TITLE}</h4><p>Dr. ${c.Instructor}</p><hr>
            <button class="primary-btn" onclick="triggerUpload(${c.ID}, 2)">Submit Assignment</button></div>
        </div>`;
    });
};

const triggerUpload = (cid, iid) => {
    const input = document.getElementById('file-input');
    input.onchange = async(e) => {
        const formData = new FormData();
        formData.append('courseWork', e.target.files[0]);
        formData.append('assignmentId', cid);
        formData.append('instructorId', iid);
        const res = await fetch(API + '/submit', { method: 'POST', credentials: 'include', body: formData });
        alert((await res.json()).message);
    };
    input.click();
};

const loadGrades = async() => {
    const res = await fetch(API + '/submissions/mygrades', { credentials: 'include' });
    const data = await res.json();
    const tbody = document.querySelector('#grades-table tbody');
    tbody.innerHTML = '';
    data.forEach(g => {
        const date = new Date(g.SUBMITTED_AT).toLocaleDateString();
        const grade = g.GRADE ? `<strong style="color:green;">${g.GRADE}/100</strong>` : '<span style="color:orange;">Pending</span>';
        tbody.innerHTML += `<tr><td>Assignment ${g.ASSIGNMENT_ID}</td><td>${grade}</td><td>${g.FEEDBACK || '-'}</td><td>${date}</td></tr>`;
    });
};

const changePassword = async() => {
    const oldP = document.getElementById('old-pass').value;
    const newP = document.getElementById('new-pass').value;
    const res = await fetch(API + '/profile/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ oldPassword: oldP, newPassword: newP }) });
    alert((await res.json()).message);
};

const logout = () => {
    fetch(API + '/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

init();