const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Update current game status
router.post('/status', auth, async (req, res) => {
  try {
    const { gameName, isPlaying } = req.body;
    
    if (isPlaying && gameName) {
      // User started playing a game
      const gameData = {
        name: gameName,
        startTime: new Date(),
        duration: 0
      };
      
      await User.findByIdAndUpdate(req.user._id, {
        currentGame: gameData,
        status: 'busy'
      });
      
      res.json({
        message: 'Game status updated',
        game: gameData
      });
    } else {
      // User stopped playing
      const user = await User.findById(req.user._id);
      let duration = 0;
      
      if (user.currentGame && user.currentGame.startTime) {
        duration = Math.floor((new Date() - user.currentGame.startTime) / 1000); // seconds
      }
      
      await User.findByIdAndUpdate(req.user._id, {
        currentGame: null,
        status: 'online'
      });
      
      res.json({
        message: 'Game stopped',
        duration: duration
      });
    }
  } catch (error) {
    console.error('Game status update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's current game
router.get('/current', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.currentGame) {
      const duration = Math.floor((new Date() - user.currentGame.startTime) / 1000);
      
      res.json({
        game: {
          ...user.currentGame.toObject(),
          duration: duration
        }
      });
    } else {
      res.json({ game: null });
    }
  } catch (error) {
    console.error('Get current game error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friends' game status
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username displayName avatar currentGame status lastSeen');
    
    const friendsWithGames = user.friends.map(friend => {
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
    
    res.json({ friends: friendsWithGames });
  } catch (error) {
    console.error('Get friends games error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get popular games (mock data for now)
router.get('/popular', async (req, res) => {
  try {
    // This would typically query a games database
    const popularGames = [
      { name: 'Counter-Strike 2', players: 1250000 },
      { name: 'Dota 2', players: 850000 },
      { name: 'League of Legends', players: 2100000 },
      { name: 'Valorant', players: 950000 },
      { name: 'Fortnite', players: 1800000 },
      { name: 'Minecraft', players: 1200000 },
      { name: 'GTA V', players: 750000 },
      { name: 'Call of Duty: Warzone', players: 1100000 }
    ];
    
    res.json({ games: popularGames });
  } catch (error) {
    console.error('Get popular games error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search games
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    // Mock game search - in real app this would query a games database
    const allGames = [
      'Counter-Strike 2', 'Dota 2', 'League of Legends', 'Valorant',
      'Fortnite', 'Minecraft', 'GTA V', 'Call of Duty: Warzone',
      'Apex Legends', 'PUBG', 'Overwatch 2', 'Rocket League',
      'FIFA 24', 'NBA 2K24', 'Madden NFL 24', 'The Sims 4'
    ];
    
    const matchingGames = allGames.filter(game => 
      game.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({ games: matchingGames });
  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 