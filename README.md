# 🎓 LearnPath - Enhanced Learning Management Platform

> **A comprehensive roadmap-based learning platform with progress tracking, certificate generation, and admin analytics.**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/SubhashKumar14/LearnPath-1)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/mysql-8.0%2B-orange.svg)](https://mysql.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [💻 Usage](#-usage)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [📊 API Documentation](#-api-documentation)
- [🗄️ Database Schema](#️-database-schema)
- [🎨 Frontend Structure](#-frontend-structure)
- [🔧 Development](#-development)
- [🚀 Deployment](#-deployment)
- [🐛 Troubleshooting](#-troubleshooting)
- [📈 Future Roadmap](#-future-roadmap)
- [🤝 Contributing](#-contributing)

## 🌟 Features

### 🎯 Core Learning Features
- **🛤️ Learning Roadmaps**: Structured learning paths with modules and tasks
- **📚 Course Management**: Comprehensive course system with lessons and progress tracking
- **✅ Progress Tracking**: Real-time task and lesson completion monitoring
- **🏆 Achievement System**: Automated badge generation and milestone tracking
- **📜 Certificate Generation**: PDF certificates for course completion
- **📱 Responsive Design**: Mobile-first Bootstrap 5 interface

### 👨‍💼 Admin Features
- **📊 Analytics Dashboard**: Comprehensive statistics and user insights
- **👥 User Management**: View user progress and activity
- **📝 Content Creation**: CRUD operations for roadmaps, modules, tasks, and courses
- **🎖️ Badge & Certificate Management**: Automated and manual certificate issuance
- **📈 Performance Metrics**: Completion rates, engagement analytics, and trend analysis

### 🔒 Security Features
- **🔐 JWT Authentication**: Secure token-based authentication
- **🛡️ Role-Based Access Control**: Admin and user role separation
- **🔒 Password Hashing**: bcrypt encryption for secure password storage
- **🚫 Input Validation**: Comprehensive server-side validation
- **🏠 Session Management**: Secure session handling with MySQL store

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│  (Bootstrap 5)  │◄──►│  (Express.js)   │◄──►│    (MySQL)      │
│                 │    │                 │    │                 │
│ • Vanilla JS    │    │ • REST API      │    │ • User Data     │
│ • SPA Design    │    │ • JWT Auth      │    │ • Progress      │
│ • Progress UI   │    │ • Middleware    │    │ • Content       │
│ • Admin Panel   │    │ • Validation    │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Project Structure
```
LearnPath/
├── 📄 server.js              # Main Express server
├── 🔐 auth_middleware.js     # JWT authentication middleware
├── 🗄️ db.js                  # MySQL database connection
├── 📋 schema.sql             # Complete database schema
├── ⚙️ .env                   # Environment configuration
├── 📦 package.json           # Dependencies and scripts
├── 📖 README.md              # This documentation
├── 📁 public/                # Frontend static files
│   ├── 🏠 index.html         # Main SPA interface
│   ├── 🎓 certificate.html   # Certificate template
│   ├── 🏆 badge.html         # Badge template
│   ├── 🎨 css/style.css      # Custom styling
│   └── 💻 js/app.js          # Frontend application logic
└── 📁 docs/                  # Documentation and diagrams
    └── 🖼️ images/            # Architecture diagrams
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **MySQL** 8.0+ installed and running
- **Git** for cloning the repository

### 1-Minute Setup
```bash
# Clone the repository
git clone https://github.com/SubhashKumar14/LearnPath-1.git
cd LearnPath-1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Create and populate database
mysql -u root -p < schema.sql

# Start the server
npm start
```

🎉 **Access your application at:** http://localhost:3000

## 📦 Installation

### Detailed Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/SubhashKumar14/LearnPath-1.git
   cd LearnPath-1
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Create database (or use the schema.sql file)
   CREATE DATABASE learnpath_db;
   EXIT;
   
   # Import schema and sample data
   mysql -u root -p < schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit the configuration
   nano .env
   ```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=learnpath_db

# Server Configuration
PORT=3000
NODE_ENV=development

# Security Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
SESSION_SECRET=your_super_secure_session_secret_key_change_in_production
```

### Database Configuration

The application uses MySQL with connection pooling. Key configuration:

- **Connection Pool**: 10 concurrent connections
- **Timeout**: 60 seconds
- **Charset**: utf8mb4 for full Unicode support
- **Timezone**: UTC for consistency

## 💻 Usage

### 🔑 Default Login Credentials

| Role  | Email                | Password  | Purpose                    |
|-------|---------------------|-----------|----------------------------|
| Admin | admin@learnpath.com | password  | Full platform management   |
| User  | john@example.com    | password  | Learning and progress      |
| User  | jane@example.com    | password  | Learning and progress      |

### 👨‍💼 Admin Features

1. **Dashboard Access**: Login as admin to access the analytics dashboard
2. **Content Management**: Create and edit roadmaps, modules, tasks, and courses
3. **User Analytics**: View user progress, completion rates, and engagement metrics
4. **Certificate Management**: Issue certificates and track achievements

### 👨‍🎓 User Features

1. **Browse Content**: Explore available roadmaps and courses
2. **Track Progress**: Monitor completion status on the "My Progress" page
3. **Earn Badges**: Automatic badge generation upon 100% roadmap completion
4. **Get Certificates**: Receive certificates for completed courses

## 🔐 Authentication & Authorization

### Authentication Flow
1. **Registration/Login**: Users authenticate with email/password
2. **JWT Token**: Server issues JWT token upon successful login
3. **Token Storage**: Frontend stores token in localStorage
4. **Request Authorization**: Token sent in Authorization header
5. **Role Verification**: Middleware validates token and user role

### Role-Based Access Control

```javascript
// User roles
const ROLES = {
  USER: 'user',      // Can access learning content and progress
  ADMIN: 'admin'     // Full access to admin dashboard and management
};

// Route protection examples
app.get('/api/admin/*', requireAdmin);    // Admin only
app.get('/api/user/*', authenticateToken); // Authenticated users
app.get('/api/public/*');                 // Public access
```

## 📊 API Documentation

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/register` | User registration | Public |
| POST | `/api/login` | User authentication | Public |
| GET | `/api/profile` | Get user profile | User |
| PUT | `/api/profile` | Update user profile | User |

### 📚 Learning Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/roadmaps` | Get all roadmaps | Public |
| GET | `/api/roadmaps/:id` | Get roadmap details | Public |
| GET | `/api/courses` | Get all courses | Public |
| GET | `/api/courses/:id` | Get course details | Public |
| POST | `/api/progress/task` | Update task progress | User |
| POST | `/api/progress/lesson` | Update lesson progress | User |

### 👨‍💼 Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/user-analytics` | User analytics | Admin |
| POST | `/api/admin/roadmaps` | Create roadmap | Admin |
| PUT | `/api/admin/roadmaps/:id` | Update roadmap | Admin |
| DELETE | `/api/admin/roadmaps/:id` | Delete roadmap | Admin |

### 🏆 Achievement Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/roadmaps/:id/generate-badge` | Generate badge | User |
| POST | `/api/courses/:id/generate-certificate` | Generate certificate | User |
| GET | `/api/user/achievements` | Get user achievements | User |
| GET | `/api/user/certificates` | Get user certificates | User |

## 🗄️ Database Schema

### Core Tables

```sql
-- Users and Authentication
users (id, username, email, password, role, created_at, last_login)
sessions (session_id, expires, data)

-- Learning Content Structure
roadmaps (id, title, description, created_at)
modules (id, roadmap_id, title, description, order_index)
tasks (id, module_id, title, description, resource_url, order_index)

-- Course System
courses (id, title, description, difficulty, duration, category, instructor)
course_lessons (id, course_id, title, content, duration, order_index)

-- Progress Tracking
user_roadmaps (id, user_id, roadmap_id, enrolled_at)
user_progress (id, user_id, task_id, completed, completed_at)
user_courses (id, user_id, course_id, enrolled_at, progress, completed_at)
lesson_progress (id, user_id, lesson_id, completed, completed_at)

-- Achievements and Recognition
certificates (id, certificate_id, user_id, course_id, student_name, title, completion_date)
badges (id, badge_id, user_id, roadmap_id, student_name, badge_type, completion_date)
user_achievements (id, user_id, achievement_type, achievement_title, earned_at)
```

### Performance Optimizations
- **Indexes**: Strategic indexes on user_id, completion status, and foreign keys
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized joins and aggregations for analytics

## 🎨 Frontend Structure

### Technology Stack
- **HTML5**: Semantic markup structure
- **Bootstrap 5**: Responsive CSS framework
- **Vanilla JavaScript**: No framework dependencies
- **Font Awesome**: Icon library
- **SPA Architecture**: Single Page Application design

### Key Frontend Components

```javascript
// Main application modules
- Authentication (login/register/logout)
- Navigation (role-based menu visibility)
- Dashboard (user progress and admin analytics)
- Content Management (CRUD operations)
- Progress Tracking (real-time updates)
- Certificate Generation (PDF download)
```

### UI/UX Features
- 📱 **Mobile Responsive**: Optimized for all screen sizes
- 🎨 **Modern Design**: Clean, professional interface
- ⚡ **Fast Loading**: Optimized assets and caching
- ♿ **Accessible**: ARIA labels and semantic HTML
- 🌙 **Consistent Theming**: Unified color scheme and typography

## 🔧 Development

### Development Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Database migration
npm run db:migrate

# Manual database commands
mysql -u root -p learnpath_db < schema.sql
```

### Development Workflow

1. **Code Changes**: Edit files in your preferred editor
2. **Auto-Reload**: nodemon automatically restarts server on changes
3. **Database Updates**: Run migrations when schema changes
4. **Testing**: Test functionality in browser at http://localhost:3000
5. **Commit**: Use Git for version control

### Code Style Guidelines

- **JavaScript**: ES6+ features, async/await for promises
- **SQL**: Consistent naming, proper indexing
- **HTML**: Semantic elements, proper nesting
- **CSS**: BEM methodology, responsive design

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment
   NODE_ENV=production
   
   # Use strong secrets
   JWT_SECRET=your_production_jwt_secret
   SESSION_SECRET=your_production_session_secret
   ```

2. **Database Configuration**
   ```bash
   # Create production database
   mysql -u root -p
   CREATE DATABASE learnpath_production;
   
   # Import schema
   mysql -u root -p learnpath_production < schema.sql
   ```

3. **Process Management**
   ```bash
   # Using PM2 for production
   npm install -g pm2
   pm2 start server.js --name learnpath
   pm2 startup
   pm2 save
   ```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Database Connection Error** | Verify MySQL is running and credentials in `.env` are correct |
| **Port Already in Use** | Kill existing processes: `taskkill /f /im node.exe` (Windows) |
| **JWT Token Invalid** | Clear localStorage and login again |
| **Permission Denied** | Check user roles and admin authentication |
| **Schema Errors** | Re-run `mysql -u root -p < schema.sql` |

### Debug Mode

```bash
# Enable detailed logging
DEBUG=learnpath:* npm start

# Check database connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Verify server health
curl http://localhost:3000/api/health
```

## 📈 Future Roadmap

### 🚀 Planned Features

#### Phase 1 (v2.1.0)
- [ ] **Email Notifications**: Course completion and achievement notifications
- [ ] **Advanced Search**: Full-text search across content
- [ ] **Mobile App**: React Native companion app
- [ ] **API Rate Limiting**: Enhanced security measures

#### Phase 2 (v2.2.0)
- [ ] **Multi-language Support**: i18n implementation
- [ ] **Dark Mode**: Theme switching capability
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Social Features**: User forums and discussions

#### Phase 3 (v3.0.0)
- [ ] **Microservices Architecture**: Service decomposition
- [ ] **Real-time Collaboration**: Live learning sessions
- [ ] **AI-Powered Recommendations**: Personalized learning paths
- [ ] **Blockchain Certificates**: Immutable credential verification

### 🔧 Technical Improvements
- [ ] **Automated Testing**: Jest + Supertest test suite
- [ ] **CI/CD Pipeline**: GitHub Actions integration
- [ ] **Performance Monitoring**: Application performance insights
- [ ] **Security Audit**: Comprehensive security review

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

---

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/SubhashKumar14/LearnPath-1/issues)
- **Documentation**: [Wiki](https://github.com/SubhashKumar14/LearnPath-1/wiki)
- **Email**: support@learnpath.dev

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Bootstrap Team** for the excellent CSS framework
- **Express.js Community** for the robust web framework
- **MySQL Team** for the reliable database system
- **Font Awesome** for the comprehensive icon library
- **All Contributors** who have helped improve this project

---

<div align="center">
  <strong>Built with ❤️ for the learning community</strong>
  <br>
  <sub>LearnPath v2.0.0 - Empowering education through technology</sub>
</div>
* Readme further enhanced with deployment, security, extensibility, troubleshooting matrices.

### 3. Partially Addressed / Foundations Laid
* Prototype credential tables (`badges`, `certificates`) exist; real asset generation not yet implemented.
* Optional prototype tables for courses & lessons created (not yet wired to API routes).
* Basic security (bcrypt, JWT expiry, parameterized queries) present; advanced controls pending.

### 4. Outstanding / Future (Explicitly Discussed but Not Yet Implemented)
Security & Auth:
* Rate limiting, audit logging, stronger password policies, password reset, email verification, potential MFA.
* JWT refresh / rotation strategy & migration from localStorage to httpOnly secure cookies.

Testing & Quality:
* Automated unit/API test suite (Jest/Vitest + Supertest) & coverage thresholds.
* CI workflow (GitHub Actions) for build/lint/test gates.

Content & Features:
* Multi-admin / instructor roles & delegated content workflows.
* Course / lesson API endpoints leveraging prototype tables.
* Search, pagination, filtering for roadmaps and tasks.
* Analytics dashboards (engagement, completion funnels, per-module curves).
* Notification & email system (progress milestones, credential issuance).
* Real badge image & certificate PDF generation pipeline (possibly microservice or library integration).

Frontend & UX:
* Modular refactor of `public/js/app.js` (ES modules + bundler like Vite/Rollup).
* Accessibility audit (WCAG), dark mode, i18n framework integration.
* Componentization / state management improvements.

Data & Operations:
* Migration tooling (Prisma / Knex / Flyway) to replace monolithic schema file.
* Additional indexing & query optimization for scale.
* Structured logging, metrics, and health/observability stack.
* Backup automation & disaster recovery playbook.

Governance & Compliance:
* Add `LICENSE` file (MIT planned) & `CONTRIBUTING.md` guidelines.
* Security policy / responsible disclosure doc.

### 5. Notable Architectural Decisions
* Chose single-admin simplicity over multi-role complexity for MVP speed.
* Vanilla JS SPA (no framework) to minimize onboarding complexity — tradeoff: larger `app.js` file and reduced modularity.
* Monolithic Express file (`server.js`) for velocity; planned future extraction into route modules/services.
* Single consolidated schema over incremental migrations — acceptable for early stage, flagged for change.
* LocalStorage JWT storage for simplicity with understanding of XSS tradeoffs (roadmap includes mitigation path).

### 6. Technical Debt / Risk Hotspots
| Area | Risk | Mitigation Path |
| ---- | ---- | --------------- |
| Auth brute force | No rate limiting | Add `express-rate-limit` + account lock logic |
| Token storage | XSS exposure potential | Move to httpOnly secure cookies + CSP & Helmet |
| Large server file | Maintainability | Refactor into routers/controllers/services |
| Lack of tests | Regression risk | Introduce Jest + Supertest early |
| Schema evolution | Manual edits risk drift | Adopt migration tool |

### 7. Immediate Next Step Suggestions (Actionable Shortlist)
1. Add LICENSE + CONTRIBUTING to formalize repo.
2. Introduce Jest + Supertest smoke tests (login, create roadmap, toggle progress).
3. Apply `helmet` + `express-rate-limit` for quick security uplift.
4. Split `server.js` into `routes/` modules incrementally.
5. Implement real credential generation placeholder service interface (contract first).

---

# LearnPath – Structured Roadmap Learning Platform

LearnPath is a lightweight full‑stack learning platform for publishing and tracking structured learning roadmaps (→ modules → tasks). Learners enrol, toggle granular task completion, and (prototype) request badges/certificates after finishing a roadmap. A single protected admin account manages all roadmap content through the same SPA UX. The stack intentionally stays minimal (Express + MySQL + Vanilla JS) to maximize clarity and approachability.

---
## 📌 High‑Level Overview
| Aspect | Status |
| ------ | ------ |
| Roadmap browsing & detail views | ✅ Implemented |
| Auth (JWT) & single admin role | ✅ Implemented |
| Progress tracking per task | ✅ Implemented |
| Start roadmap / user_roadmaps link | ✅ Implemented |
| Admin CRUD (roadmaps / modules / tasks) | ✅ Implemented |
| Admin statistics dashboard | ✅ Implemented |
| User profile view & update | ✅ Implemented |
| Activity feed & active roadmaps | ✅ Implemented |
| Badge & certificate request endpoints (prototype) | ✅ Implemented (stub asset URLs) |
| Secure page gating & logout hardening | ✅ Implemented |
| Automated tests | ⏳ Planned |
| CI workflow (GitHub Actions) | ⏳ Planned |
| True asset generation (PDF/PNG) | ⏳ Planned |
| Password reset  | ⏳ Planned |
| Frontend bundling / modularization | ⏳ Planned |

---
## ✨ Current Feature Set

### End User (Learner)
* Browse all published roadmaps with module & task counts.
* View roadmap detail: modules, tasks, resources, completion percentage.
* Start a roadmap (creates row in `user_roadmaps`).
* Toggle task completion (persisted in `user_progress`).
* Track aggregated stats (started, completed, tasks done, earned badges/certs).
* See recent activity feed (task completions, roadmap starts).
* View active (in‑progress) roadmaps with progress bars.
* Request badge / certificate after full completion (server validates; placeholder URLs issued).
* Update profile (username, email, password change optional).

### Administrator (Single Admin Account)
* Authenticates like a user; role gate applied via middleware + UI gating.
* Dashboard statistics (counts of users, roadmaps, modules, tasks, completions, issued badges/certs).
* Create / edit / delete roadmaps.
* Add / edit / delete modules within a roadmap (order maintained via incremental order_index).
* Add / edit / delete tasks with descriptions & external resource links.

### Security & Access Control
* JWT (24h expiry) signed with configurable secret.
* Middleware: `authenticateToken` + `requireAdmin`.
* UI gating: protected pages cannot be accessed after logout or without role.
* Parameterized SQL queries (mysql2) to prevent injection.
* Bcrypt password hashing.

---
## 🏗️ Architecture

![LearnPath System Architecture](docs\images\Architecture.svg)

* **Frontend**: Vanilla JS + Bootstrap 5 served statically from `public/`.
* **Backend**: Express REST API (`server.js`).
* **Database**: MySQL; schema in `schema.sql` with relational integrity & cascading deletes for modules/tasks.
* **Auth Storage**: JWT stored in `localStorage` (simple SPA approach).
* **State**: In-browser JS manages current user, progress map, rendered views.

### Data Model (Textual ER Outline)
```
users (1) ──< roadmaps.created_by
roadmaps (1) ──< modules (cascade)
modules (1) ──< tasks (cascade)
users (M) ──< user_progress >── (M) tasks  (completion per task)
users (M) ──< user_roadmaps >── (M) roadmaps (enrolment/start)
users (1) ──< certificates (per roadmap)
users (1) ──< badges (per roadmap)
```

---
## 📂 Repository Structure
```
server.js               # Express API & all route handlers (monolithic entry point)
auth_middleware.js      # JWT verification + admin role gate helpers
db.js                   # MySQL connection pool (mysql2) + initial connectivity check
schema.sql              # Canonical schema + seed + optional prototype tables
public/index.html       # SPA shell (sections shown/hidden via JS)
public/badge.html       # Placeholder badge asset page (prototype)
public/certificate.html # Placeholder certificate asset page (prototype)
public/js/app.js        # Front-end controller: auth, rendering, admin CRUD, progress
public/css/style.css    # Minimal custom styles over Bootstrap
package.json            # Scripts + deps
setup.sh                # Convenience setup script (Linux/macOS) – optional
```

Removed legacy helper/test scripts after consolidation (see git history for reference).

### File Responsibility Matrix (Quick View)
| Layer | File(s) | Core Responsibilities |
| ----- | ------- | --------------------- |
| API Routing | `server.js` | Define endpoints, compose middleware, run queries |
| Auth | `auth_middleware.js` | Decode JWT, attach user, enforce admin role |
| Data Access | `db.js` | Provide pooled connection (promise API) |
| Schema | `schema.sql` | DDL + seeds + optional experimental tables |
| Frontend State | `public/js/app.js` | LocalStorage auth, DOM rendering, fetch orchestration |
| Presentation | `public/*.html`, `public/css/style.css` | Static markup & styling |

---
## 🔑 Environment Variables
Create a `.env` (keys are read via `process.env` – ensure you load them before starting if you add dotenv):
| Variable | Required | Default (implicit) | Purpose |
| -------- | -------- | ------------------ | ------- |
| DB_HOST | ✅ | localhost | MySQL host |
| DB_USER | ✅ | root | MySQL user |
| DB_PASSWORD | ✅ | – | MySQL password |
| DB_NAME | ✅ | learnpath_db | Database name (schema assumes this) |
| JWT_SECRET | ✅ | – | HMAC signing key for JWTs |
| PORT | ⏺ | 3000 | Server listen port |

If you need dotenv support, install and add at top of `server.js`:
```js
// require('dotenv').config();
```

---
## 🗄️ Database Schema (Core Tables)
Core production‑relevant tables (prototype tables excluded here):

| Table | Purpose | Key Columns / Notes |
| ----- | ------- | ------------------- |
| users | Account identities | `role` ENUM('user','admin'); unique `email` |
| roadmaps | Top-level learning tracks | FK `created_by -> users.id` |
| modules | Ordered groups within a roadmap | Cascade delete on roadmap removal |
| tasks | Atomic actionable learning items | Optional `resource_url`; ordered per module |
| user_progress | Per-task completion state | Unique (`user_id`,`task_id`); stores timestamp |
| user_roadmaps | User enrolments | `started_at`, optional `completed_at` |
| certificates | Issued certificates (prototype asset URL) | One per (user, roadmap) scenario |
| badges | Issued badges (prototype asset URL) | One per (user, roadmap) scenario |

Prototype / optional extension tables: `badge_requests`, `certificate_requests`, `courses`, `course_modules`, `lessons`, `user_courses`, `lesson_progress`.

### Integrity & Constraints Highlights
* Cascade deletes from `modules` → `tasks` ensure cleanup.
* Unique key on `user_progress(user_id, task_id)` enables idempotent upsert semantics.
* No soft deletes; physical removal assumed (simple model).

### Suggested Future Indices
| Table | Index | Rationale |
| ----- | ----- | --------- |
| user_progress | (user_id) | Fast per-user progress aggregation |
| user_progress | (task_id) | Task completion stats |
| user_roadmaps | (user_id, roadmap_id) | Accelerate completion lookups |

---
## 🔄 Typical Request Flow (Example: Toggle Task Completion)
1. User clicks checkbox in UI.
2. `app.js` sends `POST /api/progress/task` with `{ taskId, completed }` + `Authorization: Bearer <jwt>`.
3. `authenticateToken` decodes token → attaches `req.user`.
4. Handler performs upsert logic (INSERT ON DUPLICATE KEY UPDATE) in `user_progress`.
5. Returns confirmation JSON; UI updates progress bar & activity feed.

---
## 🧪 Testing Strategy (Planned)
Current state: No automated tests after cleanup (legacy scripts removed).

Planned layers:
1. Unit: Pure functions (if refactored out of route handlers).
2. API: Supertest against in‑memory (or ephemeral) MySQL (possibly using Docker + migrations).
3. Smoke: Startup + `/api/health` + seed account login.
4. Future CI: GitHub Actions matrix (Node LTS versions) + lint + coverage threshold.

---
## 📡 API Surface (Condensed with Status Codes)
Below is a concise list (see comments in `server.js` for live source of truth):

| Method | Endpoint | Auth | 2xx | Common 4xx/5xx |
| ------ | -------- | ---- | --- | -------------- |
| POST | /api/register | Public | 201 | 400 (email exists) |
| POST | /api/login | Public | 200 | 401 (bad creds) |
| GET | /api/profile | User | 200 | 401 (no token) |
| PUT | /api/profile | User | 200 | 400/401 |
| GET | /api/roadmaps | Public | 200 | – |
| GET | /api/roadmaps/:id | Public | 200 | 404 |
| POST | /api/roadmaps | Admin | 201 | 401/403/400 |
| PUT | /api/roadmaps/:id | Admin | 200 | 404 |
| DELETE | /api/roadmaps/:id | Admin | 204 | 404 |
| POST | /api/roadmaps/:id/start | User | 201 | 404 |
| GET | /api/roadmaps/:id/progress | User | 200 | 404 |
| POST | /api/modules/:roadmapId/modules | Admin | 201 | 404 |
| POST | /api/modules/:moduleId/tasks | Admin | 201 | 404 |
| POST | /api/progress/task | User | 200 | 400 |
| GET | /api/user/activity | User | 200 | 401 |
| GET | /api/admin/stats | Admin | 200 | 401/403 |
| POST | /api/badges/request | User | 201 | 400 (incomplete) |
| POST | /api/certificates/request | User | 201 | 400 (incomplete) |
| GET | /api/health | Public | 200 | 500 (DB down) |

---
## 🧾 Representative JSON Payloads
### Login Response
```json
{
	"token": "<jwt>",
	"user": {"id":1, "username":"admin", "email":"admin@learnpath.com", "role":"admin"}
}
```
### Roadmap Detail (abridged)
```json
{
	"id":1,
	"title":"Data Structures & Algorithms",
	"modules":[{
		"id":10,
		"title":"Arrays & Strings",
		"tasks":[{"id":55, "title":"Introduction to Arrays", "completed":true}]
	}]
}
```

---
## 🔐 Security Deep Dive
Implemented controls:
* JWT bearer auth (HMAC) – no refresh token layer yet.
* Password hashing: bcrypt cost factor 10 (configurable).
* Parameterized queries via mysql2 prepared statements.
* Role guarding (single admin) both server and client side.
* Logout thoroughly purges localStorage & hides protected UI.

Risks / gaps (future work):
* No rate limiting → brute force risk on `/api/login`.
* No account lockout or MFA.
* Token stored in localStorage (susceptible to XSS if introduced) – consider httpOnly cookies.
* No CSRF protection (not critical with bearer header + same‑origin static serving but relevant if migrating to cookies).
* No password policy / complexity checks.

---
## 🏗️ Deployment & Ops Checklist
| Concern | Action |
| ------- | ------ |
| Secrets | Set strong `JWT_SECRET` via env store (Vault/Secrets Manager) |
| DB Migrations | Move from monolithic `schema.sql` to tool (Prisma, Knex, Flyway) |
| Logging | Add structured logger (pino/winston) + request IDs |
| Monitoring | Add health probes + metrics exporter |
| Backups | Automate MySQL dumps / point‑in‑time recovery |
| HTTPS | Terminate TLS at reverse proxy (NGINX/Caddy) |

---
## 🧩 Extensibility Points
| Area | Enhancement Idea |
| ---- | ---------------- |
| Content Types | Add quizzes / coding challenges table |
| Credentialing | Real badge image generation + certificate PDF pipeline |
| Analytics | Per‑task completion heatmaps, retention cohorts |
| Roles | Instructor role for delegated content management |
| Frontend | Modularize `app.js` (ESM) + build with Vite/Rollup |

---
## 🛠️ Troubleshooting
| Symptom | Likely Cause | Fix |
| ------- | ------------ | --- |
| 500 on any DB route | DB not reachable | Verify env vars & MySQL running |
| Login always 401 | Wrong seed hash or user missing | Rerun `schema.sql` seeding |
| Progress not saving | Unique constraint failing silently | Check `user_progress` unique index exists |
| Admin UI hidden after refresh | Token expired | Re-login (24h expiry) |

---
## 🧭 Roadmap (Refined Milestones)
1. Security hardening (rate limiting, password reset, token refresh).
2. Automated test harness (Supertest + Jest) + CI pipeline.
3. Real credential asset generation service.
4. Frontend modular refactor & accessibility audit.
5. Multi-role & instructor authoring workflows.

---
## 📝 License
MIT (add `LICENSE` file before public distribution).

---
## ✅ Current Status Snapshot
Functional MVP with single-admin content management, learner progress tracking, prototype credential issuance, and a consolidated schema foundation ready for iterative enhancement.

---
## 📣 Support
Open an issue with reproduction steps, expected vs actual behavior, and sanitized logs.

---
Happy learning & shipping.

---
## ⚙️ Installation & Setup
### Prerequisites
* Node.js 16+ (tested on 18+ recommended)
* MySQL 8+

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
mysql -u root -p < schema.sql
```

### 3. Configure Environment
Create a `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=learnpath_db
JWT_SECRET=change_me_in_production
PORT=3000
```

### 4. Run
```bash
npm start    # or: npm run dev (with nodemon)
```
Visit: http://localhost:3000

### 5. Test (Basic Integration)
```bash
npm test
```

---
## 👤 Default Accounts (Seed Data)
| Role | Email | Password | Notes |
| ---- | ----- | -------- | ----- |
| Admin | admin@learnpath.com | password123 | Single admin account (enforced in seed) |
| User  | john.doe@example.com | password123 | Sample learner |

⚠️ Change / rotate these credentials immediately for any non-local deployment.

---
## 🔐 Authentication Flow
1. User submits credentials → `/api/login`.
2. Server validates & returns JWT + minimal user object.
3. Frontend stores token & user in `localStorage`.
4. All protected requests send `Authorization: Bearer <token>` header.
5. Logout clears storage & resets UI (no placeholder user).

---
## 🧩 Full API Reference (Implemented)

### Auth & Profile
| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | /api/register | Public | Register new user |
| POST | /api/login | Public | Login & receive JWT |
| GET  | /api/profile | User | Fetch profile + aggregated stats |
| PUT  | /api/profile | User | Update username/email/password |

### Roadmaps & Content
| GET | /api/roadmaps | Public | List roadmaps w/ counts |
| GET | /api/roadmaps/:id | Public | Roadmap + modules/tasks |
| POST | /api/roadmaps | Admin | Create roadmap (+ optional nested modules/tasks) |
| PUT | /api/roadmaps/:id | Admin | Update roadmap meta |
| DELETE | /api/roadmaps/:id | Admin | Delete roadmap (cascade modules/tasks) |
| POST | /api/roadmaps/:id/start | User | Enrol user in roadmap |
| GET | /api/roadmaps/:id/progress | User | Map of task completion (boolean per task) |

### Modules (Admin)
| POST | /api/roadmaps/:roadmapId/modules | Admin | Create module |
| PUT  | /api/modules/:id | Admin | Update module title |
| DELETE | /api/modules/:id | Admin | Delete module (cascade tasks) |

### Tasks (Admin)
| POST | /api/modules/:moduleId/tasks | Admin | Create task |
| PUT  | /api/tasks/:id | Admin | Update task |
| DELETE | /api/tasks/:id | Admin | Delete task |

### Admin Task/Module (Alternate prefixed endpoints)
| POST | /api/admin/roadmaps/:roadmapId/modules | Admin | Alternative creation with order index |
| PUT  | /api/admin/modules/:id | Admin | Update module (title/order) |
| DELETE | /api/admin/modules/:id | Admin | Delete module |
| POST | /api/admin/modules/:moduleId/tasks | Admin | Create task w/ ordering |
| PUT  | /api/admin/tasks/:id | Admin | Update task full fields |
| DELETE | /api/admin/tasks/:id | Admin | Delete task |

### Admin Dashboard
| GET | /api/admin/stats | Admin | Platform aggregate counts |

### Progress & Activity
| GET | /api/progress/:userId | User/Admin | Aggregate roadmap progress list |
| POST | /api/progress/task | User | Toggle / set task completion |
| GET | /api/user/active-roadmaps | User | In-progress roadmaps |
| GET | /api/user/activity | User | Recent activity feed |
| GET | /api/user/stats | User | Summary counters |

### Badges & Certificates (Prototype)
| POST | /api/badges/request | User | Request badge (validated full completion) |
| POST | /api/certificates/request | User | Request certificate (validated) |

### Misc
| GET | /api/health | Public | Health probe |

#### Sample: Task Completion Request
```bash
curl -X POST http://localhost:3000/api/progress/task \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	-d '{"taskId":123, "completed":true}'
```
Response:
```json
{ "message": "Progress updated successfully", "completed": true }
```

---
## 🖥️ Frontend Interaction Model
Single `index.html` containing multiple logical "pages" toggled via JS (`showPage`). No build tooling yet; all logic consolidated in `public/js/app.js`.

---
## 🧪 Testing
* `integration-test.js` exercises: admin login → create user → login user → start roadmap → update progress.
* Future: add Jest or Vitest + Supertest for unit + route tests.

---
## 🔒 Security Considerations
Implemented:
* Bcrypt password hashing.
* JWT expiration (24h).
* Parameterized queries.
* Role enforcement middleware.
* Logout clearing local state + gated UI.

Planned / Recommended:
* Rate limiting (e.g., express-rate-limit) for auth + mutation endpoints.
* Password reset + email verification.
* Audit logging of admin actions.
* HTTPS enforcement + secure cookie option (if switching from localStorage).
* CSP / security headers (helmet middleware).

---
## 🚀 Deployment Notes
* Behind reverse proxy (NGINX) serve static files + forward `/api/*`.
* Set strong `JWT_SECRET` and rotate periodically.
* Run DB migrations (currently single schema file; consider migration tool).
* Enable backup & monitoring (metric collection for usage growth).

---
## 📈 Performance & Scalability
Current:
* Simple pooled MySQL connections (mysql2 pool).
* Roadmap listing does aggregate counts in one query.

Future Enhancements:
* Add indices on foreign keys & high-read columns (some implicit via FK; explicit composite indexes for activity queries could help).
* Pagination & server-side filtering for `/api/roadmaps` once dataset grows.
* Caching layer (Redis) for admin stats & roadmap lists.

---
## 🗺️ Product Roadmap (Next Steps)
| Priority | Item | Rationale |
| -------- | ---- | --------- |
| High | Password reset + email verification | Account security |
| High | Proper badge/certificate asset generation (PDF/PNG) | User motivation |
| High | Unit & API test coverage + CI workflow | Reliability |
| Medium | Pagination & search on roadmaps | Scalability |
| Medium | Role expansion (multiple admins / instructors) | Growth |
| Medium | Rich analytics (per-module completion curves) | Insight |
| Medium | Frontend modular refactor + build (ESM bundling) | Maintainability |
| Low | Internationalization (i18n) | Global reach |
| Low | Dark mode & accessibility audits (WCAG) | UX inclusivity |
| Low | Notification system (email / in-app) | Engagement |

---
## 🤝 Contributing (Planned Guidelines)
1. Fork & branch from `main` (`feat/<feature-name>`).
2. Add/adjust tests for any new feature.
3. Run formatter / linter (to be added) & ensure tests pass.
4. Open PR with concise description & screenshots where UI changes.

*(Formal CONTRIBUTING.md not yet created.)*

---
## 📜 License
MIT License – see `LICENSE` (add if missing before production release).

---
## 🆘 Support / Questions
Open a GitHub Issue with:
* Steps to reproduce
* Expected vs actual behavior
* Logs / screenshots (omit secrets)

---
## ✅ Summary
LearnPath currently delivers a functional single-admin roadmap learning experience with progress tracking, statistics, and prototype credential issuance. The foundation is solid for expanding into richer credentialing, multi-role collaboration, and production hardening (security, tests, performance). See the roadmap above for the prioritized evolution path.

Happy building & learning! 🎓

