/**
 * Piano di Studi Universitari - Main Controller
 * Controller principale che coordina tutti i moduli del sistema
 */

class StudyPlanController {
    constructor() {
        // Inizializza i moduli
        this.model = new StudyPlanModel();
        this.uiManager = new UIManager(this.model);
        this.formManager = new FormManager(this.model, this.uiManager);
        this.gamificationSystem = new GamificationSystem();
        this.pomodoroSystem = new PomodoroSystem();
        this.themeManager = new ThemeManager();
        
        // Configura le dipendenze tra moduli
        this.setupModuleDependencies();
        
        // Stato del timer
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.currentTime = 0;
        this.selectedCourse = null;
        
        // Flag per indicare se l'inizializzazione è completata
        this.initialized = false;
    }

    // === CONFIGURAZIONE MODULI ===

    setupModuleDependencies() {
        // Configura UIManager
        this.uiManager.setGamificationSystem(this.gamificationSystem);
        
        // Configura FormManager
        this.formManager.setGamificationSystem(this.gamificationSystem);
        this.formManager.setPomodoroSystem(this.pomodoroSystem);
        
        // Configura PomodoroSystem
        this.pomodoroSystem.setGamificationSystem(this.gamificationSystem);
        this.pomodoroSystem.setOnTimerUpdate(() => {
            this.updateTimerDisplay();
            this.uiManager.updateGamificationUI();
        });
    }

    // === INIZIALIZZAZIONE ===

    async init() {
        try {
            // Carica i dati
            await this.loadData();
            
            // Inizializza tema
            await this.initTheme();
            
            // Inizializza UI
            this.initUI();
            
            // Inizializza timer
            this.initTimer();
            
            // Inizializza gamification
            this.initGamification();
            
            // Aggiorna tutto
            this.uiManager.refreshAll();
            
            // Imposta il flag di inizializzazione completata
            this.initialized = true;
            
            console.log('Piano di Studi inizializzato con successo');
        } catch (error) {
            console.error('Errore durante l\'inizializzazione:', error);
            this.uiManager.showNotification('Errore', 'Errore durante l\'inizializzazione dell\'applicazione', 'error');
        }
    }

    async loadData() {
        await this.model.loadData();
        await this.gamificationSystem.loadGamificationData();
    }

    async initTheme() {
        // Il ThemeManager si inizializza automaticamente nel constructor
        // Qui possiamo aggiungere configurazioni aggiuntive se necessario
        
        // Ascolta i cambiamenti di tema per aggiornare altri componenti
        document.addEventListener('themeChanged', (event) => {
            const theme = event.detail.theme;
            console.log('Tema cambiato a:', theme);
            
            // Aggiorna eventuali componenti che dipendono dal tema
            this.uiManager.onThemeChanged(theme);
        });
        
        // Inizializza il listener per i cambiamenti del sistema
        this.themeManager.initSystemThemeListener();
    }

    initUI() {
        this.uiManager.initTabs();
        this.formManager.initForms();
        this.initEventListeners();
    }

    initTimer() {
        this.updateTimerDisplay();
        this.updateCourseSelect();
    }

    initGamification() {
        this.gamificationSystem.initializeDailyGoals();
        this.gamificationSystem.updateAchievements(this.model);
        this.uiManager.updateGamificationUI();
    }

    // === EVENT LISTENERS ===

    initEventListeners() {
        // Timer controls
        this.initTimerControls();
        
        // Pomodoro controls
        this.initPomodoroControls();
        
        // Plant interaction
        this.initPlantInteraction();
        
        // Debug system
        this.initDebugSystem();
    }

    initTimerControls() {
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const stopBtn = document.getElementById('stop-timer');
        const resetBtn = document.getElementById('reset-timer');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startTimer());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseTimer());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopTimer());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());
    }

    initPomodoroControls() {
        const pomodoroToggle = document.getElementById('pomodoro-toggle');
        const pomodoroStart = document.getElementById('pomodoro-start');
        const pomodoroPause = document.getElementById('pomodoro-pause');
        const pomodoroStop = document.getElementById('pomodoro-stop');
        
        if (pomodoroToggle) {
            pomodoroToggle.addEventListener('change', (e) => {
                this.togglePomodoroMode(e.target.checked);
            });
        }
        
        if (pomodoroStart) pomodoroStart.addEventListener('click', () => this.startPomodoro());
        if (pomodoroPause) pomodoroPause.addEventListener('click', () => this.pausePomodoro());
        if (pomodoroStop) pomodoroStop.addEventListener('click', () => this.stopPomodoro());
    }

    initPlantInteraction() {
        const plant = document.querySelector('.focus-plant');
        if (plant) {
            plant.addEventListener('click', () => {
                this.interactWithPlant();
            });
        }
    }

    initDebugSystem() {
        // Il debug system è già inizializzato nel suo file separato
        // Qui possiamo aggiungere eventuali integrazioni specifiche
    }

    // === TIMER METHODS ===

    startTimer() {
        if (this.isTimerRunning) return;
        
        const courseSelect = document.getElementById('timer-course');
        if (!courseSelect || !courseSelect.value) {
            this.uiManager.showNotification('Attenzione', 'Seleziona un corso prima di iniziare il timer', 'warning');
            return;
        }
        
        this.selectedCourse = courseSelect.value;
        this.isTimerRunning = true;
        
        this.timerInterval = setInterval(() => {
            this.currentTime++;
            this.updateTimerDisplay();
            this.updatePlantGrowth();
        }, 1000);
        
        this.updateTimerButtons();
        this.uiManager.showNotification('Timer', 'Timer avviato!', 'success');
    }

    pauseTimer() {
        if (!this.isTimerRunning) return;
        
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.updateTimerButtons();
        this.uiManager.showNotification('Timer', 'Timer in pausa', 'info');
    }

    stopTimer() {
        if (this.currentTime === 0) return;
        
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        
        // Salva la sessione se c'è tempo registrato
        if (this.currentTime > 0 && this.selectedCourse) {
            this.saveStudySession();
        }
        
        this.resetTimerState();
        this.updateTimerDisplay();
        this.updateTimerButtons();
        this.resetPlant();
    }

    resetTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.resetTimerState();
        this.updateTimerDisplay();
        this.updateTimerButtons();
        this.resetPlant();
        this.uiManager.showNotification('Timer', 'Timer resettato', 'info');
    }

    resetTimerState() {
        this.currentTime = 0;
        this.selectedCourse = null;
        const courseSelect = document.getElementById('timer-course');
        if (courseSelect) courseSelect.value = '';
    }

    saveStudySession() {
        const durationMinutes = Math.floor(this.currentTime / 60);
        
        if (durationMinutes < 1) {
            this.uiManager.showNotification('Attenzione', 'Sessione troppo breve per essere salvata', 'warning');
            return;
        }
        
        const sessionData = {
            courseId: this.selectedCourse,
            duration: durationMinutes,
            date: new Date().toISOString().split('T')[0],
            notes: 'Sessione timer'
        };
        
        this.model.addStudySession(sessionData);
        
        // Aggiorna gamification
        const xpGained = Math.floor(durationMinutes / 5);
        const pointsGained = Math.floor(durationMinutes / 2);
        
        this.gamificationSystem.addXP(xpGained);
        this.gamificationSystem.addPoints(pointsGained);
        this.gamificationSystem.updateDailyGoal('study_time', durationMinutes);
        this.gamificationSystem.updateDailyGoal('study_sessions', 1);
        this.gamificationSystem.checkForBadges(this.model);
        
        // Aggiorna UI
        this.uiManager.refreshAll();
        
        this.uiManager.showNotification('Successo', 
            `Sessione salvata: ${durationMinutes} minuti (+${xpGained} XP, +${pointsGained} punti)`, 
            'success'
        );
    }

    // === POMODORO METHODS ===

    togglePomodoroMode(enabled) {
        const pomodoroControls = document.querySelector('.pomodoro-controls');
        const timerControls = document.querySelector('.timer-controls');
        
        if (pomodoroControls) {
            pomodoroControls.style.display = enabled ? 'flex' : 'none';
        }
        
        if (timerControls) {
            timerControls.style.display = enabled ? 'none' : 'flex';
        }
        
        // Reset timer se attivo
        if (this.isTimerRunning) {
            this.resetTimer();
        }
        
        this.pomodoroSystem.setEnabled(enabled);
        this.updateTimerDisplay();
    }

    startPomodoro() {
        const courseSelect = document.getElementById('timer-course');
        if (!courseSelect || !courseSelect.value) {
            this.uiManager.showNotification('Attenzione', 'Seleziona un corso prima di iniziare il Pomodoro', 'warning');
            return;
        }
        
        this.selectedCourse = courseSelect.value;
        this.pomodoroSystem.start();
        this.updatePomodoroButtons();
    }

    pausePomodoro() {
        this.pomodoroSystem.pause();
        this.updatePomodoroButtons();
    }

    stopPomodoro() {
        this.pomodoroSystem.stop();
        this.updatePomodoroButtons();
        this.resetPlant();
    }

    // === UI UPDATE METHODS ===

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        if (!display) return;
        
        let timeToShow;
        if (this.pomodoroSystem.isEnabled()) {
            timeToShow = this.pomodoroSystem.getCurrentTime();
        } else {
            timeToShow = this.currentTime;
        }
        
        const minutes = Math.floor(timeToShow / 60);
        const seconds = timeToShow % 60;
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Aggiorna fase Pomodoro
        const phaseDisplay = document.querySelector('.pomodoro-phase');
        if (phaseDisplay && this.pomodoroSystem.isEnabled()) {
            phaseDisplay.textContent = this.pomodoroSystem.getCurrentPhase();
        }
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const stopBtn = document.getElementById('stop-timer');
        const resetBtn = document.getElementById('reset-timer');
        
        if (startBtn) startBtn.disabled = this.isTimerRunning;
        if (pauseBtn) pauseBtn.disabled = !this.isTimerRunning;
        if (stopBtn) stopBtn.disabled = this.currentTime === 0;
        if (resetBtn) resetBtn.disabled = this.isTimerRunning;
    }

    updatePomodoroButtons() {
        const startBtn = document.getElementById('pomodoro-start');
        const pauseBtn = document.getElementById('pomodoro-pause');
        const stopBtn = document.getElementById('pomodoro-stop');
        
        const isRunning = this.pomodoroSystem.isRunning();
        
        if (startBtn) startBtn.disabled = isRunning;
        if (pauseBtn) pauseBtn.disabled = !isRunning;
        if (stopBtn) stopBtn.disabled = !isRunning && this.pomodoroSystem.getCurrentTime() === this.pomodoroSystem.getWorkDuration() * 60;
    }

    updateCourseSelect() {
        const select = document.getElementById('timer-course');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleziona un corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            select.appendChild(option);
        });
    }

    // === PLANT METHODS ===

    updatePlantGrowth() {
        const plant = document.querySelector('.focus-plant');
        if (!plant) return;
        
        // Calcola il livello di crescita basato sul tempo
        const growthLevel = Math.min(Math.floor(this.currentTime / 300), 5); // Ogni 5 minuti
        
        // Rimuovi classi precedenti
        plant.classList.remove('growth-1', 'growth-2', 'growth-3', 'growth-4', 'growth-5');
        
        // Aggiungi nuova classe
        if (growthLevel > 0) {
            plant.classList.add(`growth-${growthLevel}`);
        }
    }

    resetPlant() {
        const plant = document.querySelector('.focus-plant');
        if (!plant) return;
        
        plant.classList.remove('growth-1', 'growth-2', 'growth-3', 'growth-4', 'growth-5');
    }

    interactWithPlant() {
        if (!this.isTimerRunning && !this.pomodoroSystem.isRunning()) {
            this.uiManager.showNotification('Pianta', 'Avvia il timer per far crescere la pianta! 🌱', 'info');
            return;
        }
        
        // Animazione di interazione
        const plant = document.querySelector('.focus-plant');
        if (plant) {
            plant.classList.add('bounce');
            setTimeout(() => plant.classList.remove('bounce'), 500);
        }
        
        // Messaggio motivazionale
        const messages = [
            'Continua così! 🌟',
            'La pianta sta crescendo! 🌱',
            'Ottimo lavoro! 💪',
            'Resta concentrato! 🎯',
            'Stai andando alla grande! 🚀'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.uiManager.showNotification('Motivazione', randomMessage, 'success');
    }

    // === PUBLIC METHODS (chiamati dall'HTML) ===

    removeCourse(courseId) {
        if (confirm('Sei sicuro di voler rimuovere questo corso?')) {
            this.model.removeCourse(courseId);
            this.uiManager.refreshAll();
            this.updateCourseSelect();
            this.uiManager.showNotification('Successo', 'Corso rimosso con successo', 'success');
        }
    }

    removeExam(examId) {
        if (confirm('Sei sicuro di voler rimuovere questo esame?')) {
            this.model.removeExam(examId);
            this.uiManager.refreshAll();
            this.uiManager.showNotification('Successo', 'Esame rimosso con successo', 'success');
        }
    }

    removeStudyMaterial(materialId) {
        if (confirm('Sei sicuro di voler rimuovere questo materiale?')) {
            this.model.removeStudyMaterial(materialId);
            this.uiManager.refreshAll();
            this.uiManager.showNotification('Successo', 'Materiale rimosso con successo', 'success');
        }
    }
}

// Inizializza l'applicazione quando il DOM è pronto
let controller;

document.addEventListener('DOMContentLoaded', () => {
    controller = new StudyPlanController();
});

// Esporta per l'uso globale
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyPlanController;
} else {
    window.StudyPlanController = StudyPlanController;
}