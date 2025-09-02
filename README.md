# LearnPath - Roadmap Learning Platform

> **A comprehensive learning management system for structured roadmap-based education with progress tracking, courses, and credential generation.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-orange.svg)](https://mysql.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple.svg)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ðŸŽ¯ Overview

LearnPath is a modern, full-stack learning platform that enables users to follow structured learning roadmaps, complete tasks, track progress, and earn certificates and badges. Built with simplicity and effectiveness in mind, it provides both learners and administrators with powerful tools for educational content management and delivery.

### âœ¨ Key Features

- **ðŸ“š Structured Learning Roadmaps** - Expert-curated learning paths with modules and tasks
- **ðŸŽ“ Course Management** - Individual courses with lessons and progress tracking
- **ðŸ“Š Progress Tracking** - Granular task-level completion tracking with visual progress bars
- **ðŸ† Achievements System** - Badges and certificates for completed roadmaps and courses
- **ðŸ‘¤ User Management** - Registration, authentication, and profile management
- **ðŸ”§ Admin Dashboard** - Complete content management and user analytics
- **ðŸ“± Responsive Design** - Mobile-friendly interface with Bootstrap 5
- **ðŸ” Secure Authentication** - JWT-based authentication with role-based access control

## ðŸ—ï¸ Architecture

**Frontend:** Vanilla JavaScript + Bootstrap 5 (SPA)  
**Backend:** Node.js + Express.js REST API  
**Database:** MySQL with relational integrity  
**Authentication:** JWT with localStorage storage  
**File Structure:** Monolithic for simplicity, designed for easy extension

### Data Flow
```
Users â†’ Roadmaps (1:M) â†’ Modules (1:M) â†’ Tasks (1:M)
Users â†’ Courses (M:M) â†’ Lessons (1:M) â†’ Progress Tracking
Users â†’ Certificates/Badges â†’ Achievement System
```

## ðŸš€ Quick Start

### Prerequisites

- Node.js 16+ (18+ recommended)
- MySQL 8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SubhashKumar14/LearnPath-1.git
   cd LearnPath-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   mysql -u root -p < schema.sql
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=learnpath_db
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=3000
   NODE_ENV=development
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to: `http://localhost:3000`

## ðŸ‘¥ Default Accounts

| Role  | Email | Password | Purpose |
|-------|-------|----------|---------|
| Admin | admin@learnpath.com | password123 | Full platform management |
| User  | john.doe@example.com | password123 | Sample learner account |
| User  | jane.smith@example.com | password123 | Sample learner account |

**âš ï¸ Important:** Change these default passwords immediately in production!

## ðŸ“‹ API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/register` | User registration | No |
| POST | `/api/login` | User login | No |
| GET | `/api/profile` | Get user profile | Yes |
| PUT | `/api/profile` | Update user profile | Yes |

### Roadmap Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/roadmaps` | List all roadmaps | No |
| GET | `/api/roadmaps/:id` | Get roadmap details | No |
| POST | `/api/roadmaps` | Create roadmap | Admin |
| PUT | `/api/roadmaps/:id` | Update roadmap | Admin |
| DELETE | `/api/roadmaps/:id` | Delete roadmap | Admin |
| POST | `/api/roadmaps/:id/start` | Start roadmap | User |

### Progress Tracking

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/progress/task` | Toggle task completion | User |
| GET | `/api/roadmaps/:id/progress` | Get roadmap progress | User |
| GET | `/api/user/activity` | Get user activity feed | User |
| GET | `/api/user/stats` | Get user statistics | User |

### Course Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/courses` | List all courses | No |
| GET | `/api/courses/:id` | Get course details | No |
| POST | `/api/courses` | Create course | Admin |
| POST | `/api/courses/:id/start` | Start course | User |
| POST | `/api/lessons/:lessonId/progress` | Toggle lesson completion | User |

### Certificates & Badges

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/certificates/request` | Request certificate | User |
| POST | `/api/badges/request` | Request badge | User |
| POST | `/api/certificates/generate` | Generate certificate | User |
| POST | `/api/badges/generate` | Generate badge | User |

### Admin Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/stats` | Get platform statistics | Admin |
| GET | `/api/admin/user-analytics` | Get user analytics | Admin |
| GET | `/api/admin/certificate-requests` | Get pending certificate requests | Admin |
| GET | `/api/admin/badge-requests` | Get pending badge requests | Admin |

## ðŸ—„ï¸ Database Schema

### Core Tables

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `users` | User accounts and authentication | Base entity |
| `roadmaps` | Learning roadmap definitions | â†’ `modules` |
| `modules` | Roadmap sections | â†’ `tasks` |
| `tasks` | Individual learning tasks | â† `user_progress` |
| `user_roadmaps` | User roadmap enrollments | Many-to-many |
| `user_progress` | Task completion tracking | Progress state |

### Course System

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `courses` | Course definitions | â†’ `course_lessons` |
| `course_lessons` | Individual lessons | â† `lesson_progress` |
| `user_courses` | Course enrollments | Many-to-many |
| `lesson_progress` | Lesson completion tracking | Progress state |

### Achievement System

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `certificates` | Issued certificates | User achievements |
| `badges` | Issued badges | Roadmap completion |
| `certificate_requests` | Pending requests | Admin workflow |
| `badge_requests` | Pending requests | Admin workflow |

## ðŸŽ¨ Frontend Structure

### Page Navigation
- **Home Page:** Landing page with featured roadmaps
- **Roadmaps:** Browse and filter learning paths
- **Courses:** Browse individual courses
- **Profile:** User account management and statistics
- **Progress:** Detailed learning progress tracking
- **Admin Dashboard:** Platform management (admin only)

### Key JavaScript Functions
```javascript
// Authentication
login(email, password)
register(userData)
logout()

// Content Management
loadRoadmaps(filters)
loadCourses(filters)
startRoadmap(roadmapId)
toggleTaskProgress(taskId, completed)

// Admin Functions
createRoadmap(roadmapData)
manageUsers()
generateCertificate(requestData)
```

## ðŸ”§ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | localhost | MySQL database host |
| `DB_USER` | Yes | root | MySQL username |
| `DB_PASSWORD` | Yes | - | MySQL password |
| `DB_NAME` | Yes | learnpath_db | Database name |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |

### Security Configuration

```javascript
// JWT Configuration
const jwtConfig = {
  expiresIn: '24h',
  algorithm: 'HS256'
};

// Password Hashing
const bcryptRounds = 12;

// CORS Settings
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};
```

## ðŸ“Š Admin Features

### Dashboard Overview
- User registration trends
- Course/roadmap completion rates
- Active user statistics
- Content performance metrics

### Content Management
- Create/edit/delete roadmaps
- Manage modules and tasks
- Course and lesson management
- Bulk content operations

### User Management
- View user activity
- Monitor learning progress
- Generate reports
- Manage user roles

### Certificate & Badge Management
- Review pending requests
- Generate certificates and badges
- Bulk approval workflows
- Custom credential templates

## ðŸš€ Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export JWT_SECRET="your-super-secure-secret"
   export DB_PASSWORD="secure-db-password"
   ```

2. **Database Setup**
   ```sql
   -- Create production database
   CREATE DATABASE learnpath_production;
   -- Import schema
   mysql -u username -p learnpath_production < schema.sql
   ```

3. **Process Management**
   ```bash
   # Using PM2 for production
   npm install -g pm2
   pm2 start server.js --name "learnpath"
   pm2 startup
   pm2 save
   ```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - DB_USER=learnpath
      - DB_PASSWORD=secure_password
      - DB_NAME=learnpath_db
    depends_on:
      - mysql
  
  mysql:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=learnpath_db
      - MYSQL_USER=learnpath
      - MYSQL_PASSWORD=secure_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  mysql_data:
```

## ðŸ§ª Testing

### API Testing
```bash
# Install test dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Roadmap creation and enrollment
- [ ] Task progress tracking
- [ ] Course completion
- [ ] Certificate generation
- [ ] Admin dashboard functionality

## ðŸ” Security Considerations

### Current Security Measures
- JWT authentication with expiration
- Bcrypt password hashing (cost factor 12)
- Parameterized SQL queries (SQL injection prevention)
- Role-based access control
- Input validation and sanitization

### Security Recommendations
- [ ] Implement rate limiting for authentication endpoints
- [ ] Add CSRF protection for state-changing operations
- [ ] Use HTTPS in production
- [ ] Implement proper session management
- [ ] Add audit logging for admin actions
- [ ] Regular security dependency updates

## ðŸ› Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MySQL service status
systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"
```

**JWT Token Expired**
- Users need to log in again after 24 hours
- Check server logs for authentication errors

**Progress Not Saving**
- Verify database constraints
- Check browser console for JavaScript errors

**Admin Panel Not Loading**
- Confirm admin role in database
- Check JWT token validity

### Debug Mode
```bash
# Enable detailed logging
DEBUG=learnpath:* npm start
```

## ðŸŽ¯ Roadmap & Future Enhancements

### Phase 1: Core Improvements
- [ ] Automated testing suite
- [ ] Password reset functionality
- [ ] Email verification system
- [ ] Enhanced error handling

### Phase 2: Feature Extensions
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Bulk import/export tools
- [ ] Discussion forums
- [ ] Mobile app development

### Phase 3: Scalability
- [ ] Microservices architecture
- [ ] Redis caching layer
- [ ] CDN integration
- [ ] Load balancing
- [ ] Database sharding

### Phase 4: Advanced Features
- [ ] AI-powered learning recommendations
- [ ] Video content integration
- [ ] Real-time collaboration tools
- [ ] Advanced reporting
- [ ] API rate limiting and quotas

## ðŸ¤ Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- Use ES6+ JavaScript features
- Follow existing code formatting
- Add comments for complex logic
- Update documentation for API changes

### Pull Request Process
1. Update README.md with details of changes
2. Add unit tests for new features
3. Ensure the build passes
4. Request review from maintainers

## ðŸ“„ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 LearnPath

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## ðŸ™ Acknowledgments

- **Bootstrap Team** - For the excellent CSS framework
- **Express.js Community** - For the robust Node.js framework  
- **MySQL Team** - For the reliable database system
- **JWT.io** - For authentication standards
- **All Contributors** - For their valuable contributions

## ðŸ“ž Support

- **Documentation:** This README and inline code comments
- **Issues:** [GitHub Issues](https://github.com/SubhashKumar14/LearnPath-1/issues)
- **Discussions:** [GitHub Discussions](https://github.com/SubhashKumar14/LearnPath-1/discussions)

---

**Built with â¤ï¸ for the learning community**

---

## ðŸ“ˆ Project Status

**Current Version:** 2.0.0  
**Status:** Active Development  
**Last Updated:** September 2025  
**Maintainers:** [@SubhashKumar14](https://github.com/SubhashKumar14)

---

*Happy Learning! ðŸŽ“*
