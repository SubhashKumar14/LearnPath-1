// Global variables
let currentUser = null;
let roadmaps = [];
let currentRoadmap = null;
let userProgress = null;

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

// Load user profile data
async function loadUserProfile() {
    if (!currentUser) return;

    try {
        // Load user statistics and progress
        const [progressResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE}/progress/${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            }),
            fetch(`${API_BASE}/user/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            })
        ]);

        const progressData = progressResponse.ok ? await progressResponse.json() : null;
        const statsData = statsResponse.ok ? await statsResponse.json() : null;

        updateProfileUI(progressData, statsData);
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Update profile UI
function updateProfileUI(progressData, statsData) {
    document.getElementById('profile-name').textContent = currentUser.username;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-role').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

    // Update avatar
    const profileAvatar = document.getElementById('profile-avatar');
    profileAvatar.innerHTML = `<div class="user-avatar-large">${currentUser.username.substring(0, 2).toUpperCase()}</div>`;

    // Update statistics
    if (statsData) {
        document.getElementById('profile-roadmaps-started').textContent = statsData.roadmapsStarted || 0;
        document.getElementById('profile-roadmaps-completed').textContent = statsData.roadmapsCompleted || 0;
        document.getElementById('profile-tasks-completed').textContent = statsData.tasksCompleted || 0;
        document.getElementById('profile-badges-earned').textContent = statsData.badgesEarned || 0;
    }

    // Load recent activity and active roadmaps
    loadRecentActivity();
    loadActiveRoadmaps();
}

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
        const response = await fetch(`${API_BASE}/progress/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const progressData = await response.json();
            displayProgressData(progressData);
        } else {
            showAlert('Error loading progress data', 'danger');
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        showAlert('Error loading progress data', 'danger');
    }
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
async function viewRoadmap(roadmapId) {
    if (!currentUser) {
        showAlert('Please log in to view roadmap details', 'warning');
        showPage('login-page');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/roadmaps/${roadmapId}`);
        
        if (response.ok) {
            const roadmapData = await response.json();
            currentRoadmap = roadmapData;
            displayRoadmapDetail(roadmapData);
            showPage('roadmap-detail-page');
        } else {
            showAlert('Error loading roadmap details', 'danger');
        }
    } catch (error) {
        console.error('Error loading roadmap:', error);
        showAlert('Error loading roadmap details', 'danger');
    }
}

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
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-5">
                        <i class="fas fa-trophy text-warning fa-4x mb-3"></i>
                        <h3 class="fw-bold text-success mb-3">Congratulations!</h3>
                        <p class="lead">You've completed the roadmap: <strong>${currentRoadmap.title}</strong></p>
                        <p class="text-muted">You can now request a certificate or badge for this achievement.</p>
                        <div class="d-flex gap-3 justify-content-center mt-4">
                            <button class="btn btn-primary" onclick="requestCertificate()">
                                <i class="fas fa-certificate me-2"></i>Request Certificate
                            </button>
                            <button class="btn btn-outline-primary" onclick="requestBadge()">
                                <i class="fas fa-medal me-2"></i>Request Badge
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    const modalElement = new bootstrap.Modal(document.getElementById('completionModal'));
    modalElement.show();
    
    // Remove modal from DOM after it's hidden
    document.getElementById('completionModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Request certificate
async function requestCertificate() {
    try {
        const response = await fetch(`${API_BASE}/certificates/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roadmapId: currentRoadmap.id,
                type: 'certificate'
            })
        });

        if (response.ok) {
            showAlert('Certificate request submitted! You will be notified when it\'s ready.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('completionModal')).hide();
        } else {
            const error = await response.json();
            showAlert(error.error || 'Error requesting certificate', 'danger');
        }
    } catch (error) {
        console.error('Error requesting certificate:', error);
        showAlert('Error requesting certificate', 'danger');
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

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Update the showPage function to load data when needed
const originalShowPage = showPage;
showPage = function(pageId) {
    originalShowPage(pageId);
    
    // Load specific data based on page
    if (pageId === 'profile-page' && currentUser) {
        loadUserProfile();
    } else if (pageId === 'progress-page' && currentUser) {
        loadProgressPage();
    }
};