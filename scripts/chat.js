// Chat Functionality
class ChatManager {
    constructor() {
        this.currentChannel = 'genel';
        this.messages = new Map(); // channel -> messages array
        this.typingUsers = new Map(); // channel -> typing users
        this.emojiPicker = null;
        this.attachments = [];
        
        this.initializeChat();
    }

    initializeChat() {
        this.setupChatEventListeners();
        this.initializeEmojiPicker();
        this.setupTypingIndicator();
        this.loadChatHistory();
    }

    setupChatEventListeners() {
        // Message input events
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                this.handleTyping(e.target.value);
            });

            messageInput.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });

            messageInput.addEventListener('paste', (e) => {
                this.handlePaste(e);
            });
        }

        // Emoji picker
        const emojiButton = document.getElementById('emoji-picker');
        if (emojiButton) {
            emojiButton.addEventListener('click', () => {
                this.toggleEmojiPicker();
            });
        }

        // File attachment
        const attachButton = document.getElementById('attach-file');
        if (attachButton) {
            attachButton.addEventListener('click', () => {
                this.openFileSelector();
            });
        }

        // Message reactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-reaction')) {
                this.handleReaction(e);
            }
        });

        // Message context menu
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.message')) {
                e.preventDefault();
                this.showMessageContextMenu(e);
            }
        });
    }

    handleTyping(text) {
        if (text.length > 0) {
            this.startTyping();
        } else {
            this.stopTyping();
        }
    }

    handleKeyDown(event) {
        // Enter to send message, Shift+Enter for new line
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        } else if (event.key === 'Escape') {
            this.clearMessageInput();
        }
        
        // Cmd+A (Select All)
        if (event.metaKey && event.key === 'a') {
            event.preventDefault();
            event.target.select();
        }
        
        // Cmd+C (Copy)
        if (event.metaKey && event.key === 'c') {
            // Let default behavior handle copy
        }
        
        // Cmd+V (Paste)
        if (event.metaKey && event.key === 'v') {
            // Let default behavior handle paste
        }
    }

    handlePaste(event) {
        const items = event.clipboardData.items;
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                this.handleImagePaste(file);
                break;
            }
        }
    }

    handleImagePaste(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.sendImageMessage(e.target.result, file.name);
            };
            reader.readAsDataURL(file);
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (message && window.tgcApp && window.tgcApp.currentUser) {
            const messageData = {
                id: this.generateMessageId(),
                author: window.tgcApp.currentUser.username,
                content: message,
                timestamp: new Date(),
                channel: this.currentChannel,
                type: 'text',
                reactions: [],
                edited: false
            };

            this.addMessageToChat(messageData);
            this.clearMessageInput();
            this.stopTyping();
            
            // Send to server if connected
            if (window.tgcApp.socket && window.tgcApp.isConnected) {
                window.tgcApp.socket.emit('message', messageData);
            }
        }
    }

    sendImageMessage(imageData, fileName) {
        if (window.tgcApp && window.tgcApp.currentUser) {
            const messageData = {
                id: this.generateMessageId(),
                author: window.tgcApp.currentUser.username,
                content: imageData,
                fileName: fileName,
                timestamp: new Date(),
                channel: this.currentChannel,
                type: 'image',
                reactions: [],
                edited: false
            };

            this.addMessageToChat(messageData);
            
            // Send to server if connected
            if (window.tgcApp.socket && window.tgcApp.isConnected) {
                window.tgcApp.socket.emit('message', messageData);
            }
        }
    }

    addMessageToChat(messageData) {
        const messagesContainer = document.getElementById('messages');
        const messageElement = this.createMessageElement(messageData);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store message in memory
        if (!this.messages.has(this.currentChannel)) {
            this.messages.set(this.currentChannel, []);
        }
        this.messages.get(this.currentChannel).push(messageData);

        // Limit messages per channel
        const channelMessages = this.messages.get(this.currentChannel);
        if (channelMessages.length > 100) {
            channelMessages.shift();
            // Remove oldest message from DOM
            const firstMessage = messagesContainer.querySelector('.message');
            if (firstMessage) {
                firstMessage.remove();
            }
        }
    }

    createMessageElement(messageData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.dataset.messageId = messageData.id;
        
        const timeString = this.formatTime(messageData.timestamp);
        const content = this.formatMessageContent(messageData);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="assets/default-avatar.png" alt="Avatar">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${messageData.author}</span>
                    <span class="message-time">${timeString}</span>
                    ${messageData.edited ? '<span class="message-edited">(düzenlendi)</span>' : ''}
                </div>
                <div class="message-text">${content}</div>
                ${messageData.reactions.length > 0 ? this.createReactionsHTML(messageData.reactions) : ''}
            </div>
        `;
        
        return messageDiv;
    }

    formatMessageContent(messageData) {
        if (messageData.type === 'image') {
            return `
                <div class="message-image">
                    <img src="${messageData.content}" alt="${messageData.fileName}" onclick="this.classList.toggle('expanded')">
                    <div class="image-caption">${messageData.fileName}</div>
                </div>
            `;
        } else {
            return this.escapeHtml(this.formatText(messageData.content));
        }
    }

    formatText(text) {
        // Convert URLs to links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convert @mentions
        text = text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
        
        // Convert #channels
        text = text.replace(/#(\w+)/g, '<span class="channel-mention">#$1</span>');
        
        // Convert emojis
        text = this.convertEmojis(text);
        
        return text;
    }

    convertEmojis(text) {
        const emojiMap = {
            ':)': '😊',
            ':(': '😢',
            ':D': '😃',
            ';)': '😉',
            ':P': '😛',
            '<3': '❤️',
            ':heart:': '❤️',
            ':thumbsup:': '👍',
            ':thumbsdown:': '👎',
            ':fire:': '🔥',
            ':ok_hand:': '👌',
            ':pray:': '🙏',
            ':clap:': '👏',
            ':eyes:': '👀',
            ':thinking:': '🤔'
        };

        for (const [code, emoji] of Object.entries(emojiMap)) {
            text = text.replace(new RegExp(code, 'g'), emoji);
        }

        return text;
    }

    createReactionsHTML(reactions) {
        const reactionGroups = {};
        reactions.forEach(reaction => {
            if (!reactionGroups[reaction.emoji]) {
                reactionGroups[reaction.emoji] = [];
            }
            reactionGroups[reaction.emoji].push(reaction.user);
        });

        const reactionsHTML = Object.entries(reactionGroups).map(([emoji, users]) => {
            const count = users.length;
            const hasReacted = users.includes(window.tgcApp?.currentUser?.username);
            return `
                <span class="message-reaction ${hasReacted ? 'reacted' : ''}" data-emoji="${emoji}">
                    ${emoji} ${count}
                </span>
            `;
        }).join('');

        return `<div class="message-reactions">${reactionsHTML}</div>`;
    }

    handleReaction(event) {
        const reactionElement = event.target.closest('.message-reaction');
        if (!reactionElement) return;

        const emoji = reactionElement.dataset.emoji;
        const messageElement = reactionElement.closest('.message');
        const messageId = messageElement.dataset.messageId;

        this.addReaction(messageElement, emoji);
    }

    addReaction(messageElement, emoji) {
        // Add reaction to message
        const reactionDiv = document.createElement('div');
        reactionDiv.className = 'message-reaction';
        reactionDiv.textContent = emoji;
        reactionDiv.style.cssText = `
            display: inline-block;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 4px 8px;
            margin: 2px;
            font-size: 14px;
        `;
        
        messageElement.appendChild(reactionDiv);
    }

    findMessageById(messageId) {
        for (const [channel, messages] of this.messages) {
            const message = messages.find(m => m.id === messageId);
            if (message) return message;
        }
        return null;
    }

    updateMessageReactions(messageId, reactions) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        const reactionsContainer = messageElement.querySelector('.message-reactions');
        if (reactions.length > 0) {
            if (reactionsContainer) {
                reactionsContainer.innerHTML = this.createReactionsHTML(reactions);
            } else {
                const newReactionsContainer = document.createElement('div');
                newReactionsContainer.className = 'message-reactions';
                newReactionsContainer.innerHTML = this.createReactionsHTML(reactions);
                messageElement.querySelector('.message-content').appendChild(newReactionsContainer);
            }
        } else if (reactionsContainer) {
            reactionsContainer.remove();
        }
    }

    initializeEmojiPicker() {
        const emojis = [
            '😊', '😢', '😃', '😉', '😛', '❤️', '👍', '👎', '🔥', '👌', '🙏', '👏', '👀', '🤔',
            '🎮', '🎯', '⚔️', '🏗️', '⛏️', '⚽', '🚗', '💬', '🎤', '📹', '🎵', '🎨', '🌟', '💎'
        ];

        this.emojiPicker = document.createElement('div');
        this.emojiPicker.className = 'emoji-picker';
        this.emojiPicker.style.display = 'none';
        
        const emojiGrid = document.createElement('div');
        emojiGrid.className = 'emoji-grid';
        
        emojis.forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.className = 'emoji-button';
            emojiButton.textContent = emoji;
            emojiButton.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            emojiGrid.appendChild(emojiButton);
        });

        this.emojiPicker.appendChild(emojiGrid);
        document.body.appendChild(this.emojiPicker);
    }

    toggleEmojiPicker() {
        const emojiButton = document.getElementById('emoji-picker');
        if (!emojiButton || !this.emojiPicker) return;

        const isVisible = this.emojiPicker.style.display !== 'none';
        
        if (isVisible) {
            this.emojiPicker.style.display = 'none';
        } else {
            const rect = emojiButton.getBoundingClientRect();
            this.emojiPicker.style.position = 'absolute';
            this.emojiPicker.style.top = `${rect.bottom + 5}px`;
            this.emojiPicker.style.left = `${rect.left}px`;
            this.emojiPicker.style.display = 'block';
        }
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            const start = messageInput.selectionStart;
            const end = messageInput.selectionEnd;
            const text = messageInput.value;
            
            messageInput.value = text.substring(0, start) + emoji + text.substring(end);
            messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
            messageInput.focus();
        }
        
        this.emojiPicker.style.display = 'none';
    }

    setupTypingIndicator() {
        this.typingTimeout = null;
    }

    startTyping() {
        if (!window.tgcApp || !window.tgcApp.currentUser) return;

        if (window.tgcApp.socket && window.tgcApp.isConnected) {
            window.tgcApp.socket.emit('typing', {
                channel: this.currentChannel,
                user: window.tgcApp.currentUser.username
            });
        }

        this.showTypingIndicator(window.tgcApp.currentUser.username);
    }

    stopTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        this.typingTimeout = setTimeout(() => {
            if (window.tgcApp.socket && window.tgcApp.isConnected) {
                window.tgcApp.socket.emit('stop-typing', {
                    channel: this.currentChannel,
                    user: window.tgcApp.currentUser.username
                });
            }
            this.hideTypingIndicator();
        }, 1000);
    }

    showTypingIndicator(username) {
        let typingIndicator = document.querySelector('.typing-indicator');
        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            document.getElementById('messages').appendChild(typingIndicator);
        }
        
        typingIndicator.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">${username} yazıyor...</span>
        `;
        typingIndicator.style.display = 'block';
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    openFileSelector() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (file.type.startsWith('image/')) {
                this.sendImageMessage(e.target.result, file.name);
            } else {
                this.sendFileMessage(e.target.result, file.name, file.type);
            }
        };
        reader.readAsDataURL(file);
    }

    sendFileMessage(fileData, fileName, fileType) {
        if (window.tgcApp && window.tgcApp.currentUser) {
            const messageData = {
                id: this.generateMessageId(),
                author: window.tgcApp.currentUser.username,
                content: fileData,
                fileName: fileName,
                fileType: fileType,
                timestamp: new Date(),
                channel: this.currentChannel,
                type: 'file',
                reactions: [],
                edited: false
            };

            this.addMessageToChat(messageData);
            
            if (window.tgcApp.socket && window.tgcApp.isConnected) {
                window.tgcApp.socket.emit('message', messageData);
            }
        }
    }

    showMessageContextMenu(event) {
        const messageElement = event.target.closest('.message');
        if (!messageElement) return;
        
        // Check if it's a text input (don't show context menu for text input)
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Remove existing context menu
        const existingMenu = document.querySelector('.message-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const contextMenu = document.createElement('div');
        contextMenu.className = 'message-context-menu';
        
        // Check if message contains image
        const hasImage = messageElement.querySelector('img');
        
        // Check if this is the user's own message
        const messageAuthor = messageElement.querySelector('.message-author');
        const currentUser = window.tgcApp?.currentUser;
        const isOwnMessage = currentUser && messageAuthor.textContent === currentUser.displayName;
        
        if (hasImage) {
            contextMenu.innerHTML = `
                <div class="context-menu-item" data-action="save-image">
                    <i class="fas fa-download"></i>
                    PC'ye Kaydet
                </div>
                <div class="context-menu-item" data-action="add-reaction">
                    <i class="fas fa-smile"></i>
                    Tepki Ekle
                </div>
            `;
        } else {
            let menuItems = `
                <div class="context-menu-item" data-action="add-reaction">
                    <i class="fas fa-smile"></i>
                    Tepki Ekle
                </div>
            `;
            
            // Only show delete for own messages
            if (isOwnMessage) {
                menuItems += `
                    <div class="context-menu-item" data-action="delete">
                        <i class="fas fa-trash"></i>
                        Sil
                    </div>
                `;
            }
            
            contextMenu.innerHTML = menuItems;
        }
        
        // Position context menu
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        contextMenu.style.zIndex = '1000';
        
        document.body.appendChild(contextMenu);
        
        // Handle context menu actions
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action) {
                this.handleContextMenuAction(action, messageElement, e.target);
                contextMenu.remove();
            }
        });
        
        // Remove context menu when clicking outside
        document.addEventListener('click', () => {
            contextMenu.remove();
        }, { once: true });
    }

    handleContextMenuAction(action, messageElement, targetElement) {
        const messageId = messageElement.dataset.messageId;
        
        switch (action) {
            case 'save-image':
                const imgElement = messageElement.querySelector('img');
                if (imgElement) {
                    this.saveImageToPC(imgElement);
                }
                break;
                
            case 'add-reaction':
                this.showReactionPicker(messageElement);
                break;
                
            case 'edit':
                this.editMessage(messageElement);
                break;
                
            case 'delete':
                this.deleteMessage(messageElement);
                break;
        }
    }

    copyMessageContent(message) {
        if (message.type === 'text') {
            navigator.clipboard.writeText(message.content);
            if (window.tgcApp) {
                window.tgcApp.showNotification('Mesaj kopyalandı', 'success');
            }
        }
    }

    editMessage(messageElement) {
        const messageText = messageElement.querySelector('.message-text');
        if (!messageText) return;
        
        // Check if this is the user's own message
        const messageAuthor = messageElement.querySelector('.message-author');
        const currentUser = window.tgcApp?.currentUser;
        
        if (!currentUser || messageAuthor.textContent !== currentUser.displayName) {
            if (window.tgcApp) {
                window.tgcApp.showNotification('Sadece kendi mesajlarınızı düzenleyebilirsiniz.', 'warning');
            }
            return;
        }
        
        const currentText = messageText.textContent;
        
        // Create edit modal
        const editModal = document.createElement('div');
        editModal.className = 'modal show';
        editModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Mesajı Düzenle</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="edit-message-text">Mesaj</label>
                        <textarea id="edit-message-text" rows="4" placeholder="Mesajınızı yazın...">${currentText}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">İptal</button>
                    <button class="btn-primary" onclick="window.chatManager.saveMessageEdit(this.closest('.modal'), '${messageElement.dataset.messageId}')">Kaydet</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(editModal);
        
        // Focus on textarea
        const textarea = editModal.querySelector('#edit-message-text');
        textarea.focus();
        textarea.select();
    }

    saveMessageEdit(modal, messageId) {
        const textarea = modal.querySelector('#edit-message-text');
        const newText = textarea.value.trim();
        
        if (newText) {
            const messageElement = document.getElementById(messageId);
            if (messageElement) {
                const messageText = messageElement.querySelector('.message-text');
                if (messageText) {
                    messageText.textContent = newText;
                    
                    // Add edited indicator
                    const editedIndicator = messageElement.querySelector('.edited-indicator');
                    if (!editedIndicator) {
                        const indicator = document.createElement('span');
                        indicator.className = 'edited-indicator';
                        indicator.textContent = ' (düzenlendi)';
                        indicator.style.fontSize = '0.8em';
                        indicator.style.color = '#888';
                        messageText.appendChild(indicator);
                    }
                    
                    if (window.tgcApp) {
                        window.tgcApp.showNotification('Mesaj düzenlendi!', 'success');
                    }
                }
            }
        }
        
        modal.remove();
    }

    deleteMessage(messageElement) {
        if (confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
            messageElement.remove();
        }
    }

    showReactionPicker(messageElement) {
        const reactionPicker = document.createElement('div');
        reactionPicker.className = 'reaction-picker';
        reactionPicker.innerHTML = `
            <div class="reaction-options">
                <button class="reaction-btn" data-emoji="👍">👍</button>
                <button class="reaction-btn" data-emoji="❤️">❤️</button>
                <button class="reaction-btn" data-emoji="😂">😂</button>
                <button class="reaction-btn" data-emoji="😮">😮</button>
                <button class="reaction-btn" data-emoji="😢">😢</button>
                <button class="reaction-btn" data-emoji="😡">😡</button>
                <button class="reaction-btn" data-emoji="👏">👏</button>
                <button class="reaction-btn" data-emoji="🔥">🔥</button>
            </div>
        `;
        
        // Position reaction picker
        const rect = messageElement.getBoundingClientRect();
        reactionPicker.style.position = 'absolute';
        reactionPicker.style.left = rect.left + 'px';
        reactionPicker.style.top = (rect.top - 60) + 'px';
        reactionPicker.style.zIndex = '1000';
        
        document.body.appendChild(reactionPicker);
        
        // Handle reaction selection
        reactionPicker.addEventListener('click', (e) => {
            const emoji = e.target.dataset.emoji;
            if (emoji) {
                this.addReaction(messageElement, emoji);
                reactionPicker.remove();
            }
        });
        
        // Remove reaction picker when clicking outside
        document.addEventListener('click', () => {
            reactionPicker.remove();
        }, { once: true });
    }

    saveImageToPC(imgElement) {
        try {
            // Create a canvas to draw the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to image size
            canvas.width = imgElement.naturalWidth;
            canvas.height = imgElement.naturalHeight;
            
            // Draw image on canvas
            ctx.drawImage(imgElement, 0, 0);
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `image_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                if (window.tgcApp) {
                    window.tgcApp.showNotification('Resim PC\'ye kaydedildi!', 'success');
                }
            }, 'image/png');
            
        } catch (error) {
            if (window.tgcApp) {
                window.tgcApp.showNotification('Resim kaydedilemedi: ' + error.message, 'error');
            }
        }
    }

    clearMessageInput() {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.value = '';
            messageInput.focus();
        }
    }

    loadChatHistory() {
        // Load chat history from localStorage or server
        const savedMessages = localStorage.getItem(`chat_history_${this.currentChannel}`);
        if (savedMessages) {
            const messages = JSON.parse(savedMessages);
            messages.forEach(message => {
                this.addMessageToChat(message);
            });
        }
    }

    saveChatHistory() {
        const channelMessages = this.messages.get(this.currentChannel);
        if (channelMessages) {
            localStorage.setItem(`chat_history_${this.currentChannel}`, JSON.stringify(channelMessages));
        }
    }

    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    switchChannel(channel) {
        this.currentChannel = channel;
        this.loadChatHistory();
        this.hideTypingIndicator();
    }

    updateMessageInStorage(message) {
        const currentChannel = this.currentChannel;
        const messages = this.messages.get(currentChannel) || [];
        const messageIndex = messages.findIndex(m => m.id === message.id);
        
        if (messageIndex !== -1) {
            messages[messageIndex] = message;
            this.messages.set(currentChannel, messages);
            this.saveChatHistory();
        }
    }
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatManager) {
        window.chatManager = new ChatManager();
    }
});

// Also initialize when window loads (fallback)
window.addEventListener('load', () => {
    if (!window.chatManager) {
        window.chatManager = new ChatManager();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
} 