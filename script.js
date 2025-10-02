// =========================================
// 1. GLOBAL SETUP & INIT
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize functions
    setupFloatingElements();
    setupPricingToggle();
    setupFAQAccordion();
    setupFormSubmissionHandlers();
    setupFormBuilderSubmissionHandler();
});

// Helper for floating background elements (from form.html inline script)
function setupFloatingElements() {
    const body = document.body;
    const numberOfElements = 15;
    for (let i = 0; i < numberOfElements; i++) {
        const element = document.createElement('div');
        element.className = 'floating-element';
        element.style.width = `${Math.random() * 20 + 10}px`;
        element.style.height = element.style.width;
        element.style.left = `${Math.random() * 100}vw`;
        element.style.animationDuration = `${Math.random() * 15 + 10}s`;
        element.style.animationDelay = `-${Math.random() * 10}s`;
        element.style.opacity = `${Math.random() * 0.4 + 0.1}`;
        body.appendChild(element);
    }
}


// =========================================
// 2. LOGIN/REGISTER LOGIC (from SignUp_LogIn_Form.js)
// =========================================

function setupFormSubmissionHandlers() {
    const container = document.querySelector('.login-container'); // Note: Assuming the login page loads the login-container class
    const registerBtn = document.querySelector('.register-btn');
    const loginBtn = document.querySelector('.login-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Existing logic for switching between panels
    if (registerBtn && container) {
        registerBtn.addEventListener('click', () => {
            container.classList.add('active');
        });
    }

    if (loginBtn && container) {
        loginBtn.addEventListener('click', () => {
            container.classList.remove('active');
        });
    }

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

            // Save token and redirect on successful Login
            if (endpoint.includes('/login') && result.token) {
                localStorage.setItem('authToken', result.token);
                alert(`Login successful! Redirecting to dashboard.`);
                window.location.href = '/dashboard.html'; // Redirect to a new page
            } else {
                alert(`Success: ${result.message || 'Operation successful'}.`);
                form.reset();
                // If registration is successful, automatically switch to login panel
                if (endpoint.includes('/register') && container) {
                    container.classList.remove('active');
                }
            }

        } catch (error) {
            console.error('Submission Error:', error.message);
            alert(`Error: ${error.message}. Check console for server logs.`);
        }
    }

    // Attach the submission handler to the forms (if they exist on the page)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleFormSubmission(e, loginForm, loginForm.action));
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => handleFormSubmission(e, registerForm, registerForm.action));
    }
}

// =========================================
// 3. FORM BUILDER LOGIC (from form.html inline script)
// =========================================

const formModal = document.getElementById('formModal');
const formPreview = document.getElementById('dynamic-form-preview');
const successMessage = document.getElementById('success-message');

window.openFormBuilder = function(templateType) {
    if (formModal) {
        formModal.style.display = 'block';
        formPreview.innerHTML = ''; // Clear previous form

        // Add default inputs for demonstration
        if (templateType === 'contact' || templateType === 'survey') {
            addElement('text', 'Your Name');
            addElement('email', 'Your Email');
            addElement('textarea', 'Your Message');
        }
        addElement('submit');
    }
}

window.closeFormBuilder = function() {
    if (formModal) {
        formModal.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
    }
}

window.addElement = function(type, labelText) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'form-field';

    const label = document.createElement('label');
    label.textContent = labelText || (type.charAt(0).toUpperCase() + type.slice(1)) + ' Field';

    let inputElement;

    switch (type) {
        case 'text':
        case 'email':
            inputElement = document.createElement('input');
            inputElement.type = type;
            inputElement.name = label.textContent.replace(/\s+/g, '_').toLowerCase();
            inputElement.placeholder = 'Enter ' + label.textContent.toLowerCase();
            fieldContainer.appendChild(label);
            fieldContainer.appendChild(inputElement);
            break;
        case 'textarea':
            inputElement = document.createElement('textarea');
            inputElement.name = label.textContent.replace(/\s+/g, '_').toLowerCase();
            inputElement.placeholder = 'Type your message...';
            fieldContainer.appendChild(label);
            fieldContainer.appendChild(inputElement);
            break;
        case 'checkbox':
            fieldContainer.className = 'checkbox-field';
            inputElement = document.createElement('input');
            inputElement.type = 'checkbox';
            inputElement.id = 'checkbox-' + Date.now();
            label.setAttribute('for', inputElement.id);
            label.textContent = 'Accept Terms and Conditions';
            fieldContainer.appendChild(inputElement);
            fieldContainer.appendChild(label);
            break;
        case 'radio':
            fieldContainer.className = 'radio-group';
            label.textContent = 'Select Option';
            fieldContainer.appendChild(label);
            ['Option 1', 'Option 2'].forEach(option => {
                const radioDiv = document.createElement('div');
                radioDiv.className = 'radio-field';
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'radio-group-name';
                radioInput.value = option.toLowerCase().replace(/\s+/g, '_');
                radioInput.id = option.toLowerCase().replace(/\s+/g, '_') + Date.now();
                const radioLabel = document.createElement('label');
                radioLabel.setAttribute('for', radioInput.id);
                radioLabel.textContent = option;
                radioDiv.appendChild(radioInput);
                radioDiv.appendChild(radioLabel);
                fieldContainer.appendChild(radioDiv);
            });
            break;
        case 'select':
            inputElement = document.createElement('select');
            inputElement.name = 'dropdown-select';
            fieldContainer.appendChild(label);
            ['Option A', 'Option B', 'Option C'].forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option.toLowerCase().replace(/\s+/g, '_');
                optionEl.textContent = option;
                inputElement.appendChild(optionEl);
            });
            fieldContainer.appendChild(inputElement);
            break;
        case 'submit':
            inputElement = document.createElement('button');
            inputElement.type = 'submit';
            inputElement.className = 'submit-btn';
            inputElement.textContent = 'Submit Form';
            fieldContainer.className = 'form-field';
            fieldContainer.appendChild(inputElement);
            break;
        default:
            return;
    }

    if (formPreview) {
        if (type === 'submit') {
            const existingSubmit = formPreview.querySelector('.submit-btn');
            if (existingSubmit) existingSubmit.closest('.form-field').remove();
            formPreview.appendChild(fieldContainer);
        } else {
            const submitButtonField = formPreview.querySelector('.submit-btn');
            if (submitButtonField) {
                formPreview.insertBefore(fieldContainer, submitButtonField.closest('.form-field'));
            } else {
                formPreview.appendChild(fieldContainer);
            }
        }
    }
}

window.exportForm = function(format) {
    if (!formPreview) return;
    const formElements = Array.from(formPreview.elements).filter(el => el.type !== 'submit');

    if (format === 'html') {
        const formHTML = `<form action="/api/submit-form" method="POST">\n` + formPreview.innerHTML.replace(/\s*class="form-field"/g, '').replace(/<button type="submit".*?>.*?<\/button>/s, '<button type="submit" class="submit-btn">Submit Form</button>').trim() + `\n</form>`;
        alert('Exported HTML:\n\n' + formHTML);
        console.log(formHTML);
    } else if (format === 'json') {
        const formJSON = formElements.map(el => ({
            type: el.type || el.tagName.toLowerCase(),
            name: el.name,
            label: el.closest('.form-field').querySelector('label') ? el.closest('.form-field').querySelector('label').textContent : 'No Label',
            placeholder: el.placeholder || ''
        }));
        alert('Exported JSON (for backend schema):\n\n' + JSON.stringify(formJSON, null, 2));
        console.log(formJSON);
    }
}

function setupFormBuilderSubmissionHandler() {
    if (formPreview) {
        formPreview.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(formPreview);
            const data = Object.fromEntries(formData.entries());

            console.log('Form data ready to submit:', data);
            const backendEndpoint = '/api/v1/forms/submit';

            try {
                // SIMULATING a successful backend response
                await new Promise(resolve => setTimeout(resolve, 1500));

                formPreview.reset();
                formPreview.style.display = 'none'; // Hide the form
                if (successMessage) successMessage.style.display = 'block'; // Show success message

                // Hide success message after a few seconds
                setTimeout(() => {
                    if (successMessage) successMessage.style.display = 'none';
                    formPreview.style.display = 'block'; // Show form again
                }, 5000);

            } catch (error) {
                console.error('Submission failed:', error);
                alert('Form submission failed. Check console for details.');
            }
        });
    }
}

// =========================================
// 4. PRICING PAGE LOGIC (from pricing.js)
// =========================================

function setupPricingToggle() {
    // Check if elements exist to run this logic
    const toggle = document.getElementById('pricing-toggle');
    if (!toggle) return; 

    const prices = document.querySelectorAll('.price');
    const periods = document.querySelectorAll('.period');
    const discount = document.querySelector('.discount');

    const monthlyPrices = ['$99', '$199', '$299'];
    const yearlyPrices = ['$990', '$1990', '$2990'];

    const updatePrices = () => {
        prices.forEach((price, index) => {
            price.textContent = toggle.checked ? yearlyPrices[index] : monthlyPrices[index];
        });

        periods.forEach(period => {
            period.textContent = toggle.checked ? '/year' : '/mo';
        });

        if (discount) discount.style.display = toggle.checked ? 'inline-block' : 'none';
    };

    toggle.addEventListener('change', updatePrices);
    updatePrices(); // Initial load check
}

function setupFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all other items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });

                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}