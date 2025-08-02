# Changelog

All notable changes to Miyav will be documented in this file.

## [1.0.1] - 2025-01-30

### 🚀 Added
- **Complete Backend Infrastructure**: Full server-side architecture with Node.js/Express
- **MongoDB Database Integration**: Persistent data storage for users, messages, and friends
- **JWT Authentication**: Secure token-based authentication system
- **GitHub OAuth**: One-click login with GitHub accounts
- **Socket.IO Real-time Communication**: Live chat, notifications, and user status updates
- **File Upload System**: Image and file sharing capabilities
- **Game Integration API**: Track and share gaming status
- **Security Features**: Rate limiting, input validation, XSS protection
- **Automatic Server Startup**: Server starts automatically with Electron app
- **Notification System**: Real-time friend requests and message notifications

### 🔄 Changed
- **Removed Local Storage**: Migrated from client-side to server-side authentication
- **Updated UI**: Enhanced GitHub OAuth buttons and modern design
- **Improved Security**: Server-based authentication with JWT tokens
- **Better Error Handling**: Comprehensive error management and user feedback

### 🗑️ Removed
- **Forgot Password Feature**: Replaced with GitHub OAuth authentication
- **Local Storage Dependencies**: All client-side data now stored on server
- **Manual Server Management**: Server now starts automatically

### 🔧 Technical Improvements
- **Database Models**: User and Message schemas with MongoDB
- **API Endpoints**: RESTful APIs for auth, friends, games, and uploads
- **Middleware**: Authentication, security, and upload handling
- **Real-time Features**: Socket.IO for live updates and notifications

### 🐛 Fixed
- **Authentication Flow**: Secure server-based login/registration
- **Data Persistence**: All data now properly stored in database
- **Cross-platform Compatibility**: Improved Electron app stability

## [1.0.0-beta] - 2024-07-30

### 🎯 Initial Release
- Basic user registration and login
- Friend system with username search
- Direct messaging functionality
- Image sharing and saving
- Game tracking and status sharing
- Modern glassmorphism design
- Dark theme support
- Cross-platform compatibility (macOS/Windows)

### 📝 Beta Notes
- Video calling (not yet active)
- Voice calling in development
- Group chats in progress
- Emoji support planned for future versions 