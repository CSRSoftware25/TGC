// Voice Chat Functionality
class VoiceChat {
    constructor() {
        this.stream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.peerConnections = new Map();
        this.localStream = null;
        this.remoteStreams = new Map();
        this.voiceChannel = null;
        this.isInVoiceChannel = false;
        
        this.initializeVoice();
    }

    initializeVoice() {
        this.setupVoiceEventListeners();
        this.checkMicrophonePermission();
    }

    setupVoiceEventListeners() {
        // Voice channel clicks
        document.querySelectorAll('.channel-item.voice').forEach(channel => {
            channel.addEventListener('click', (e) => {
                const channelName = e.currentTarget.dataset.channel;
                this.joinVoiceChannel(channelName);
            });
        });

        // Voice message button
        const voiceButton = document.getElementById('voice-message');
        if (voiceButton) {
            voiceButton.addEventListener('click', () => {
                this.toggleVoiceMessage();
            });
        }
    }

    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted');
        } catch (error) {
            console.error('Microphone permission denied:', error);
            this.showVoiceNotification('Mikrofon izni gerekli', 'error');
        }
    }

    async joinVoiceChannel(channelName) {
        if (!window.tgcApp || !window.tgcApp.currentUser) {
            this.showVoiceNotification('Sesli kanala katılmak için giriş yapın', 'warning');
            return;
        }

        try {
            this.voiceChannel = channelName;
            this.isInVoiceChannel = true;
            
            // Get microphone access
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.updateVoiceChannelUI(channelName, true);
            this.showVoiceNotification(`${channelName} sesli kanalına katıldınız`, 'success');
            
            // Initialize WebRTC connections
            this.initializeVoiceConnections();
            
        } catch (error) {
            console.error('Failed to join voice channel:', error);
            this.showVoiceNotification('Sesli kanala katılamadı: ' + error.message, 'error');
        }
    }

    leaveVoiceChannel() {
        if (this.isInVoiceChannel) {
            this.isInVoiceChannel = false;
            this.voiceChannel = null;
            
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            
            // Close peer connections
            this.peerConnections.forEach(connection => {
                connection.close();
            });
            this.peerConnections.clear();
            
            this.updateVoiceChannelUI(null, false);
            this.showVoiceNotification('Sesli kanaldan ayrıldınız', 'info');
        }
    }

    updateVoiceChannelUI(channelName, isJoined) {
        // Update voice channel indicators
        document.querySelectorAll('.channel-item.voice').forEach(channel => {
            channel.classList.remove('active');
        });

        if (isJoined && channelName) {
            const channelElement = document.querySelector(`[data-channel="${channelName}"]`);
            if (channelElement) {
                channelElement.classList.add('active');
            }
        }

        // Update user status
        const userStatus = document.getElementById('user-status');
        if (userStatus) {
            if (isJoined) {
                userStatus.textContent = `${channelName} sesli kanalında`;
            } else {
                userStatus.textContent = 'Çevrimiçi';
            }
        }

        // Update voice button
        const voiceButton = document.getElementById('voice-message');
        if (voiceButton) {
            const icon = voiceButton.querySelector('i');
            if (isJoined) {
                icon.classList.remove('fa-microphone');
                icon.classList.add('fa-microphone-slash');
                voiceButton.title = 'Sesli kanaldan ayrıl';
            } else {
                icon.classList.remove('fa-microphone-slash');
                icon.classList.add('fa-microphone');
                voiceButton.title = 'Sesli mesaj gönder';
            }
        }
    }

    async toggleVoiceMessage() {
        if (this.isInVoiceChannel) {
            this.leaveVoiceChannel();
        } else {
            await this.startVoiceRecording();
        }
    }

    async startVoiceRecording() {
        if (!window.tgcApp || !window.tgcApp.currentUser) {
            this.showVoiceNotification('Sesli mesaj göndermek için giriş yapın', 'warning');
            return;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];
            this.isRecording = true;

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.processVoiceMessage();
            };

            this.mediaRecorder.start();
            this.updateRecordingUI(true);
            this.showVoiceNotification('Ses kaydı başlatıldı...', 'info');

        } catch (error) {
            console.error('Failed to start voice recording:', error);
            this.showVoiceNotification('Ses kaydı başlatılamadı: ' + error.message, 'error');
        }
    }

    stopVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateRecordingUI(false);
            this.showVoiceNotification('Ses kaydı durduruldu', 'info');
        }
    }

    updateRecordingUI(isRecording) {
        const voiceButton = document.getElementById('voice-message');
        if (voiceButton) {
            const icon = voiceButton.querySelector('i');
            if (isRecording) {
                icon.classList.remove('fa-microphone');
                icon.classList.add('fa-stop');
                voiceButton.style.color = '#f04747';
            } else {
                icon.classList.remove('fa-stop');
                icon.classList.add('fa-microphone');
                voiceButton.style.color = '';
            }
        }
    }

    processVoiceMessage() {
        if (this.audioChunks.length === 0) return;

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create voice message element
        this.createVoiceMessage(audioUrl);
        
        // Clean up
        this.audioChunks = [];
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    createVoiceMessage(audioUrl) {
        const messagesContainer = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message voice-message';
        
        const currentUser = window.tgcApp ? window.tgcApp.currentUser : { username: 'Kullanıcı' };
        const timeString = this.formatTime(new Date());
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="assets/default-avatar.png" alt="Avatar">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${currentUser.username}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                <div class="voice-message-content">
                    <audio controls>
                        <source src="${audioUrl}" type="audio/wav">
                        Tarayıcınız ses dosyalarını desteklemiyor.
                    </audio>
                    <span class="voice-message-duration">Sesli mesaj</span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return 'Şimdi';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} dakika önce`;
        } else {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
    }

    initializeVoiceConnections() {
        // WebRTC configuration
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        // Create RTCPeerConnection for each peer
        // This would be implemented with actual peer connections
        console.log('Voice connections initialized');
    }

    async createPeerConnection(peerId) {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        // Add local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
            this.handleRemoteStream(peerId, event.streams[0]);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendIceCandidate(peerId, event.candidate);
            }
        };

        this.peerConnections.set(peerId, peerConnection);
        return peerConnection;
    }

    handleRemoteStream(peerId, stream) {
        this.remoteStreams.set(peerId, stream);
        this.playRemoteAudio(peerId, stream);
    }

    playRemoteAudio(peerId, stream) {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = stream;
        audioElement.autoplay = true;
        audioElement.id = `remote-audio-${peerId}`;
        document.body.appendChild(audioElement);
    }

    sendIceCandidate(peerId, candidate) {
        // Send ICE candidate to signaling server
        if (window.tgcApp && window.tgcApp.socket) {
            window.tgcApp.socket.emit('ice-candidate', {
                peerId: peerId,
                candidate: candidate
            });
        }
    }

    showVoiceNotification(message, type = 'info') {
        if (window.tgcApp) {
            window.tgcApp.showNotification(message, type);
        } else {
            console.log(`Voice Notification [${type}]:`, message);
        }
    }

    // Voice channel management
    getVoiceChannelUsers(channelName) {
        // This would fetch users from the server
        return [
            { id: '1', username: 'Ahmet', status: 'speaking' },
            { id: '2', username: 'Mehmet', status: 'muted' },
            { id: '3', username: 'Ayşe', status: 'listening' }
        ];
    }

    updateVoiceChannelUsers(channelName) {
        const users = this.getVoiceChannelUsers(channelName);
        // Update UI with voice channel users
        console.log(`Voice channel ${channelName} users:`, users);
    }

    // Voice controls
    muteMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.showVoiceNotification(
                    audioTrack.enabled ? 'Mikrofon açıldı' : 'Mikrofon kapatıldı',
                    'info'
                );
            }
        }
    }

    deafenUser() {
        // Mute all incoming audio
        this.remoteStreams.forEach((stream, peerId) => {
            const audioElement = document.getElementById(`remote-audio-${peerId}`);
            if (audioElement) {
                audioElement.muted = !audioElement.muted;
            }
        });
        
        this.showVoiceNotification(
            this.remoteStreams.size > 0 ? 'Ses kapatıldı' : 'Ses açıldı',
            'info'
        );
    }

    // Voice quality settings
    setVoiceQuality(quality) {
        const qualities = {
            low: { sampleRate: 8000, channelCount: 1 },
            medium: { sampleRate: 16000, channelCount: 1 },
            high: { sampleRate: 44100, channelCount: 2 }
        };

        const settings = qualities[quality] || qualities.medium;
        console.log(`Voice quality set to ${quality}:`, settings);
    }

    // Voice effects
    applyVoiceEffect(effect) {
        const effects = {
            echo: { delay: 0.1, feedback: 0.3 },
            reverb: { roomSize: 0.8, dampening: 0.5 },
            pitch: { pitch: 1.2 }
        };

        const effectSettings = effects[effect];
        if (effectSettings) {
            console.log(`Applying voice effect: ${effect}`, effectSettings);
        }
    }
}

// Initialize voice chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voiceChat = new VoiceChat();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceChat;
} 