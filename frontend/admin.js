const API = 'http://localhost:3000/api';

const init = () => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
        alert("Access Denied: You are not an Admin.");
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name').innerText = user.fullName;
    document.getElementById('display-name').innerText = user.fullName;
    document.getElementById('display-email').innerText = user.email;

    loadPendingRequests();
    showSection('home');
};

const showSection = (sectionId) => {
    if (sectionId === 'profile') sectionId = 'home';

    const sections = ['home', 'pending', 'manage'];

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

    if (sectionId === 'pending') loadPendingRequests();
};

const loadPendingRequests = async() => {
    try {
        const res = await fetch(API + '/admin/pending', { credentials: 'include' });
        const data = await res.json();
        const tbody = document.querySelector('#pending-table tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">No pending requests found.</td></tr>';
        } else {
            data.forEach(u => {
                const row = `<tr><td>${u.FULL_NAME}</td><td>${u.EMAIL}</td><td>${u.CREATED_AT}</td><td><button class="primary-btn" style="padding:5px 10px; width:auto;" onclick="approveUser(${u.ID})">Approve</button></td></tr>`;
                tbody.innerHTML += row;
            });
        }
    } catch (err) { console.error(err); }
};

const approveUser = async(id) => {
    if (!confirm("Approve this student?")) return;
    await fetch(API + '/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: id })
    });
    alert('User Approved!');
    loadPendingRequests();
};

const createFaculty = async() => {
    const name = document.getElementById('fac-name').value;
    const email = document.getElementById('fac-email').value;
    const pass = document.getElementById('fac-pass').value;

    if (!name || !email || !pass) return alert("Fill all fields");

    const res = await fetch(API + '/admin/create-faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullName: name, email: email, password: pass })
    });
    const data = await res.json();
    alert(data.message);
};

const resetUserPass = async() => {
    const uid = document.getElementById('reset-id').value;
    const newP = document.getElementById('reset-pass').value;

    if (!uid || !newP) return alert("Please enter User ID and New Password.");

    const res = await fetch(API + '/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: uid, newPassword: newP })
    });
    const data = await res.json();
    alert(data.message);
};

const changeMyPassword = async() => {
    const oldP = document.getElementById('my-old-pass').value;
    const newP = document.getElementById('my-new-pass').value;

    const res = await fetch(API + '/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword: oldP, newPassword: newP })
    });
    const data = await res.json();
    alert(data.message);
};

const logout = () => {
    fetch(API + '/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

init();