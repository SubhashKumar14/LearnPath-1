# 🎯 LearnPath - Advanced Learning Management System

<div align="center">

![LearnPath Logo](https://img.shields.io/badge/LearnPath-v2.0.0-blue?style=for-the-badge&logo=graduation-cap)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange?style=flat-square&logo=mysql)](https://mysql.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.2-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#license)

**Structured Learning Roadmaps with Real-time Progress Tracking & Automated Certificate Generation**

[🚀 Live Demo](#installation) | [📖 Documentation](#api-documentation) | [🐛 Report Bug](https://github.com/SubhashKumar14/LearnPath-1/issues)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Architecture](#-architecture)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#-configuration)
- [📊 Database Schema](#-database-schema)
- [🔐 Authentication & Security](#-authentication--security)
- [📱 User Interface](#-user-interface)
- [🎓 Certificate System](#-certificate-system)
- [📈 Progress Tracking](#-progress-tracking)
- [👨‍💼 Admin Panel](#-admin-panel)
- [🔌 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

**LearnPath** is a comprehensive Learning Management System (LMS) designed to provide structured, goal-oriented learning experiences through customizable roadmaps. Built with modern web technologies, it offers real-time progress tracking, automated certificate generation, and a robust admin interface for content management.

### 🎯 Purpose

LearnPath addresses the challenge of unstructured online learning by providing:
- **Guided Learning Paths**: Step-by-step roadmaps for skill development
- **Progress Visualization**: Real-time tracking with intuitive progress bars
- **Achievement Recognition**: Automated certificate and badge generation
- **Administrative Control**: Comprehensive content management system

---

## ✨ Key Features

### 🎓 **Learning Management**
- **📚 Structured Roadmaps**: Modular learning paths with organized content
- **📖 Course Integration**: Comprehensive course management with lessons
- **📝 Task Tracking**: Granular task completion with real-time updates
- **🔄 Progress Persistence**: Automatic saving of learning progress

### 🏆 **Achievement System**
- **🎖️ Digital Certificates**: PDF certificate generation with user credentials
- **🏅 Digital Badges**: Custom badge creation for roadmap completion
- **📊 Progress Analytics**: Detailed statistics and learning insights
- **🎉 Completion Recognition**: Automated celebration of achievements

### 👤 **User Experience**
- **🔐 Secure Authentication**: JWT-based user authentication system
- **📱 Responsive Design**: Mobile-first responsive interface
- **🎨 Modern UI/UX**: Bootstrap-powered clean interface
- **⚡ Real-time Updates**: Live progress updates without page refresh

### 🛡️ **Administrative Features**
- **👨‍💼 Admin Dashboard**: Comprehensive admin control panel
- **📊 Analytics & Reports**: User engagement and progress analytics
- **🔧 Content Management**: CRUD operations for roadmaps and courses
- **🔒 Role-based Access**: Secure admin-only functionality

---

## 🛠 Tech Stack

### **Backend Infrastructure**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 16+ | Server-side JavaScript runtime |
| **Express.js** | 4.18.2 | Web application framework |
| **MySQL** | 8.0+ | Relational database management |
| **JWT** | 9.0.2 | Secure authentication tokens |

### **Security & Session Management**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **bcryptjs** | 3.0.2 | Password hashing and security |
| **express-session** | 1.17.3 | Session management |
| **mysql-session-store** | 3.0.0 | Database session storage |
| **CORS** | 2.8.5 | Cross-origin resource sharing |

### **Frontend Technologies**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **HTML5** | Latest | Semantic markup structure |
| **CSS3** | Latest | Modern styling and animations |
| **JavaScript ES6+** | Latest | Interactive functionality |
| **Bootstrap** | 5.3+ | Responsive UI framework |

### **Development & Deployment**
| Technology | Purpose |
|-----------|---------|
| **Nodemon** | Development hot-reload |
| **Git** | Version control system |
| **npm** | Package management |
| **dotenv** | Environment configuration |

---

## 🏗 Architecture

### **System Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│   (Browser)     │◄──►│   (Express.js)   │◄──►│   (MySQL)       │
│                 │    │                  │    │                 │
│ • HTML/CSS/JS   │    │ • REST API       │    │ • User Data     │
│ • Bootstrap UI  │    │ • Authentication │    │ • Progress      │
│ • AJAX Requests │    │ • Session Mgmt   │    │ • Content       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Application Layers**

1. **Presentation Layer** (Frontend)
   - Responsive web interface
   - Real-time progress visualization
   - Interactive learning modules

2. **Business Logic Layer** (Backend)
   - RESTful API endpoints
   - Authentication & authorization
   - Progress calculation algorithms

3. **Data Access Layer** (Database)
   - MySQL relational database
   - Optimized queries and indexing
   - Session and progress persistence

---

## 🚀 Installation

### **Prerequisites**

Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### **Quick Start**

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
   # Create MySQL database
   mysql -u root -p -e "CREATE DATABASE learnpath_db;"
   
   # Import schema
   mysql -u root -p learnpath_db < schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit configuration
   nano .env
   ```

5. **Start the Application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the Application**
   - Frontend: `http://localhost:3000`
   - API Health Check: `http://localhost:3000/api/health`

---

## ⚙️ Configuration

### **Environment Variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=learnpath_db

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=your_session_secret_key_here

# Security
BCRYPT_ROUNDS=10
```

### **Database Configuration**

The application automatically connects to MySQL using the provided credentials. Ensure your MySQL server is running and accessible.

---

## 📊 Database Schema

### **Core Tables Structure**

```sql
-- User Management
users (id, username, email, password, role, created_at)
sessions (session_id, expires, data)

-- Learning Content
roadmaps (id, title, description, difficulty, duration)
modules (id, roadmap_id, title, description, order_index)
tasks (id, module_id, title, description, resource_url)
courses (id, title, description, instructor, difficulty)
course_lessons (id, course_id, title, content, video_url)

-- Progress Tracking
user_roadmaps (id, user_id, roadmap_id, started_at, completed_at)
user_progress (id, user_id, task_id, completed, completed_at)
user_courses (id, user_id, course_id, progress, completed_at)
lesson_progress (id, user_id, lesson_id, completed, completed_at)

-- Achievement System
certificates (id, user_id, course_id, certificate_id, issued_at)
badges (id, user_id, roadmap_id, badge_id, issued_at)
```

### **Relationships**

- Users have many roadmaps and courses (many-to-many)
- Roadmaps contain modules, modules contain tasks (one-to-many)
- Progress tracking links users to specific tasks/lessons
- Certificates and badges are issued upon completion

---

## 🔐 Authentication & Security

### **Security Features**

- **🔒 Password Hashing**: bcryptjs with configurable salt rounds
- **🎫 JWT Tokens**: Secure stateless authentication
- **🛡️ Session Management**: MySQL-backed session storage
- **🚪 Role-based Access**: Admin and user role differentiation
- **🔐 Route Protection**: Middleware-based route guarding

### **Authentication Flow**

1. User registers/logs in with credentials
2. Server validates and hashes password
3. JWT token generated and returned
4. Token required for protected routes
5. Admin routes require additional role verification

### **Admin Access Control**

Admin functionality is restricted to users with:
- Role: `admin`
- Email: `admin@learnpath.com`

---

## � User Interface

### **Design Principles**

- **📱 Mobile-First**: Responsive design for all device sizes
- **🎨 Modern UI**: Clean, professional Bootstrap-based interface
- **⚡ Performance**: Optimized loading and smooth interactions
- **♿ Accessibility**: WCAG compliant design patterns

### **Key UI Components**

1. **Dashboard**: Personal learning overview with statistics
2. **Roadmap Browser**: Filterable catalog of learning paths
3. **Course Interface**: Lesson navigation with progress tracking
4. **Progress Visualization**: Real-time progress bars and charts
5. **Certificate Gallery**: Achievement showcase and download

### **User Experience Features**

- **🔍 Smart Search**: Find relevant roadmaps and courses
- **📊 Progress Tracking**: Visual progress indicators
- **🎉 Achievement Celebrations**: Completion animations and notifications
- **💾 Auto-save**: Automatic progress persistence

---

## 🎓 Certificate System

### **Automated Certificate Generation**

The system provides comprehensive achievement recognition:

#### **Digital Certificates**
- **📜 Course Completion**: PDF certificates for completed courses
- **👤 Personalized**: User name, completion date, course details
- **🔗 Direct Download**: Instant PDF generation and download
- **💾 Persistent Storage**: Database record of all issued certificates

#### **Digital Badges**
- **🏅 Roadmap Achievement**: Custom badges for roadmap completion
- **🎨 Visual Design**: Professional badge design with user details
- **📱 Shareable**: Downloadable badges for portfolio/social sharing

#### **Implementation Details**

```javascript
// Certificate generation process
1. User completes course/roadmap
2. System validates 100% completion
3. Unique certificate ID generated
4. User redirected to certificate page with credentials
5. PDF generated using html2pdf.js
6. Certificate record saved to database
```

---

## 📈 Progress Tracking

### **Real-time Progress Calculation**

The system implements sophisticated progress tracking:

#### **Multi-level Progress**
- **📊 Task Level**: Individual task completion status
- **📈 Module Level**: Module progress based on task completion
- **🎯 Roadmap Level**: Overall roadmap completion percentage
- **📚 Course Level**: Lesson-based progress tracking

#### **Progress Persistence**
- **💾 Real-time Saving**: Automatic progress updates
- **🔄 Cross-device Sync**: Progress available across devices
- **📊 Historical Data**: Completion timestamps and analytics
- **🎉 Completion Detection**: Smart first-time completion alerts

#### **Visual Indicators**
```css
/* Progress bar styles */
.progress-bar {
    transition: width 0.3s ease;
    background: linear-gradient(45deg, #007bff, #28a745);
}

/* Completion animations */
.task-completed {
    animation: completionPulse 0.6s ease-in-out;
}
```

---

## 👨‍💼 Admin Panel

### **Comprehensive Administration**

The admin panel provides full content management capabilities:

#### **Content Management**
- **📚 Roadmap CRUD**: Create, read, update, delete roadmaps
- **� Course Management**: Full course and lesson management
- **📝 Task Organization**: Module and task content management
- **🔧 Bulk Operations**: Efficient content manipulation

#### **User Management**
- **👥 User Analytics**: User engagement and progress reports
- **📊 System Statistics**: Platform usage and completion rates
- **🎯 Performance Metrics**: Learning effectiveness analytics

#### **Security Features**
- **🔒 Role Verification**: Email-based admin access control
- **🛡️ Route Protection**: Admin-only API endpoints
- **📝 Activity Logging**: Admin action audit trails

### **Admin Dashboard Features**

---

## 🔌 API Documentation

### **Core API Endpoints**

#### **Authentication Endpoints**
```http
POST /api/register          # User registration
POST /api/login             # User authentication
POST /api/logout            # Session termination
GET  /api/profile           # User profile data
PUT  /api/profile           # Update user profile
```

#### **Learning Content Endpoints**
```http
GET  /api/roadmaps          # List all roadmaps
GET  /api/roadmaps/:id      # Get specific roadmap
GET  /api/courses           # List all courses
GET  /api/courses/:id       # Get specific course
```

#### **Progress Tracking Endpoints**
```http
GET  /api/roadmaps/:id/progress      # Get roadmap progress
POST /api/progress/task              # Update task progress
GET  /api/courses/:id/progress       # Get course progress
POST /api/lessons/:id/progress       # Update lesson progress
```

#### **Admin Endpoints**
```http
GET  /api/admin/stats               # System statistics
GET  /api/admin/users               # User management
POST /api/admin/roadmaps            # Create roadmap
PUT  /api/admin/roadmaps/:id        # Update roadmap
DELETE /api/admin/roadmaps/:id      # Delete roadmap
```

### **API Response Format**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Full Stack Development",
    "progress": 75
  },
  "message": "Progress updated successfully"
}
```

---

## 🧪 Testing

### **Testing Strategy**

The application includes comprehensive testing features:

#### **Manual Testing Tools**
- **🔧 Completion Reset**: `resetCompletionFlags()` function for testing
- **📊 Progress Simulation**: Test progress calculation accuracy
- **🎯 Admin Functions**: Test role-based access control

#### **Testing Checklist**

**✅ User Authentication**
- [x] Registration with validation
- [x] Login/logout functionality
- [x] JWT token handling
- [x] Session persistence

**✅ Progress Tracking**
- [x] Task completion updates
- [x] Progress bar accuracy
- [x] Cross-device synchronization
- [x] Completion alert triggers

**✅ Certificate System**
- [x] PDF generation functionality
- [x] User credential integration
- [x] Download mechanisms
- [x] Database record creation

**✅ Admin Panel**
- [x] Role-based access control
- [x] Content management operations
- [x] User analytics display
- [x] System statistics accuracy

---

## 🚀 Deployment

### **Production Deployment Steps**

1. **Server Preparation**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade
   
   # Install Node.js and MySQL
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs mysql-server
   ```

2. **Application Deployment**
   ```bash
   # Clone and setup
   git clone https://github.com/SubhashKumar14/LearnPath-1.git
   cd LearnPath-1
   npm install --production
   
   # Database setup
   sudo mysql -u root -p < schema.sql
   ```

3. **Environment Configuration**
   ```bash
   # Production environment
   cp .env.example .env
   nano .env  # Configure production values
   ```

4. **Process Management**
   ```bash
   # Using PM2 for production
   npm install -g pm2
   pm2 start server.js --name "learnpath"
   pm2 startup
   pm2 save
   ```

### **Docker Deployment** (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

### **Development Guidelines**

We welcome contributions! Please follow these guidelines:

1. **🍴 Fork the Repository**
2. **🌿 Create Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **💾 Commit Changes** (`git commit -m 'Add amazing feature'`)
4. **📤 Push to Branch** (`git push origin feature/amazing-feature`)
5. **🔃 Open Pull Request**

### **Code Standards**

- **📝 ES6+ JavaScript**: Modern JavaScript features
- **🎨 Consistent Formatting**: Use prettier for code formatting
- **📖 Documentation**: Comment complex logic and functions
- **🧪 Testing**: Test new features thoroughly

### **Bug Reports**

When reporting bugs, please include:
- **🖥️ Environment**: OS, Node.js version, browser
- **📝 Steps to Reproduce**: Detailed reproduction steps
- **📸 Screenshots**: Visual evidence if applicable
- **📊 Expected vs Actual**: What should happen vs what happens

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 SubhashKumar14

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📞 Contact & Support

<div align="center">

**👨‍💻 Developer**: SubhashKumar14  
**📧 Email**: subhash1403kumar@gmail.com  
**🐙 GitHub**: [@SubhashKumar14](https://github.com/SubhashKumar14)  
**🔗 Repository**: [LearnPath-1](https://github.com/SubhashKumar14/LearnPath-1)

---

### **🌟 Project Stats**

![GitHub Stars](https://img.shields.io/github/stars/SubhashKumar14/LearnPath-1?style=social)
![GitHub Forks](https://img.shields.io/github/forks/SubhashKumar14/LearnPath-1?style=social)
![GitHub Issues](https://img.shields.io/github/issues/SubhashKumar14/LearnPath-1)
![GitHub Last Commit](https://img.shields.io/github/last-commit/SubhashKumar14/LearnPath-1)

**⭐ If you find this project useful, please consider giving it a star!**

</div>

---

<div align="center">

**🚀 Built with ❤️ using Node.js, Express.js, and MySQL**

*Empowering learners through structured, goal-oriented education*

</div>
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

