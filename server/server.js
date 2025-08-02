const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const { auth, optionalAuth } = require('./middleware/auth');
const { 
  authLimiter, 
  messageLimiter, 
  uploadLimiter, 
  apiLimiter,
  securityHeaders,
  requestLogger,
  corsOptions
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const githubAuthRoutes = require('./routes/github-auth');
const friendsRoutes = require('./routes/friends');
const gamesRoutes = require('./routes/games');
const uploadRoutes = require('./routes/upload');

// Import services
const notificationService = require('./services/notifications');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

// Session middleware for GitHub OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'miyav-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Passport middleware
const { passport } = require('./middleware/github-auth');
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(securityHeaders);
app.use(requestLogger);

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/messages', messageLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', githubAuthRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/upload', uploadRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Miyav Chat Server', 
    version: '1.0.0',
    status: 'running',
    features: [
      'Real-time messaging',
      'User authentication',
      'Friend system',
      'Game integration',
      'File sharing',
      'Push notifications'
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log('User connected:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      if (!token) {
        socket.emit('auth_error', { error: 'No token provided' });
        return;
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'miyav-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        socket.emit('auth_error', { error: 'Invalid token' });
        return;
      }

      // Store user info in socket
      socket.userId = user._id;
      socket.username = user.username;
      socket.displayName = user.displayName;

      // Add to notification service
      notificationService.addConnection(user._id, socket);

      // Update user status to online
      await User.findByIdAndUpdate(user._id, { 
        status: 'online',
        lastSeen: new Date()
      });

      // Notify friends about online status
      await notificationService.sendStatusNotification(user._id, 'online');

      socket.emit('authenticated', { 
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar
        }
      });

      console.log(`User authenticated: ${user.username}`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth_error', { error: 'Authentication failed' });
    }
  });

  // Join a chat room
  socket.on('join_room', (data) => {
    const { room, username } = data;
    socket.join(room);
    socket.to(room).emit('user_joined', {
      username: username,
      message: `${username} joined the chat`,
      timestamp: new Date()
    });
    console.log(`${username} joined room: ${room}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { room, username, message, type = 'text', receiverId } = data;
      
      const messageData = {
        username: username,
        message: message,
        type: type,
        timestamp: new Date(),
        id: socket.id
      };
      
      io.to(room).emit('receive_message', messageData);

      // Save message to database if receiver is specified
      if (receiverId && socket.userId) {
        const newMessage = new Message({
          sender: socket.userId,
          receiver: receiverId,
          content: message,
          type: type,
          room: room
        });
        await newMessage.save();

        // Send notification to receiver
        await notificationService.sendMessageNotification(socket.userId, receiverId, message);
      }

      console.log(`Message in ${room}: ${username}: ${message}`);
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { room, username } = data;
    socket.to(room).emit('user_typing', { username });
  });

  // Stop typing
  socket.on('stop_typing', (data) => {
    const { room, username } = data;
    socket.to(room).emit('user_stop_typing', { username });
  });

  // User status update
  socket.on('status_update', async (data) => {
    try {
      const { room, username, status } = data;
      
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { status });
        await notificationService.sendStatusNotification(socket.userId, status);
      }
      
      socket.to(room).emit('user_status_changed', {
        username,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Status update error:', error);
    }
  });

  // Game status update
  socket.on('game_status', async (data) => {
    try {
      const { gameName, isPlaying } = data;
      
      if (socket.userId) {
        const user = await User.findById(socket.userId);
        const friendIds = user.friends.map(friend => friend.toString());
        
        if (isPlaying && gameName) {
          await User.findByIdAndUpdate(socket.userId, {
            currentGame: {
              name: gameName,
              startTime: new Date(),
              duration: 0
            },
            status: 'busy'
          });
        } else {
          await User.findByIdAndUpdate(socket.userId, {
            currentGame: null,
            status: 'online'
          });
        }

        // Notify friends about game status
        await notificationService.sendGameStatusNotification(socket.userId, friendIds, gameName, isPlaying);
      }
    } catch (error) {
      console.error('Game status update error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        // Update user status to offline
        await User.findByIdAndUpdate(socket.userId, { 
          status: 'offline',
          lastSeen: new Date()
        });

        // Remove from notification service
        notificationService.removeConnection(socket.userId);

        // Notify friends about offline status
        await notificationService.sendStatusNotification(socket.userId, 'offline');
      }
      
      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Miyav Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🔐 Authentication system active`);
  console.log(`👥 Friend system ready`);
  console.log(`🎮 Game integration active`);
  console.log(`📁 File upload system ready`);
  console.log(`🔔 Notification system active`);
});

module.exports = { app, server, io }; 