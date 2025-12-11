const loginForm = document.getElementById('loginForm');
const errorSpan = document.getElementById('loginErr');

loginForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    if (errorSpan) errorSpan.textContent = 'Logging in...';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'admin') {
                window.location.href = 'admin_dashboard.html';
            } else if (data.user.role === 'faculty') {
                window.location.href = 'faculty_dashboard.html';
            } else {
                window.location.href = 'student_dashboard.html';
            }
        } else {
            if (errorSpan) errorSpan.textContent = data.message || 'Login failed';
        }
    } catch (err) {
        if (errorSpan) errorSpan.textContent = 'Server connection error';
    }
});