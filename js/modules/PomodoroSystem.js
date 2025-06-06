/**
 * Piano di Studi Universitari - Pomodoro System
 * Gestisce il timer Pomodoro con fasi di lavoro e pausa
 */

class PomodoroSystem {
    constructor(gamificationSystem = null) {
        this.gamificationSystem = gamificationSystem;
        
        // Configurazione Pomodoro
        this.config = {
            workTime: 25 * 60, // 25 minuti in secondi
            shortBreak: 5 * 60, // 5 minuti
            longBreak: 15 * 60, // 15 minuti
            cycles: 0,
            maxCycles: 4,
            currentPhase: 'work' // 'work', 'shortBreak', 'longBreak'
        };
        
        // Stato del timer
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.isTimerRunning = false;
        this.pomodoroMode = false;
        this.currentCourse = null;
        
        // Callbacks
        this.onTimerUpdate = null;
        this.onTimerComplete = null;
        this.onPhaseChange = null;
    }

    // === CONFIGURAZIONE ===

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    getConfig() {
        return this.config;
    }

    // === CALLBACKS ===

    setOnTimerUpdate(callback) {
        this.onTimerUpdate = callback;
    }

    setOnTimerComplete(callback) {
        this.onTimerComplete = callback;
    }

    setOnPhaseChange(callback) {
        this.onPhaseChange = callback;
    }

    // === CONTROLLO TIMER ===

    startTimer(courseId = null) {
        if (this.isTimerRunning) return;
        
        this.currentCourse = courseId;
        this.isTimerRunning = true;
        
        // Se non è impostato un tempo, usa la configurazione Pomodoro
        if (this.timerSeconds === 0) {
            this.timerSeconds = this.getCurrentPhaseTime();
        }
        
        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            
            if (this.onTimerUpdate) {
                this.onTimerUpdate(this.timerSeconds, this.getCurrentPhase());
            }
            
            if (this.timerSeconds <= 0) {
                this.completeTimer();
            }
        }, 1000);
        
        // Aggiorna UI
        this.updateTimerDisplay();
    }

    pauseTimer() {
        if (!this.isTimerRunning) return;
        
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        this.updateTimerDisplay();
    }

    stopTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.currentCourse = null;
        
        this.updateTimerDisplay();
    }

    resetTimer() {
        this.stopTimer();
        this.timerSeconds = this.getCurrentPhaseTime();
        this.updateTimerDisplay();
    }

    // === GESTIONE POMODORO ===

    togglePomodoroMode() {
        this.pomodoroMode = !this.pomodoroMode;
        
        if (this.pomodoroMode) {
            this.config.currentPhase = 'work';
            this.config.cycles = 0;
            this.timerSeconds = this.config.workTime;
        } else {
            this.timerSeconds = 0;
        }
        
        this.updateTimerDisplay();
        
        if (this.onPhaseChange) {
            this.onPhaseChange(this.config.currentPhase, this.pomodoroMode);
        }
        
        return this.pomodoroMode;
    }

    getCurrentPhase() {
        return this.pomodoroMode ? this.config.currentPhase : 'normal';
    }

    getCurrentPhaseTime() {
        if (!this.pomodoroMode) return 25 * 60; // Default 25 minuti
        
        switch (this.config.currentPhase) {
            case 'work':
                return this.config.workTime;
            case 'shortBreak':
                return this.config.shortBreak;
            case 'longBreak':
                return this.config.longBreak;
            default:
                return this.config.workTime;
        }
    }

    getPhaseDisplayName() {
        switch (this.config.currentPhase) {
            case 'work':
                return 'Lavoro';
            case 'shortBreak':
                return 'Pausa Breve';
            case 'longBreak':
                return 'Pausa Lunga';
            default:
                return 'Timer';
        }
    }

    // === COMPLETAMENTO TIMER ===

    completeTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        const completedPhase = this.config.currentPhase;
        const duration = Math.floor(this.getCurrentPhaseTime() / 60);
        
        // Gestione Pomodoro
        if (this.pomodoroMode) {
            this.handlePomodoroCompletion(completedPhase, duration);
        } else {
            this.handleNormalTimerCompletion(duration);
        }
        
        // Callback di completamento
        if (this.onTimerComplete) {
            this.onTimerComplete(completedPhase, duration, this.currentCourse);
        }
        
        this.updateTimerDisplay();
    }

    handlePomodoroCompletion(phase, duration) {
        if (phase === 'work') {
            // Sessione di lavoro completata
            this.config.cycles++;
            
            // Aggiorna gamification se disponibile
            if (this.gamificationSystem) {
                this.gamificationSystem.updateAchievements('pomodoro_session', duration);
                this.gamificationSystem.updateDailyGoal('pomodoro_sessions', 1);
                this.gamificationSystem.updateDailyGoal('study_time', duration * 60);
                this.gamificationSystem.updateDailyGoal('focus_time', duration * 60);
                this.gamificationSystem.addXP(30);
                this.gamificationSystem.addPoints(20);
            }
            
            // Determina il tipo di pausa
            if (this.config.cycles >= this.config.maxCycles) {
                this.config.currentPhase = 'longBreak';
                this.config.cycles = 0;
            } else {
                this.config.currentPhase = 'shortBreak';
            }
            
            this.showNotification(
                '🍅 Pomodoro Completato!', 
                `Ottimo lavoro! Tempo per una ${this.config.currentPhase === 'longBreak' ? 'pausa lunga' : 'pausa breve'}.`
            );
        } else {
            // Pausa completata
            this.config.currentPhase = 'work';
            this.showNotification(
                '⏰ Pausa Terminata!', 
                'Torna al lavoro! Inizia un nuovo Pomodoro.'
            );
        }
        
        // Imposta il timer per la prossima fase
        this.timerSeconds = this.getCurrentPhaseTime();
        
        // Notifica cambio fase
        if (this.onPhaseChange) {
            this.onPhaseChange(this.config.currentPhase, this.pomodoroMode);
        }
    }

    handleNormalTimerCompletion(duration) {
        // Timer normale completato
        if (this.gamificationSystem && this.currentCourse) {
            this.gamificationSystem.updateAchievements('study_session', duration);
            this.gamificationSystem.updateDailyGoal('study_sessions', 1);
            this.gamificationSystem.updateDailyGoal('study_time', duration * 60);
            this.gamificationSystem.addXP(duration * 2);
            this.gamificationSystem.addPoints(duration);
        }
        
        this.showNotification(
            '⏰ Timer Completato!', 
            `Sessione di studio di ${duration} minuti completata.`
        );
        
        this.timerSeconds = 0;
    }

    // === UTILITÀ ===

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateTimerDisplay() {
        const timerDisplay = document.querySelector('.timer-display');
        const timerCircle = document.querySelector('.timer-circle');
        const phaseDisplay = document.querySelector('.phase-display');
        const startBtn = document.querySelector('.start-timer');
        const pauseBtn = document.querySelector('.pause-timer');
        const stopBtn = document.querySelector('.stop-timer');
        const resetBtn = document.querySelector('.reset-timer');
        
        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.timerSeconds);
        }
        
        if (timerCircle) {
            if (this.isTimerRunning) {
                timerCircle.classList.add('running');
            } else {
                timerCircle.classList.remove('running');
            }
        }
        
        if (phaseDisplay && this.pomodoroMode) {
            phaseDisplay.textContent = this.getPhaseDisplayName();
            phaseDisplay.style.display = 'block';
        } else if (phaseDisplay) {
            phaseDisplay.style.display = 'none';
        }
        
        // Aggiorna pulsanti
        if (startBtn) {
            startBtn.disabled = this.isTimerRunning;
        }
        
        if (pauseBtn) {
            pauseBtn.disabled = !this.isTimerRunning;
        }
        
        if (stopBtn) {
            stopBtn.disabled = !this.isTimerRunning && this.timerSeconds === 0;
        }
        
        if (resetBtn) {
            resetBtn.disabled = this.isTimerRunning;
        }
    }

    showNotification(title, message) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: 'images/icon48.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, {
                            body: message,
                            icon: 'images/icon48.png'
                        });
                    }
                });
            }
        }
        
        // Fallback: mostra notifica in-app
        this.showInAppNotification(title, message);
    }

    showInAppNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'timer-notification';
        notification.innerHTML = `
            <div class="timer-notification-content">
                <div class="timer-notification-title">${title}</div>
                <div class="timer-notification-message">${message}</div>
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

    isRunning() {
        return this.isTimerRunning;
    }

    isPomodoroMode() {
        return this.pomodoroMode;
    }

    getRemainingTime() {
        return this.timerSeconds;
    }

    getCurrentCourse() {
        return this.currentCourse;
    }

    getCycles() {
        return this.config.cycles;
    }

    getMaxCycles() {
        return this.config.maxCycles;
    }

    // === SETTERS ===

    setCustomTime(minutes) {
        if (!this.isTimerRunning) {
            this.timerSeconds = minutes * 60;
            this.updateTimerDisplay();
        }
    }

    setGamificationSystem(gamificationSystem) {
        this.gamificationSystem = gamificationSystem;
    }
}

// Esporta la classe per l'uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PomodoroSystem;
} else {
    window.PomodoroSystem = PomodoroSystem;
}