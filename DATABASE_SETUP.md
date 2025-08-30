# LearnPath Database Setup

## Single Schema File

The LearnPath project now uses a **single consolidated SQL file** for all database setup:

### 📁 `schema.sql`
- **Complete database schema** with all tables
- **Sample data** for testing and development
- **Performance indexes** for optimal queries
- **Clean, organized structure**

## What Was Consolidated

The following files were merged into `schema.sql` and removed:
- ❌ `update_schema.sql` - Course system updates
- ❌ `simple_schema.sql` - Simplified course tables
- ❌ `fix_schema.sql` - Schema fixes and corrections
- ❌ `fix_db.sql` - Minor database patches

## Database Setup

To set up the database, simply run:

```bash
mysql -u root -p < schema.sql
```

Or import it through your MySQL client.

## What's Included

### Core System
- ✅ **Users & Authentication**
- ✅ **Roadmaps & Modules**
- ✅ **Tasks & Progress Tracking**

### Courses System
- ✅ **Courses & Lessons**
- ✅ **Course Enrollment**
- ✅ **Lesson Progress Tracking**
- ✅ **Course Notes**

### Certificates & Badges
- ✅ **Certificate Requests & Management**
- ✅ **Badge Requests & Management**
- ✅ **Admin Approval Workflow**

### Sample Data
- ✅ **Admin user** (admin@learnpath.com / password)
- ✅ **Sample roadmaps** with modules and tasks
- ✅ **Sample courses** with lessons
- ✅ **Performance indexes**

## Benefits of Single Schema

1. **Easier Setup** - One file to run
2. **No Conflicts** - No duplicate or conflicting table definitions
3. **Better Maintenance** - Single source of truth
4. **Cleaner Codebase** - No scattered SQL files
5. **Production Ready** - Complete schema in one place

## Database Structure

The consolidated schema includes:
- **15 main tables** with proper relationships
- **Performance indexes** for optimal queries
- **Foreign key constraints** for data integrity
- **Sample data** for immediate testing
