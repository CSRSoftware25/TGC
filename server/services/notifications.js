const User = require('../models/User');

class NotificationService {
  constructor() {
    this.connections = new Map(); // Store socket connections
  }

  // Add user connection
  addConnection(userId, socket) {
    this.connections.set(userId.toString(), socket);
  }

  // Remove user connection
  removeConnection(userId) {
    this.connections.delete(userId.toString());
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const socket = this.connections.get(userId.toString());
    if (socket) {
      socket.emit('notification', notification);
    }
  }

  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    userIds.forEach(userId => {
      this.sendToUser(userId, notification);
    });
  }

  // Send friend request notification
  async sendFriendRequest(fromUserId, toUserId) {
    try {
      const fromUser = await User.findById(fromUserId).select('username displayName avatar');
      
      const notification = {
        type: 'friend_request',
        title: 'Yeni Arkadaşlık İsteği',
        message: `${fromUser.displayName} size arkadaşlık isteği gönderdi`,
        data: {
          fromUser: {
            id: fromUser._id,
            username: fromUser.username,
            displayName: fromUser.displayName,
            avatar: fromUser.avatar
          }
        },
        timestamp: new Date()
      };

      this.sendToUser(toUserId, notification);
    } catch (error) {
      console.error('Send friend request notification error:', error);
    }
  }

  // Send message notification
  async sendMessageNotification(fromUserId, toUserId, message) {
    try {
      const fromUser = await User.findById(fromUserId).select('username displayName avatar');
      
      const notification = {
        type: 'new_message',
        title: 'Yeni Mesaj',
        message: `${fromUser.displayName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        data: {
          fromUser: {
            id: fromUser._id,
            username: fromUser.username,
            displayName: fromUser.displayName,
            avatar: fromUser.avatar
          },
          message: message
        },
        timestamp: new Date()
      };

      this.sendToUser(toUserId, notification);
    } catch (error) {
      console.error('Send message notification error:', error);
    }
  }

  // Send game status notification
  async sendGameStatusNotification(userId, friendIds, gameName, isPlaying) {
    try {
      const user = await User.findById(userId).select('username displayName avatar');
      
      const notification = {
        type: 'game_status',
        title: isPlaying ? 'Oyun Başladı' : 'Oyun Bitti',
        message: isPlaying 
          ? `${user.displayName} ${gameName} oyununu oynamaya başladı`
          : `${user.displayName} ${gameName} oyununu bıraktı`,
        data: {
          user: {
            id: user._id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar
          },
          game: gameName,
          isPlaying: isPlaying
        },
        timestamp: new Date()
      };

      this.sendToUsers(friendIds, notification);
    } catch (error) {
      console.error('Send game status notification error:', error);
    }
  }

  // Send system notification
  sendSystemNotification(userId, title, message, data = {}) {
    const notification = {
      type: 'system',
      title: title,
      message: message,
      data: data,
      timestamp: new Date()
    };

    this.sendToUser(userId, notification);
  }

  // Send online/offline notification to friends
  async sendStatusNotification(userId, status) {
    try {
      const user = await User.findById(userId).populate('friends');
      const userInfo = {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      };

      const notification = {
        type: 'status_change',
        title: status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı',
        message: `${user.displayName} ${status === 'online' ? 'çevrimiçi' : 'çevrimdışı'} oldu`,
        data: {
          user: userInfo,
          status: status
        },
        timestamp: new Date()
      };

      // Send to all friends
      const friendIds = user.friends.map(friend => friend._id);
      this.sendToUsers(friendIds, notification);
    } catch (error) {
      console.error('Send status notification error:', error);
    }
  }

  // Get all connections count
  getConnectionsCount() {
    return this.connections.size;
  }

  // Get all connected user IDs
  getConnectedUsers() {
    return Array.from(this.connections.keys());
  }
}

module.exports = new NotificationService(); 