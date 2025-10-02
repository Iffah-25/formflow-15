// SignUp_LogIn_Form.js (Updated for Token Handling)

const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// Existing logic for switching between panels
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})

// ** Token and Backend Hooks **
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

async function handleFormSubmission(event, form, endpoint) {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Trim whitespace from credentials
    if (data.password) {
        data.password = data.password.trim();
    }
    if (data.email) {
        data.email = data.email.trim();
    }
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Server error: ${response.status}`);
        }
        
        console.log('Backend response:', result);
        
        // 💡 NEW LOGIC: Save token and redirect on successful Login
        if (endpoint.includes('/login') && result.token) {
            localStorage.setItem('authToken', result.token);
            alert(`Login successful! Redirecting to dashboard.`);
            window.location.href = '/dashboard.html'; // Redirect to a new page
        } else {
            alert(`Success: ${result.message || 'Operation successful'}.`);
            form.reset(); 
            // If registration is successful, automatically switch to login panel
            if (endpoint.includes('/register')) {
                 container.classList.remove('active'); 
            }
        }

    } catch (error) {
        console.error('Submission Error:', error.message);
        alert(`Error: ${error.message}. Check console for server logs.`);
    }
}

// Attach the new submission handler to the forms
if (loginForm) {
    loginForm.addEventListener('submit', (e) => handleFormSubmission(e, loginForm, loginForm.action));
}

if (registerForm) {
    registerForm.addEventListener('submit', (e) => handleFormSubmission(e, registerForm, registerForm.action));
}