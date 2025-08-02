// Friends Management System
class FriendsManager {
    constructor() {
        this.friends = new Map();
        this.friendRequests = new Map();
        this.currentChat = null;
        this.friendsList = [];
        
        this.initializeFriends();
    }

    initializeFriends() {
        this.setupEventListeners();
        this.loadFriends();
        this.loadFriendRequests();
        this.loadDMList();
    }

    setupEventListeners() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
            return;
        }

        // Add friend form
        const addFriendForm = document.getElementById('add-friend-form');
        if (addFriendForm) {
            addFriendForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddFriend();
            });
        }

        // Close modal buttons
        const closeButtons = document.querySelectorAll('.modal-close, .btn-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hideModal(button.closest('.modal').id);
            });
        });

        // Friend list item clicks
        const friendList = document.getElementById('friends-list');
        if (friendList) {
            friendList.addEventListener('click', (e) => {
                const friendItem = e.target.closest('.friend-item');
                if (friendItem) {
                    const username = friendItem.dataset.username;
                    if (username) {
                        this.showFriendProfile(username);
                    }
                }
            });
        }

        // DM list item clicks
        const dmList = document.getElementById('dm-list');
        if (dmList) {
            dmList.addEventListener('click', (e) => {
                const dmItem = e.target.closest('.dm-item');
                if (dmItem) {
                    const dmId = dmItem.dataset.dmId;
                    if (dmId) {
                        this.openDM(dmId);
                    }
                }
            });
        }
    }

    setupModalControls() {
        // Add friend modal
        const addFriendBtn = document.getElementById('add-friend');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                this.showModal('add-friend-modal');
            });
        }

        // New DM modal
        const newDmBtn = document.getElementById('new-dm');
        if (newDmBtn) {
            newDmBtn.addEventListener('click', () => {
                this.showNewDMModal();
            });
        }

        // Close modal buttons
        const closeButtons = document.querySelectorAll('.modal-close, .btn-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hideModal(button.closest('.modal').id);
            });
        });
    }

    showAddFriendModal() {
        if (!window.tgcApp || !window.tgcApp.currentUser) {
            this.showNotification('Arkadaş eklemek için giriş yapın.', 'warning');
            return;
        }
        this.showModal('add-friend-modal');
    }

    showNewDMModal() {
        if (!window.tgcApp || !window.tgcApp.currentUser) {
            this.showNotification('DM oluşturmak için giriş yapın.', 'warning');
            return;
        }
        
        // Check if user is authenticated
        if (!window.authManager || !window.authManager.isUserAuthenticated()) {
            this.showNotification('DM oluşturmak için giriş yapın.', 'warning');
            return;
        }
        
        this.showModal('new-dm-modal');
        this.populateDMUserSelector();
    }

    showCreateGroupModal() {
        if (!window.tgcApp || !window.tgcApp.currentUser) {
            this.showNotification('Grup oluşturmak için giriş yapın.', 'warning');
            return;
        }
        
        // Check if user is authenticated
        if (!window.authManager || !window.authManager.isUserAuthenticated()) {
            this.showNotification('Grup oluşturmak için giriş yapın.', 'warning');
            return;
        }
        
        this.showNotification('Grup özelliği beta sürümde henüz aktif değil. Yakında eklenecek!', 'info');
    }

    async handleAddFriend() {
        const username = document.getElementById('friend-username').value;
        const message = document.getElementById('friend-message').value;

        if (!username) {
            this.showNotification('Kullanıcı adı gerekli.', 'error');
            return;
        }

        try {
            // Check if user exists in registered users
            const users = window.authManager ? window.authManager.getUsers() : [];
            const targetUser = users.find(u => u.username === username);
            
            if (!targetUser) {
                this.showNotification('Bu kullanıcı adı bulunamadı. Kullanıcının kayıt olmuş olması gerekiyor.', 'error');
                return;
            }

            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
            if (!currentUser) {
                this.showNotification('Giriş yapmanız gerekiyor.', 'error');
                return;
            }

            if (targetUser.username === currentUser.username) {
                this.showNotification('Kendinizi arkadaş olarak ekleyemezsiniz.', 'error');
                return;
            }

            // Check if already friends
            const currentFriends = this.friendsList || [];
            const alreadyFriend = currentFriends.find(f => f.username === username);
            
            if (alreadyFriend) {
                this.showNotification('Bu kullanıcı zaten arkadaşınız.', 'error');
                return;
            }

            // Simulate friend request (in real app, this would be sent to server)
            const friendRequest = {
                id: this.generateId(),
                from: currentUser.username,
                to: username,
                message: message,
                timestamp: new Date(),
                status: 'pending'
            };

            // Store friend request
            this.friendRequests.set(friendRequest.id, friendRequest);
            this.saveFriendRequests();

            this.hideModal('add-friend-modal');
            this.showNotification(`${username} kullanıcısına arkadaşlık isteği gönderildi. Kullanıcı kabul ederse arkadaşınız olacaksınız.`, 'success');
            
            // Clear form
            document.getElementById('friend-username').value = '';
            document.getElementById('friend-message').value = '';
            
        } catch (error) {
            this.showNotification('Arkadaş eklenirken bir hata oluştu.', 'error');
        }
    }

    async handleCreateGroup() {
        const groupName = document.getElementById('group-name').value;
        const description = document.getElementById('group-description').value;
        const selectedMembers = this.getSelectedMembers();

        if (!groupName) {
            this.showNotification('Grup adı gerekli.', 'error');
            return;
        }

        if (selectedMembers.length === 0) {
            this.showNotification('En az bir üye seçin.', 'error');
            return;
        }

        try {
            // Simulate creating group
            const group = {
                id: this.generateId(),
                name: groupName,
                description: description,
                creator: window.tgcApp.currentUser.username,
                members: [window.tgcApp.currentUser.username, ...selectedMembers],
                createdAt: new Date()
            };

            this.createGroupElement(group);
            this.hideModal('create-group-modal');
            this.showNotification(`${groupName} grubu oluşturuldu.`, 'success');
            
            // Clear form
            document.getElementById('group-name').value = '';
            document.getElementById('group-description').value = '';

        } catch (error) {
            this.showNotification('Grup oluşturulamadı: ' + error.message, 'error');
        }
    }

    async handleCreateDM() {
        const username = document.getElementById('dm-user-selector').value;
        
        if (!username) {
            this.showNotification('Lütfen bir kullanıcı seçin.', 'error');
            return;
        }
        
        // Check if user exists
        const users = window.authManager ? window.authManager.getUsers() : [];
        const targetUser = users.find(u => u.username === username);
        
        if (!targetUser) {
            this.showNotification('Bu kullanıcı bulunamadı.', 'error');
            return;
        }
        
        // Create DM
        const dmId = `dm_${this.generateId()}`;
        const dmData = {
            id: dmId,
            participants: [window.authManager.getCurrentUser().username, username],
            created: new Date(),
            lastMessage: null
        };
        
        // Add to DM list
        if (!this.dmList) this.dmList = [];
        this.dmList.push(dmData);
        this.saveDMList();
        
        // Open DM
        this.openDM(dmId);
        this.updateDMList();
        
        this.hideModal('new-dm-modal');
        this.showNotification(`${username} ile DM oluşturuldu.`, 'success');
        
        // Clear form
        document.getElementById('dm-user-selector').value = '';
    }

    populateMemberSelector() {
        const memberSelector = document.getElementById('member-selector');
        memberSelector.innerHTML = '';

        this.friendsList.forEach(friend => {
            const checkbox = document.createElement('div');
            checkbox.className = 'member-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="member-${friend.username}" value="${friend.username}">
                <label for="member-${friend.username}">${friend.username}</label>
            `;
            memberSelector.appendChild(checkbox);
        });
    }

    getSelectedMembers() {
        const checkboxes = document.querySelectorAll('#member-selector input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    populateDMUserSelector() {
        const userSelector = document.getElementById('dm-user-selector');
        if (!userSelector) return;
        
        // Get all registered users
        const users = window.authManager ? window.authManager.getUsers() : [];
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        if (!currentUser) {
            this.showNotification('Kullanıcı bilgisi bulunamadı.', 'error');
            return;
        }
        
        // Filter out current user and existing friends
        const availableUsers = users.filter(user => 
            user.username !== currentUser.username && 
            !this.friendsList.find(friend => friend.username === user.username)
        );
        
        userSelector.innerHTML = '';
        
        if (availableUsers.length === 0) {
            userSelector.innerHTML = '<option value="">Kullanılabilir kullanıcı yok</option>';
            return;
        }
        
        availableUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.displayName || user.username;
            userSelector.appendChild(option);
        });
    }

    openFriendChat(username) {
        this.currentChat = { type: 'friend', username: username };
        this.updateChatHeader(username);
        this.loadChatHistory(username);
        this.updateActiveStates(username);
    }

    openDM(username) {
        this.currentChat = { type: 'dm', username: username };
        this.updateChatHeader(username);
        this.loadChatHistory(username);
        this.updateActiveStates(username);
    }

    openGroup(groupId) {
        this.currentChat = { type: 'group', groupId: groupId };
        this.updateGroupChatHeader(groupId);
        this.loadGroupChatHistory(groupId);
        this.updateActiveStates(groupId);
    }

    updateChatHeader(username) {
        const friend = this.friendsList.find(f => f.username === username);
        if (friend) {
            document.getElementById('chat-name').textContent = friend.username;
            document.getElementById('chat-status-text').textContent = friend.status;
            document.getElementById('chat-avatar').src = friend.avatar || 'assets/default-avatar.png';
            
            const statusIndicator = document.getElementById('chat-status');
            statusIndicator.className = `status-indicator ${friend.statusType || 'online'}`;
        }
    }

    updateGroupChatHeader(groupId) {
        const group = this.getGroupById(groupId);
        if (group) {
            document.getElementById('chat-name').textContent = group.name;
            document.getElementById('chat-status-text').textContent = `${group.members.length} üye`;
            document.getElementById('chat-avatar').src = 'assets/default-avatar.png';
            
            const statusIndicator = document.getElementById('chat-status');
            statusIndicator.className = 'status-indicator online';
        }
    }

    updateActiveStates(activeId) {
        // Remove active class from all items
        document.querySelectorAll('.friend-item, .dm-item, .group-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked item
        const activeItem = document.querySelector(`[data-user="${activeId}"], [data-dm="${activeId}"], [data-group="${activeId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    loadFriends() {
        // Load friends from localStorage
        const savedFriends = localStorage.getItem('tgc_friends');
        if (savedFriends) {
            this.friendsList = JSON.parse(savedFriends);
        } else {
            // Empty friends list - users will add their own friends
            this.friendsList = [];
        }
        this.updateFriendsList();
    }

    updateFriendsList() {
        const friendsList = document.getElementById('friends-list');
        friendsList.innerHTML = '';

        this.friendsList.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = `friend-item ${friend.statusType || 'online'}`;
            friendElement.dataset.user = friend.username;
            
            friendElement.innerHTML = `
                <div class="friend-avatar">
                    <img src="${friend.avatar}" alt="Avatar">
                    <div class="status-indicator ${friend.statusType || 'online'}"></div>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.username}</div>
                    <div class="friend-status">${friend.status}</div>
                </div>
            `;
            
            friendsList.appendChild(friendElement);
        });
    }

    loadFriendRequests() {
        // Load friend requests from localStorage
        const savedRequests = localStorage.getItem('tgc_friend_requests');
        if (savedRequests) {
            const requests = JSON.parse(savedRequests);
            requests.forEach(request => {
                this.friendRequests.set(request.id, request);
            });
        }
    }

    saveFriendRequests() {
        const requests = Array.from(this.friendRequests.values());
        localStorage.setItem('tgc_friend_requests', JSON.stringify(requests));
    }

    addFriend(friendData) {
        this.friendsList.push(friendData);
        this.updateFriendsList();
        this.saveFriends();
    }

    removeFriend(username) {
        this.friendsList = this.friendsList.filter(f => f.username !== username);
        this.updateFriendsList();
        this.saveFriends();
    }

    saveFriends() {
        localStorage.setItem('tgc_friends', JSON.stringify(this.friendsList));
    }

    createGroupElement(group) {
        const groupsList = document.getElementById('groups-list');
        const groupElement = document.createElement('div');
        groupElement.className = 'group-item';
        groupElement.dataset.group = group.id;
        
        groupElement.innerHTML = `
            <div class="group-avatar">
                <i class="fas fa-users"></i>
            </div>
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-members">${group.members.length} üye</div>
            </div>
        `;
        
        groupsList.appendChild(groupElement);
    }

    getGroupById(groupId) {
        // This would fetch group data from storage
        return {
            id: groupId,
            name: 'Gaming Squad',
            members: ['user1', 'user2', 'user3'],
            avatar: 'assets/default-avatar.png'
        };
    }

    loadChatHistory(username) {
        // Load chat history for specific user
        const savedHistory = localStorage.getItem(`chat_history_${username}`);
        if (savedHistory) {
            const messages = JSON.parse(savedHistory);
            this.displayMessages(messages);
        } else {
            // Clear messages container
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = `
                <div class="message">
                    <div class="message-avatar">
                        <img src="assets/default-avatar.png" alt="Avatar">
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">Sistem</span>
                            <span class="message-time">Şimdi</span>
                        </div>
                        <div class="message-text">
                            ${username} ile sohbet başlatıldı! 💬
                        </div>
                    </div>
                </div>
            `;
        }
    }

    loadGroupChatHistory(groupId) {
        // Load group chat history
        const savedHistory = localStorage.getItem(`group_chat_history_${groupId}`);
        if (savedHistory) {
            const messages = JSON.parse(savedHistory);
            this.displayMessages(messages);
        } else {
            // Clear messages container
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = `
                <div class="message">
                    <div class="message-avatar">
                        <img src="assets/default-avatar.png" alt="Avatar">
                    </div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">Sistem</span>
                            <span class="message-time">Şimdi</span>
                        </div>
                        <div class="message-text">
                            Grup sohbeti başlatıldı! 👥
                        </div>
                    </div>
                </div>
            `;
        }
    }

    displayMessages(messages) {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        
        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
        
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
        
        if (diff < 60000) {
            return 'Şimdi';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} dakika önce`;
        } else if (diff < 86400000) {
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

    showNotification(message, type = 'info') {
        if (window.tgcApp) {
            window.tgcApp.showNotification(message, type);
        } else {
            console.log(`Friends Notification [${type}]:`, message);
        }
    }

    // Friend request management
    acceptFriendRequest(requestId) {
        const request = this.friendRequests.get(requestId);
        if (request) {
            this.addFriend({
                username: request.from,
                status: 'Çevrimiçi',
                statusType: 'online',
                avatar: 'assets/default-avatar.png'
            });
            this.friendRequests.delete(requestId);
            this.saveFriendRequests();
            this.showNotification(`${request.from} arkadaş olarak eklendi.`, 'success');
        }
    }

    declineFriendRequest(requestId) {
        this.friendRequests.delete(requestId);
        this.saveFriendRequests();
        this.showNotification('Arkadaşlık isteği reddedildi.', 'info');
    }

    // Get current chat info
    getCurrentChat() {
        return this.currentChat;
    }

    // Update friend status
    updateFriendStatus(username, status, statusType) {
        const friend = this.friendsList.find(f => f.username === username);
        if (friend) {
            friend.status = status;
            friend.statusType = statusType;
            this.updateFriendsList();
            this.saveFriends();
        }
    }

    loadDMList() {
        // Load DM list from localStorage
        const savedDMs = localStorage.getItem('tgc_dm_list');
        if (savedDMs) {
            this.dmList = JSON.parse(savedDMs);
        } else {
            this.dmList = [];
        }
        this.updateDMList();
    }

    updateDMList() {
        const dmList = document.getElementById('dm-list');
        if (!dmList) return;
        
        dmList.innerHTML = '';
        
        if (!this.dmList || this.dmList.length === 0) {
            dmList.innerHTML = '<div class="empty-state">Henüz DM yok</div>';
            return;
        }
        
        this.dmList.forEach(dm => {
            const otherParticipant = dm.participants.find(p => p !== window.authManager.getCurrentUser().username);
            const dmElement = document.createElement('div');
            dmElement.className = 'dm-item';
            dmElement.dataset.dm = dm.id;
            
            dmElement.innerHTML = `
                <div class="dm-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="dm-info">
                    <div class="dm-name">${otherParticipant}</div>
                    <div class="dm-last-message">${dm.lastMessage || 'Henüz mesaj yok'}</div>
                </div>
            `;
            
            dmList.appendChild(dmElement);
        });
    }

    saveDMList() {
        localStorage.setItem('tgc_dm_list', JSON.stringify(this.dmList || []));
    }

    showProfileModal(username) {
        const users = window.authManager ? window.authManager.getUsers() : [];
        const user = users.find(u => u.username === username);
        
        if (!user) {
            this.showNotification('Kullanıcı bulunamadı.', 'error');
            return;
        }
        
        // Update profile modal content
        const profileName = document.getElementById('profile-name');
        const profileDisplayName = document.getElementById('profile-display-name');
        const profileStatusText = document.getElementById('profile-status-text');
        const currentGame = document.getElementById('current-game');
        const gameTime = document.getElementById('game-time');
        const favoriteGame = document.getElementById('favorite-game');
        
        if (profileName) profileName.textContent = `${user.displayName || user.username} Profili`;
        if (profileDisplayName) profileDisplayName.textContent = user.displayName || user.username;
        if (profileStatusText) profileStatusText.textContent = 'Çevrimiçi';
        
        // Game info (simulated)
        if (currentGame) currentGame.textContent = 'Counter-Strike 2';
        if (gameTime) gameTime.textContent = '2 saat 15 dakika';
        if (favoriteGame) favoriteGame.textContent = 'Counter-Strike 2';
        
        // Show modal
        this.showModal('profile-modal');
        
        // Setup profile modal actions
        this.setupProfileModalActions(username);
    }
    
    setupProfileModalActions(username) {
        // Close profile modal
        const closeProfileBtn = document.getElementById('close-profile-modal');
        if (closeProfileBtn) {
            closeProfileBtn.addEventListener('click', () => {
                this.hideModal('profile-modal');
            });
        }
        
        // Send message button
        const sendMessageBtn = document.getElementById('send-message-btn');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                this.hideModal('profile-modal');
                // Open DM with this user
                this.openDM(username);
            });
        }
        
        // Add friend button
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                this.hideModal('profile-modal');
                // Add friend functionality
                this.addFriendFromProfile(username);
            });
        }
    }
    
    addFriendFromProfile(username) {
        // Check if already friends
        const currentFriends = this.friendsList || [];
        const alreadyFriend = currentFriends.find(f => f.username === username);
        
        if (alreadyFriend) {
            this.showNotification('Bu kullanıcı zaten arkadaşınız.', 'info');
            return;
        }
        
        // Add friend
        this.addFriend({
            username: username,
            status: 'Çevrimiçi',
            statusType: 'online',
            avatar: 'assets/default-avatar.png'
        });
        
        this.showNotification(`${username} arkadaş olarak eklendi.`, 'success');
    }
}

// Initialize friends manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing FriendsManager...');
    window.friendsManager = new FriendsManager();
});

// Also initialize when window loads (fallback)
window.addEventListener('load', () => {
    if (!window.friendsManager) {
        console.log('Window loaded, initializing FriendsManager as fallback...');
        window.friendsManager = new FriendsManager();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FriendsManager;
} 