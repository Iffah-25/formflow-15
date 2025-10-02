// dashboard.js - UPDATED for Render Deployment

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Global Setup ---
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

    // --- 2. Security Check (Must run first) ---
    const token = verifyAuthToken();
    if (!token) return; // Redirect occurs in verifyAuthToken

    // --- 3. Initialize Functions ---
    setupTabSwitching(navItems, tabContents, titleElement, tabTitles);
    
    // --- 4. Initial Data Loading ---
    loadProfileInfo();
    loadDashboardStats(token); 
    loadCreatedForms(token);
});

// =========================================
// TAB SWITCHING LOGIC
// =========================================

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

    window.openCreateForm = () => switchTab('create', navItems, tabContents, titleElement, tabTitles);
    window.navigateToTemplates = () => window.location.href = 'template_library.html';
    window.shareDashboard = () => alert('Share functionality not yet implemented!');
    window.startPdfToForm = () => switchTab('pdf-to-form', navItems, tabContents, titleElement, tabTitles);

    switchTab('overview', navItems, tabContents, titleElement, tabTitles);
}

// =========================================
// SECURITY & USER INFO
// =========================================

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

// Logout handler
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    alert('You have been logged out.');
    window.location.href = 'SignUp_LogIn_Form.html'; 
});

// =========================================
// DYNAMIC CONTENT LOADING (API Interaction)
// =========================================

const API_BASE_URL = 'https://your-backend.onrender.com/api/v1';

async function loadDashboardStats(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) throw new Error('Auth Failed');
        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();
        
        document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-number').textContent = stats.totalForms;
        document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-number').textContent = stats.totalResponses;
        document.querySelector('.stats-grid .stat-card:nth-child(3) .stat-number').textContent = `$${stats.revenueGenerated.toFixed(2)}`;
    } catch (error) {
        handleAuthError(error);
        console.error('Error loading stats:', error);
    }
}

async function loadCreatedForms(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/forms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) throw new Error('Auth Failed');
        if (!response.ok) throw new Error('Failed to fetch forms');

        const forms = await response.json();
        const formListEl = document.querySelector('#tab-forms .form-list');
        formListEl.innerHTML = '';

        if (forms.length === 0) {
            formListEl.innerHTML = '<p style="text-align:center; padding:30px;">You haven\'t created any forms yet. Start building!</p>';
            return;
        }

        forms.forEach(form => {
            const statusClass = form.status === 'published' ? 'published' : 'draft';
            const responsesText = `Responses (${form.responses})`;
            const item = document.createElement('div');
            item.className = 'form-item';
            
            item.innerHTML = `
                <div class="form-details">
                    <i class='bx bx-${form.icon}'></i>
                    <span class="form-name">${form.name}</span>
                    <span class="form-status ${statusClass}">${capitalize(form.status)}</span>
                </div>
                <div class="form-actions">
                    <button class="action-icon"><i class='bx bx-link'></i> Link</button>
                    <button class="action-icon edit-btn" data-form-id="${form.id}"><i class='bx bx-pencil'></i> Edit</button>
                    <button class="action-icon view-responses-btn" data-form-id="${form.id}" ${form.responses === 0 ? 'disabled' : ''}>
                        <i class='bx bx-bar-chart-alt-2'></i> ${responsesText}
                    </button>
                </div>
            `;
            formListEl.appendChild(item);
        });

    } catch (error) {
        handleAuthError(error);
        console.error('Error loading forms:', error);
        document.querySelector('#tab-forms .form-list').innerHTML = '<p style="color:red; text-align:center; padding:30px;">Failed to load forms. Server error.</p>';
    }
}

// =========================================
// HELPER FUNCTIONS
// =========================================

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function handleAuthError(error) {
    if (error.message === 'Auth Failed') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        alert('Session expired or invalid token. Please log in again.');
        window.location.href = 'SignUp_LogIn_Form.html';
    }
}
