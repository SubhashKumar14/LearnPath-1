// Enhanced API client with better error handling (added per key changes)
class ApiClient {
    constructor() {
        this.baseURL = '/api';
        this.timeout = 10000;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('authToken');

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            timeout: this.timeout
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...(options.headers || {}) }
        };

        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get(endpoint) { return this.request(endpoint); }
    post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
    put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

const api = new ApiClient();

// Enhanced Admin Manager with basic dashboard loading (scaffold)
class AdminManager {
    constructor() {
        this.currentEditingRoadmap = null;
        this.stats = null;
        this.roadmaps = [];
    }

    async loadDashboard() {
        try {
            const [stats, roadmaps] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/roadmaps')
            ]);
            this.stats = stats;
            this.roadmaps = roadmaps;
            this.displayStats(stats);
            this.displayAdminRoadmaps(roadmaps);
        } catch (error) {
            console.error('Admin dashboard load error:', error);
            showNotification('Failed to load admin dashboard', 'danger');
        }
    }

    displayStats(stats) {
        const statElements = {
            'stat-users': stats.total_users || 0,
            'stat-roadmaps': stats.total_roadmaps || 0,
            'stat-courses': stats.total_courses || 0,
            'stat-tasks': stats.total_tasks || 0,
            'stat-certificates': stats.certificates_issued || 0,
            'stat-badges': stats.badges_issued || 0
        };
        Object.entries(statElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    // Placeholder; integrate with existing admin rendering if desired
    displayAdminRoadmaps(roadmaps) {
        // Re-use existing adminReloadRoadmaps logic elsewhere
        // This method can be expanded to render roadmaps in an admin-specific panel.
    }
}

const adminManager = new AdminManager();

// Provide showNotification alias if only showAlert exists
if (typeof window.showNotification === 'undefined') {
    window.showNotification = function(msg, type) {
        if (typeof showAlert === 'function') return showAlert(msg, type);
        console.log(`[${type}] ${msg}`);
    };
}

// Global variables
let currentUser = null;
let currentRoadmap = null;
let currentCourse = null;
let roadmaps = [];
let userProgress = {};

// Function to reset completion flags (for testing)
function resetCompletionFlags() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('roadmap_completed_') || key.startsWith('course_completed_')) {
            localStorage.removeItem(key);
        }
    });
    console.log('Completion flags reset - you can now trigger completion modals again');
    showAlert('Completion flags reset! You can now retrigger completion modals.', 'info');
}

// Make reset function available globally for testing
window.resetCompletionFlags = resetCompletionFlags;

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    checkAuthStatus();
    setupEventListeners();
    // Always load roadmaps for public viewing
    loadRoadmaps();
    if (!currentUser) {
        showPage('home-page');
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUIForAuthenticatedUser();
            validateToken();
        } catch (e) {
            console.error('User data parse error', e);
            logout();
        }
    } else {
        updateUIForAnonymousUser();
    }
}

// Validate token
async function validateToken() {
    try {
        const res = await fetch(`${API_BASE}/profile`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }});
        if (!res.ok) logout();
    } catch (e) { logout(); }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    document.getElementById('user-section').style.display = 'flex';
    document.getElementById('auth-section').style.display = 'none';
    
    if (currentUser.role === 'admin' && currentUser.email === 'admin@learnpath.com') {
        // Admin user: show only admin dashboard, hide learning navigation
        document.getElementById('admin-nav').style.display = 'block';
        document.getElementById('progress-nav').style.display = 'none';
        // Hide roadmaps and courses nav items for admin
        const navItems = document.querySelectorAll('#main-nav .nav-item');
        navItems.forEach(item => {
            const link = item.querySelector('.nav-link');
            if (link && (link.textContent.includes('Roadmaps') || link.textContent.includes('Courses') || link.textContent.includes('My Progress'))) {
                item.style.display = 'none';
            }
        });
    } else {
        // Regular user: show learning navigation, hide admin
        document.getElementById('progress-nav').style.display = 'block';
        document.getElementById('admin-nav').style.display = 'none';
        // Show all nav items for regular users
        const navItems = document.querySelectorAll('#main-nav .nav-item');
        navItems.forEach(item => {
            item.style.display = 'block';
        });
    }
    
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-avatar').textContent = getUserInitials(currentUser.username);
}

// Update UI for anonymous user
function updateUIForAnonymousUser() {
    // Hide all authenticated-only UI elements
    const userSection = document.getElementById('user-section');
    if (userSection) userSection.style.display = 'none';
    const authSection = document.getElementById('auth-section');
    if (authSection) authSection.style.display = 'block';
    const progressNav = document.getElementById('progress-nav');
    if (progressNav) progressNav.style.display = 'none';
    const adminNav = document.getElementById('admin-nav');
    if (adminNav) adminNav.style.display = 'none';

    // Clear any residual user specific text / avatar so no placeholder like JD shows
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) userNameEl.textContent = '';
    const userAvatarEl = document.getElementById('user-avatar');
    if (userAvatarEl) userAvatarEl.textContent = '';

    // Close any admin editor panels if left open
    const adminEditor = document.getElementById('admin-editor');
    if (adminEditor) adminEditor.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    const profileForm = document.getElementById('profile-form');
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', filterRoadmaps);
    const difficultyFilter = document.getElementById('difficulty-filter');
    if (difficultyFilter) difficultyFilter.addEventListener('change', filterRoadmaps);
    
    // Admin form listeners
    const createRoadmapForm = document.getElementById('create-roadmap-form');
    if (createRoadmapForm) createRoadmapForm.addEventListener('submit', handleCreateRoadmap);
    const createModuleForm = document.getElementById('create-module-form');
    if (createModuleForm) createModuleForm.addEventListener('submit', handleCreateModule);
    const createTaskForm = document.getElementById('create-task-form');
    if (createTaskForm) createTaskForm.addEventListener('submit', handleCreateTask);
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
        const data = await api.post('/login', { email, password });

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        currentUser = data.user;

        showAlert('Login successful! Welcome back!', 'success');
        updateUIForAuthenticatedUser();
        showPage('home-page');
        document.getElementById('login-form').reset();
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'An error occurred during login', 'danger');
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
        await api.post('/register', { username, email, password });

        showAlert('Account created successfully! Please log in.', 'success');
        showPage('login-page');
        document.getElementById('login-email').value = email;
        document.getElementById('register-form').reset();
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(error.message || 'An error occurred during registration', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle profile update
async function handleProfileUpdate(e){
    e.preventDefault();
    if(!currentUser) return showAlert('Login first','warning');
    const username = document.getElementById('profile-username').value;
    const email = document.getElementById('profile-email').value;
    const password = document.getElementById('profile-password').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...'; btn.disabled = true;
    try {
        const payload = { username, email };
        if (password && password.trim()) {
            payload.password = password;
        }
        const data = await api.put('/profile', payload);
        
        currentUser.username = username; 
        currentUser.email = email; 
        localStorage.setItem('userData', JSON.stringify(currentUser)); 
        updateUIForAuthenticatedUser(); 
        loadProfileData(); 
        showAlert(data.message || 'Profile updated successfully!', 'success'); 
        document.getElementById('profile-password').value=''; 
    } catch(err){ 
        console.error('Profile update error:', err); 
        showAlert(err.message || 'Profile update failed', 'danger'); 
    } finally { 
        btn.innerHTML=orig; 
        btn.disabled=false; 
    }
}

// Load profile data
// Enhanced profile loading function with role-based content
// Add a flag to prevent multiple simultaneous loads
let isLoadingProfile = false;

async function loadProfileData() {
    if (!currentUser || isLoadingProfile) return;
    
    isLoadingProfile = true;
    try {
        const response = await api.get('/profile');
        const profile = response;
        
        // Update basic profile information
        updateProfileBasics(profile);
        
        // Load role-specific content
        if (profile.role === 'admin' && profile.email === 'admin@learnpath.com') {
            await loadAdminProfile(profile);
        } else {
            await loadUserProfile(profile);
        }
        
    } catch (error) {
        console.error('Profile load error:', error);
        showNotification('Failed to load profile data', 'danger');
    } finally {
        isLoadingProfile = false;
    }
}

// Update basic profile information shared by all roles
function updateProfileBasics(profile) {
    const elements = {
        'profile-name': profile.username || 'Unknown User',
        'profile-email': profile.email || 'No email',
        'profile-role': (profile.role === 'admin' && profile.email === 'admin@learnpath.com') ? 'Administrator' : 'User',
        'profile-edit-username': profile.username || '',
        'profile-edit-email': profile.email || ''
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    });
    
    // Update profile avatar with initials
    const avatarElement = document.getElementById('profile-avatar');
    if (avatarElement && profile.username) {
        const initials = getUserInitials(profile.username);
        avatarElement.innerHTML = `<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 80px; height: 80px; font-size: 24px;">${initials}</div>`;
    }
    
    // Update membership info
    const memberSince = document.getElementById('profile-member-since');
    const lastLogin = document.getElementById('profile-last-login');
    
    if (memberSince && profile.created_at) {
        memberSince.textContent = new Date(profile.created_at).toLocaleDateString();
    }
    
    if (lastLogin && profile.last_login) {
        lastLogin.textContent = new Date(profile.last_login).toLocaleDateString();
    }
    
    // Update role badge styling
    const roleBadge = document.getElementById('profile-role');
    if (roleBadge) {
        roleBadge.className = `badge ${(profile.role === 'admin' && profile.email === 'admin@learnpath.com') ? 'bg-danger' : 'bg-primary'} me-2`;
    }
}

// Load user-specific profile content
async function loadUserProfile(profile) {
    // Show user content, hide admin content
    const userContent = document.getElementById('user-profile-content');
    const adminContent = document.getElementById('admin-profile-content');
    
    if (userContent) userContent.style.display = 'block';
    if (adminContent) adminContent.style.display = 'none';
    
    try {
        // Load user statistics
        await loadUserStats();
        
        // Load learning roadmaps
        await loadUserRoadmaps();
        
        // Load achievements and badges
        await loadUserAchievements();
        
        // Load certificates
        await loadUserCertificates();
        
        // Load recent activity
        await loadUserActivity();
        
    } catch (error) {
        console.error('Error loading user profile data:', error);
    }
}

// Load admin-specific profile content
async function loadAdminProfile(profile) {
    // Only show admin content for admin@learnpath.com
    if (profile.email !== 'admin@learnpath.com') {
        await loadUserProfile(profile);
        return;
    }
    
    // Show admin content, hide user content
    const userContent = document.getElementById('user-profile-content');
    const adminContent = document.getElementById('admin-profile-content');
    
    if (userContent) userContent.style.display = 'none';
    if (adminContent) adminContent.style.display = 'block';
    
    try {
        // Load admin statistics
        await loadAdminStats();
        
        // Load admin activity
        await loadAdminActivity();
        
    } catch (error) {
        console.error('Error loading admin profile data:', error);
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        const stats = await api.get('/user/stats');
        
        const statElements = {
            'profile-roadmaps-started': stats.roadmaps_started || 0,
            'profile-roadmaps-completed': stats.roadmaps_completed || 0,
            'profile-tasks-completed': stats.tasks_completed || 0,
            'profile-badges-earned': stats.badges_earned || 0
        };
        
        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Update progress bars
        const overallProgress = stats.overall_progress || 0;
        const weekProgress = stats.week_progress || 0;
        
        updateProgressBar('overall-progress-bar', 'overall-progress-percent', overallProgress);
        updateProgressBar('week-progress-bar', 'week-progress-percent', weekProgress);
        
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Load user learning roadmaps
async function loadUserRoadmaps() {
    try {
        const roadmaps = await api.get('/user/roadmaps');
        const container = document.getElementById('learning-roadmaps');
        
        if (!container) return;
        
        if (!roadmaps || roadmaps.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-road fa-2x mb-3"></i>
                    <p>No learning roadmaps yet</p>
                    <a href="#" onclick="showPage('roadmaps-page')" class="btn btn-primary btn-sm">Browse Roadmaps</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = roadmaps.map(roadmap => `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${roadmap.title}</h6>
                    <span class="badge ${roadmap.progress >= 100 ? 'bg-success' : 'bg-primary'}">${roadmap.progress}%</span>
                </div>
                <div class="progress mb-2" style="height: 6px;">
                    <div class="progress-bar" style="width: ${roadmap.progress}%"></div>
                </div>
                <small class="text-muted">${roadmap.modules_completed}/${roadmap.total_modules} modules completed</small>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading user roadmaps:', error);
        document.getElementById('learning-roadmaps').innerHTML = '<p class="text-danger">Failed to load roadmaps</p>';
    }
}

// Load user achievements and badges
async function loadUserAchievements() {
    try {
        const achievements = await api.get('/user/achievements');
        const container = document.getElementById('achievements-section');
        
        if (!container) return;
        
        if (!achievements || achievements.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-medal fa-2x mb-3"></i>
                    <p>No achievements yet</p>
                    <small>Complete roadmaps to earn badges!</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="row">
                ${achievements.map(achievement => `
                    <div class="col-6 col-md-4 text-center mb-3">
                        <div class="achievement-badge">
                            <i class="fas ${achievement.icon || 'fa-trophy'} fa-2x text-warning mb-2"></i>
                            <div class="small fw-bold">${achievement.name}</div>
                            <div class="small text-muted">${achievement.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading achievements:', error);
        document.getElementById('achievements-section').innerHTML = '<p class="text-danger">Failed to load achievements</p>';
    }
}

// Load user certificates
async function loadUserCertificates() {
    try {
        const certificates = await api.get('/user/certificates');
        const container = document.getElementById('certificates-section');
        
        if (!container) return;
        
        if (!certificates || certificates.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-certificate fa-2x mb-3"></i>
                    <p>No certificates yet</p>
                    <small>Complete roadmaps to earn certificates!</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = certificates.map(cert => `
            <div class="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
                <div>
                    <div class="fw-bold">${cert.roadmap_title}</div>
                    <small class="text-muted">Completed: ${new Date(cert.completed_at).toLocaleDateString()}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="downloadCertificate(${cert.id})">
                        <i class="fas fa-download me-1"></i>Download
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading certificates:', error);
        document.getElementById('certificates-section').innerHTML = '<p class="text-danger">Failed to load certificates</p>';
    }
}

// Load user recent activity
async function loadUserActivity() {
    try {
        const activities = await api.get('/user/activity');
        const container = document.getElementById('recent-activity');
        
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-clock fa-2x mb-3"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="d-flex mb-3">
                <div class="flex-shrink-0">
                    <i class="fas ${activity.icon || 'fa-check-circle'} text-success me-3"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="small fw-bold">${activity.title}</div>
                    <div class="small text-muted">${activity.description}</div>
                    <div class="small text-muted">${new Date(activity.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading user activity:', error);
        document.getElementById('recent-activity').innerHTML = '<p class="text-danger">Failed to load activity</p>';
    }
}

// Load admin statistics
async function loadAdminStats() {
    try {
        // Throttle rapid repeat calls
        const now = Date.now();
        if (window.__lastAdminStatsFetch && now - window.__lastAdminStatsFetch < 5000) {
            // console.debug('Skipping admin stats fetch (throttled)');
            return;
        }
        window.__lastAdminStatsFetch = now;

        const stats = await api.get('/admin/stats');
        
        const statElements = {
            'admin-total-users': stats.total_users || 0,
            'admin-active-users': stats.active_users || 0,
            'admin-total-roadmaps': stats.total_roadmaps || 0,
            'admin-total-modules': stats.total_modules || 0,
            'admin-total-tasks': stats.total_tasks || 0,
            'admin-certificates-issued': stats.certificates_issued || 0
        };
        
        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

// Load admin activity log
async function loadAdminActivity() {
    try {
        // Throttle repeat calls
        const now = Date.now();
        if (window.__lastAdminActivityFetch && now - window.__lastAdminActivityFetch < 5000) {
            // console.debug('Skipping admin activity fetch (throttled)');
            return;
        }
        window.__lastAdminActivityFetch = now;

        const activities = await api.get('/admin/activity');
        const container = document.getElementById('admin-activity');
        
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-list-alt fa-2x mb-3"></i>
                    <p>No recent admin activity</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="d-flex justify-content-between align-items-center mb-3 p-3 border rounded">
                <div>
                    <div class="fw-bold">${activity.action}</div>
                    <div class="text-muted small">${activity.description}</div>
                    <div class="text-muted small">by ${activity.admin_name}</div>
                </div>
                <div class="text-muted small">
                    ${new Date(activity.created_at).toLocaleDateString()}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading admin activity:', error);
        document.getElementById('admin-activity').innerHTML = '<p class="text-danger">Failed to load activity</p>';
    }
}

// Helper function to update progress bars
function updateProgressBar(barId, percentId, value) {
    const bar = document.getElementById(barId);
    const percent = document.getElementById(percentId);
    
    if (bar) bar.style.width = `${value}%`;
    if (percent) percent.textContent = `${value}%`;
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
    if(!roadmapsData.length){ container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No roadmaps found.</p></div>'; return; }
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

// Filter roadmaps
function filterRoadmaps(){
    const term = document.getElementById('search-input')?.value.toLowerCase()||'';
    const diff = document.getElementById('difficulty-filter')?.value||'All Difficulties';
    const filtered = roadmaps.filter(r=> (r.title.toLowerCase().includes(term) || (r.description||'').toLowerCase().includes(term)) && (diff==='All Difficulties' || r.difficulty===diff));
    displayRoadmaps(filtered);
}

// View roadmap details
async function viewRoadmap(roadmapId){
    try { const res = await fetch(`${API_BASE}/roadmaps/${roadmapId}`); const data = await res.json(); if(res.ok){ currentRoadmap = data; if(currentUser){ await loadRoadmapProgress(roadmapId);} displayRoadmapDetails(data); showPage('roadmap-detail-page'); } else { showAlert('Error loading roadmap details','danger'); } } catch(e){ console.error(e); showAlert('Connection error loading roadmap','danger'); }
}

async function loadRoadmapProgress(roadmapId){ if(!currentUser) return; try { const res = await fetch(`${API_BASE}/roadmaps/${roadmapId}/progress`,{headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}`}}); if(res.ok){ userProgress[currentUser.id] = await res.json(); } } catch(e){ console.error('Progress load error',e);} }

function displayRoadmapDetails(roadmap){
    document.getElementById('roadmap-detail-title').textContent = roadmap.title;
    document.getElementById('roadmap-detail-description').textContent = roadmap.description || 'No description available';
    document.getElementById('roadmap-detail-difficulty').textContent = roadmap.difficulty || 'Beginner';
    document.getElementById('roadmap-detail-duration').textContent = roadmap.duration || 30;
    document.getElementById('roadmap-breadcrumb').textContent = roadmap.title;
    // count tasks
    let totalTasks=0, completedTasks=0; (roadmap.modules||[]).forEach(m=>{ (m.tasks||[]).forEach(t=>{ totalTasks++; if(currentUser && userProgress[currentUser.id] && userProgress[currentUser.id][t.id]) completedTasks++; }); });
    document.getElementById('roadmap-detail-task-count').textContent = totalTasks;
    const pct = totalTasks? Math.round((completedTasks/totalTasks)*100):0;
    document.getElementById('roadmap-progress-bar').style.width = pct+'%';
    document.getElementById('roadmap-progress-text').textContent = pct+'% Complete';
    displayRoadmapModules(roadmap.modules||[]);
    const startBtn = document.getElementById('start-roadmap-btn');
    if(!currentUser){ startBtn.textContent='Login to Start'; startBtn.onclick=()=>showPage('login-page'); } else if(completedTasks>0){ startBtn.textContent='Continue Learning'; startBtn.onclick=()=>startRoadmap(); } else { startBtn.textContent='Start Learning'; startBtn.onclick=()=>startRoadmap(); }
}

function displayRoadmapModules(modules){ const container = document.getElementById('roadmap-modules'); if(!container) return; if(!modules.length){ container.innerHTML='<div class="text-center text-muted py-5"><i class="fas fa-puzzle-piece fa-2x mb-3"></i><p>No modules available.</p></div>'; return; } container.innerHTML = modules.map((m,i)=>`<div class="card mb-4"><div class="card-header"><h5 class="fw-bold mb-0"><span class="module-number me-2">${i+1}</span>${m.title}</h5></div><div class="card-body"><div class="tasks-list">${(m.tasks||[]).map(t=>{ const done = currentUser && userProgress[currentUser.id] && userProgress[currentUser.id][t.id]; return `<div class='task-item d-flex align-items-start gap-2 py-2 border-bottom ${done?'task-completed':''}'><div><input type='checkbox' class='form-check-input' id='task-${t.id}' ${done?'checked':''} ${currentUser?`onchange="updateTaskProgress(${t.id}, this.checked)"`:'disabled'}></div><div class='flex-grow-1'><label for='task-${t.id}' class='form-check-label fw-medium'>${t.title}</label>${t.description?`<small class='d-block text-muted'>${t.description}</small>`:''}${t.resource_url?`<a href='${t.resource_url}' target='_blank' class='btn btn-sm btn-outline-primary mt-1'><i class='fas fa-external-link-alt me-1'></i>Resource</a>`:''}</div></div>`; }).join('') || '<p class="text-muted">No tasks.</p>'}</div></div></div>`).join(''); }

async function updateTaskProgress(taskId, completed) {
    if(!currentUser){
        showAlert('Login to track progress','warning');
        return;
    }

    try { 
        // Get the checkbox element
        const checkbox = document.getElementById(`task-${taskId}`);
        const originalState = checkbox ? checkbox.checked : false;

        // Optimistically update UI
        if (checkbox) {
            checkbox.checked = completed;
            updateTaskDisplayState(taskId, completed);
        }

        const res = await fetch(`${API_BASE}/progress/task`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'Authorization':`Bearer ${localStorage.getItem('authToken')}`
            },
            body:JSON.stringify({taskId, completed})
        }); 

        if(res.ok){ 
            const data = await res.json();

            // Update user progress cache
            if(!userProgress[currentUser.id]) userProgress[currentUser.id] = {}; 
            if(completed) {
                userProgress[currentUser.id][taskId] = true; 
            } else {
                userProgress[currentUser.id][taskId] = false;
            }

            // Refresh roadmap display to show updated progress
            if(currentRoadmap) displayRoadmapDetails(currentRoadmap); 

            showAlert(completed ? 'Task completed! 🎉' : 'Task marked incomplete','success'); 

            // Check if roadmap just completed for the first time
            if(data.roadmapCompleted){
                const completionKey = `roadmap_completed_${currentRoadmap.id}_${currentUser.id}`;
                const alreadyCompleted = localStorage.getItem(completionKey);

                if (!alreadyCompleted) {
                    // First time completion - show modal and set flag
                    localStorage.setItem(completionKey, 'true');
                    showRoadmapCompletionModal();
                }
            }
        } else { 
            // Revert UI on error
            if (checkbox) {
                checkbox.checked = originalState;
                updateTaskDisplayState(taskId, originalState);
            }

            const data = await res.json(); 
            showAlert(data.error || 'Error updating progress','danger'); 
        } 
    } catch(e){ 
        console.error(e); 
        showAlert('Connection error','danger'); 

        // Revert UI on error
        const checkbox = document.getElementById(`task-${taskId}`); 
        if(checkbox) {
            checkbox.checked = !completed;
            updateTaskDisplayState(taskId, !completed);
        }
    } 
}

// Helper function to update task display state
function updateTaskDisplayState(taskId, completed) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskItem) {
        if (completed) {
            taskItem.classList.add('task-completed');
        } else {
            taskItem.classList.remove('task-completed');
        }
    }
}

async function startRoadmap(){ if(!currentUser) { showAlert('Login first','warning'); return;} if(!currentRoadmap){ showAlert('No roadmap selected','danger'); return;} try { const res = await fetch(`${API_BASE}/roadmaps/${currentRoadmap.id}/start`,{method:'POST',headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}`}}); if(res.ok){ showAlert('Roadmap started!','success'); const btn=document.getElementById('start-roadmap-btn'); if(btn) btn.textContent='Continue Learning'; } else { const data = await res.json(); showAlert(data.error||'Error starting roadmap','danger'); } } catch(e){ showAlert('Connection error','danger'); }}

// Create roadmap (admin function)
async function createRoadmap(){ if(!currentUser||currentUser.role!=='admin') return showAlert('Admin access required','danger'); showAlert('Admin creation UI not implemented yet','info'); }

// ---------------- Admin Functions ----------------
let adminEditingRoadmapId = null;

function adminShowCreateRoadmap(){ if(!adminCheck()) return; adminEditingRoadmapId=null; document.getElementById('admin-editor-title').textContent='Create Roadmap'; document.getElementById('admin-roadmap-form').reset(); document.getElementById('admin-editor').style.display='block'; document.getElementById('admin-modules').innerHTML=''; }
function adminCloseEditor(){ document.getElementById('admin-editor').style.display='none'; }
function adminCheck(){ if(!currentUser||currentUser.role!=='admin'||currentUser.email!=='admin@learnpath.com'){ showAlert('Admin access restricted','danger'); return false;} return true; }
async function adminReloadRoadmaps(){ if(!adminCheck()) return; const res = await fetch(`${API_BASE}/roadmaps`); const data = await res.json(); const container=document.getElementById('admin-roadmaps-list'); if(!container) { console.error('admin-roadmaps-list element not found'); return; } container.innerHTML=''; data.forEach(r=>{ container.innerHTML += `<div class='col-md-4'><div class="card h-100"><div class="card-body"><h6 class='fw-bold mb-1'>${r.title}</h6><small class='text-muted d-block mb-2'>${r.difficulty||'Beginner'} • ${r.task_count||0} tasks</small><div class='d-flex gap-2'><button class='btn btn-sm btn-outline-primary' onclick='adminEditRoadmap(${r.id})'><i class="fas fa-edit"></i></button><button class='btn btn-sm btn-outline-danger' onclick='adminDeleteRoadmap(${r.id})'><i class="fas fa-trash"></i></button></div></div></div></div>`; }); }
async function adminEditRoadmap(id){ if(!adminCheck()) return; const res = await fetch(`${API_BASE}/roadmaps/${id}`); if(!res.ok) return showAlert('Error loading roadmap','danger'); const rm = await res.json(); adminEditingRoadmapId=id; document.getElementById('admin-roadmap-title').value=rm.title; document.getElementById('admin-roadmap-description').value=rm.description||''; document.getElementById('admin-roadmap-difficulty').value=rm.difficulty||'Beginner'; document.getElementById('admin-roadmap-duration').value=rm.duration||30; document.getElementById('admin-editor-title').textContent='Edit Roadmap'; document.getElementById('admin-editor').style.display='block'; adminRenderModules(rm.modules||[]); }
async function adminDeleteRoadmap(id){ if(!adminCheck()) return; if(!confirm('Delete this roadmap?')) return; const res = await fetch(`${API_BASE}/roadmaps/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}`}}); if(res.ok){ showAlert('Roadmap deleted','success'); adminReloadRoadmaps(); } else { showAlert('Delete failed','danger'); } }
document.addEventListener('submit', e=>{ if(e.target && e.target.id==='admin-roadmap-form'){ e.preventDefault(); adminSaveRoadmap(); }});
async function adminSaveRoadmap(){ if(!adminCheck()) return; const title=document.getElementById('admin-roadmap-title').value.trim(); const description=document.getElementById('admin-roadmap-description').value.trim(); const difficulty=document.getElementById('admin-roadmap-difficulty').value; const duration=parseInt(document.getElementById('admin-roadmap-duration').value)||30; if(!title||!description) return showAlert('Title & description required','warning'); const body=JSON.stringify({title,description,difficulty,duration}); const headers={'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('authToken')}`}; let res; if(adminEditingRoadmapId){ res = await fetch(`${API_BASE}/roadmaps/${adminEditingRoadmapId}`,{method:'PUT',headers,body}); } else { res= await fetch(`${API_BASE}/roadmaps`,{method:'POST',headers,body}); } if(res.ok){ showAlert('Saved','success'); adminReloadRoadmaps(); if(!adminEditingRoadmapId){ const data=await res.json(); adminEditingRoadmapId=data.roadmapId; } } else { const d=await res.json(); showAlert(d.error||'Save failed','danger'); } }
function adminRenderModules(mods){ const container=document.getElementById('admin-modules'); container.innerHTML = mods.map(m=>adminModuleHtml(m)).join(''); }
function adminModuleHtml(m){ return `<div class='card mb-2' data-module-id='${m.id}'><div class='card-header py-2 d-flex align-items-center gap-2'><strong class='flex-grow-1'>${m.title}</strong><button class='btn btn-sm btn-outline-secondary' onclick='adminPromptEditModule(${m.id})'><i class="fas fa-edit"></i></button><button class='btn btn-sm btn-outline-danger' onclick='adminDeleteModule(${m.id})'><i class="fas fa-trash"></i></button><button class='btn btn-sm btn-outline-primary' onclick='adminAddTask(${m.id})'><i class="fas fa-plus"></i></button></div><div class='card-body p-2'>${(m.tasks||[]).map(t=>adminTaskHtml(t)).join('')||'<small class="text-muted">No tasks</small>'}</div></div>`; }
function adminTaskHtml(t){ return `<div class='border rounded p-2 d-flex align-items-center mb-1' data-task-id='${t.id}'><div class='flex-grow-1'><div class='fw-semibold small'>${t.title}</div>${t.description?`<div class='small text-muted'>${t.description}</div>`:''}</div><div class='d-flex gap-1'><button class='btn btn-sm btn-outline-secondary' onclick='adminPromptEditTask(${t.id})'><i class="fas fa-edit"></i></button><button class='btn btn-sm btn-outline-danger' onclick='adminDeleteTask(${t.id})'><i class="fas fa-trash"></i></button></div></div>`; }
async function adminAddModule(){ if(!adminEditingRoadmapId) return showAlert('Save roadmap first','warning'); const title=prompt('Module title?'); if(!title) return; const res=await fetch(`${API_BASE}/roadmaps/${adminEditingRoadmapId}/modules`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('authToken')}`},body:JSON.stringify({title})}); if(res.ok){ const mod=await res.json(); adminEditRoadmap(adminEditingRoadmapId); } else showAlert('Create module failed','danger'); }
async function adminPromptEditModule(id){ const card=document.querySelector(`[data-module-id='${id}']`); if(!card) return; const current=card.querySelector('strong').textContent; const title=prompt('New module title', current); if(!title||title===current) return; const res=await fetch(`${API_BASE}/modules/${id}`,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('authToken')}`},body:JSON.stringify({title})}); if(res.ok){ showAlert('Module updated','success'); adminEditRoadmap(adminEditingRoadmapId);} else showAlert('Update failed','danger'); }
async function adminDeleteModule(id){ if(!confirm('Delete module (tasks will be removed)?')) return; const res=await fetch(`${API_BASE}/modules/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}`}}); if(res.ok){ showAlert('Module deleted','success'); adminEditRoadmap(adminEditingRoadmapId);} else showAlert('Delete failed','danger'); }
async function adminAddTask(moduleId){ const title=prompt('Task title?'); if(!title) return; const description=prompt('Task description (optional)',''); const resource_url=prompt('Resource URL (optional)',''); const res=await fetch(`${API_BASE}/modules/${moduleId}/tasks`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('authToken')}`},body:JSON.stringify({title,description,resource_url})}); if(res.ok){ showAlert('Task added','success'); adminEditRoadmap(adminEditingRoadmapId);} else showAlert('Add task failed','danger'); }
async function adminPromptEditTask(id){ const el=document.querySelector(`[data-task-id='${id}']`); if(!el) return; const currentTitle=el.querySelector('.fw-semibold').textContent; const newTitle=prompt('Task title', currentTitle); if(!newTitle) return; const description=prompt('Task description',''); const resource_url=prompt('Resource URL',''); const res=await fetch(`${API_BASE}/tasks/${id}`,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('authToken')}`},body:JSON.stringify({title:newTitle,description,resource_url})}); if(res.ok){ showAlert('Task updated','success'); adminEditRoadmap(adminEditingRoadmapId);} else showAlert('Update failed','danger'); }
async function adminDeleteTask(id){ if(!confirm('Delete task?')) return; const res=await fetch(`${API_BASE}/tasks/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}`}}); if(res.ok){ showAlert('Task deleted','success'); adminEditRoadmap(adminEditingRoadmapId);} else showAlert('Delete failed','danger'); }
// Initial admin load when page shown
// (Removed legacy incremental showPage override; unified later)

// Legacy showPage placeholder - replaced by unified implementation at end

// Get user initials from username
function getUserInitials(username) {
    if (!username) return 'U';
    
    // Split by space and take first letter of each word
    const names = username.trim().split(' ');
    if (names.length === 1) {
        // If only one name (like "subhash"), take first letter and "S" for last name
        return names[0].charAt(0).toUpperCase() + 'S';
    } else {
        // If multiple names, take first letter of first and last name
        return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    }
}

// Logout
function logout() { 
    if(confirm('Are you sure you want to logout?')) { 
        localStorage.removeItem('authToken'); 
        localStorage.removeItem('userData'); 
        currentUser = null; 
        currentRoadmap = null; 
        userProgress = {}; 
        updateUIForAnonymousUser(); 
    // Ensure any protected pages are hidden
    ['progress-page','profile-page','admin-page'].forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('active'); });
    showPage('home-page');
        showAlert('Logged out successfully!', 'success'); 
        loadRoadmaps(); 
    }
}

// Show alert
function showAlert(message,type='info'){ document.querySelectorAll('.alert-custom').forEach(a=>a.remove()); const alert=document.createElement('div'); alert.className=`alert alert-${type} alert-dismissible fade show position-fixed alert-custom`; alert.style.cssText='top:20px;right:20px;z-index:9999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15);'; alert.innerHTML=`${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`; document.body.appendChild(alert); setTimeout(()=>{ if(alert.parentNode) alert.remove(); },5000); }

// Removed old profile loader (replaced by loadProfileData + specific calls)

// Removed legacy updateProfileUI (stats handled differently in provided ref code)

// Load recent activity
async function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    
    try {
        const response = await fetch(`${API_BASE}/user/activity`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const activities = await response.json();
            displayRecentActivity(activities);
        } else {
            container.innerHTML = '<p class="text-muted text-center py-3">No recent activity</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-danger text-center py-3">Error loading activity</p>';
    }
}

// Display recent activity
function displayRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No recent activity</p>';
        return;
    }

    const activityHTML = activities.slice(0, 5).map(activity => `
        <div class="d-flex align-items-center py-2 border-bottom">
            <div class="activity-icon me-3">
                <i class="fas fa-${getActivityIcon(activity.type)} text-primary"></i>
            </div>
            <div class="flex-grow-1">
                <p class="mb-1">${activity.description}</p>
                <small class="text-muted">${formatDate(activity.created_at)}</small>
            </div>
        </div>
    `).join('');

    container.innerHTML = activityHTML;
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        'task_completed': 'check-circle',
        'roadmap_started': 'play-circle',
        'roadmap_completed': 'trophy',
        'badge_earned': 'medal'
    };
    return icons[type] || 'circle';
}

// Load active roadmaps
async function loadActiveRoadmaps() {
    const container = document.getElementById('active-roadmaps');
    
    try {
        const response = await fetch(`${API_BASE}/user/active-roadmaps`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const roadmaps = await response.json();
            displayActiveRoadmaps(roadmaps);
        } else {
            container.innerHTML = '<p class="text-muted text-center py-3">No active roadmaps</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-danger text-center py-3">Error loading roadmaps</p>';
    }
}

// Display active roadmaps
function displayActiveRoadmaps(roadmaps) {
    const container = document.getElementById('active-roadmaps');
    
    if (!roadmaps || roadmaps.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No active roadmaps. <a href="#" onclick="showPage(\'roadmaps-page\')">Start learning!</a></p>';
        return;
    }

    const roadmapsHTML = roadmaps.map(roadmap => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="fw-bold mb-1">${roadmap.title}</h6>
                        <p class="text-muted mb-2">${roadmap.description}</p>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: ${roadmap.progress || 0}%"></div>
                        </div>
                        <small class="text-muted">${roadmap.progress || 0}% complete</small>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewRoadmap(${roadmap.id})">
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = roadmapsHTML;
}

// Load progress page
async function loadProgressPage() {
    if (!currentUser) return;

    try {
        // Load comprehensive progress data using new API
        const response = await fetch(`${API_BASE}/my-progress`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const progressData = await response.json();
            displayMyProgressData(progressData);
            await loadMyActivity(); // Load recent activity
        } else {
            showAlert('Error loading progress data', 'danger');
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        showAlert('Error loading progress data', 'danger');
    }
}

// Enhanced My Progress data display
function displayMyProgressData(data) {
    // Display overall statistics
    displayProgressStats(data.stats);
    
    // Display roadmaps
    displayMyRoadmaps(data.roadmaps);
    
    // Display courses
    displayMyCourses(data.courses);
    
    // Update overall progress indicator
    const overallProgress = data.stats.overall_progress || 0;
    const progressBar = document.getElementById('overall-progress-bar');
    const progressText = document.getElementById('overall-progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${overallProgress}%`;
        progressBar.className = `progress-bar ${getProgressBarClass(overallProgress)}`;
    }
    
    if (progressText) {
        progressText.textContent = `${overallProgress}% Complete`;
    }
}

// Display progress statistics cards
function displayProgressStats(stats) {
    const statsContainer = document.getElementById('progress-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="col-md-3">
            <div class="card text-center border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-center mb-2">
                        <i class="fas fa-road text-primary me-2"></i>
                        <h3 class="text-primary fw-bold mb-0">${stats.total_roadmaps || 0}</h3>
                    </div>
                    <p class="text-muted mb-1">Total Roadmaps</p>
                    <small class="text-success">${stats.completed_roadmaps || 0} completed</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-center mb-2">
                        <i class="fas fa-book text-info me-2"></i>
                        <h3 class="text-info fw-bold mb-0">${stats.total_courses || 0}</h3>
                    </div>
                    <p class="text-muted mb-1">Total Courses</p>
                    <small class="text-success">${stats.completed_courses || 0} completed</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-center mb-2">
                        <i class="fas fa-tasks text-warning me-2"></i>
                        <h3 class="text-warning fw-bold mb-0">${stats.total_tasks || 0}</h3>
                    </div>
                    <p class="text-muted mb-1">Total Tasks</p>
                    <small class="text-success">${stats.completed_tasks || 0} completed</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-center mb-2">
                        <i class="fas fa-calendar-check text-success me-2"></i>
                        <h3 class="text-success fw-bold mb-0">${stats.streak_days || 0}</h3>
                    </div>
                    <p class="text-muted mb-1">Day Streak</p>
                    <small class="text-muted">Keep learning!</small>
                </div>
            </div>
        </div>
    `;
}

// Display My Roadmaps with enhanced progress tracking
function displayMyRoadmaps(roadmaps) {
    const container = document.getElementById('progress-roadmaps');
    if (!container) return;
    
    if (!roadmaps || roadmaps.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-road fa-3x mb-3 text-muted"></i>
                <h5>No roadmaps started yet</h5>
                <p>Start your learning journey by choosing a roadmap</p>
                <button class="btn btn-primary" onclick="showPage('roadmaps-page')">
                    <i class="fas fa-plus me-1"></i>Browse Roadmaps
                </button>
            </div>
        `;
        return;
    }

    const roadmapsHTML = roadmaps.map(roadmap => {
        const progress = parseFloat(roadmap.progress) || 0;
        const progressClass = getProgressBarClass(progress);
        const statusBadge = progress === 100 ? 
            '<span class="badge bg-success ms-2"><i class="fas fa-check me-1"></i>Completed</span>' :
            progress > 0 ? '<span class="badge bg-info ms-2"><i class="fas fa-play me-1"></i>In Progress</span>' :
            '<span class="badge bg-secondary ms-2"><i class="fas fa-clock me-1"></i>Not Started</span>';

        return `
            <div class="card mb-4 border-0 shadow-sm">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="fw-bold mb-0">${roadmap.title}</h5>
                                ${statusBadge}
                            </div>
                            <p class="text-muted mb-3">${roadmap.description || 'No description available'}</p>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar ${progressClass}" 
                                     role="progressbar" 
                                     style="width: ${progress}%" 
                                     aria-valuenow="${progress}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <small class="text-muted">
                                        <i class="fas fa-chart-line me-1"></i>Progress: ${progress}%
                                    </small>
                                </div>
                                <div class="col-sm-6">
                                    <small class="text-muted">
                                        <i class="fas fa-tasks me-1"></i>${roadmap.completed_tasks || 0} / ${roadmap.total_tasks || 0} tasks
                                    </small>
                                </div>
                            </div>
                            ${roadmap.last_activity ? `
                                <div class="mt-2">
                                    <small class="text-muted">
                                        <i class="fas fa-clock me-1"></i>Last activity: ${formatDate(roadmap.last_activity)}
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="col-md-4 text-md-end">
                            <div class="d-flex flex-column gap-2">
                                <button class="btn btn-primary btn-sm" onclick="viewRoadmap(${roadmap.id})">
                                    <i class="fas fa-eye me-1"></i>View Details
                                </button>
                                ${progress > 0 ? `
                                    <button class="btn btn-outline-success btn-sm" onclick="continueRoadmap(${roadmap.id})">
                                        <i class="fas fa-play me-1"></i>Continue Learning
                                    </button>
                                ` : `
                                    <button class="btn btn-outline-primary btn-sm" onclick="startRoadmap(${roadmap.id})">
                                        <i class="fas fa-rocket me-1"></i>Start Learning
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = roadmapsHTML;
}

// Display My Courses
function displayMyCourses(courses) {
    const container = document.getElementById('progress-courses');
    if (!container) return;
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-book fa-2x mb-3 text-muted"></i>
                <h6>No courses enrolled yet</h6>
                <p class="small">Enroll in courses to track your progress</p>
                <button class="btn btn-outline-primary btn-sm" onclick="showPage('courses-page')">
                    <i class="fas fa-search me-1"></i>Browse Courses
                </button>
            </div>
        `;
        return;
    }

    const coursesHTML = courses.map(course => {
        const progress = parseFloat(course.progress) || 0;
        const progressClass = getProgressBarClass(progress);

        return `
            <div class="col-md-6 mb-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body">
                        <h6 class="fw-bold mb-2">${course.title}</h6>
                        <p class="text-muted small mb-3">${course.description || 'No description'}</p>
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar ${progressClass}" style="width: ${progress}%"></div>
                        </div>
                        <div class="d-flex justify-content-between">
                            <small class="text-muted">${progress}% complete</small>
                            <small class="text-muted">${course.completed_lessons || 0}/${course.total_lessons || 0} lessons</small>
                        </div>
                        <button class="btn btn-outline-primary btn-sm mt-2 w-100" 
                                onclick="viewCourse(${course.id})">
                            <i class="fas fa-eye me-1"></i>View Course
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="row">${coursesHTML}</div>`;
}

// Load recent activity
async function loadMyActivity() {
    try {
        const response = await fetch(`${API_BASE}/my-progress/activity`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const activities = await response.json();
            displayMyActivity(activities);
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Display recent activity
function displayMyActivity(activities) {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-clock fa-2x mb-3"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }

    const activitiesHTML = activities.map(activity => `
        <div class="d-flex align-items-center mb-3 p-3 border rounded">
            <div class="me-3">
                ${getActivityTypeIcon(activity.type)}
            </div>
            <div class="flex-grow-1">
                <div class="fw-bold small">${activity.description}</div>
                <div class="text-muted small">${formatDate(activity.created_at)}</div>
            </div>
        </div>
    `).join('');

    container.innerHTML = activitiesHTML;
}

// Helper function to get progress bar color class
function getProgressBarClass(progress) {
    if (progress >= 100) return 'bg-success';
    if (progress >= 75) return 'bg-info';
    if (progress >= 50) return 'bg-warning';
    if (progress >= 25) return 'bg-primary';
    return 'bg-secondary';
}

// Helper function to get activity type icon
function getActivityTypeIcon(type) {
    const icons = {
        'task': '<i class="fas fa-check-circle text-success"></i>',
        'lesson': '<i class="fas fa-book-open text-info"></i>',
        'roadmap': '<i class="fas fa-road text-primary"></i>',
        'course': '<i class="fas fa-graduation-cap text-warning"></i>'
    };
    return icons[type] || '<i class="fas fa-circle text-muted"></i>';
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

// Display progress data
function displayProgressData(progressData) {
    // Update overall progress
    const overallProgress = progressData.overallProgress || 0;
    document.getElementById('overall-progress-bar').style.width = `${overallProgress}%`;
    document.getElementById('overall-progress-text').textContent = `${overallProgress}% Complete`;

    // Update progress stats
    const statsContainer = document.getElementById('progress-stats');
    statsContainer.innerHTML = `
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-primary fw-bold">${progressData.totalRoadmaps || 0}</h3>
                    <p class="text-muted mb-0">Total Roadmaps</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-success fw-bold">${progressData.completedRoadmaps || 0}</h3>
                    <p class="text-muted mb-0">Completed</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-info fw-bold">${progressData.totalTasks || 0}</h3>
                    <p class="text-muted mb-0">Total Tasks</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-warning fw-bold">${progressData.completedTasks || 0}</h3>
                    <p class="text-muted mb-0">Tasks Done</p>
                </div>
            </div>
        </div>
    `;

    // Display roadmap progress
    displayRoadmapProgress(progressData.roadmaps || []);
}

// Display roadmap progress
function displayRoadmapProgress(roadmaps) {
    const container = document.getElementById('progress-roadmaps');
    
    if (!roadmaps || roadmaps.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-road fa-3x mb-3"></i>
                <h5>No roadmaps started yet</h5>
                <p>Start your learning journey by choosing a roadmap</p>
                <button class="btn btn-primary" onclick="showPage('roadmaps-page')">Browse Roadmaps</button>
            </div>
        `;
        return;
    }

    const roadmapsHTML = roadmaps.map(roadmap => `
        <div class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="fw-bold mb-2">${roadmap.title}</h5>
                        <p class="text-muted mb-3">${roadmap.description}</p>
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar bg-gradient" style="width: ${roadmap.progress || 0}%"></div>
                        </div>
                        <div class="row">
                            <div class="col-sm-6">
                                <small class="text-muted">Progress: ${roadmap.progress || 0}%</small>
                            </div>
                            <div class="col-sm-6 text-sm-end">
                                <small class="text-muted">${roadmap.completed_tasks || 0} / ${roadmap.total_tasks || 0} tasks</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="d-flex flex-column gap-2">
                            <button class="btn btn-primary btn-sm" onclick="viewRoadmap(${roadmap.id})">
                                <i class="fas fa-eye me-1"></i>View Details
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="continueRoadmap(${roadmap.id})">
                                <i class="fas fa-play me-1"></i>Continue Learning
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = roadmapsHTML;
}

// View roadmap details with modules and tasks
// legacy duplicated viewRoadmap removed (replaced)

// Display roadmap detail
function displayRoadmapDetail(roadmap) {
    // Update breadcrumb and header
    document.getElementById('roadmap-breadcrumb').textContent = roadmap.title;
    document.getElementById('roadmap-detail-title').textContent = roadmap.title;
    document.getElementById('roadmap-detail-description').textContent = roadmap.description;
    document.getElementById('roadmap-detail-difficulty').textContent = roadmap.difficulty || 'Beginner';
    document.getElementById('roadmap-detail-duration').textContent = roadmap.duration || 30;
    document.getElementById('roadmap-detail-task-count').textContent = roadmap.total_tasks || 0;

    // Update progress bar (if user has started)
    const progress = roadmap.user_progress || 0;
    document.getElementById('roadmap-progress-bar').style.width = `${progress}%`;
    document.getElementById('roadmap-progress-text').textContent = `${progress}% Complete`;

    // Update start button
    const startBtn = document.getElementById('start-roadmap-btn');
    if (progress > 0) {
        startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Continue Learning';
        startBtn.onclick = () => continueRoadmap(roadmap.id);
    } else {
        startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Start Learning';
        startBtn.onclick = () => startRoadmap();
    }

    // Display modules and tasks
    displayRoadmapModules(roadmap.modules || []);
}

// Display roadmap modules
function displayRoadmapModules(modules) {
    const container = document.getElementById('roadmap-modules');
    
    if (!modules || modules.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-puzzle-piece fa-3x mb-3"></i>
                <h5>No modules available</h5>
                <p>This roadmap is being prepared. Check back soon!</p>
            </div>
        `;
        return;
    }

    const modulesHTML = modules.map((module, index) => `
        <div class="card mb-4 module-card" data-module-id="${module.id}">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h5 class="mb-1 fw-bold">
                            <span class="module-number me-2">${index + 1}</span>
                            ${module.title}
                        </h5>
                        <p class="text-muted mb-0">${module.description}</p>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="d-flex align-items-center justify-content-md-end">
                            <div class="progress me-3" style="width: 100px; height: 6px;">
                                <div class="progress-bar bg-success" style="width: ${module.progress || 0}%"></div>
                            </div>
                            <small class="text-muted">${module.progress || 0}%</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="tasks-list">
                    ${displayModuleTasks(module.tasks || [], module.id)}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = modulesHTML;
}

// Display module tasks
function displayModuleTasks(tasks, moduleId) {
    if (!tasks || tasks.length === 0) {
        return '<p class="text-muted">No tasks available for this module.</p>';
    }

    return tasks.map((task, index) => `
        <div class="task-item d-flex align-items-center py-2 border-bottom" data-task-id="${task.id}">
            <div class="task-checkbox me-3">
                <input type="checkbox" class="form-check-input" id="task-${task.id}" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="toggleTaskCompletion(${task.id}, ${moduleId})">
            </div>
            <div class="flex-grow-1">
                <label for="task-${task.id}" class="form-check-label fw-medium mb-1 d-block">
                    ${task.title}
                </label>
                <p class="text-muted mb-1 small">${task.description}</p>
                ${task.resource_url ? `
                    <a href="${task.resource_url}" target="_blank" class="btn btn-link btn-sm p-0 text-decoration-none">
                        <i class="fas fa-external-link-alt me-1"></i>View Resource
                    </a>
                ` : ''}
            </div>
            <div class="task-status">
                ${task.completed ? 
                    '<i class="fas fa-check-circle text-success"></i>' : 
                    '<i class="far fa-circle text-muted"></i>'
                }
            </div>
        </div>
    `).join('');
}

// Start roadmap
async function startRoadmap() {
    if (!currentRoadmap) return;

    try {
        const response = await fetch(`${API_BASE}/roadmaps/${currentRoadmap.id}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showAlert('Roadmap started! Good luck with your learning journey!', 'success');
            // Reload the roadmap to get updated progress
            viewRoadmap(currentRoadmap.id);
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error starting roadmap', 'danger');
        }
    } catch (error) {
        console.error('Error starting roadmap:', error);
        showAlert('Error starting roadmap', 'danger');
    }
}

// Continue roadmap (same as start but different messaging)
function continueRoadmap(roadmapId) {
    viewRoadmap(roadmapId);
}

// Start roadmap with ID parameter (for My Progress page)
async function startRoadmap(roadmapId) {
    if (!currentUser) {
        showAlert('Login first', 'warning');
        return;
    }

    if (roadmapId) {
        // Called from My Progress page with specific roadmap ID
        try {
            const res = await fetch(`${API_BASE}/roadmaps/${roadmapId}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (res.ok) {
                showAlert('Roadmap started!', 'success');
                // Redirect to the roadmap details
                viewRoadmap(roadmapId);
            } else {
                const data = await res.json();
                showAlert(data.error || 'Error starting roadmap', 'danger');
            }
        } catch (e) {
            console.error('Error starting roadmap:', e);
            showAlert('Connection error', 'danger');
        }
    } else {
        // Legacy behavior - start current roadmap
        if (!currentRoadmap) {
            showAlert('No roadmap selected', 'danger');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/roadmaps/${currentRoadmap.id}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (res.ok) {
                showAlert('Roadmap started!', 'success');
                const btn = document.getElementById('start-roadmap-btn');
                if (btn) btn.textContent = 'Continue Learning';
            } else {
                const data = await res.json();
                showAlert(data.error || 'Error starting roadmap', 'danger');
            }
        } catch (e) {
            console.error('Error starting roadmap:', e);
            showAlert('Connection error', 'danger');
        }
    }
}

// View course (for My Progress page)
function viewCourse(courseId) {
    if (!courseId) {
        showAlert('Invalid course ID', 'danger');
        return;
    }

    // Navigate to courses page and open the specific course
    showPage('courses-page');
    
    // After a brief delay to allow page load, open the course
    setTimeout(() => {
        openCourse(courseId);
    }, 100);
}

// Toggle task completion
async function toggleTaskCompletion(taskId, moduleId) {
    try {
        const response = await fetch(`${API_BASE}/progress/task`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taskId: taskId,
                moduleId: moduleId,
                roadmapId: currentRoadmap.id
            })
        });

        if (response.ok) {
            const result = await response.json();
            showAlert('Progress updated!', 'success');
            
            // Update the UI to reflect the change
            updateTaskUI(taskId, result.completed);
            
            // If roadmap is completed, show celebration
            if (result.roadmapCompleted) {
                showRoadmapCompletionModal();
            }
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error updating progress', 'danger');
            // Revert the checkbox
            const checkbox = document.getElementById(`task-${taskId}`);
            if (checkbox) checkbox.checked = !checkbox.checked;
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showAlert('Error updating progress', 'danger');
        // Revert the checkbox
        const checkbox = document.getElementById(`task-${taskId}`);
        if (checkbox) checkbox.checked = !checkbox.checked;
    }
}

// Update task UI
function updateTaskUI(taskId, completed) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskItem) {
        const statusIcon = taskItem.querySelector('.task-status i');
        if (completed) {
            statusIcon.className = 'fas fa-check-circle text-success';
        } else {
            statusIcon.className = 'far fa-circle text-muted';
        }
    }
}

// Show roadmap completion modal
function showRoadmapCompletionModal() {
    const modal = `
        <div class="modal fade" id="completionModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-trophy me-2"></i>
                            Congratulations! 🎉
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-4">
                            <i class="fas fa-medal fa-4x text-warning mb-3"></i>
                            <h4>Roadmap Completed!</h4>
                            <p class="lead">You've successfully completed: <strong>${currentRoadmap.title}</strong></p>
                            <p class="text-muted">Your dedication and hard work have paid off!</p>
                        </div>

                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            You can now generate a digital badge to showcase your achievement!
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-warning" onclick="generateRoadmapBadge()">
                            <i class="fas fa-medal me-2"></i>Generate Badge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('completionModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modal);
    const modalElement = new bootstrap.Modal(document.getElementById('completionModal'));
    modalElement.show();

    // Remove modal from DOM after it's hidden
    document.getElementById('completionModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function generateRoadmapBadge() {
    if (!currentRoadmap) return;

    try {
        // Show loading state
        const generateBtn = document.querySelector('[onclick="generateRoadmapBadge()"]');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
        generateBtn.disabled = true;

        const response = await fetch(`${API_BASE}/roadmaps/${currentRoadmap.id}/generate-badge`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            // Hide the completion modal
            bootstrap.Modal.getInstance(document.getElementById('completionModal')).hide();

            // Show success message
            showAlert('Badge generated successfully! Opening in new tab...', 'success');

            // Open badge in new tab
            setTimeout(() => {
                window.open(result.badgeUrl, '_blank');
            }, 1000);

        } else {
            if (result.alreadyExists) {
                showAlert('Badge already exists for this roadmap!', 'info');
                bootstrap.Modal.getInstance(document.getElementById('completionModal')).hide();
            } else {
                showAlert(result.error || 'Failed to generate badge', 'danger');
            }
        }

    } catch (error) {
        console.error('Error generating badge:', error);
        showAlert('Failed to generate badge', 'danger');
    } finally {
        // Reset button
        const generateBtn = document.querySelector('[onclick="generateRoadmapBadge()"]');
        if (generateBtn) {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }
}

// Show course completion modal
function showCourseCompletionModal() {
    const modal = `
        <div class="modal fade" id="courseCompletionModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-5">
                        <i class="fas fa-graduation-cap text-success fa-4x mb-3"></i>
                        <h3 class="fw-bold text-success mb-3">Course Completed!</h3>
                        <p class="lead">You've successfully completed: <strong>${currentCourse.title}</strong></p>
                        <p class="text-muted">You can now generate a certificate for this achievement!</p>
                        <div class="d-flex gap-3 justify-content-center mt-4">
                            <button class="btn btn-primary" onclick="requestCourseCertificate()">
                                <i class="fas fa-certificate me-2"></i>Generate Certificate
                            </button>
                            <button class="btn btn-outline-secondary" onclick="bootstrap.Modal.getInstance(document.getElementById('courseCompletionModal')).hide()">
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    const modalElement = new bootstrap.Modal(document.getElementById('courseCompletionModal'));
    modalElement.show();
    
    // Remove modal from DOM after it's hidden
    document.getElementById('courseCompletionModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Generate certificate directly
async function requestCertificate() {
    try {
        // Show modal to get user details
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Generate Certificate</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="certificate-form">
                            <div class="mb-3">
                                <label for="student-name" class="form-label">Student Name*</label>
                                <input type="text" class="form-control" id="student-name" required 
                                       placeholder="Enter full name for certificate">
                            </div>
                            <div class="mb-3">
                                <label for="completion-date" class="form-label">Completion Date*</label>
                                <input type="date" class="form-control" id="completion-date" required 
                                       value="${new Date().toISOString().split('T')[0]}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="generateRoadmapCertificate()">
                            <i class="fas fa-certificate me-2"></i>Generate Certificate
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Remove modal from DOM after it's hidden
        modal.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error showing certificate form:', error);
        showAlert('Error showing certificate form', 'danger');
    }
}

// Generate roadmap certificate
async function generateRoadmapCertificate() {
    try {
        const studentName = document.getElementById('student-name').value;
        const completionDate = document.getElementById('completion-date').value;
        
        if (!studentName || !completionDate) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        // Generate a unique badge ID
        const badgeId = 'BADGE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Create badge data
        const badgeData = {
            studentName: studentName,
            roadmapName: currentRoadmap.title,
            completionDate: completionDate,
            badgeId: badgeId
        };
        
        // Save badge data to localStorage for the badge page to access
        localStorage.setItem('currentBadgeData', JSON.stringify(badgeData));
        
        // Hide modal
        bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
        
        // Record the badge generation in the backend
        try {
            await fetch(`${API_BASE}/badges/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roadmapId: currentRoadmap.id,
                    studentName: studentName,
                    completionDate: completionDate,
                    badgeId: badgeId
                })
            });
        } catch (error) {
            console.error('Error recording badge in backend:', error);
        }
        
        // Redirect to badge page
        window.open(`badge.html?student=${encodeURIComponent(studentName)}&roadmap=${encodeURIComponent(currentRoadmap.title)}&date=${encodeURIComponent(completionDate)}&id=${encodeURIComponent(badgeId)}`, '_blank');
        
        showAlert('Badge generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating badge:', error);
        showAlert('Error generating badge', 'danger');
    }
}

// Request badge
async function requestBadge() {
    try {
        const response = await fetch(`${API_BASE}/badges/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roadmapId: currentRoadmap.id,
                type: 'badge'
            })
        });

        if (response.ok) {
            showAlert('Badge request submitted! You will be notified when it\'s ready.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('completionModal')).hide();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error requesting badge', 'danger');
        }
    } catch (error) {
        console.error('Error requesting badge:', error);
        showAlert('Error requesting badge', 'danger');
    }
}

// Edit profile function
function editProfile() {
    showAlert('Profile editing feature coming soon!', 'info');
}

// Admin Functions
// Enhanced Profile Helper Functions

// Download a specific certificate
async function downloadCertificate(certificateId) {
    try {
        const response = await fetch(`${API_BASE}/certificates/${certificateId}/download`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${certificateId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('Certificate downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download certificate');
        }
    } catch (error) {
        console.error('Error downloading certificate:', error);
        showNotification('Failed to download certificate', 'danger');
    }
}

// Download all certificates
async function downloadCertificates() {
    try {
        const response = await fetch(`${API_BASE}/certificates/download-all`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-certificates.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('All certificates downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download certificates');
        }
    } catch (error) {
        console.error('Error downloading certificates:', error);
        showNotification('Failed to download certificates', 'danger');
    }
}

// Admin helper functions for profile page
function viewAllUsers() {
    showPage('admin-page');
    // Could add specific user management section
}

function generateReports() {
    showNotification('Report generation feature coming soon!', 'info');
}

function manageRoadmaps() {
    showPage('admin-page');
    // Focus on roadmap management section
}

function manageModules() {
    showPage('admin-page');
    // Focus on module management section
}

function manageTasks() {
    showPage('admin-page');
    // Focus on task management section
}

// Enhanced profile form submission
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('profile-edit-username').value;
            const email = document.getElementById('profile-edit-email').value;
            const password = document.getElementById('profile-edit-password').value;
            
            const updateData = { username, email };
            if (password.trim()) {
                updateData.password = password;
            }
            
            try {
                await api.put('/profile', updateData);
                showNotification('Profile updated successfully!', 'success');
                
                // Close the edit form
                const collapseElement = document.getElementById('edit-profile-form');
                if (collapseElement) {
                    const collapse = new bootstrap.Collapse(collapseElement, { toggle: false });
                    collapse.hide();
                }
                
                // Reload profile data
                loadProfileData();
                
            } catch (error) {
                console.error('Profile update error:', error);
                showNotification(error.message || 'Failed to update profile', 'danger');
            }
        });
    }
});

// Enhanced Profile Helper Functions

// Download a specific certificate
async function downloadCertificate(certificateId) {
    try {
        const response = await fetch(`${API_BASE}/certificates/${certificateId}/download`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${certificateId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('Certificate downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download certificate');
        }
    } catch (error) {
        console.error('Error downloading certificate:', error);
        showNotification('Failed to download certificate', 'danger');
    }
}

// Download all certificates
async function downloadCertificates() {
    try {
        const response = await fetch(`${API_BASE}/certificates/download-all`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my-certificates.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('All certificates downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download certificates');
        }
    } catch (error) {
        console.error('Error downloading certificates:', error);
        showNotification('Failed to download certificates', 'danger');
    }
}

// Admin helper functions for profile page
function viewAllUsers() {
    showPage('admin-page');
    // Could add specific user management section
}

function generateReports() {
    showNotification('Report generation feature coming soon!', 'info');
}

function manageRoadmaps() {
    showPage('admin-page');
    // Focus on roadmap management section
}

function manageModules() {
    showPage('admin-page');
    // Focus on module management section
}

function manageTasks() {
    showPage('admin-page');
    // Focus on task management section
}

// Enhanced profile form submission
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('profile-edit-username').value;
            const email = document.getElementById('profile-edit-email').value;
            const password = document.getElementById('profile-edit-password').value;
            
            const updateData = { username, email };
            if (password.trim()) {
                updateData.password = password;
            }
            
            try {
                await api.put('/profile', updateData);
                showNotification('Profile updated successfully!', 'success');
                
                // Close the edit form
                const collapseElement = document.getElementById('edit-profile-form');
                if (collapseElement) {
                    const collapse = new bootstrap.Collapse(collapseElement, { toggle: false });
                    collapse.hide();
                }
                
                // Reload profile data
                loadProfileData();
                
            } catch (error) {
                console.error('Profile update error:', error);
                showNotification(error.message || 'Failed to update profile', 'danger');
            }
        });
    }
});

async function loadAdminRoadmaps() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        const response = await fetch(`${API_BASE}/roadmaps`);
        const roadmaps = await response.json();
        
        const container = document.getElementById('admin-roadmaps-list');
        if (!roadmaps.length) {
            container.innerHTML = '<p class="text-muted text-center py-3">No roadmaps found. Create your first roadmap!</p>';
            return;
        }
        
        const roadmapsHTML = roadmaps.map(roadmap => `
            <div class="card mb-3" data-roadmap-id="${roadmap.id}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h6 class="fw-bold mb-1">${roadmap.title}</h6>
                            <p class="text-muted mb-2">${roadmap.description}</p>
                            <div class="d-flex gap-3">
                                <small><i class="fas fa-signal me-1"></i>${roadmap.difficulty}</small>
                                <small><i class="far fa-clock me-1"></i>${roadmap.duration} days</small>
                                <small><i class="fas fa-layer-group me-1"></i>${roadmap.module_count || 0} modules</small>
                                <small><i class="fas fa-tasks me-1"></i>${roadmap.task_count || 0} tasks</small>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="manageRoadmapModules(${roadmap.id}, '${roadmap.title}')">
                                    <i class="fas fa-cogs me-1"></i>Manage
                                </button>
                                <button class="btn btn-outline-secondary" onclick="editRoadmap(${roadmap.id})">
                                    <i class="fas fa-edit me-1"></i>Edit
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteRoadmap(${roadmap.id})">
                                    <i class="fas fa-trash me-1"></i>Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = roadmapsHTML;
    } catch (error) {
        console.error('Error loading admin roadmaps:', error);
        document.getElementById('admin-roadmaps-list').innerHTML = 
            '<p class="text-danger text-center py-3">Error loading roadmaps</p>';
    }
}

function showCreateRoadmapModal() {
    const modal = new bootstrap.Modal(document.getElementById('createRoadmapModal'));
    modal.show();
}

async function manageRoadmapModules(roadmapId, roadmapTitle) {
    try {
        const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}`);
        const roadmap = await response.json();
        
        // Create a management interface
        const modalHTML = `
            <div class="modal fade" id="manageModulesModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Manage: ${roadmapTitle}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex justify-content-between mb-3">
                                <h6>Modules & Tasks</h6>
                                <button class="btn btn-sm btn-primary" onclick="showCreateModuleModal(${roadmapId})">
                                    <i class="fas fa-plus me-1"></i>Add Module
                                </button>
                            </div>
                            <div id="modules-management">
                                ${roadmap.modules.map((module, index) => `
                                    <div class="card mb-2">
                                        <div class="card-header">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span><strong>${index + 1}. ${module.title}</strong></span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="showCreateTaskModal(${module.id})">
                                                        <i class="fas fa-plus me-1"></i>Add Task
                                                    </button>
                                                    <button class="btn btn-outline-danger" onclick="deleteModule(${module.id})">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            ${module.tasks.map((task, taskIndex) => `
                                                <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                                                    <span>${taskIndex + 1}. ${task.title}</span>
                                                    <button class="btn btn-outline-danger btn-sm" onclick="deleteTask(${task.id})">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            `).join('')}
                                            ${!module.tasks.length ? '<p class="text-muted mb-0">No tasks yet</p>' : ''}
                                        </div>
                                    </div>
                                `).join('')}
                                ${!roadmap.modules.length ? '<p class="text-muted">No modules yet. Add your first module!</p>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('manageModulesModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('manageModulesModal'));
        modal.show();
        
        // Clean up modal after hiding
        document.getElementById('manageModulesModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error loading roadmap details:', error);
        showAlert('Error loading roadmap details', 'danger');
    }
}

function showCreateModuleModal(roadmapId) {
    document.getElementById('module-roadmap-id').value = roadmapId;
    const modal = new bootstrap.Modal(document.getElementById('createModuleModal'));
    modal.show();
}

function showCreateTaskModal(moduleId) {
    document.getElementById('task-module-id').value = moduleId;
    const modal = new bootstrap.Modal(document.getElementById('createTaskModal'));
    modal.show();
}

async function deleteRoadmap(roadmapId) {
    if (!confirm('Are you sure you want to delete this roadmap? This will also delete all modules and tasks.')) return;
    
    try {
        const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (response.ok) {
            showAlert('Roadmap deleted successfully', 'success');
            loadAdminRoadmaps();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error deleting roadmap', 'danger');
        }
    } catch (error) {
        console.error('Error deleting roadmap:', error);
        showAlert('Error deleting roadmap', 'danger');
    }
}

async function deleteModule(moduleId) {
    if (!confirm('Are you sure you want to delete this module and all its tasks?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/modules/${moduleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (response.ok) {
            showAlert('Module deleted successfully', 'success');
            // Refresh the current modal view
            location.reload(); // Simple approach - reload page
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error deleting module', 'danger');
        }
    } catch (error) {
        console.error('Error deleting module:', error);
        showAlert('Error deleting module', 'danger');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (response.ok) {
            showAlert('Task deleted successfully', 'success');
            location.reload(); // Simple approach - reload page
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error deleting task', 'danger');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showAlert('Error deleting task', 'danger');
    }
}

// Admin form handlers
async function handleCreateRoadmap(e) {
    e.preventDefault();
    
    const title = document.getElementById('roadmap-title').value;
    const description = document.getElementById('roadmap-description').value;
    const difficulty = document.getElementById('roadmap-difficulty').value;
    const duration = document.getElementById('roadmap-duration').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/roadmaps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ title, description, difficulty, duration: parseInt(duration) })
        });
        
        if (response.ok) {
            showAlert('Roadmap created successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createRoadmapModal')).hide();
            document.getElementById('create-roadmap-form').reset();
            loadAdminRoadmaps();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error creating roadmap', 'danger');
        }
    } catch (error) {
        console.error('Error creating roadmap:', error);
        showAlert('Error creating roadmap', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleCreateModule(e) {
    e.preventDefault();
    
    const roadmapId = document.getElementById('module-roadmap-id').value;
    const title = document.getElementById('module-title').value;
    const order_index = document.getElementById('module-order').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/admin/roadmaps/${roadmapId}/modules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ title, order_index: parseInt(order_index) })
        });
        
        if (response.ok) {
            showAlert('Module added successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createModuleModal')).hide();
            document.getElementById('create-module-form').reset();
            // Refresh the page to show updated modules
            location.reload();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error creating module', 'danger');
        }
    } catch (error) {
        console.error('Error creating module:', error);
        showAlert('Error creating module', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleCreateTask(e) {
    e.preventDefault();
    
    const moduleId = document.getElementById('task-module-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const resource_url = document.getElementById('task-resource-url').value;
    const order_index = document.getElementById('task-order').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/admin/modules/${moduleId}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ title, description, resource_url, order_index: parseInt(order_index) })
        });
        
        if (response.ok) {
            showAlert('Task added successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createTaskModal')).hide();
            document.getElementById('create-task-form').reset();
            // Refresh the page to show updated tasks
            location.reload();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error creating task', 'danger');
        }
    } catch (error) {
        console.error('Error creating task:', error);
        showAlert('Error creating task', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Update the showPage function to load data when needed
const originalShowPage = showPage;
let __currentPageId = null;
// Remove earlier layered overrides; final unified showPage defined at end.

// ===== LEGACY COURSE FUNCTIONS REMOVED =====
// (All course functionality now handled by updated implementations below)

// ===== ROADMAP BADGE FUNCTIONALITY =====

function completeRoadmap() {
    if (!currentRoadmap) return;
    
    // Mark roadmap as completed
    currentRoadmap.progress = 100;
    updateRoadmapActionButtons();
    showNotification('Congratulations! Roadmap completed successfully.', 'success');
}

function requestRoadmapBadge() {
    if (!currentRoadmap) return;
    
    // Send badge request to admin
    api.post('/badges/request', {
        roadmapId: currentRoadmap.id,
        type: 'roadmap'
    }).then(() => {
        currentRoadmap.badge_requested = true;
        updateRoadmapActionButtons();
        showNotification('Badge request sent to admin for approval.', 'info');
    }).catch(error => {
        console.error('Error requesting badge:', error);
        showNotification('Failed to request badge', 'danger');
    });
}

function viewRoadmapBadge() {
    if (!currentRoadmap) return;
    window.open(`badge.html?roadmap=${currentRoadmap.id}`, '_blank');
}

function updateRoadmapActionButtons() {
    const startBtn = document.getElementById('start-roadmap-btn');
    const completeBtn = document.getElementById('complete-roadmap-btn');
    const requestBadgeBtn = document.getElementById('request-badge-btn');
    const viewBadgeBtn = document.getElementById('view-badge-btn');
    
    if (!currentRoadmap) return;
    
    if (currentRoadmap.progress === 0) {
        startBtn.style.display = 'block';
        completeBtn.style.display = 'none';
        requestBadgeBtn.style.display = 'none';
        viewBadgeBtn.style.display = 'none';
    } else if (currentRoadmap.progress < 100) {
        startBtn.style.display = 'none';
        completeBtn.style.display = 'block';
        requestBadgeBtn.style.display = 'none';
        viewBadgeBtn.style.display = 'none';
    } else if (!currentRoadmap.badge_requested) {
        startBtn.style.display = 'none';
        completeBtn.style.display = 'none';
        requestBadgeBtn.style.display = 'block';
        viewBadgeBtn.style.display = 'none';
    } else {
        startBtn.style.display = 'none';
        completeBtn.style.display = 'none';
        requestBadgeBtn.style.display = 'none';
        viewBadgeBtn.style.display = 'block';
    }
}



// Load certificate requests
async function loadCertificateRequests() {
    try {
        const requests = await api.get('/admin/certificate-requests');
        const container = document.getElementById('certificate-requests-list');
        
        if (!requests.length) {
            container.innerHTML = '<p class="text-muted">No certificate requests pending.</p>';
            return;
        }
        
        container.innerHTML = requests.map(request => `
            <div class="request-item mb-3 p-3 border rounded">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h6 class="mb-1">${request.student_name}</h6>
                        <p class="text-muted mb-1">${request.course_title || request.roadmap_title}</p>
                        <small class="text-muted">Requested: ${new Date(request.created_at).toLocaleDateString()}</small>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-sm btn-primary me-2" onclick="generateCertificateForUser(${request.id})">
                            Generate Certificate
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="rejectRequest(${request.id}, 'certificate')">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading certificate requests:', error);
    }
}

// Load badge requests
async function loadBadgeRequests() {
    try {
        const requests = await api.get('/admin/badge-requests');
        const container = document.getElementById('badge-requests-list');
        
        if (!requests.length) {
            container.innerHTML = '<p class="text-muted">No badge requests pending.</p>';
            return;
        }
        
        container.innerHTML = requests.map(request => `
            <div class="request-item mb-3 p-3 border rounded">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h6 class="mb-1">${request.student_name}</h6>
                        <p class="text-muted mb-1">${request.roadmap_title}</p>
                        <small class="text-muted">Requested: ${new Date(request.created_at).toLocaleDateString()}</small>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-sm btn-warning me-2" onclick="generateBadgeForUser(${request.id})">
                            Generate Badge
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="rejectRequest(${request.id}, 'badge')">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading badge requests:', error);
    }
}

// Generate certificate for user
function generateCertificateForUser(requestId) {
    // Load request details and show generation modal
    api.get(`/admin/certificate-requests/${requestId}`).then(request => {
        document.getElementById('cert-student-name').value = request.student_name;
        document.getElementById('cert-course-title').value = request.course_title || request.roadmap_title;
        document.getElementById('cert-completion-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('cert-instructor-name').value = 'LearnPath';
        document.getElementById('cert-id').value = `CERT-${Date.now()}`;
        
        const modal = new bootstrap.Modal(document.getElementById('certificateGenerationModal'));
        modal.show();
        
        // Store request ID for later use
        window.currentCertificateRequest = requestId;
    });
}

// Generate badge for user
function generateBadgeForUser(requestId) {
    // Load request details and show generation modal
    api.get(`/admin/badge-requests/${requestId}`).then(request => {
        document.getElementById('badge-student-name').value = request.student_name;
        document.getElementById('badge-roadmap-title').value = request.roadmap_title;
        document.getElementById('badge-completion-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('badge-id').value = `BADGE-${Date.now()}`;
        
        const modal = new bootstrap.Modal(document.getElementById('badgeGenerationModal'));
        modal.show();
        
        // Store request ID for later use
        window.currentBadgeRequest = requestId;
    });
}

// Preview and generate functions
function previewCertificate() {
    const studentName = document.getElementById('cert-student-name').value;
    const courseTitle = document.getElementById('cert-course-title').value;
    const completionDate = document.getElementById('cert-completion-date').value;
    const instructorName = document.getElementById('cert-instructor-name').value;
    const certId = document.getElementById('cert-id').value;
    
    showNotification('Certificate preview updated!', 'info');
}

function previewBadge() {
    const studentName = document.getElementById('badge-student-name').value;
    const roadmapTitle = document.getElementById('badge-roadmap-title').value;
    const completionDate = document.getElementById('badge-completion-date').value;
    const badgeId = document.getElementById('badge-id').value;
    
    showNotification('Badge preview updated!', 'info');
}

async function generateCertificate() {
    const certificateData = {
        requestId: window.currentCertificateRequest,
        studentName: document.getElementById('cert-student-name').value,
        courseTitle: document.getElementById('cert-course-title').value,
        completionDate: document.getElementById('cert-completion-date').value,
        instructorName: document.getElementById('cert-instructor-name').value,
        certificateId: document.getElementById('cert-id').value
    };
    
    try {
        await api.post('/admin/generate-certificate', certificateData);
        showNotification('Certificate generated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('certificateGenerationModal')).hide();
        loadCertificateRequests();
    } catch (error) {
        console.error('Error generating certificate:', error);
        showNotification('Failed to generate certificate', 'danger');
    }
}

async function generateBadge() {
    const badgeData = {
        requestId: window.currentBadgeRequest,
        studentName: document.getElementById('badge-student-name').value,
        roadmapTitle: document.getElementById('badge-roadmap-title').value,
        completionDate: document.getElementById('badge-completion-date').value,
        badgeId: document.getElementById('badge-id').value,
        badgeType: document.getElementById('badge-type').value
    };
    
    try {
        await api.post('/admin/generate-badge', badgeData);
        showNotification('Badge generated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('badgeGenerationModal')).hide();
        loadBadgeRequests();
    } catch (error) {
        console.error('Error generating badge:', error);
        showNotification('Failed to generate badge', 'danger');
    }
}

async function rejectRequest(requestId, type) {
    try {
        await api.post(`/admin/reject-${type}-request`, { requestId });
        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} request rejected.`, 'info');
        
        if (type === 'certificate') {
            loadCertificateRequests();
        } else {
            loadBadgeRequests();
        }
    } catch (error) {
        console.error(`Error rejecting ${type} request:`, error);
        showNotification(`Failed to reject ${type} request`, 'danger');
    }
}

// Export data function for admin
function exportData() {
    showNotification('Data export feature coming soon!', 'info');
}

// === NEW COURSE & ADMIN REQUEST ENHANCEMENTS (appended) ===
// If newer implementations already exist earlier, these act as overrides (loaded after earlier definitions).

function authHeaders(){ const t=localStorage.getItem('authToken'); return t? { 'Authorization': `Bearer ${t}` }: {}; }

// Override loadCourses to use enriched backend progress
async function loadCourses(){
    try { 
        const r = await fetch('/api/courses', { headers: authHeaders() }); 
        if(!r.ok) throw 0; 
        const data = await r.json(); 
        const container=document.getElementById('coursesList')||document.getElementById('courses-container'); 
        if(!container) return; 
        container.innerHTML=''; 
        
        if(!data.length) {
            container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No courses found.</p></div>';
            return;
        }
        
        data.forEach(c => {
            const difficulty = c.difficulty || 'Beginner';
            const badgeClass = difficulty === 'Beginner' ? 'bg-success' : 
                              difficulty === 'Intermediate' ? 'bg-warning' : 'bg-info';
                              
            const progressBarClass = c.progress >= 100 ? 'bg-success' : 'bg-primary';
            
            const courseCard = `
                <div class="col-md-4 mb-4">
                    <div class="card roadmap-card h-100 fade-in">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="card-title fw-bold">${c.title}</h5>
                                <span class="badge ${badgeClass}">${difficulty}</span>
                            </div>
                            <p class="card-text text-muted">${c.description || 'No description available'}</p>
                            <div class="progress mb-2" style="height: 8px;">
                                <div class="progress-bar ${progressBarClass}" style="width: ${c.progress||0}%"></div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span><i class="far fa-clock me-1"></i> ${c.duration || 2} hours</span>
                                <span><i class="fas fa-book me-1"></i> ${c.lessons_count || 0} lessons</span>
                            </div>
                            <small class="text-muted d-block text-center">${c.progress||0}% complete</small>
                        </div>
                        <div class="card-footer bg-white">
                            <button class="btn btn-primary w-100" onclick="openCourse(${c.id})">
                                ${c.progress > 0 ? 'Continue Course' : 'Start Course'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += courseCard;
        }); 
    } catch(e){ 
        console.error(e);
    } 
}

// Override openCourse to fetch fresh data
async function openCourse(id){ try { const r= await fetch(`/api/courses/${id}`, { headers: authHeaders() }); if(!r.ok) throw 0; const c= await r.json(); currentCourse=c; // Reuse existing detail page if present
    if(document.getElementById('course-detail-page')) { // old structure
        document.getElementById('course-title').textContent=c.title;
        document.getElementById('course-description').textContent=c.description||'';
        document.getElementById('course-difficulty').textContent=c.difficulty||'';
        document.getElementById('course-progress-bar').style.width=(c.progress||0)+'%';
        document.getElementById('course-progress-text').textContent=(c.progress||0)+'% Complete';
        renderCourseLessonList(c.lessons||[]);
        updateCourseActionButtons(c);
        showPage('course-detail-page');
    }
} catch(e){ console.error(e);} }

function openLessonResource(url) {
    if (!url) return;
    // Decode URL if it was encoded for HTML
    const decodedUrl = url.replace(/%27/g, "'");
    // Open in new tab/window
    window.open(decodedUrl, '_blank');
}

function renderCourseLessonList(lessons){ const container=document.getElementById('course-lessons'); if(!container) return; container.innerHTML = lessons.map(l=>`<div class='d-flex align-items-center border rounded p-2 mb-2 ${l.completed?'bg-light':''}'><div class='flex-grow-1'><div class='fw-semibold small mb-1'>${l.title}</div>${l.duration?`<small class='text-muted d-block mb-1'>${l.duration}</small>`:''}${l.resource_url?`<button class='btn btn-sm btn-outline-primary' onclick="openLessonResource('${l.resource_url.replace(/'/g,"%27")}')"><i class='fa fa-play'></i> Resource</button>`:''}</div><div><button class='btn btn-sm ${l.completed?'btn-success':'btn-outline-secondary'}' data-lesson-id='${l.id}' data-completed='${l.completed?1:0}' onclick='toggleLessonComplete(${l.id})'>${l.completed?'<i class="fa fa-check"></i>':'<i class="fa fa-circle"></i>'}</button></div></div>`).join('') || '<div class="text-muted">No lessons</div>'; }

async function toggleLessonComplete(lessonId, forceComplete=false){ 
    try { 
        const btn=document.querySelector(`button[data-lesson-id='${lessonId}']`); 
        const current = btn? btn.getAttribute('data-completed')==='1':false; 
        const completed = forceComplete? true: !current; 
        const r = await fetch(`/api/lessons/${lessonId}/progress`, { 
            method:'POST', 
            headers:{ 'Content-Type':'application/json', ...authHeaders() }, 
            body: JSON.stringify({ completed })
        }); 
        
        if(!r.ok) {
            if(r.status === 404) {
                showNotification('Lesson not found', 'warning');
                return;
            }
            throw new Error(`HTTP ${r.status}`);
        }
        
        const data= await r.json(); 
        if(btn){ 
            btn.className='btn btn-sm '+(completed?'btn-success':'btn-outline-secondary'); 
            btn.innerHTML = completed? '<i class="fa fa-check"></i>':'<i class="fa fa-circle"></i>'; 
            btn.setAttribute('data-completed', completed? '1':'0'); 
        }
        
        if(typeof data.progress==='number'){ 
            document.getElementById('course-progress-bar').style.width=data.progress+'%'; 
            document.getElementById('course-progress-text').textContent=data.progress+'% Complete'; 
            if(currentCourse) currentCourse.progress=data.progress; 
            updateCourseActionButtons(currentCourse); 
            
            // Show course completion modal if course was just completed for the first time
            if (data.courseCompleted) {
                const completionKey = `course_completed_${currentCourse.id}_${currentUser.id}`;
                const alreadyCompleted = localStorage.getItem(completionKey);
                
                if (!alreadyCompleted) {
                    // First time completion - show modal and set flag
                    localStorage.setItem(completionKey, 'true');
                    showCourseCompletionModal();
                }
            }
        }
    } catch(e){ 
        console.error('Error updating lesson progress:', e);
        showNotification('Failed to update lesson progress', 'danger');
    } 
}

function updateCourseActionButtons(course){ 
    if(!course) return; 
    const startBtn=document.getElementById('start-course-btn'); 
    const completeBtn=document.getElementById('complete-course-btn'); 
    const requestBtn=document.getElementById('request-certificate-btn'); 
    const viewBtn=document.getElementById('view-certificate-btn'); 
    const progress=course.progress||0; 
    
    if(startBtn){ 
        startBtn.style.display = progress===0? 'block':'none'; 
    } 
    if(completeBtn){ 
        completeBtn.style.display = progress>0 && progress<100? 'block':'none'; 
    } 
    if(requestBtn){ 
        // Show generate certificate button if course is completed and no certificate exists
        requestBtn.style.display = progress===100 && !course.has_certificate? 'block':'none'; 
        requestBtn.disabled = !!course.has_certificate; 
    } 
    if(viewBtn){ 
        viewBtn.style.display = progress===100 && course.has_certificate? 'block':'none'; 
    } 
}

async function startCourse(){ if(!currentCourse) return; await fetch(`/api/courses/${currentCourse.id}/start`, { method:'POST', headers: authHeaders() }); openCourse(currentCourse.id); }
async function completeCourse(){ if(!currentCourse) return; for(const l of currentCourse.lessons||[]) if(!l.completed) await toggleLessonComplete(l.id,true); }
async function requestCourseCertificate(){ 
    if(!currentCourse) return; 
    
    // Show modal to get user details
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Generate Certificate</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="course-certificate-form">
                        <div class="mb-3">
                            <label for="course-student-name" class="form-label">Student Name*</label>
                            <input type="text" class="form-control" id="course-student-name" required 
                                   placeholder="Enter full name for certificate">
                        </div>
                        <div class="mb-3">
                            <label for="course-completion-date" class="form-label">Completion Date*</label>
                            <input type="date" class="form-control" id="course-completion-date" required 
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="generateCourseCertificate()">
                        <i class="fas fa-certificate me-2"></i>Generate Certificate
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Remove modal from DOM after it's hidden
    modal.addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Generate course certificate
async function generateCourseCertificate() {
    if (!currentCourse) return;

    try {
        const response = await fetch(`${API_BASE}/courses/${currentCourse.id}/generate-certificate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            // Hide any open modal
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                bootstrap.Modal.getInstance(openModal).hide();
            }

            showAlert('Certificate generated successfully! Opening in new tab...', 'success');

            // Open certificate in new tab
            setTimeout(() => {
                window.open(result.certificateUrl, '_blank');
            }, 1000);

        } else {
            if (result.alreadyExists) {
                showAlert('Certificate already exists for this course!', 'info');
            } else {
                showAlert(result.error || 'Failed to generate certificate', 'danger');
            }
        }

    } catch (error) {
        console.error('Error generating certificate:', error);
        showAlert('Failed to generate certificate', 'danger');
    }
}

// Admin unified requests summary auto-load when admin page shows
async function loadAdminRequestsSummary(){ if(!currentUser||currentUser.role!=='admin') return; try { const r= await fetch('/api/admin/requests/summary',{ headers: authHeaders()}); if(!r.ok) return; const data= await r.json(); // simple inject into placeholders if they exist
 const certWrap=document.getElementById('adminPendingCertificates'); if(certWrap) certWrap.innerHTML = data.certificates.map(c=>`<div class='border rounded p-2 mb-2 d-flex justify-content-between align-items-center'><div><strong>${c.student_name}</strong><br/><small>${c.certificate_title}</small></div><button class='btn btn-sm btn-success' onclick='approveCertificateRequest(${c.id})'><i class="fa fa-check"></i></button></div>`).join('') || '<div class="text-muted">No pending certificates</div>';
 const badgeWrap=document.getElementById('adminPendingBadges'); if(badgeWrap) badgeWrap.innerHTML = data.badges.map(b=>`<div class='border rounded p-2 mb-2 d-flex justify-content-between align-items-center'><div><strong>${b.student_name}</strong><br/><small>${b.roadmap_title}</small></div><button class='btn btn-sm btn-success' onclick='approveBadgeRequest(${b.id})'><i class="fa fa-check"></i></button></div>`).join('') || '<div class="text-muted">No pending badges</div>';
 } catch(e){ console.error(e);} }

async function approveCertificateRequest(id){ try { const r= await fetch(`/api/admin/certificate-requests/${id}/approve`, { method:'POST', headers: authHeaders()}); if(r.ok){ showNotification('Certificate approved','success'); loadAdminRequestsSummary(); } } catch(e){ console.error(e);} }
async function approveBadgeRequest(id){ try { const r= await fetch(`/api/admin/badge-requests/${id}/approve`, { method:'POST', headers: authHeaders()}); if(r.ok){ showNotification('Badge approved','success'); loadAdminRequestsSummary(); } } catch(e){ console.error(e);} }

// (Removed intermediate showPage override previously here)

// ===== ADMIN COURSE MANAGEMENT UI =====
async function adminLoadCourses(){ if(!currentUser||currentUser.role!=='admin') return; try { const r= await fetch('/api/courses', { headers: authHeaders() }); if(!r.ok) throw 0; const data= await r.json(); const wrap=document.getElementById('admin-courses-list-main'); if(!wrap) return; 
    if(data.length === 0) {
        wrap.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-book fa-2x mb-3"></i><p>No courses available. <a href="#" onclick="adminOpenCourseEditor()">Create your first course</a></p></div>';
        return;
    }
    wrap.innerHTML=''; 
    data.forEach(c=>{
        const courseCard = document.createElement('div');
        courseCard.className = 'mb-3 p-3 border rounded';
        courseCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="fw-bold mb-1">${c.title}</h6>
                    <p class="text-muted small mb-2">${(c.description||'').slice(0,150)}${(c.description||'').length > 150 ? '...' : ''}</p>
                    <div class="d-flex align-items-center gap-3 text-muted small">
                        <span><i class="fas fa-signal"></i> ${c.difficulty}</span>
                        <span><i class="fas fa-clock"></i> ${c.duration} hours</span>
                        <span><i class="fas fa-book-open"></i> ${c.lessons_count || 0} lessons</span>
                        <span><i class="fas fa-users"></i> ${c.students_count || 0} students</span>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="adminManageLessons(${c.id})">
                        <i class="fas fa-cog"></i> Manage
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="adminEditCourse(${c.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="adminDeleteCourse(${c.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        wrap.appendChild(courseCard);
    });
} catch(e){ console.error(e); }
}

function adminOpenCourseEditor(){ if(!currentUser||currentUser.role!=='admin') return; document.getElementById('admin-course-id').value=''; document.getElementById('admin-course-title').value=''; document.getElementById('admin-course-description').value=''; document.getElementById('admin-course-difficulty').value='Beginner'; document.getElementById('admin-course-duration').value='2'; document.getElementById('courseEditorTitle').textContent='New Course'; new bootstrap.Modal(document.getElementById('courseEditorModal')).show(); }

async function adminEditCourse(id){ try { const r= await fetch(`/api/courses/${id}`, { headers: authHeaders() }); if(!r.ok) throw 0; const c= await r.json(); document.getElementById('admin-course-id').value=c.id; document.getElementById('admin-course-title').value=c.title; document.getElementById('admin-course-description').value=c.description||''; document.getElementById('admin-course-difficulty').value=c.difficulty||'Beginner'; document.getElementById('admin-course-duration').value=c.duration||2; document.getElementById('courseEditorTitle').textContent='Edit Course'; new bootstrap.Modal(document.getElementById('courseEditorModal')).show(); } catch(e){ console.error(e); }
}

async function adminDeleteCourse(id){ if(!confirm('Delete this course?')) return; try { const r= await fetch(`/api/courses/${id}`, { method:'DELETE', headers: authHeaders() }); if(r.ok){ showNotification('Course deleted','success'); adminLoadCourses(); } } catch(e){ console.error(e); }
}

document.addEventListener('submit', e=>{ if(e.target && e.target.id==='admin-course-form'){ e.preventDefault(); adminSaveCourse(); } if(e.target && e.target.id==='admin-lesson-form'){ e.preventDefault(); adminSaveLesson(); } });

async function adminSaveCourse(){ const id=document.getElementById('admin-course-id').value; const payload={ title: document.getElementById('admin-course-title').value.trim(), description: document.getElementById('admin-course-description').value.trim(), difficulty: document.getElementById('admin-course-difficulty').value, duration: parseInt(document.getElementById('admin-course-duration').value)||2 }; if(!payload.title||!payload.description) return showNotification('Title & description required','warning'); try { const r= await fetch(id? `/api/courses/${id}`:'/api/courses',{ method: id? 'PUT':'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify(payload)}); if(!r.ok) throw 0; showNotification('Course saved','success'); bootstrap.Modal.getInstance(document.getElementById('courseEditorModal')).hide(); adminLoadCourses(); } catch(e){ showNotification('Save failed','danger'); }
}

async function adminManageLessons(courseId){ try { const r= await fetch(`/api/courses/${courseId}`, { headers: authHeaders() }); if(!r.ok) throw 0; const c= await r.json(); window.__lessonCourseId=courseId; const lessonsHtml = (c.lessons||[]).map(l=>`<tr><td>${l.title}</td><td>${l.duration||''}</td><td>${l.completed?'<i class=\'fa fa-check text-success\'></i>':''}</td><td class='text-end'><div class='btn-group btn-group-sm'><button class='btn btn-outline-secondary' onclick='adminEditLesson(${l.id},${courseId})'><i class=\'fas fa-edit\'></i></button><button class='btn btn-outline-danger' onclick='adminDeleteLesson(${l.id},${courseId})'><i class=\'fas fa-trash\'></i></button></div></td></tr>`).join('') || '<tr><td colspan="4" class="text-muted">No lessons</td></tr>';
    const modalMarkup = `<div class="modal fade" id="lessonManageModal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Lessons: ${c.title}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><div class='d-flex justify-content-end mb-2'><button class='btn btn-sm btn-primary' onclick='adminOpenLessonEditor(${courseId})'><i class="fas fa-plus me-1"></i>Add Lesson</button></div><table class='table table-sm'><thead><tr><th>Title</th><th style='width:120px;'>Duration</th><th style='width:40px;'>Done</th><th style='width:120px;'></th></tr></thead><tbody id='admin-lessons-tbody'>${lessonsHtml}</tbody></table></div></div></div></div>`;
    const existing=document.getElementById('lessonManageModal'); if(existing) existing.remove(); document.body.insertAdjacentHTML('beforeend', modalMarkup); const modal = new bootstrap.Modal(document.getElementById('lessonManageModal')); modal.show(); document.getElementById('lessonManageModal').addEventListener('hidden.bs.modal',()=>{ document.getElementById('lessonManageModal').remove(); }); } catch(e){ console.error(e); }
}

function adminOpenLessonEditor(courseId){ document.getElementById('admin-lesson-course-id').value=courseId; document.getElementById('admin-lesson-id').value=''; document.getElementById('admin-lesson-title').value=''; document.getElementById('admin-lesson-duration').value=''; document.getElementById('admin-lesson-resource').value=''; document.getElementById('admin-lesson-order').value='1'; document.getElementById('lessonEditorTitle').textContent='New Lesson'; new bootstrap.Modal(document.getElementById('lessonEditorModal')).show(); }

async function adminEditLesson(lessonId, courseId){ try { const r= await fetch(`/api/courses/${courseId}`, { headers: authHeaders() }); if(!r.ok) throw 0; const c= await r.json(); const lesson=(c.lessons||[]).find(l=>l.id===lessonId); if(!lesson) return; document.getElementById('admin-lesson-course-id').value=courseId; document.getElementById('admin-lesson-id').value=lesson.id; document.getElementById('admin-lesson-title').value=lesson.title; document.getElementById('admin-lesson-duration').value=lesson.duration||''; document.getElementById('admin-lesson-resource').value=lesson.resource_url||''; document.getElementById('admin-lesson-order').value=lesson.order_index||1; document.getElementById('lessonEditorTitle').textContent='Edit Lesson'; new bootstrap.Modal(document.getElementById('lessonEditorModal')).show(); } catch(e){ console.error(e); }
}

async function adminSaveLesson(){ const courseId=document.getElementById('admin-lesson-course-id').value; const lessonId=document.getElementById('admin-lesson-id').value; const payload={ title: document.getElementById('admin-lesson-title').value.trim(), duration: document.getElementById('admin-lesson-duration').value.trim(), resource_url: document.getElementById('admin-lesson-resource').value.trim(), order_index: parseInt(document.getElementById('admin-lesson-order').value)||1 }; if(!payload.title) return showNotification('Title required','warning'); try { const url = lessonId? `/api/lessons/${lessonId}`: `/api/courses/${courseId}/lessons`; const method = lessonId? 'PUT':'POST'; const r= await fetch(url,{ method, headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify(payload)}); if(!r.ok) throw 0; showNotification('Lesson saved','success'); bootstrap.Modal.getInstance(document.getElementById('lessonEditorModal')).hide(); adminManageLessons(courseId); } catch(e){ showNotification('Save failed','danger'); }
}

async function adminDeleteLesson(lessonId, courseId){ if(!confirm('Delete lesson?')) return; try { const r= await fetch(`/api/lessons/${lessonId}`, { method:'DELETE', headers: authHeaders() }); if(r.ok){ showNotification('Lesson deleted','success'); adminManageLessons(courseId); } } catch(e){ console.error(e); }
}

// Unified showPage implementation appended at end of file
function showPage(pageId){
    if(!currentUser){ const protectedPages=['progress-page','profile-page','admin-page','course-detail-page']; if(protectedPages.includes(pageId)) pageId='home-page'; }
    if(currentUser && currentUser.role!=='admin' && pageId==='admin-page') pageId='home-page';
    if(__currentPageId===pageId) return;
    __currentPageId = pageId;
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const tp=document.getElementById(pageId); if(tp) tp.classList.add('active');
    switch(pageId){
        case 'profile-page': if(currentUser) loadProfileData(); break;
        case 'progress-page': if(currentUser) loadMyProgressPage(); break;
        case 'admin-page': if(currentUser && currentUser.role==='admin'){ loadAdminStats(); loadAdminRoadmaps(); adminLoadCourses(); loadAdminRequestsSummary(); } break;
        case 'courses-page': loadCourses(); break;
    }
}

// My Progress page functionality
async function loadMyProgressPage() {
    if (!currentUser) {
        showPage('login-page');
        return;
    }

    try {
        // Load main progress data
        const progressResponse = await fetch(`${API_BASE}/my-progress`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });

        if (!progressResponse.ok) {
            throw new Error('Failed to load progress data');
        }

        const progressData = await progressResponse.json();

        // Display progress statistics
        displayProgressStats(progressData.stats);

        // Display roadmaps progress
        displayMyRoadmaps(progressData.roadmaps);

        // Display courses progress  
        displayMyCourses(progressData.courses);

        // Load recent activity
        loadMyActivity();

    } catch (error) {
        console.error('Error loading My Progress:', error);
        showAlert('Failed to load progress data', 'danger');
    }
}

function displayProgressStats(stats) {
    // Update progress statistics in the UI
    const elements = {
        'my-roadmaps-enrolled': stats.roadmaps_enrolled || 0,
        'my-roadmaps-completed': stats.roadmaps_completed || 0,
        'my-courses-enrolled': stats.courses_enrolled || 0,
        'my-courses-completed': stats.courses_completed || 0,
        'my-tasks-completed': stats.total_tasks_completed || 0,
        'my-lessons-completed': stats.total_lessons_completed || 0,
        'my-badges-earned': stats.badges_earned || 0,
        'my-certificates-earned': stats.certificates_earned || 0
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function displayMyRoadmaps(roadmaps) {
    const container = document.getElementById('my-roadmaps-list');
    if (!container) return;

    if (!roadmaps || roadmaps.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-route fa-3x text-muted mb-3"></i>
                <h5>No Roadmaps Started</h5>
                <p class="text-muted">Start your learning journey by choosing a roadmap</p>
                <button class="btn btn-primary" onclick="showPage('roadmaps-page')">Browse Roadmaps</button>
            </div>
        `;
        return;
    }

    container.innerHTML = roadmaps.map(roadmap => `
        <div class="card mb-3 roadmap-progress-card">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="card-title mb-2">${roadmap.title}</h6>
                        <p class="text-muted small mb-2">${roadmap.description || ''}</p>
                        <div class="d-flex gap-2 mb-2">
                            <span class="badge bg-primary">${roadmap.difficulty}</span>
                            <span class="badge bg-secondary">${roadmap.duration} days</span>
                            ${roadmap.completed_at ? '<span class="badge bg-success">Completed</span>' : ''}
                        </div>
                        <small class="text-muted">
                            Started: ${new Date(roadmap.started_at).toLocaleDateString()}
                            ${roadmap.completed_at ? ` • Completed: ${new Date(roadmap.completed_at).toLocaleDateString()}` : ''}
                        </small>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar ${roadmap.progress_percentage >= 100 ? 'bg-success' : 'bg-primary'}" 
                                 style="width: ${roadmap.progress_percentage || 0}%"></div>
                        </div>
                        <div class="text-center">
                            <strong>${Math.round(roadmap.progress_percentage || 0)}%</strong>
                            <div class="small text-muted">
                                ${roadmap.completed_tasks}/${roadmap.total_tasks} tasks
                            </div>
                            <button class="btn btn-sm btn-outline-primary mt-2" 
                                    onclick="viewRoadmap(${roadmap.id})">
                                ${roadmap.completed_at ? 'Review' : 'Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayMyCourses(courses) {
    const container = document.getElementById('my-courses-list');
    if (!container) return;

    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-book fa-3x text-muted mb-3"></i>
                <h5>No Courses Started</h5>
                <p class="text-muted">Enhance your skills with our courses</p>
                <button class="btn btn-primary" onclick="showPage('courses-page')">Browse Courses</button>
            </div>
        `;
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="card mb-3 course-progress-card">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h6 class="card-title mb-2">${course.title}</h6>
                        <p class="text-muted small mb-2">${course.description || ''}</p>
                        <div class="d-flex gap-2 mb-2">
                            <span class="badge bg-info">${course.difficulty}</span>
                            <span class="badge bg-secondary">${course.duration} hours</span>
                            ${course.completed_at ? '<span class="badge bg-success">Completed</span>' : ''}
                        </div>
                        <small class="text-muted">
                            Started: ${new Date(course.enrolled_at).toLocaleDateString()}
                            ${course.completed_at ? ` • Completed: ${new Date(course.completed_at).toLocaleDateString()}` : ''}
                        </small>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="progress mb-2" style="height: 8px;">
                            <div class="progress-bar ${course.progress >= 100 ? 'bg-success' : 'bg-primary'}" 
                                 style="width: ${course.progress || 0}%"></div>
                        </div>
                        <div class="text-center">
                            <strong>${Math.round(course.progress || 0)}%</strong>
                            <div class="small text-muted">
                                ${course.completed_lessons}/${course.total_lessons} lessons
                            </div>
                            <button class="btn btn-sm btn-outline-primary mt-2" 
                                    onclick="openCourse(${course.id})">
                                ${course.completed_at ? 'Review' : 'Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadMyActivity() {
    try {
        const response = await fetch(`${API_BASE}/my-progress/activity`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });

        if (response.ok) {
            const activities = await response.json();
            displayMyActivity(activities);
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

function displayMyActivity(activities) {
    const container = document.getElementById('my-activity-list');
    if (!container) return;

    if (!activities || activities.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">No recent activity</div>';
        return;
    }

    container.innerHTML = activities.map(activity => {
        const icon = getActivityTypeIcon(activity.activity_type);
        return `
            <div class="d-flex align-items-center mb-3">
                <div class="activity-icon me-3">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="fw-semibold">${activity.description}</div>
                    <small class="text-muted">in ${activity.context_title}</small>
                </div>
                <small class="text-muted">${formatDate(activity.activity_date)}</small>
            </div>
        `;
    }).join('');
}

function getActivityTypeIcon(type) {
    const icons = {
        'task_completed': 'fa-check-circle text-success',
        'lesson_completed': 'fa-play-circle text-primary',
        'roadmap_enrolled': 'fa-route text-info',
        'course_enrolled': 'fa-book text-info'
    };
    return icons[type] || 'fa-circle';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// EOF