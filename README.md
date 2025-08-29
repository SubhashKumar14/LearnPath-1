# LearnPath - Roadmap Learning Platform

A comprehensive learning platform that allows users to follow structured roadmaps, track their progress, and earn certificates and badges upon completion.

## Features

### For Students
- 🛣️ **Structured Learning Roadmaps**: Follow expert-curated learning paths
- 📈 **Progress Tracking**: Monitor your completion status for tasks and modules  
- 📋 **Task Management**: Complete tasks with external resource links
- 🏆 **Certificates & Badges**: Earn recognition for completing roadmaps
- 👤 **User Dashboard**: View personal learning statistics and progress
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

### For Administrators
- 🛠️ **Roadmap Management**: Create, edit, and delete learning roadmaps
- 📊 **User Management**: Monitor user progress and activity
- 📜 **Certificate Generation**: Issue certificates and badges to users

## Technology Stack

- **Backend**: Node.js + Express.js + MySQL
- **Frontend**: HTML5 + CSS3 + JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Authentication**: JWT + bcrypt
- **Database**: MySQL with proper schema design

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)

### Step 1: Clone and Install
```bash
cd learnpath-platform
npm install
```

### Step 2: Database Setup
```bash
mysql -u root -p < schema.sql
```

### Step 3: Environment Configuration
Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=learnpath_db
JWT_SECRET=your_secret_key_here
PORT=3000
```

### Step 4: Start the Application
```bash
npm start
```

The application will be available at: `http://localhost:3000`

## Default User Accounts

- **Admin**: `admin@learnpath.com` / `password123`
- **User**: `john.doe@example.com` / `password123`

> **⚠️ Important**: Change these default passwords before deploying to production!

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Roadmaps
- `GET /api/roadmaps` - Get all roadmaps
- `GET /api/roadmaps/:id` - Get specific roadmap
- `POST /api/roadmaps` - Create roadmap (Admin only)
- `POST /api/roadmaps/:id/start` - Start a roadmap

### Progress Tracking
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress/task` - Update task completion

## Usage

1. **Registration**: Create an account or use the demo account
2. **Browse Roadmaps**: View available learning paths
3. **Start Learning**: Click "Start Learning" on any roadmap
4. **Track Progress**: Complete tasks and monitor your progress
5. **Earn Recognition**: Generate certificates and badges upon completion

## Security

- Passwords are hashed using bcrypt
- JWT tokens for session management
- Input validation on both frontend and backend
- SQL injection protection with parameterized queries

## License

This project is licensed under the MIT License.

## Support

For support and questions, create an issue in the repository.
