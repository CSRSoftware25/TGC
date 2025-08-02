// Game Detection and Status Management
class GameDetection {
    constructor() {
        this.currentGame = null;
        this.gameProcesses = new Map();
        this.gameStatus = 'online'; // online, idle, dnd, offline
        this.detectionInterval = null;
        this.gameList = this.initializeGameList();
        
        this.initializeGameDetection();
    }

    initializeGameDetection() {
        this.setupGameDetection();
        this.startDetection();
        this.setupStatusManagement();
    }

    setupGameDetection() {
        // Initialize game detection based on platform
        if (navigator.platform.includes('Win')) {
            this.setupWindowsDetection();
        } else if (navigator.platform.includes('Mac')) {
            this.setupMacDetection();
        } else {
            this.setupGenericDetection();
        }
    }

    setupWindowsDetection() {
        // Windows-specific game detection
        this.windowsGameProcesses = {
            'valorant.exe': { name: 'Valorant', icon: '🎯' },
            'csgo.exe': { name: 'Counter-Strike: Global Offensive', icon: '🔫' },
            'leagueoflegends.exe': { name: 'League of Legends', icon: '⚔️' },
            'fortnite.exe': { name: 'Fortnite', icon: '🏗️' },
            'minecraft.exe': { name: 'Minecraft', icon: '⛏️' },
            'steam.exe': { name: 'Steam', icon: '🎮' },
            'epicgameslauncher.exe': { name: 'Epic Games', icon: '🎮' },
            'battle.net.exe': { name: 'Battle.net', icon: '⚔️' },
            'origin.exe': { name: 'Origin', icon: '🎮' },
            'uplay.exe': { name: 'Ubisoft Connect', icon: '🎮' },
            'discord.exe': { name: 'Discord', icon: '💬' },
            'teamspeak.exe': { name: 'TeamSpeak', icon: '🎤' },
            'obs64.exe': { name: 'OBS Studio', icon: '📹' },
            'streamlabs.exe': { name: 'Streamlabs', icon: '📹' }
        };
    }

    setupMacDetection() {
        // macOS-specific game detection
        this.macGameProcesses = {
            'Steam': { name: 'Steam', icon: '🎮' },
            'Battle.net': { name: 'Battle.net', icon: '⚔️' },
            'Epic Games Launcher': { name: 'Epic Games', icon: '🎮' },
            'Origin': { name: 'Origin', icon: '🎮' },
            'Discord': { name: 'Discord', icon: '💬' },
            'OBS': { name: 'OBS Studio', icon: '📹' },
            'Streamlabs': { name: 'Streamlabs', icon: '📹' }
        };
    }

    setupGenericDetection() {
        // Generic game detection for other platforms
        this.genericGameProcesses = {
            'steam': { name: 'Steam', icon: '🎮' },
            'discord': { name: 'Discord', icon: '💬' },
            'obs': { name: 'OBS Studio', icon: '📹' }
        };
    }

    initializeGameList() {
        return {
            // Popular Turkish games
            'valorant': {
                name: 'Valorant',
                icon: '🎯',
                category: 'FPS',
                description: 'Taktiksel nişancı oyunu'
            },
            'csgo': {
                name: 'Counter-Strike: Global Offensive',
                icon: '🔫',
                category: 'FPS',
                description: 'Klasik FPS oyunu'
            },
            'lol': {
                name: 'League of Legends',
                icon: '⚔️',
                category: 'MOBA',
                description: 'Çok oyunculu online savaş arenası'
            },
            'fortnite': {
                name: 'Fortnite',
                icon: '🏗️',
                category: 'Battle Royale',
                description: 'Yapı inşa etme ve savaş oyunu'
            },
            'minecraft': {
                name: 'Minecraft',
                icon: '⛏️',
                category: 'Sandbox',
                description: 'Küp dünyasında yaratıcılık'
            },
            'pubg': {
                name: 'PUBG: Battlegrounds',
                icon: '🎯',
                category: 'Battle Royale',
                description: 'Hayatta kalma savaşı'
            },
            'dota2': {
                name: 'Dota 2',
                icon: '⚔️',
                category: 'MOBA',
                description: 'Savunma oyunu'
            },
            'fifa': {
                name: 'FIFA',
                icon: '⚽',
                category: 'Sports',
                description: 'Futbol simülasyonu'
            },
            'pes': {
                name: 'eFootball PES',
                icon: '⚽',
                category: 'Sports',
                description: 'Futbol oyunu'
            },
            'gta': {
                name: 'Grand Theft Auto',
                icon: '🚗',
                category: 'Action',
                description: 'Açık dünya aksiyon oyunu'
            }
        };
    }

    startDetection() {
        // Start periodic game detection
        this.detectionInterval = setInterval(() => {
            this.detectRunningGames();
        }, 5000); // Check every 5 seconds

        // Initial detection
        this.detectRunningGames();
    }

    async detectRunningGames() {
        try {
            if (navigator.platform.includes('Win')) {
                await this.detectWindowsGames();
            } else if (navigator.platform.includes('Mac')) {
                await this.detectMacGames();
            } else {
                await this.detectGenericGames();
            }
        } catch (error) {
            console.error('Game detection error:', error);
        }
    }

    async detectWindowsGames() {
        // Simulate Windows process detection
        // In a real implementation, this would use Windows API or PowerShell
        const runningGames = [];
        
        // Simulate detecting some games
        const randomGames = ['valorant', 'csgo', 'lol', 'fortnite', 'minecraft'];
        const randomGame = randomGames[Math.floor(Math.random() * randomGames.length)];
        
        if (Math.random() > 0.7) { // 30% chance of detecting a game
            runningGames.push(randomGame);
        }

        this.updateGameStatus(runningGames);
    }

    async detectMacGames() {
        // Simulate macOS process detection
        const runningGames = [];
        
        // Simulate detecting some games
        const randomGames = ['steam', 'discord', 'obs'];
        const randomGame = randomGames[Math.floor(Math.random() * randomGames.length)];
        
        if (Math.random() > 0.7) { // 30% chance of detecting a game
            runningGames.push(randomGame);
        }

        this.updateGameStatus(runningGames);
    }

    async detectGenericGames() {
        // Generic game detection
        const runningGames = [];
        
        // Simulate detecting some games
        const randomGames = ['steam', 'discord'];
        const randomGame = randomGames[Math.floor(Math.random() * randomGames.length)];
        
        if (Math.random() > 0.7) { // 30% chance of detecting a game
            runningGames.push(randomGame);
        }

        this.updateGameStatus(runningGames);
    }

    updateGameStatus(runningGames) {
        const previousGame = this.currentGame;
        
        if (runningGames.length > 0) {
            const detectedGame = runningGames[0];
            const gameInfo = this.gameList[detectedGame];
            
            if (gameInfo && this.currentGame !== detectedGame) {
                this.currentGame = detectedGame;
                this.updateUserStatus(detectedGame, gameInfo);
                this.notifyGameDetection(detectedGame, gameInfo);
            }
        } else {
            if (this.currentGame) {
                this.currentGame = null;
                this.updateUserStatus(null, null);
                this.notifyGameStopped();
            }
        }
    }

    updateUserStatus(gameId, gameInfo) {
        const userStatusElement = document.getElementById('user-status');
        const memberStatusElements = document.querySelectorAll('.member-status');
        
        if (gameId && gameInfo) {
            const statusText = `${gameInfo.icon} ${gameInfo.name} oynuyor`;
            
            if (userStatusElement) {
                userStatusElement.textContent = statusText;
            }
            
            // Update member list status
            memberStatusElements.forEach(element => {
                if (element.textContent.includes('Çevrimiçi') || element.textContent.includes('Boşta')) {
                    element.textContent = statusText;
                }
            });
            
            // Update game status indicator
            this.updateGameStatusIndicator(gameInfo);
            
        } else {
            const statusText = 'Çevrimiçi';
            
            if (userStatusElement) {
                userStatusElement.textContent = statusText;
            }
            
            // Reset member list status
            memberStatusElements.forEach(element => {
                if (element.textContent.includes('oynuyor')) {
                    element.textContent = 'Çevrimiçi';
                }
            });
            
            // Remove game status indicator
            this.removeGameStatusIndicator();
        }
    }

    updateGameStatusIndicator(gameInfo) {
        // Add game status indicator to user info
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            let gameIndicator = userInfo.querySelector('.game-status');
            
            if (!gameIndicator) {
                gameIndicator = document.createElement('div');
                gameIndicator.className = 'game-status';
                userInfo.appendChild(gameIndicator);
            }
            
            gameIndicator.innerHTML = `
                <i class="fas fa-gamepad"></i>
                <span>${gameInfo.name}</span>
            `;
        }
    }

    removeGameStatusIndicator() {
        const gameIndicator = document.querySelector('.game-status');
        if (gameIndicator) {
            gameIndicator.remove();
        }
    }

    notifyGameDetection(gameId, gameInfo) {
        if (window.tgcApp) {
            window.tgcApp.showNotification(
                `${gameInfo.icon} ${gameInfo.name} oyunu başlatıldı!`,
                'success'
            );
        }
        
        // Update member list with game status
        this.updateMemberGameStatus(gameId, gameInfo);
    }

    notifyGameStopped() {
        if (window.tgcApp) {
            window.tgcApp.showNotification('Oyun durduruldu', 'info');
        }
        
        // Update member list
        this.updateMemberGameStatus(null, null);
    }

    updateMemberGameStatus(gameId, gameInfo) {
        // Update member list to show game status
        const memberItems = document.querySelectorAll('.member-item');
        
        memberItems.forEach((member, index) => {
            const statusElement = member.querySelector('.member-status');
            if (statusElement && index === 0) { // Update first member as current user
                if (gameId && gameInfo) {
                    statusElement.textContent = `${gameInfo.icon} ${gameInfo.name} oynuyor`;
                } else {
                    statusElement.textContent = 'Çevrimiçi';
                }
            }
        });
    }

    setupStatusManagement() {
        // Setup status change handlers
        this.setupStatusChangeHandlers();
    }

    setupStatusChangeHandlers() {
        // Add status change functionality
        const statusOptions = [
            { id: 'online', text: 'Çevrimiçi', icon: '🟢' },
            { id: 'idle', text: 'Boşta', icon: '🟡' },
            { id: 'dnd', text: 'Rahatsız etmeyin', icon: '🔴' },
            { id: 'invisible', text: 'Görünmez', icon: '⚫' }
        ];

        // Create status menu (would be implemented in UI)
        console.log('Status management initialized');
    }

    setUserStatus(status) {
        this.gameStatus = status;
        
        const statusElement = document.getElementById('user-status');
        if (statusElement) {
            const statusTexts = {
                'online': 'Çevrimiçi',
                'idle': 'Boşta',
                'dnd': 'Rahatsız etmeyin',
                'invisible': 'Görünmez'
            };
            
            statusElement.textContent = statusTexts[status] || 'Çevrimiçi';
        }
        
        // Update status indicator
        this.updateStatusIndicator(status);
    }

    updateStatusIndicator(status) {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${status}`;
        }
    }

    getCurrentGame() {
        return this.currentGame;
    }

    getGameInfo(gameId) {
        return this.gameList[gameId] || null;
    }

    getAllGames() {
        return this.gameList;
    }

    // Game statistics
    getGameStats() {
        return {
            totalGames: Object.keys(this.gameList).length,
            currentGame: this.currentGame,
            gameTime: this.getGameTime(),
            favoriteGame: this.getFavoriteGame()
        };
    }

    getGameTime() {
        // Calculate time spent in current game
        if (this.currentGame && this.gameStartTime) {
            const now = new Date();
            const diff = now - this.gameStartTime;
            return Math.floor(diff / 1000 / 60); // minutes
        }
        return 0;
    }

    getFavoriteGame() {
        // Return most played game (would be calculated from statistics)
        return 'Valorant';
    }

    // Stop detection
    stopDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    // Resume detection
    resumeDetection() {
        if (!this.detectionInterval) {
            this.startDetection();
        }
    }
}

// Initialize game detection when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameDetection = new GameDetection();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameDetection;
} 