// Main Application Logic
class TurkishGamingChat {
    constructor() {
        this.currentUser = null;
        this.currentServer = 'home';
        this.currentChannel = 'genel';
        this.isConnected = false;
        this.socket = null;
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadUserData();
        this.checkAuthentication();
        this.initializeGameDetection();
        
        // Wait for auth manager to be available
        this.waitForAuthManager();
    }

    waitForAuthManager() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkAuthManager = () => {
            attempts++;
            if (window.authManager) {
                this.syncUserFromAuthManager();
            } else if (attempts < maxAttempts) {
                setTimeout(checkAuthManager, 100);
            } else {
                // Show error notification
                this.showNotification('Kimlik doğrulama sistemi yüklenemedi. Sayfayı yenileyin.', 'error');
            }
        };
        checkAuthManager();
    }

    syncUserFromAuthManager() {
        if (window.authManager) {
            this.currentUser = window.authManager.getCurrentUser();
            this.isAuthenticated = window.authManager.isUserAuthenticated();
        }
    }

    setupEventListeners() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
            return;
        }

        // Voice call button
        const voiceCallBtn = document.getElementById('voice-call');
        if (voiceCallBtn) {
            voiceCallBtn.addEventListener('click', () => {
                this.startVoiceCall();
            });
        }



        // Search messages
        const searchBtn = document.getElementById('search-messages');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.showSearchModal();
            });
        }

        // More options
        const moreOptionsBtn = document.getElementById('more-options');
        if (moreOptionsBtn) {
            moreOptionsBtn.addEventListener('click', () => {
                this.showMoreOptions();
            });
        }

        // Send message button
        const sendMessageBtn = document.getElementById('send-message');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Emoji picker
        const emojiButton = document.getElementById('emoji-picker');
        if (emojiButton) {
            emojiButton.addEventListener('click', () => {
                this.toggleEmojiPicker();
            });
        }

        // Modal controls
        this.setupModalControls();

        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (window.authManager && typeof window.authManager.showLoginModal === 'function') {
                    window.authManager.showLoginModal();
                } else {
                    this.showNotification('Kimlik doğrulama sistemi yükleniyor...', 'info');
                    // Try to show register modal as fallback
                    this.showModal('register-modal');
                }
            });
        } else {
            console.error('Login button not found in DOM');
        }

        // User settings
        const userSettingsBtn = document.getElementById('user-settings');
        if (userSettingsBtn) {
            userSettingsBtn.addEventListener('click', () => {
                this.showUserSettings();
            });
        }

        // Listen for menu events
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.on('open-settings', () => {
                if (window.authManager) {
                    window.authManager.showUserSettingsModal();
                }
            });
        }
    }

    setupModalControls() {
        // Login modal
        const showRegisterBtn = document.getElementById('show-register');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('login-modal');
                this.showModal('register-modal');
            });
        }

        const closeLoginBtn = document.getElementById('close-login-modal');
        if (closeLoginBtn) {
            closeLoginBtn.addEventListener('click', () => {
                this.hideModal('login-modal');
            });
        }

        // Register modal
        const showLoginBtn = document.getElementById('show-login');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('register-modal');
                this.showModal('login-modal');
            });
        }

        const closeRegisterBtn = document.getElementById('close-register-modal');
        if (closeRegisterBtn) {
            closeRegisterBtn.addEventListener('click', () => {
                this.hideModal('register-modal');
            });
        }

        // Form submissions
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    startVoiceCall() {
        if (!window.friendsManager || !window.friendsManager.getCurrentChat()) {
            this.showNotification('Sesli arama başlatmak için bir sohbet seçin.', 'warning');
            return;
        }
        this.showNotification('Sesli arama başlatılıyor...', 'info');
    }



    showSearchModal() {
        this.showNotification('Arama özelliği yakında gelecek!', 'info');
    }

    showMoreOptions() {
        // Show profile modal for current chat
        const currentChat = window.friendsManager ? window.friendsManager.getCurrentChat() : null;
        
        if (currentChat && currentChat.type === 'friend') {
            window.friendsManager.showProfileModal(currentChat.username);
        } else {
            this.showNotification('Profil görüntülemek için bir arkadaş seçin.', 'info');
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message) {
            this.showNotification('Mesaj yazın.', 'warning');
            return;
        }

        // Check if user is authenticated
        if (!window.authManager || !window.authManager.isUserAuthenticated()) {
            this.showNotification('Mesaj göndermek için giriş yapın.', 'warning');
            return;
        }

        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) {
            this.showNotification('Kullanıcı bilgisi bulunamadı.', 'error');
            return;
        }

        // For demo purposes, just add message to UI
        const messageData = {
            id: this.generateId(),
            author: currentUser.displayName || currentUser.username,
            content: message,
            timestamp: new Date(),
            avatar: currentUser.avatar || 'assets/default-avatar.png'
        };

        this.addMessageToUI(messageData);
        messageInput.value = '';
        this.showNotification('Mesaj gönderildi!', 'success');
    }

    addMessageToUI(messageData) {
        const messagesContainer = document.getElementById('messages');
        const messageElement = this.createMessageElement(messageData);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createMessageElement(messageData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const timeString = this.formatTime(messageData.timestamp);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="assets/default-avatar.png" alt="Avatar">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${messageData.author}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                <div class="message-text">${this.escapeHtml(messageData.content)}</div>
            </div>
        `;
        
        return messageDiv;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Şimdi';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} dakika önce`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} saat önce`;
        } else {
            return date.toLocaleDateString('tr-TR');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showNotification('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        try {
            // Simulate login
            this.currentUser = {
                username: username,
                email: 'user@example.com',
                avatar: 'assets/default-avatar.png'
            };

            this.hideModal('login-modal');
            this.updateUserInfo();
            this.showNotification('Başarıyla giriş yapıldı!', 'success');
            this.connectToServer(this.currentServer);
        } catch (error) {
            this.showNotification('Giriş başarısız: ' + error.message, 'error');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        if (!username || !email || !password || !passwordConfirm) {
            this.showNotification('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            this.showNotification('Şifreler eşleşmiyor.', 'error');
            return;
        }

        try {
            // Simulate registration
            this.currentUser = {
                username: username,
                email: email,
                avatar: 'assets/default-avatar.png'
            };

            this.hideModal('register-modal');
            this.updateUserInfo();
            this.showNotification('Hesap başarıyla oluşturuldu!', 'success');
            this.connectToServer(this.currentServer);
        } catch (error) {
            this.showNotification('Kayıt başarısız: ' + error.message, 'error');
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('username').textContent = this.currentUser.username;
            document.getElementById('user-avatar').src = this.currentUser.avatar;
        }
    }

    checkAuthentication() {
        // Check if user is logged in
        if (!this.currentUser) {
            this.showModal('login-modal');
        }
    }

    loadUserData() {
        // Load user data from localStorage
        const savedUser = localStorage.getItem('tgc_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUserInfo();
        }
    }

    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('tgc_user', JSON.stringify(this.currentUser));
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showComingSoon(message) {
        this.showNotification(message, 'info');
    }

    // Right panel management
    hideRightPanel() {
        const rightPanel = document.getElementById('right-panel');
        const profileButton = document.getElementById('profile-button');
        
        if (rightPanel) {
            rightPanel.classList.add('hidden');
        }
        
        if (profileButton) {
            profileButton.classList.add('show');
        }
    }

    showRightPanel() {
        const rightPanel = document.getElementById('right-panel');
        const profileButton = document.getElementById('profile-button');
        
        if (rightPanel) {
            rightPanel.classList.remove('hidden');
        }
        
        if (profileButton) {
            profileButton.classList.remove('show');
        }
    }

    toggleVoiceMessage() {
        if (!this.currentUser) {
            this.showNotification('Sesli mesaj göndermek için giriş yapın.', 'warning');
            return;
        }

        // Toggle voice recording
        const button = document.getElementById('voice-message');
        const icon = button.querySelector('i');
        
        if (icon.classList.contains('fa-microphone')) {
            icon.classList.remove('fa-microphone');
            icon.classList.add('fa-stop');
            this.startVoiceRecording();
        } else {
            icon.classList.remove('fa-stop');
            icon.classList.add('fa-microphone');
            this.stopVoiceRecording();
        }
    }

    startVoiceRecording() {
        this.showNotification('Ses kaydı başlatıldı...', 'info');
        // Voice recording logic will be implemented in voice.js
    }

    stopVoiceRecording() {
        this.showNotification('Ses kaydı durduruldu.', 'info');
        // Voice recording logic will be implemented in voice.js
    }

    toggleEmojiPicker() {
        const emojiPicker = document.getElementById('emoji-picker-container');
        if (!emojiPicker) {
            this.createEmojiPicker();
        } else {
            emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        }
    }

    createEmojiPicker() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) return;
        
        // Remove existing emoji picker
        const existingPicker = document.getElementById('emoji-picker-container');
        if (existingPicker) {
            existingPicker.remove();
        }
        
        const emojiPicker = document.createElement('div');
        emojiPicker.id = 'emoji-picker-container';
        emojiPicker.className = 'emoji-picker-container';
        
        const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖'];
        
        emojiPicker.innerHTML = `
            <div class="emoji-picker">
                <div class="emoji-grid">
                    ${emojis.map(emoji => `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`).join('')}
                </div>
            </div>
        `;
        
        // Position emoji picker
        const rect = messageInput.getBoundingClientRect();
        emojiPicker.style.position = 'absolute';
        emojiPicker.style.left = rect.left + 'px';
        emojiPicker.style.top = (rect.top - 200) + 'px';
        emojiPicker.style.zIndex = '1000';
        
        document.body.appendChild(emojiPicker);
        
        // Handle emoji selection
        emojiPicker.addEventListener('click', (e) => {
            const emoji = e.target.dataset.emoji;
            if (emoji) {
                this.insertEmoji(emoji);
                emojiPicker.remove();
            }
        });
        
        // Remove emoji picker when clicking outside
        document.addEventListener('click', () => {
            emojiPicker.remove();
        }, { once: true });
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('message-input');
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(cursorPos);
        
        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    }

    showLoginModal() {
        if (window.authManager) {
            window.authManager.showLoginModal();
        } else {
            this.showModal('login-modal');
        }
    }

    showUserSettings() {
        if (window.authManager && window.authManager.isUserAuthenticated()) {
            window.authManager.showUserSettingsModal();
        } else {
            this.showNotification('Ayarlara erişmek için giriş yapın.', 'warning');
        }
    }

    initializeGameDetection() {
        // Game detection will be implemented in game-detection.js
        this.showNotification('Oyun algılama başlatıldı.', 'info');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.tgcApp) {
        window.tgcApp = new TurkishGamingChat();
    }
});

// Global function for coming soon features
window.showComingSoon = function(message) {
    if (window.tgcApp) {
        window.tgcApp.showComingSoon(message);
    } else {
        // Fallback if app is not loaded
        alert(message);
    }
};

// Global functions for right panel
window.closeRightPanel = function() {
    if (window.tgcApp) {
        window.tgcApp.hideRightPanel();
    }
};

window.showRightPanel = function() {
    if (window.tgcApp) {
        window.tgcApp.showRightPanel();
    }
};

// Also initialize when window loads (fallback)
window.addEventListener('load', () => {
    if (!window.tgcApp) {
        console.log('Window loaded, initializing TurkishGamingChat as fallback...');
        window.tgcApp = new TurkishGamingChat();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    // Handle responsive design
});

// Handle beforeunload
window.addEventListener('beforeunload', () => {
    if (window.tgcApp) {
        window.tgcApp.saveUserData();
    }
}); 