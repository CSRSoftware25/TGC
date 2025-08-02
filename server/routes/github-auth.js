const express = require('express');
const { passport, generateGitHubToken } = require('../middleware/github-auth');
const User = require('../models/User');

const router = express.Router();

// GitHub OAuth login
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub OAuth callback
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/auth/failure' }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect('/auth/failure');
      }

      // Generate JWT token
      const token = generateGitHubToken(user);

      // Send HTML page that posts message to parent window
      const userData = {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        status: user.status
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>GitHub OAuth Callback</title>
        </head>
        <body>
          <script>
            try {
              // Send message to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'github-auth-success',
                  token: '${token}',
                  user: ${JSON.stringify(userData)}
                }, 'http://localhost:3000');
                
                // Close this window
                window.close();
              } else {
                // Fallback: redirect with parameters
                window.location.href = 'http://localhost:3000/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}';
              }
            } catch (error) {
              console.error('GitHub callback error:', error);
              window.location.href = 'http://localhost:3000/auth/callback?error=callback_failed';
            }
          </script>
          <p>GitHub girişi tamamlanıyor...</p>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect('/auth/failure');
    }
  }
);

// Auth failure route
router.get('/failure', (req, res) => {
  res.json({ 
    error: 'Authentication failed',
    message: 'GitHub authentication failed. Please try again.'
  });
});

// Get GitHub OAuth URL for frontend
router.get('/github/url', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback')}&scope=user:email`;
  
  res.json({ 
    authUrl: githubAuthUrl 
  });
});

module.exports = router; 