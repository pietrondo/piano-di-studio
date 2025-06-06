/**
 * Piano di Studi Universitari - Gamification System
 * Gestisce il sistema di gamification: livelli, XP, badge, obiettivi giornalieri
 */

class GamificationSystem {
    constructor() {
        // Dati di gamification
        this.gamificationData = {
            level: 1,
            xp: 0,
            totalPoints: 0,
            badges: [],
            dailyGoals: [],
            currentStreak: 0,
            maxStreak: 0,
            lastActiveDate: null,
            lastDailyGoalsUpdate: null,
            achievements: {
                totalStudySessions: 0,
                totalStudyTime: 0,
                pomodoroSessions: 0,
                dailyGoalsCompleted: 0
            }
        };
        
        // Definizioni dei badge
        this.badgeDefinitions = {
            first_session: {
                name: "Prima Sessione",
                icon: "🎯",
                description: "Completa la tua prima sessione di studio"
            },
            pomodoro_master: {
                name: "Maestro Pomodoro",
                icon: "🍅",
                description: "Completa 10 sessioni Pomodoro"
            },
            study_warrior: {
                name: "Guerriero dello Studio",
                icon: "⚔️",
                description: "Studia per 1 ora totale"
            },
            level_5: {
                name: "Livello 5",
                icon: "⭐",
                description: "Raggiungi il livello 5"
            },
            daily_goal_achiever: {
                name: "Obiettivi Raggiunti",
                icon: "🎯",
                description: "Completa 5 obiettivi giornalieri"
            },
            streak_master: {
                name: "Maestro della Costanza",
                icon: "🔥",
                description: "Mantieni una streak di 7 giorni"
            },
            focus_champion: {
                name: "Campione di Concentrazione",
                icon: "🧠",
                description: "Completa 50 sessioni Pomodoro"
            },
            dedication: {
                name: "Dedizione",
                icon: "💎",
                description: "Studia per 10 ore totali"
            },
            'daily-champion': {
                name: "Campione Giornaliero",
                icon: "🏆",
                description: "Completa tutti gli obiettivi giornalieri"
            }
        };
        
        // Template per obiettivi giornalieri
        this.dailyGoalTemplates = [
            { 
                type: 'study_time', 
                name: 'Studia per 30 minuti', 
                icon: '📚', 
                target: 1800,
                reward: 50,
                xpReward: 25
            },
            { 
                type: 'pomodoro_sessions', 
                name: 'Completa 3 Pomodoro', 
                icon: '🍅', 
                target: 3,
                reward: 75,
                xpReward: 35
            },
            { 
                type: 'study_sessions', 
                name: 'Fai 2 sessioni di studio', 
                icon: '📖', 
                target: 2,
                reward: 40,
                xpReward: 20
            },
            { 
                type: 'focus_time', 
                name: 'Concentrati per 45 minuti', 
                icon: '🎯', 
                target: 2700,
                reward: 60,
                xpReward: 30
            },
            { 
                type: 'materials_added', 
                name: 'Aggiungi 1 materiale', 
                icon: '📄', 
                target: 1,
                reward: 25,
                xpReward: 15
            }
        ];
    }

    // === GESTIONE DATI ===

    async loadGamificationData() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['gamificationData'], (result) => {
                if (result.gamificationData) {
                    this.gamificationData = { ...this.gamificationData, ...result.gamificationData };
                }
                
                // Verifica se è un nuovo giorno
                const today = new Date().toDateString();
                if (this.gamificationData.lastActiveDate !== today) {
                    this.resetDailyGoals();
                    this.gamificationData.lastActiveDate = today;
                }
                
                resolve();
            });
        });
    }

    async saveGamificationData() {
        return new Promise((resolve) => {
            chrome.storage.sync.set({
                gamificationData: this.gamificationData
            }, resolve);
        });
    }

    // === CALCOLI LIVELLO E XP ===

    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    getXPForNextLevel(currentLevel) {
        return (currentLevel * currentLevel) * 100;
    }

    getXPForCurrentLevel(currentLevel) {
        if (currentLevel <= 1) return 0;
        return ((currentLevel - 1) * (currentLevel - 1)) * 100;
    }

    // === GESTIONE XP E PUNTI ===

    addXP(amount) {
        const oldLevel = this.gamificationData.level;
        this.gamificationData.xp += amount;
        this.gamificationData.level = this.calculateLevel(this.gamificationData.xp);
        
        if (this.gamificationData.level > oldLevel) {
            this.showLevelUpNotification(this.gamificationData.level);
            this.addPoints(this.gamificationData.level * 10); // Bonus punti per level up
            this.checkForBadges();
        }
        
        this.saveGamificationData();
        return this.gamificationData.level > oldLevel;
    }

    addPoints(amount) {
        this.gamificationData.totalPoints += amount;
        this.showPointsNotification(amount);
        this.saveGamificationData();
    }

    // === GESTIONE BADGE ===

    hasBadge(badgeId) {
        return this.gamificationData.badges.includes(badgeId);
    }

    awardBadge(badgeId) {
        if (!this.hasBadge(badgeId)) {
            this.gamificationData.badges.push(badgeId);
            this.saveGamificationData();
            this.showBadgeNotification(badgeId);
            this.addPoints(100); // Bonus punti per badge
            return true;
        }
        return false;
    }

    checkForBadges() {
        Object.keys(this.badgeDefinitions).forEach(badgeId => {
            if (!this.hasBadge(badgeId)) {
                let earned = false;
                
                switch (badgeId) {
                    case 'first_session':
                        earned = this.gamificationData.achievements.totalStudySessions >= 1;
                        break;
                    case 'pomodoro_master':
                        earned = this.gamificationData.achievements.pomodoroSessions >= 10;
                        break;
                    case 'study_warrior':
                        earned = this.gamificationData.achievements.totalStudyTime >= 3600;
                        break;
                    case 'level_5':
                        earned = this.gamificationData.level >= 5;
                        break;
                    case 'daily_goal_achiever':
                        earned = this.gamificationData.achievements.dailyGoalsCompleted >= 5;
                        break;
                    case 'streak_master':
                        earned = this.gamificationData.currentStreak >= 7;
                        break;
                    case 'focus_champion':
                        earned = this.gamificationData.achievements.pomodoroSessions >= 50;
                        break;
                    case 'dedication':
                        earned = this.gamificationData.achievements.totalStudyTime >= 36000;
                        break;
                }
                
                if (earned) {
                    this.awardBadge(badgeId);
                }
            }
        });
    }

    // === GESTIONE OBIETTIVI GIORNALIERI ===

    initializeDailyGoals() {
        const today = new Date().toDateString();
        
        if (!this.gamificationData.lastDailyGoalsUpdate || 
            this.gamificationData.lastDailyGoalsUpdate !== today) {
            
            this.generateDailyGoals();
            this.gamificationData.lastDailyGoalsUpdate = today;
            this.saveGamificationData();
        }
    }

    generateDailyGoals() {
        // Seleziona 3 obiettivi casuali
        const shuffled = [...this.dailyGoalTemplates].sort(() => 0.5 - Math.random());
        this.gamificationData.dailyGoals = shuffled.slice(0, 3).map(template => ({
            ...template,
            progress: 0,
            completed: false
        }));
    }

    resetDailyGoals() {
        const completedGoals = this.gamificationData.dailyGoals.filter(goal => goal.completed).length;
        if (completedGoals > 0) {
            this.gamificationData.achievements.dailyGoalsCompleted += completedGoals;
        }
        
        this.generateDailyGoals();
    }

    updateDailyGoal(goalType, increment = 1) {
        const goal = this.gamificationData.dailyGoals.find(g => g.type === goalType);
        if (goal && !goal.completed) {
            goal.progress += increment;
            
            if (goal.progress >= goal.target && !goal.completed) {
                goal.completed = true;
                this.addPoints(goal.reward);
                this.addXP(goal.xpReward);
                this.showGoalCompletedNotification(goal);
                
                // Check if all daily goals are completed
                const allCompleted = this.gamificationData.dailyGoals.every(g => g.completed);
                if (allCompleted) {
                    this.awardBadge('daily-champion');
                }
            }
            
            this.saveGamificationData();
        }
    }

    // === GESTIONE STREAK ===

    updateStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (this.gamificationData.lastActiveDate === yesterday) {
            this.gamificationData.currentStreak++;
        } else if (this.gamificationData.lastActiveDate !== today) {
            this.gamificationData.currentStreak = 1;
        }
        
        if (this.gamificationData.currentStreak > this.gamificationData.maxStreak) {
            this.gamificationData.maxStreak = this.gamificationData.currentStreak;
        }
        
        this.gamificationData.lastActiveDate = today;
        this.saveGamificationData();
    }

    // === AGGIORNAMENTO ACHIEVEMENTS ===

    updateAchievements(type, value) {
        switch (type) {
            case 'study_session':
                this.gamificationData.achievements.totalStudySessions++;
                this.gamificationData.achievements.totalStudyTime += value;
                break;
            case 'pomodoro_session':
                this.gamificationData.achievements.pomodoroSessions++;
                break;
        }
        
        this.checkForBadges();
        this.updateStreak();
        this.saveGamificationData();
    }

    // === NOTIFICHE ===

    showBadgeNotification(badgeId) {
        const badge = this.badgeDefinitions[badgeId];
        if (!badge) return;

        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="badge-notification-content">
                <span class="badge-icon">${badge.icon}</span>
                <div class="badge-text">
                    <div class="badge-title">Nuovo Badge!</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-description">${badge.description}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showLevelUpNotification(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-notification-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-text">
                    <div class="level-up-title">Livello Aumentato!</div>
                    <div class="level-up-level">Livello ${newLevel}</div>
                    <div class="level-up-bonus">+${newLevel * 10} punti bonus!</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    showPointsNotification(points) {
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `
            <div class="points-notification-content">
                <div class="points-icon">💰</div>
                <div class="points-text">+${points} punti</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    showGoalCompletedNotification(goal) {
        const notification = document.createElement('div');
        notification.className = 'goal-notification';
        notification.innerHTML = `
            <div class="goal-notification-content">
                <span class="goal-icon">${goal.icon}</span>
                <div class="goal-text">
                    <div class="goal-title">Obiettivo Completato!</div>
                    <div class="goal-name">${goal.name}</div>
                    <div class="goal-reward">+${goal.reward} punti, +${goal.xpReward} XP</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // === GETTERS ===

    getGamificationData() {
        return this.gamificationData;
    }

    getBadgeDefinitions() {
        return this.badgeDefinitions;
    }

    getDailyGoals() {
        return this.gamificationData.dailyGoals;
    }

    getLevel() {
        return this.gamificationData.level;
    }

    getXP() {
        return this.gamificationData.xp;
    }

    getTotalPoints() {
        return this.gamificationData.totalPoints;
    }

    getBadges() {
        return this.gamificationData.badges;
    }

    getCurrentStreak() {
        return this.gamificationData.currentStreak;
    }
}

// Esporta la classe per l'uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamificationSystem;
} else {
    window.GamificationSystem = GamificationSystem;
}