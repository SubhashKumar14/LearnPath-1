// Global variables
let currentUser = null;
let roadmaps = [];

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    checkAuthStatus();
    loadRoadmaps();
    setupEventListeners();

    if (!currentUser) {
        showPage('home-page');
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
        currentUser = JSON.parse(userData);
        updateUIForAuthenticatedUser();
    } else {
        updateUIForAnonymousUser();
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    document.getElementById('user-section').style.display = 'flex';
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('progress-nav').style.display = 'block';

    if (currentUser.role === 'admin') {
        document.getElementById('admin-nav').style.display = 'block';
    }

    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-avatar').textContent = currentUser.username.substring(0, 2).toUpperCase();
}

// Update UI for anonymous user
function updateUIForAnonymousUser() {
    document.getElementById('user-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('progress-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            currentUser = data.user;

            showAlert('Login successful!', 'success');
            updateUIForAuthenticatedUser();
            showPage('home-page');
        } else {
            showAlert(data.error || 'Login failed', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Account created successfully! Please log in.', 'success');
            showPage('login-page');
        } else {
            showAlert(data.error || 'Registration failed', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('An error occurred during registration', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Load roadmaps from API
async function loadRoadmaps() {
    try {
        const response = await fetch(`${API_BASE}/roadmaps`);
        const data = await response.json();

        if (response.ok) {
            roadmaps = data;
            displayRoadmaps(roadmaps);
            displayFeaturedRoadmaps(roadmaps.slice(0, 3));
        } else {
            console.error('Error loading roadmaps:', data.error);
        }
    } catch (error) {
        console.error('Error loading roadmaps:', error);
    }
}

// Display roadmaps
function displayRoadmaps(roadmapsData) {
    const container = document.getElementById('roadmaps-container');
    if (!container) return;

    container.innerHTML = '';

    roadmapsData.forEach(roadmap => {
        const difficulty = roadmap.difficulty || 'Beginner';
        const badgeClass = difficulty === 'Beginner' ? 'bg-success' : 
                          difficulty === 'Intermediate' ? 'bg-warning' : 'bg-info';

        const roadmapCard = `
            <div class="col-md-4 mb-4">
                <div class="card roadmap-card h-100 fade-in">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title fw-bold">${roadmap.title}</h5>
                            <span class="badge ${badgeClass}">${difficulty}</span>
                        </div>
                        <p class="card-text text-muted">${roadmap.description || 'No description available'}</p>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span><i class="far fa-clock me-1"></i> ${roadmap.duration || 30} days</span>
                            <span><i class="fas fa-tasks me-1"></i> ${roadmap.task_count || 0} tasks</span>
                        </div>
                    </div>
                    <div class="card-footer bg-white">
                        <button class="btn btn-primary w-100" onclick="viewRoadmap(${roadmap.id})">
                            ${currentUser ? 'Start Learning' : 'View Details'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML += roadmapCard;
    });
}

// Display featured roadmaps on home page
function displayFeaturedRoadmaps(roadmapsData) {
    const container = document.getElementById('featured-roadmaps');
    if (!container) return;

    container.innerHTML = '';

    roadmapsData.forEach(roadmap => {
        const difficulty = roadmap.difficulty || 'Beginner';
        const badgeClass = difficulty === 'Beginner' ? 'bg-success' : 
                          difficulty === 'Intermediate' ? 'bg-warning' : 'bg-info';

        const roadmapCard = `
            <div class="col-md-4 mb-4">
                <div class="card roadmap-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title fw-bold">${roadmap.title}</h5>
                            <span class="badge ${badgeClass}">${difficulty}</span>
                        </div>
                        <p class="card-text text-muted">${roadmap.description || 'No description available'}</p>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span><i class="far fa-clock me-1"></i> ${roadmap.duration || 30} days</span>
                            <span><i class="fas fa-tasks me-1"></i> ${roadmap.task_count || 0} tasks</span>
                        </div>
                    </div>
                    <div class="card-footer bg-white">
                        <button class="btn btn-primary w-100" onclick="viewRoadmap(${roadmap.id})">Learn More</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML += roadmapCard;
    });
}

// View roadmap details
function viewRoadmap(roadmapId) {
    if (!currentUser) {
        showAlert('Please log in to view roadmap details', 'warning');
        showPage('login-page');
        return;
    }

    showAlert('Roadmap details feature coming soon!', 'info');
}

// Create roadmap (admin function)
function createRoadmap() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('Admin access required', 'danger');
        return;
    }

    showAlert('Create roadmap feature coming soon!', 'info');
}

// Show page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(pageId)) {
            link.classList.add('active');
        }
    });
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        currentUser = null;
        updateUIForAnonymousUser();
        showPage('home-page');
        showAlert('Logged out successfully!', 'success');
    }
}

// Show alert
function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}