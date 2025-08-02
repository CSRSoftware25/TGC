// Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.verificationCode = null;
        this.pendingRegistration = null;
        
        this.initializeAuth();
    }

    initializeAuth() {
        this.setupEventListeners();
        this.checkAuthStatus();
        
        // Show register modal if not authenticated
        setTimeout(() => {
            if (!this.isAuthenticated) {
                this.showRegisterModal();
            }
        }, 500);
    }

    setupEventListeners() {
        
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
            return;
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            // Remove existing listeners to prevent duplicates
            registerForm.removeEventListener('submit', this.handleRegister.bind(this));
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            // Remove existing listeners to prevent duplicates
            loginForm.removeEventListener('submit', this.handleLogin.bind(this));
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Verification form
        const verificationForm = document.getElementById('verification-form');
        if (verificationForm) {
            verificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleVerification();
            });
        }

        // Modal navigation
        // Show login from register modal
        const showLoginLink = document.getElementById('show-login');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Show register from login modal
        const showRegisterLink = document.getElementById('show-register');
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }

        // Resend code
        const resendCodeBtn = document.getElementById('resend-code');
        if (resendCodeBtn) {
            resendCodeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resendVerificationCode();
            });
        }

        // Forgot password
        const forgotPasswordBtn = document.getElementById('forgot-password');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }

        // User settings
        const userSettingsBtn = document.getElementById('user-settings');
        if (userSettingsBtn) {
            userSettingsBtn.addEventListener('click', () => {
                this.showUserSettingsModal();
            });
        }

        // Close user settings modal
        const closeUserSettingsBtn = document.getElementById('close-user-settings-modal');
        if (closeUserSettingsBtn) {
            closeUserSettingsBtn.addEventListener('click', () => {
                this.hideModal('user-settings-modal');
            });
        }

        // User settings form
        const userSettingsForm = document.getElementById('user-settings-form');
        if (userSettingsForm) {
            userSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUserSettings();
            });
        }
        
    }

    showRegisterModal() {
        this.hideAllModals();
        this.showModal('register-modal');
    }

    showLoginModal() {
        this.hideAllModals();
        this.showModal('login-modal');
    }

    showVerificationModal(email) {
        this.hideAllModals();
        document.getElementById('verification-email').textContent = email;
        this.showModal('email-verification-modal');
    }

    showUserSettingsModal() {
        if (!this.isAuthenticated) {
            this.showNotification('Ayarları görüntülemek için giriş yapın.', 'warning');
            return;
        }
        this.populateUserSettings();
        this.showModal('user-settings-modal');
    }

    async handleRegister() {
        
        const username = document.getElementById('register-username').value;
        const displayName = document.getElementById('register-display-name').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !displayName || !password || !confirmPassword) {
            this.showNotification('Tüm alanları doldurun.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Şifreler eşleşmiyor.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Şifre en az 6 karakter olmalı.', 'error');
            return;
        }

        try {
            // Check if username already exists
            const users = this.getUsers();
            const existingUser = users.find(u => u.username === username);

            if (existingUser) {
                this.showNotification('Bu kullanıcı adı zaten kullanılıyor.', 'error');
                return;
            }

            // Create new user
            const newUser = {
                id: this.generateId(),
                username: username,
                displayName: displayName,
                password: this.hashPassword(password),
                createdAt: new Date(),
                verified: true // No email verification needed
            };

            // Add user to users array
            users.push(newUser);
            this.saveUsers(users);

            // Auto login
            this.currentUser = newUser;
            this.isAuthenticated = true;
            this.saveCurrentUser();

            // Update UI
            this.updateUserInterface();

            // Sync with app.js
            if (window.tgcApp) {
                window.tgcApp.syncUserFromAuthManager();
            }

            // Hide modal
            this.hideModal('register-modal');

            this.showNotification(`${displayName} hesabı başarıyla oluşturuldu!`, 'success');

            // Clear form
            document.getElementById('register-username').value = '';
            document.getElementById('register-display-name').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-confirm-password').value = '';

        } catch (error) {
            this.showNotification('Kayıt olurken bir hata oluştu.', 'error');
        }
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showNotification('Kullanıcı adı ve şifre gerekli.', 'error');
            return;
        }

        try {
            // Get users from localStorage
            const users = this.getUsers();
            const user = users.find(u => u.username === username);

            if (!user) {
                this.showNotification('Kullanıcı adı bulunamadı.', 'error');
                return;
            }

            // Check password (simple hash comparison)
            const hashedPassword = this.hashPassword(password);
            if (user.password !== hashedPassword) {
                this.showNotification('Şifre yanlış.', 'error');
                return;
            }

            // Login successful
            this.currentUser = user;
            this.isAuthenticated = true;
            
            // Save current user
            this.saveCurrentUser();
            
            // Update UI
            this.updateUserInterface();
            
            // Sync with app.js
            if (window.tgcApp) {
                window.tgcApp.syncUserFromAuthManager();
            }
            
            // Hide modal
            this.hideModal('login-modal');
            
            this.showNotification(`${user.displayName || user.username} olarak giriş yapıldı.`, 'success');
            
            // Clear form
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            
        } catch (error) {
            this.showNotification('Giriş yapılırken bir hata oluştu.', 'error');
        }
    }

    async handleVerification() {
        const code = document.getElementById('verification-code').value;

        if (!code) {
            this.showNotification('Doğrulama kodu gerekli.', 'error');
            return;
        }

        // Simple verification
        if (code !== this.verificationCode) {
            this.showNotification('Doğrulama kodu hatalı.', 'error');
            return;
        }

        try {
            // Complete registration
            const user = {
                ...this.pendingRegistration,
                verified: true,
                verifiedAt: new Date(),
                id: this.generateId()
            };

            // Save user securely
            const users = this.getUsers();
            users.push(user);
            this.saveUsers(users);

            // Auto login
            this.currentUser = user;
            this.isAuthenticated = true;
            this.saveCurrentUser();
            this.updateUserInterface();
            this.hideAllModals();

            this.showNotification('Hesabınız başarıyla oluşturuldu!', 'success');

            // Clear forms
            this.clearRegistrationForm();

        } catch (error) {
            this.showNotification('Doğrulama başarısız: ' + error.message, 'error');
        }
    }

    async handleUserSettings() {
        const username = document.getElementById('settings-username').value;
        const displayName = document.getElementById('settings-display-name').value;
        const password = document.getElementById('settings-password').value;
        const passwordConfirm = document.getElementById('settings-password-confirm').value;
        const autoStartup = document.getElementById('auto-startup').checked;
        const gameTracking = document.getElementById('game-tracking').checked;
        const messageNotifications = document.getElementById('message-notifications').checked;
        const friendNotifications = document.getElementById('friend-notifications').checked;

        // Validate password change
        if (password && password !== passwordConfirm) {
            this.showNotification('Yeni şifreler eşleşmiyor.', 'error');
            return;
        }

        if (password && password.length < 4) {
            this.showNotification('Yeni şifre en az 4 karakter olmalıdır.', 'error');
            return;
        }

        try {
            // Update user data
            this.currentUser.username = username;
            this.currentUser.displayName = displayName;
            
            // Update password if provided
            if (password) {
                this.currentUser.password = btoa(password);
            }
            
            this.currentUser.settings = {
                autoStartup,
                gameTracking,
                messageNotifications,
                friendNotifications
            };

            // Save updated user
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = this.currentUser;
                this.saveUsers(users);
                this.saveCurrentUser();
            }

            this.updateUserInterface();
            this.hideModal('user-settings-modal');
            this.showNotification('Ayarlar kaydedildi!', 'success');

        } catch (error) {
            this.showNotification('Ayarlar kaydedilemedi: ' + error.message, 'error');
        }
    }

    populateUserSettings() {
        if (!this.currentUser) return;

        document.getElementById('settings-username').value = this.currentUser.username;
        document.getElementById('settings-display-name').value = this.currentUser.displayName;
        document.getElementById('settings-password').value = '';
        document.getElementById('settings-password-confirm').value = '';

        const settings = this.currentUser.settings || {};
        document.getElementById('auto-startup').checked = settings.autoStartup || false;
        document.getElementById('game-tracking').checked = settings.gameTracking !== false;
        document.getElementById('message-notifications').checked = settings.messageNotifications !== false;
        document.getElementById('friend-notifications').checked = settings.friendNotifications !== false;
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('tgc_current_user');
        const rememberedUser = localStorage.getItem('tgc_remembered_user');

        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isAuthenticated = true;
                this.updateUserInterface();
            } catch (error) {
                // Clear corrupted data
                localStorage.removeItem('tgc_current_user');
                this.showRegisterModal();
            }
        } else if (rememberedUser) {
            // Auto login for remembered user
            const users = this.getUsers();
            const user = users.find(u => u.username === rememberedUser);
            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                this.saveCurrentUser();
                this.updateUserInterface();
            } else {
                // Clear invalid remembered user
                localStorage.removeItem('tgc_remembered_user');
                this.showRegisterModal();
            }
        } else {
            // No saved user, show register modal
            this.showRegisterModal();
        }
    }

    updateUserInterface() {
        const loginBtn = document.getElementById('login-btn');
        const userSettingsBtn = document.getElementById('user-settings');
        const userNameElement = document.getElementById('user-name');
        const panelUserName = document.getElementById('panel-user-name');
        const userStatus = document.getElementById('user-status');
        const panelUserStatus = document.getElementById('panel-user-status');
        
        if (this.isAuthenticated && this.currentUser) {
            
            // Update user name display
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.displayName;
            }
            if (panelUserName) {
                panelUserName.textContent = this.currentUser.displayName;
            }
            
            // Update status to online
            if (userStatus) {
                userStatus.textContent = 'Çevrimiçi';
            }
            if (panelUserStatus) {
                panelUserStatus.textContent = 'Çevrimiçi';
            }
            
            // Change login button to logout
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
                loginBtn.title = 'Çıkış Yap';
                loginBtn.onclick = () => this.logout();
            }
            
            // Show user settings
            if (userSettingsBtn) {
                userSettingsBtn.style.display = 'flex';
            }
            
            // Hide auth modals if user is authenticated
            this.hideAllModals();
        } else {
            
            // Update user name display
            if (userNameElement) {
                userNameElement.textContent = 'Giriş Yap';
            }
            if (panelUserName) {
                panelUserName.textContent = 'Kullanıcı';
            }
            
            // Update status to offline
            if (userStatus) {
                userStatus.textContent = 'Çevrimdışı';
            }
            if (panelUserStatus) {
                panelUserStatus.textContent = 'Çevrimdışı';
            }
            
            // Change logout button to login
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
                loginBtn.title = 'Giriş Yap';
                loginBtn.onclick = () => this.showLoginModal();
            }
            
            // Hide user settings
            if (userSettingsBtn) {
                userSettingsBtn.style.display = 'none';
            }
        }
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('tgc_current_user');
        this.updateUserInterface();
        this.showRegisterModal();
        this.showNotification('Çıkış yapıldı.', 'info');
    }

    // Utility methods
    getUsers() {
        const users = localStorage.getItem('tgc_users');
        return users ? JSON.parse(users) : [];
    }

    saveUsers(users) {
        localStorage.setItem('tgc_users', JSON.stringify(users));
    }

    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('tgc_current_user', JSON.stringify(this.currentUser));
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    hashPassword(password) {
        return btoa(password);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    simulateEmailVerification(email, code) {
        // In a real app, this would send an actual email
        // For demo purposes, we'll just show a notification
        setTimeout(() => {
            this.showNotification(`Doğrulama kodu ${email} adresine gönderildi.`, 'info');
        }, 1000);
    }

    resendVerificationCode() {
        if (this.pendingRegistration) {
            this.verificationCode = this.generateVerificationCode();
            this.simulateEmailVerification(this.pendingRegistration.email, this.verificationCode);
            this.showNotification('Yeni doğrulama kodu gönderildi.', 'info');
        }
    }

    showForgotPasswordModal() {
        this.showNotification('Şifre sıfırlama özelliği yakında gelecek!', 'info');
    }

    clearRegistrationForm() {
        document.getElementById('register-username').value = '';
        document.getElementById('register-display-name').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-password-confirm').value = '';
    }

    clearAllData() {
        // Clear all localStorage data
        const keysToRemove = [
            'tgc_users',
            'tgc_current_user',
            'tgc_friends',
            'tgc_friend_requests',
            'tgc_dm_list',
            'tgc_chat_history',
            'tgc_user_settings',
            'tgc_game_status',
            'tgc_notifications'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Reset current state
        this.currentUser = null;
        this.isAuthenticated = false;
        this.verificationCode = null;
        this.pendingRegistration = null;
        
        // Update UI
        this.updateUserInterface();
        
        // Show register modal
        this.showRegisterModal();
        
        this.showNotification('Tüm veriler temizlendi. Yeni hesap oluşturabilirsiniz.', 'success');
        
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    hideAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }

    showNotification(message, type = 'info') {
        if (window.tgcApp) {
            window.tgcApp.showNotification(message, type);
        } else {
            // console.log(`Auth Notification [${type}]:`, message); // Removed console.log
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.authManager) {
        window.authManager = new AuthManager();
        
        // Update UI after auth manager is initialized
        setTimeout(() => {
            if (window.authManager) {
                window.authManager.updateUserInterface();
            } else {
                // console.error('AuthManager failed to initialize'); // Removed console.error
            }
        }, 200);
    }
});

// Also initialize when window loads (fallback)
window.addEventListener('load', () => {
    if (!window.authManager) {
        // console.log('Window loaded, initializing AuthManager as fallback...'); // Removed console.log
        window.authManager = new AuthManager();
        window.authManager.updateUserInterface();
    }
});

// Additional fallback for immediate initialization
if (document.readyState === 'complete') {
    // console.log('Document already complete, initializing AuthManager immediately...'); // Removed console.log
    if (!window.authManager) {
        window.authManager = new AuthManager();
        window.authManager.updateUserInterface();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} 