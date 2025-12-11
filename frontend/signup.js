const signupForm = document.getElementById('signupForm');
const errorSpan = document.getElementById('signupErr');
const successSpan = document.getElementById('signupSuccess');

signupForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    if (errorSpan) errorSpan.textContent = '';
    if (successSpan) successSpan.textContent = 'Processing...';

    const fullName = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = 'student';

    try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password, role })
        });

        const data = await res.json();

        if (res.ok) {
            if (successSpan) successSpan.textContent = data.message;
            signupForm.reset();
        } else {
            if (successSpan) successSpan.textContent = '';
            if (errorSpan) errorSpan.textContent = data.message || 'Registration failed';
        }
    } catch (err) {
        if (successSpan) successSpan.textContent = '';
        if (errorSpan) errorSpan.textContent = 'Server connection error';
    }
});