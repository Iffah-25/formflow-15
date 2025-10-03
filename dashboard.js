document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const titleElement = document.getElementById('current-tab-title');

    const tabTitles = {
        'overview': 'Dashboard Overview',
        'create': 'Create New Form',
        'forms': 'Your Created Forms',
        'responses': 'Form Responses',
        'templates': 'Template Library',
        'profile': 'User Profile & Settings',
        'pdf-to-form': 'PDF to Form Converter'
    };

    const token = verifyAuthToken();
    if (!token) return;

    setupTabSwitching(navItems, tabContents, titleElement, tabTitles);
    loadProfileInfo();
    loadDashboardStats(token); 
    loadCreatedForms(token);
});

function switchTab(tabName, navItems, tabContents, titleElement, tabTitles) {
    navItems.forEach(item => item.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    const activeNavItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tab-${tabName}`);

    if (activeNavItem && activeContent) {
        activeNavItem.classList.add('active');
        activeContent.classList.add('active');
        titleElement.textContent = tabTitles[tabName] || 'Dashboard';
    }

    if (tabName === 'templates') {
        window.location.href = 'template_library.html';
    }
}

function setupTabSwitching(navItems, tabContents, titleElement, tabTitles) {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); 
            const tab = item.getAttribute('data-tab');
            
            if (item.href && item.href.includes('template_library.html')) {
                window.location.href = 'template_library.html';
            } else {
                switchTab(tab, navItems, tabContents, titleElement, tabTitles);
            }
        });
    });
    
    window.openCreateForm = () => showCreateFormModal();
    window.navigateToTemplates = () => {
        window.location.href = 'template_library.html';
    };
    window.shareDashboard = () => alert('Share functionality not yet implemented!');
    window.startPdfToForm = () => switchTab('pdf-to-form', navItems, tabContents, titleElement, tabTitles);

    switchTab('overview', navItems, tabContents, titleElement, tabTitles);
}

function verifyAuthToken() {
    const token = localStorage.getItem('authToken');
    if (!token || token.length < 10) { 
        alert('Access denied. Please log in first.');
        window.location.href = 'SignUp_LogIn_Form.html'; 
        return false;
    }
    return token;
}

function loadProfileInfo() {
    const username = localStorage.getItem('username') || 'Guest User';
    const displayNameEl = document.getElementById('user-display-name');
    const profileUsernameEl = document.getElementById('profile-username');
    
    if (displayNameEl) displayNameEl.textContent = username;
    if (profileUsernameEl) profileUsernameEl.textContent = username.toLowerCase().replace(/\s/g, '_');
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    alert('You have been logged out.');
    window.location.href = 'SignUp_LogIn_Form.html'; 
});

async function loadDashboardStats(token) {
    try {
        const response = await fetch('/api/v1/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) throw new Error('Auth Failed');
        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();
        
        document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-number').textContent = stats.totalForms;
        document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-number').textContent = stats.totalResponses;
        document.querySelector('.stats-grid .stat-card:nth-child(3) .stat-number').textContent = `$${stats.revenueGenerated.toFixed(2)}`;

    } catch (error) {
        if (error.message === 'Auth Failed') {
             localStorage.removeItem('authToken');
             localStorage.removeItem('username');
             window.location.href = 'SignUp_LogIn_Form.html';
        }
        console.error('Error loading stats:', error);
    }
}

async function loadCreatedForms(token) {
    try {
        const response = await fetch('/api/v1/dashboard/forms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) throw new Error('Auth Failed');
        if (!response.ok) throw new Error('Failed to fetch forms');

        const forms = await response.json();
        const formListEl = document.querySelector('#tab-forms .form-list');
        formListEl.innerHTML = '';

        if (forms.length === 0) {
            formListEl.innerHTML = '<p style="text-align: center; padding: 30px;">You haven\'t created any forms yet. Start building!</p>';
            return;
        }

        forms.forEach(form => {
            const statusClass = form.status === 'published' ? 'published' : 'draft';
            const item = document.createElement('div');
            item.className = 'form-item';
            
            const shareUrl = `${window.location.origin}/form/${form.formId}`;
            
            item.innerHTML = `
                <div class="form-details">
                    <i class='bx bx-${form.icon}'></i>
                    <span class="form-name">${form.name}</span>
                    <span class="form-status ${statusClass}">${form.status.charAt(0).toUpperCase() + form.status.slice(1)}</span>
                </div>
                <div class="form-actions">
                    ${form.status === 'published' ? 
                        `<button class="action-icon" onclick="copyFormLink('${shareUrl}')"><i class='bx bx-link'></i> Link</button>` :
                        `<button class="action-icon" onclick="publishForm('${form.formId}')"><i class='bx bx-upload'></i> Publish</button>`
                    }
                    <button class="action-icon view-responses-btn" onclick="viewResponses('${form.formId}')" ${form.responses === 0 ? 'disabled' : ''}>
                        <i class='bx bx-bar-chart-alt-2'></i> Responses (${form.responses})
                    </button>
                </div>
            `;
            formListEl.appendChild(item);
        });

    } catch (error) {
        if (error.message === 'Auth Failed') {
             localStorage.removeItem('authToken');
             localStorage.removeItem('username');
             window.location.href = 'SignUp_LogIn_Form.html';
        }
        console.error('Error loading forms:', error);
        document.querySelector('#tab-forms .form-list').innerHTML = '<p style="color: red; text-align: center; padding: 30px;">Failed to load forms. Server error.</p>';
    }
}

function showCreateFormModal() {
    // Open the existing form builder modal
    if (window.openFormBuilder) {
        window.openFormBuilder('scratch');
    } else {
        // Fallback to simple prompt
        const formName = prompt('Enter form name:');
        if (!formName) return;
        
        const formDescription = prompt('Enter form description (optional):');
        
        createNewForm(formName, formDescription);
    }
}

// Enhanced form builder integration
window.saveFormToBackend = async function(formName, formFields) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/v1/forms/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formName,
                description: '',
                fields: formFields,
                icon: 'file-blank'
            })
        });
        
        if (!response.ok) throw new Error('Failed to create form');
        
        const result = await response.json();
        
        alert(`Form created successfully!\nShare URL: ${result.shareUrl}`);
        
        // Reload forms list
        loadCreatedForms(token);
        
        return result;
        
    } catch (error) {
        console.error('Error creating form:', error);
        alert('Failed to create form. Please try again.');
        return null;
    }
}

async function createNewForm(name, description) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/v1/forms/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description: description || '',
                fields: [],
                icon: 'file-blank'
            })
        });
        
        if (!response.ok) throw new Error('Failed to create form');
        
        const result = await response.json();
        
        alert(`Form created successfully!\nShare URL: ${result.shareUrl}`);
        loadCreatedForms(token);
        
    } catch (error) {
        console.error('Error creating form:', error);
        alert('Failed to create form. Please try again.');
    }
}

async function publishForm(formId) {
    const token = localStorage.getItem('authToken');
    
    if (!confirm('Are you sure you want to publish this form? It will be accessible via a public link.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/v1/forms/${formId}/publish`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to publish form');
        
        const result = await response.json();
        
        alert(`Form published successfully!\nShare URL: ${result.shareUrl}`);
        loadCreatedForms(token);
        
    } catch (error) {
        console.error('Error publishing form:', error);
        alert('Failed to publish form. Please try again.');
    }
}

window.copyFormLink = function(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    }).catch(() => {
        prompt('Copy this link:', url);
    });
}

window.viewResponses = async function(formId) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`/api/v1/forms/${formId}/responses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch responses');
        
        const data = await response.json();
        
        displayResponses(data);
        
    } catch (error) {
        console.error('Error fetching responses:', error);
        alert('Failed to load responses. Please try again.');
    }
}

function displayResponses(data) {
    const responseTab = document.getElementById('tab-responses');
    const responsesContainer = responseTab.querySelector('.data-summary-grid') || document.createElement('div');
    responsesContainer.className = 'data-summary-grid';
    
    responsesContainer.innerHTML = `
        <div class="summary-card">
            <h3>${data.formName}</h3>
            <p>Total Responses: ${data.totalResponses}</p>
        </div>
        <div class="summary-card">
            <h3>Recent Responses</h3>
            <div class="response-list">
                ${data.responses.slice(0, 10).map(r => `
                    <div class="response-item">
                        <p><strong>Submitted:</strong> ${new Date(r.submittedAt).toLocaleString()}</p>
                        <pre>${JSON.stringify(r.data, null, 2)}</pre>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    if (!responseTab.querySelector('.data-summary-grid')) {
        responseTab.appendChild(responsesContainer);
    }
    
    document.querySelector('.nav-item[data-tab="responses"]').click();
}