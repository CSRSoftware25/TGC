// Server-based Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.serverUrl = 'http://localhost:3001';
        this.socket = null;
        this.isAuthenticated = false;
    }

    // Initialize authentication
    async init() {
        // Check for existing token
        const savedToken = localStorage.getItem('miyav_token');
        if (savedToken) {
            try {
                await this.validateToken(savedToken);
            } catch (error) {
                console.log('Saved token is invalid, removing...');
                localStorage.removeItem('miyav_token');
            }
        }
        
        this.updateUI();
    }

    // Register new user
    async register(userData) {
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: userData.username,
                    displayName: userData.displayName,
                    email: userData.email || `${userData.username}@miyav.local`,
                    password: userData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store token and user data
            this.token = data.token;
            this.currentUser = data.user;
            this.isAuthenticated = true;

            localStorage.setItem('miyav_token', this.token);
            localStorage.setItem('miyav_user', JSON.stringify(this.currentUser));

            // Connect to socket with authentication
            this.connectSocket();

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: credentials.username,
                    password: credentials.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            this.token = data.token;
            this.currentUser = data.user;
            this.isAuthenticated = true;

            localStorage.setItem('miyav_token', this.token);
            localStorage.setItem('miyav_user', JSON.stringify(this.currentUser));

            // Connect to socket with authentication
            this.connectSocket();

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Validate token
    async validateToken(token) {
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            const data = await response.json();
            this.currentUser = data.user;
            this.token = token;
            this.isAuthenticated = true;

            // Connect to socket with authentication
            this.connectSocket();

            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            this.logout();
            return false;
        }
    }

    // Logout user
    logout() {
        this.currentUser = null;
        this.token = null;
        this.isAuthenticated = false;

        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        // Clear local storage
        localStorage.removeItem('miyav_token');
        localStorage.removeItem('miyav_user');

        this.updateUI();
    }

    // Connect to socket with authentication
    connectSocket() {
        if (!this.token || !window.io) {
            console.error('Token or Socket.IO not available');
            return;
        }

        try {
            this.socket = io(this.serverUrl);
            
            this.socket.on('connect', () => {
                console.log('Socket connected, authenticating...');
                this.socket.emit('authenticate', { token: this.token });
            });

            this.socket.on('authenticated', (data) => {
                console.log('Socket authenticated:', data);
                this.updateUI();
            });

            this.socket.on('auth_error', (error) => {
                console.error('Socket authentication error:', error);
                this.logout();
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

        } catch (error) {
            console.error('Socket connection error:', error);
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Profile update failed');
            }

            // Update current user data
            this.currentUser = data.user;
            localStorage.setItem('miyav_user', JSON.stringify(this.currentUser));

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.currentUser !== null;
    }

    // Get authentication token
    getToken() {
        return this.token;
    }

    // Update UI based on authentication status
    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const userNameElement = document.getElementById('user-name');
        const userStatusElement = document.getElementById('user-status');

        if (this.isAuthenticated && this.currentUser) {
            // User is logged in
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }
            
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.displayName;
            }
            
            if (userStatusElement) {
                userStatusElement.textContent = 'Çevrimiçi';
            }

            // Update chat header
            const chatName = document.getElementById('chat-name');
            if (chatName) {
                chatName.textContent = `Hoş geldin, ${this.currentUser.displayName}!`;
            }

            // Update right panel
            this.updateRightPanel();

        } else {
            // User is not logged in
            if (loginBtn) {
                loginBtn.style.display = 'block';
            }
            
            if (userNameElement) {
                userNameElement.textContent = 'Giriş Yap';
            }
            
            if (userStatusElement) {
                userStatusElement.textContent = 'Çevrimdışı';
            }

            // Update chat header
            const chatName = document.getElementById('chat-name');
            if (chatName) {
                chatName.textContent = 'Hoş Geldiniz';
            }
        }
    }

    // Update right panel with user info
    updateRightPanel() {
        if (!this.currentUser) return;

        const panelUserName = document.getElementById('panel-user-name');
        const panelUserStatus = document.getElementById('panel-user-status');
        const panelCurrentGame = document.getElementById('panel-current-game');

        if (panelUserName) {
            panelUserName.textContent = this.currentUser.displayName;
        }

        if (panelUserStatus) {
            panelUserStatus.textContent = 'Çevrimiçi';
        }

        if (panelCurrentGame) {
            panelCurrentGame.innerHTML = `
                <span class="game-name">Oyun oynamıyor</span>
                <span class="game-time">0 dakika</span>
            `;
        }
    }

    // Show login modal
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Show register modal
    showRegisterModal() {
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }
}

// Initialize AuthManager
window.authManager = new AuthManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager.init();
});

// Event listeners for login/register forms
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            const result = await window.authManager.login({ username, password });
            
            if (result.success) {
                window.authManager.hideModal('login-modal');
                alert(`${result.user.displayName} olarak giriş yapıldı.`);
                
                // Clear form
                document.getElementById('login-username').value = '';
                document.getElementById('login-password').value = '';
            } else {
                alert(`Giriş başarısız: ${result.error}`);
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('register-username').value;
            const displayName = document.getElementById('register-display-name').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;

            if (password !== confirmPassword) {
                alert('Şifreler eşleşmiyor.');
                return;
            }

            const result = await window.authManager.register({
                username,
                displayName,
                password
            });
            
            if (result.success) {
                window.authManager.hideModal('register-modal');
                alert(`${result.user.displayName} hesabı başarıyla oluşturuldu!`);
                
                // Clear form
                document.getElementById('register-username').value = '';
                document.getElementById('register-display-name').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-confirm-password').value = '';
            } else {
                alert(`Kayıt başarısız: ${result.error}`);
            }
        });
    }

    // Modal navigation
    const showLoginLink = document.getElementById('show-login');
    const showRegisterLink = document.getElementById('show-register');

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.authManager.hideModal('register-modal');
            window.authManager.showLoginModal();
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.authManager.hideModal('login-modal');
            window.authManager.showRegisterModal();
        });
    }

    // Login button click
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.authManager.showLoginModal();
        });
    }

    // Auto-show register modal if no user is logged in
    setTimeout(() => {
        if (!window.authManager.isUserAuthenticated()) {
            window.authManager.showRegisterModal();
        }
    }, 1000);
}); 