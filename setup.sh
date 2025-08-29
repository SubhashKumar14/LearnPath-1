#!/bin/bash

echo "🚀 LearnPath Platform Setup Script"
echo "================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup database
echo "🗄️ Setting up database..."
echo "Please enter your MySQL root password when prompted:"
mysql -u root -p < schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed"
else
    echo "❌ Database setup failed. Please check your MySQL connection."
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the application:"
echo "  npm start        # Production mode"
echo ""
echo "The application will be available at: http://localhost:3000"
echo ""
echo "Default login credentials:"
echo "  Admin: admin@learnpath.com / password123"
echo "  User:  john.doe@example.com / password123"
echo ""
echo "⚠️  Remember to change default passwords in production!"