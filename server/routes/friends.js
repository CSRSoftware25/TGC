const express = require('express');
const { auth } = require('../middleware/auth');
const { body } = require('express-validator');
const User = require('../models/User');
const notificationService = require('../services/notifications');

const router = express.Router();

// Get user's friends
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username displayName avatar status currentGame lastSeen')
      .populate('friendRequests.from', 'username displayName avatar');

    const friends = user.friends.map(friend => {
      let gameDuration = 0;
      if (friend.currentGame && friend.currentGame.startTime) {
        gameDuration = Math.floor((new Date() - friend.currentGame.startTime) / 1000);
      }

      return {
        id: friend._id,
        username: friend.username,
        displayName: friend.displayName,
        avatar: friend.avatar,
        status: friend.status,
        currentGame: friend.currentGame ? {
          ...friend.currentGame.toObject(),
          duration: gameDuration
        } : null,
        lastSeen: friend.lastSeen
      };
    });

    const friendRequests = user.friendRequests
      .filter(request => request.status === 'pending')
      .map(request => ({
        id: request._id,
        from: {
          id: request.from._id,
          username: request.from.username,
          displayName: request.from.displayName,
          avatar: request.from.avatar
        },
        createdAt: request.createdAt
      }));

    res.json({
      friends: friends,
      friendRequests: friendRequests
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send friend request
router.post('/request', auth, [
  body('username').notEmpty().withMessage('Username is required')
], async (req, res) => {
  try {
    const { username } = req.body;

    // Find the user to send request to
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot send friend request to yourself' });
    }

    // Check if already friends
    const isAlreadyFriend = req.user.friends.includes(targetUser._id);
    if (isAlreadyFriend) {
      return res.status(400).json({ error: 'You are already friends with this user' });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === req.user._id.toString()
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: req.user._id,
      status: 'pending'
    });
    await targetUser.save();

    // Send notification
    await notificationService.sendFriendRequest(req.user._id, targetUser._id);

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept friend request
router.post('/accept/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const user = await User.findById(req.user._id);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Friend request already processed' });
    }

    // Accept the request
    request.status = 'accepted';

    // Add to friends list for both users
    user.friends.push(request.from);
    await user.save();

    const fromUser = await User.findById(request.from);
    fromUser.friends.push(user._id);
    await fromUser.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject friend request
router.post('/reject/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const user = await User.findById(req.user._id);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Friend request already processed' });
    }

    // Reject the request
    request.status = 'rejected';
    await user.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;

    // Remove from current user's friends
    const user = await User.findById(req.user._id);
    user.friends = user.friends.filter(friend => friend.toString() !== friendId);
    await user.save();

    // Remove from friend's friends
    const friend = await User.findById(friendId);
    if (friend) {
      friend.friends = friend.friends.filter(friend => friend.toString() !== req.user._id.toString());
      await friend.save();
    }

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user._id } }
      ]
    }).select('username displayName avatar status');

    // Filter out users who are already friends
    const user = await User.findById(req.user._id);
    const friendIds = user.friends.map(friend => friend.toString());
    
    const filteredUsers = users.filter(user => !friendIds.includes(user._id.toString()));

    res.json({ users: filteredUsers });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 