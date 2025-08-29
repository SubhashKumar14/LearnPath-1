# LearnPath – Structured Roadmap Learning Platform

LearnPath is a full‑stack learning platform for publishing structured learning roadmaps composed of modules and tasks. Users can enrol, track granular progress, and (prototype) earn badges/certificates. A single protected admin account can create and manage roadmaps, modules, and tasks through an integrated dashboard.

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
| Integration test script | ✅ Basic happy-path |
| CI / automated tests coverage | ⏳ Planned |
| True asset generation (PDF/PNG) | ⏳ Planned |
| Password reset / email verification | ⏳ Planned |
| Role expansion (multi-admin / instructors) | ⏳ Planned |
| Rate limiting / audit logging | ⏳ Planned |
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
server.js               # Express API & route definitions
auth_middleware.js      # JWT auth + admin guard
db.js                   # MySQL pool + connection test
schema.sql              # Full database schema & seed data
public/index.html       # Single-page shell & admin UI
public/js/app.js        # All front-end logic (auth, UI, admin, progress)
public/css/style.css    # Styling overrides
integration-test.js     # Basic automated integration flow
test-login.js           # Admin login verification helper
```

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

