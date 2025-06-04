/**
 * Piano di Studi Universitari - Popup Script
 * Gestisce l'interfaccia utente e l'interazione con l'API di storage di Chrome
 */

// Modello dati
class StudyPlanModel {
    constructor() {
        this.courses = [];
        this.exams = [];
        this.studySessions = [];
        this.studyMaterials = [];
    }

    // Carica i dati dal Chrome Storage
    async loadData() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['courses', 'exams', 'studySessions', 'studyMaterials'], (result) => {
                if (result.courses) this.courses = result.courses;
                if (result.exams) this.exams = result.exams;
                if (result.studySessions) this.studySessions = result.studySessions;
                if (result.studyMaterials) this.studyMaterials = result.studyMaterials;
                resolve();
            });
        });
    }

    // Salva i dati nel Chrome Storage
    async saveData() {
        return new Promise((resolve) => {
            chrome.storage.sync.set({
                courses: this.courses,
                exams: this.exams,
                studySessions: this.studySessions,
                studyMaterials: this.studyMaterials
            }, resolve);
        });
    }

    // Aggiunge un nuovo corso
    async addCourse(course) {
        course.id = Date.now().toString();
        this.courses.push(course);
        await this.saveData();
        return course;
    }

    // Rimuove un corso
    async removeCourse(courseId) {
        this.courses = this.courses.filter(course => course.id !== courseId);
        await this.saveData();
    }

    // Aggiunge un nuovo esame
    async addExam(exam) {
        exam.id = Date.now().toString();
        this.exams.push(exam);
        await this.saveData();
        return exam;
    }

    // Rimuove un esame
    async removeExam(examId) {
        this.exams = this.exams.filter(exam => exam.id !== examId);
        await this.saveData();
    }

    // Aggiunge una sessione di studio
    async addStudySession(session) {
        session.id = Date.now().toString();
        session.date = new Date().toISOString();
        this.studySessions.push(session);
        await this.saveData();
        return session;
    }

    // Aggiunge materiale di studio
    async addStudyMaterial(material) {
        material.id = Date.now().toString();
        this.studyMaterials.push(material);
        await this.saveData();
        return material;
    }

    // Rimuove materiale di studio
    async removeStudyMaterial(materialId) {
        this.studyMaterials = this.studyMaterials.filter(material => material.id !== materialId);
        await this.saveData();
    }
}

// Controller principale
class StudyPlanController {
    constructor(model) {
        this.model = model;
        this.currentTab = 'courses';
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.isTimerRunning = false;
        this.pomodoroMode = false;
        
        // Configurazione Pomodoro
        this.pomodoroConfig = {
            workTime: 25 * 60, // 25 minuti in secondi
            shortBreak: 5 * 60, // 5 minuti
            longBreak: 15 * 60, // 15 minuti
            cycles: 0,
            maxCycles: 4,
            currentPhase: 'work' // 'work', 'shortBreak', 'longBreak'
        };
        
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
            }
        };
        
        // Template per obiettivi giornalieri
        this.dailyGoalTemplates = [
            { type: 'study_time', name: 'Studia per 30 minuti', icon: '📚', target: 1800 },
            { type: 'pomodoro_sessions', name: 'Completa 3 Pomodoro', icon: '🍅', target: 3 },
            { type: 'study_sessions', name: 'Fai 2 sessioni di studio', icon: '📖', target: 2 },
            { type: 'focus_time', name: 'Concentrati per 45 minuti', icon: '🎯', target: 2700 },
            { type: 'materials_added', name: 'Aggiungi 1 materiale', icon: '📄', target: 1 }
        ];
    }

    // Inizializzazione
    async init() {
        await this.model.loadData();
        await this.loadGamificationData();
        this.initTabs();
        this.initForms();
        this.initEventListeners();
        this.renderCourses();
        this.renderExams();
        this.renderStudyMaterials();
        this.updateExamCourseSelect();
        this.updateStudySessionCourseSelect();
        this.updateMaterialCourseSelect();
        this.updateGamificationUI();
        this.initializeDailyGoals();
    }

    // Gamification helper methods
    calculateLevel(xp) {
        // Level formula: level = floor(sqrt(xp / 100)) + 1
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    getXPForNextLevel(currentLevel) {
        // XP needed for next level: (level^2) * 100
        return (currentLevel * currentLevel) * 100;
    }

    getXPForCurrentLevel(currentLevel) {
        // XP needed for current level: ((level-1)^2) * 100
        if (currentLevel <= 1) return 0;
        return ((currentLevel - 1) * (currentLevel - 1)) * 100;
    }

    updateGamificationUI() {
        const levelElement = document.querySelector('.user-level');
        const xpBarElement = document.querySelector('.xp-bar-fill');
        const xpTextElement = document.querySelector('.xp-text');
        const pointsElement = document.querySelector('.total-points');
        const badgesContainer = document.querySelector('.recent-badges');
        const goalsContainer = document.querySelector('.daily-goals-list');

        if (!this.gamificationData) return;

        // Update level
        if (levelElement) {
            levelElement.textContent = this.gamificationData.level;
        }

        // Update XP bar
        const currentLevelXP = this.getXPForCurrentLevel(this.gamificationData.level);
        const nextLevelXP = this.getXPForNextLevel(this.gamificationData.level);
        const progressXP = this.gamificationData.xp - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progressPercent = (progressXP / neededXP) * 100;

        if (xpBarElement) {
            xpBarElement.style.width = `${Math.min(progressPercent, 100)}%`;
        }

        if (xpTextElement) {
            xpTextElement.textContent = `${progressXP}/${neededXP} XP`;
        }

        // Update points
        if (pointsElement) {
            pointsElement.textContent = this.gamificationData.totalPoints.toLocaleString();
        }

        // Update recent badges
        if (badgesContainer) {
            badgesContainer.innerHTML = '';
            const recentBadges = this.gamificationData.badges.slice(-3);
            recentBadges.forEach(badgeId => {
                const badge = this.badgeDefinitions[badgeId];
                if (badge) {
                    const badgeElement = document.createElement('div');
                    badgeElement.className = 'badge-item';
                    badgeElement.innerHTML = `
                        <span class="badge-icon">${badge.icon}</span>
                        <span class="badge-name">${badge.name}</span>
                    `;
                    badgeElement.title = badge.description;
                    badgesContainer.appendChild(badgeElement);
                }
            });
        }

        // Update daily goals
        if (goalsContainer) {
            goalsContainer.innerHTML = '';
            this.gamificationData.dailyGoals.forEach((goal, index) => {
                const goalElement = document.createElement('div');
                goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
                const progressPercent = Math.min((goal.progress / goal.target) * 100, 100);
                
                goalElement.innerHTML = `
                    <div class="goal-info">
                        <span class="goal-icon">${goal.icon}</span>
                        <span class="goal-text">${goal.name}</span>
                        <span class="goal-progress">${goal.progress}/${goal.target}</span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                `;
                goalsContainer.appendChild(goalElement);
            });
        }
     }

     // Badge management methods
     hasBadge(badgeId) {
         return this.gamificationData.badges.includes(badgeId);
     }

     awardBadge(badgeId) {
         if (!this.hasBadge(badgeId)) {
             this.gamificationData.badges.push(badgeId);
             this.saveGamificationData();
             this.showBadgeNotification(badgeId);
             return true;
         }
         return false;
     }

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

         // Animate in
         setTimeout(() => {
             notification.classList.add('show');
         }, 100);

         // Remove after 4 seconds
         setTimeout(() => {
             notification.classList.remove('show');
             setTimeout(() => {
                 if (notification.parentNode) {
                     notification.parentNode.removeChild(notification);
                 }
             }, 300);
         }, 4000);
     }

     // Daily goals management
     initializeDailyGoals() {
         const today = new Date().toDateString();
         
         if (!this.gamificationData.lastDailyGoalsUpdate || 
             this.gamificationData.lastDailyGoalsUpdate !== today) {
             
             // Reset daily goals
             this.gamificationData.dailyGoals = this.dailyGoalTemplates.map(template => ({
                 ...template,
                 progress: 0,
                 completed: false
             }));
             
             this.gamificationData.lastDailyGoalsUpdate = today;
             this.saveGamificationData();
         }
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
             this.updateGamificationUI();
         }
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

         // Animate in
         setTimeout(() => {
             notification.classList.add('show');
         }, 100);

         // Remove after 3 seconds
         setTimeout(() => {
             notification.classList.remove('show');
             setTimeout(() => {
                 if (notification.parentNode) {
                     notification.parentNode.removeChild(notification);
                 }
             }, 300);
         }, 3000);
     }

     // Inizializza le tab
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Rimuovi classe active da tutti i pulsanti e contenuti
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Aggiungi classe active al pulsante e contenuto correnti
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                this.currentTab = tabId;
            });
        });
    }

    // Inizializza i form
    initForms() {
        // Form corso
        document.getElementById('course-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const course = {
                name: formData.get('course-name'),
                credits: parseInt(formData.get('course-credits')),
                semester: formData.get('course-semester'),
                year: parseInt(formData.get('course-year'))
            };
            
            await this.model.addCourse(course);
            this.renderCourses();
            this.updateExamCourseSelect();
            this.updateStudySessionCourseSelect();
            this.updateMaterialCourseSelect();
            e.target.reset();
        });

        // Form esame
        document.getElementById('exam-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const exam = {
                courseId: formData.get('exam-course'),
                date: formData.get('exam-date'),
                time: formData.get('exam-time'),
                location: formData.get('exam-location'),
                notes: formData.get('exam-notes')
            };
            
            await this.model.addExam(exam);
            this.renderExams();
            e.target.reset();
        });

        // Form sessione di studio
        document.getElementById('study-session-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const session = {
                courseId: formData.get('session-course'),
                topic: formData.get('session-topic'),
                duration: parseInt(formData.get('session-duration')),
                notes: formData.get('session-notes')
            };
            
            await this.saveStudySession(session);
            e.target.reset();
        });

        // Form materiale di studio
        document.getElementById('material-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const material = {
                courseId: formData.get('material-course'),
                title: formData.get('material-title'),
                type: formData.get('material-type'),
                url: formData.get('material-url'),
                notes: formData.get('material-notes')
            };
            
            await this.model.addStudyMaterial(material);
            this.renderStudyMaterials();
            this.updateDailyGoal('materials_added', 1);
            e.target.reset();
        });
    }

    // Inizializza gli event listener
    initEventListeners() {
        // Toggle Pomodoro
        document.getElementById('pomodoro-toggle').addEventListener('change', (e) => {
            this.pomodoroMode = e.target.checked;
            this.updatePomodoroInfo();
            if (!this.pomodoroMode) {
                this.resetTimer();
            }
        });

        // Controlli timer
        document.getElementById('start-timer').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-timer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('stop-timer').addEventListener('click', () => this.stopTimer());

        // Delegazione degli eventi per i pulsanti dei corsi
        document.getElementById('courses-container').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const courseId = e.target.dataset.courseId;
                await this.model.removeCourse(courseId);
                this.renderCourses();
                this.updateExamCourseSelect();
            }
        });

        // Delegazione degli eventi per i pulsanti degli esami
        document.getElementById('exams-container').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const examId = e.target.dataset.examId;
                await this.model.removeExam(examId);
                this.renderExams();
            }
        });

        // Delegazione degli eventi per i materiali
        document.getElementById('materials-container').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const materialId = e.target.dataset.materialId;
                await this.model.removeStudyMaterial(materialId);
                this.renderStudyMaterials();
            }
        });
    }

    // === METODI DI RENDERING ===

    renderCourses() {
        const container = document.getElementById('courses-container');
        container.innerHTML = '';
        
        this.model.courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            courseElement.innerHTML = `
                <div class="course-info">
                    <h3>${course.name}</h3>
                    <p>Crediti: ${course.credits} | Semestre: ${course.semester} | Anno: ${course.year}</p>
                </div>
                <button class="btn btn-delete" data-course-id="${course.id}">Elimina</button>
            `;
            container.appendChild(courseElement);
        });
    }

    renderExams() {
        const container = document.getElementById('exams-container');
        container.innerHTML = '';
        
        this.model.exams.forEach(exam => {
            const course = this.model.courses.find(c => c.id === exam.courseId);
            const examElement = document.createElement('div');
            examElement.className = 'exam-item';
            examElement.innerHTML = `
                <div class="exam-info">
                    <h3>${course ? course.name : 'Corso non trovato'}</h3>
                    <p>Data: ${exam.date} alle ${exam.time}</p>
                    <p>Luogo: ${exam.location}</p>
                    ${exam.notes ? `<p>Note: ${exam.notes}</p>` : ''}
                </div>
                <button class="btn btn-delete" data-exam-id="${exam.id}">Elimina</button>
            `;
            container.appendChild(examElement);
        });
    }

    renderStudyMaterials() {
        const container = document.getElementById('materials-container');
        container.innerHTML = '';
        
        this.model.studyMaterials.forEach(material => {
            const course = this.model.courses.find(c => c.id === material.courseId);
            const materialElement = document.createElement('div');
            materialElement.className = 'material-item';
            materialElement.innerHTML = `
                <div class="material-info">
                    <h3>${material.title}</h3>
                    <p>Corso: ${course ? course.name : 'Corso non trovato'}</p>
                    <p>Tipo: ${material.type}</p>
                    ${material.url ? `<p><a href="${material.url}" target="_blank">Apri link</a></p>` : ''}
                    ${material.notes ? `<p>Note: ${material.notes}</p>` : ''}
                </div>
                <button class="btn btn-delete" data-material-id="${material.id}">Elimina</button>
            `;
            container.appendChild(materialElement);
        });
    }

    // === METODI DI AGGIORNAMENTO SELECT ===

    updateExamCourseSelect() {
        const select = document.getElementById('exam-course');
        select.innerHTML = '<option value="">Seleziona un corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            select.appendChild(option);
        });
    }

    updateStudySessionCourseSelect() {
        const select = document.getElementById('session-course');
        select.innerHTML = '<option value="">Seleziona un corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            select.appendChild(option);
        });
    }

    updateMaterialCourseSelect() {
        const select = document.getElementById('material-course');
        select.innerHTML = '<option value="">Seleziona un corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            select.appendChild(option);
        });
    }

    // === METODI TIMER E POMODORO ===

    startTimer() {
        if (!this.isTimerRunning) {
            this.isTimerRunning = true;
            
            if (this.pomodoroMode && this.timerSeconds === 0) {
                this.timerSeconds = this.getCurrentPomodoroTime();
            } else if (!this.pomodoroMode && this.timerSeconds === 0) {
                this.timerSeconds = 25 * 60; // Default 25 minuti
            }
            
            this.timerInterval = setInterval(() => {
                this.timerSeconds--;
                this.updateTimerDisplay();
                
                if (this.timerSeconds <= 0) {
                    this.handleTimerEnd();
                }
            }, 1000);
            
            this.updateTimerDisplay();
        }
    }

    pauseTimer() {
        this.isTimerRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.updateTimerDisplay();
    }

    stopTimer() {
        this.isTimerRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.resetTimer();
    }

    resetTimer() {
        this.timerSeconds = 0;
        this.updateTimerDisplay();
        
        // Reset plant icon
        const plantIcon = document.querySelector('.focus-plant');
        if (plantIcon) {
            plantIcon.textContent = '🌱';
        }
    }

    handleTimerEnd() {
        this.pauseTimer();
        
        if (this.pomodoroMode) {
            this.handlePomodoroPhaseEnd();
        } else {
            // Timer normale completato
            this.showNotification('Timer completato!', 'La tua sessione di studio è terminata.');
        }
        
        this.resetTimer();
    }

    handlePomodoroPhaseEnd() {
        if (this.pomodoroConfig.currentPhase === 'work') {
            // Sessione di lavoro completata
            this.pomodoroConfig.cycles++;
            this.addXP(20);
            this.addPoints(10);
            this.gamificationData.achievements.pomodoroSessions++;
            this.updateDailyGoal('pomodoro_sessions', 1);
            
            // Determina la prossima fase
            if (this.pomodoroConfig.cycles >= this.pomodoroConfig.maxCycles) {
                this.pomodoroConfig.currentPhase = 'longBreak';
                this.showNotification('Pausa lunga!', 'Hai completato un ciclo completo. Prenditi una pausa lunga.');
                // Bonus per ciclo completo
                this.addXP(50);
                this.addPoints(25);
            } else {
                this.pomodoroConfig.currentPhase = 'shortBreak';
                this.showNotification('Pausa breve!', 'Sessione completata. Prenditi una pausa breve.');
            }
        } else {
            // Pausa completata
            this.pomodoroConfig.currentPhase = 'work';
            if (this.pomodoroConfig.cycles >= this.pomodoroConfig.maxCycles) {
                this.pomodoroConfig.cycles = 0; // Reset cicli
            }
            this.showNotification('Torna al lavoro!', 'Pausa terminata. È ora di riprendere a studiare.');
        }
        
        this.updatePomodoroInfo();
        this.checkForBadges();
        this.saveGamificationData();
    }

    getCurrentPomodoroTime() {
        switch (this.pomodoroConfig.currentPhase) {
            case 'work':
                return this.pomodoroConfig.workTime;
            case 'shortBreak':
                return this.pomodoroConfig.shortBreak;
            case 'longBreak':
                return this.pomodoroConfig.longBreak;
            default:
                return this.pomodoroConfig.workTime;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = display;
        
        // Aggiorna classe per animazione
        const timerCircle = document.querySelector('.timer-circle');
        if (timerCircle) {
            if (this.isTimerRunning) {
                timerCircle.classList.add('running');
            } else {
                timerCircle.classList.remove('running');
            }
        }
    }

    updatePomodoroInfo() {
        const phaseElement = document.getElementById('pomodoro-phase');
        const cycleElement = document.getElementById('pomodoro-cycle');
        const plantIcon = document.querySelector('.focus-plant');
        
        if (this.pomodoroMode) {
            let phaseText = '';
            let plantEmoji = '🌱';
            
            switch (this.pomodoroConfig.currentPhase) {
                case 'work':
                    phaseText = 'Lavoro';
                    plantEmoji = '🌿';
                    break;
                case 'shortBreak':
                    phaseText = 'Pausa Breve';
                    plantEmoji = '🌸';
                    break;
                case 'longBreak':
                    phaseText = 'Pausa Lunga';
                    plantEmoji = '🌳';
                    break;
            }
            
            phaseElement.textContent = phaseText;
            cycleElement.textContent = `${this.pomodoroConfig.cycles}/${this.pomodoroConfig.maxCycles}`;
            
            if (plantIcon) {
                plantIcon.textContent = plantEmoji;
            }
        } else {
            phaseElement.textContent = 'Timer Normale';
            cycleElement.textContent = '0/0';
            
            if (plantIcon) {
                plantIcon.textContent = '🌱';
            }
        }
    }

    // === METODI SESSIONI DI STUDIO ===

    async saveStudySession(session) {
        // Se il timer era in corso, usa il tempo del timer
        if (this.isTimerRunning || this.timerSeconds > 0) {
            const originalTime = this.pomodoroMode ? this.getCurrentPomodoroTime() : 25 * 60;
            session.duration = Math.round((originalTime - this.timerSeconds) / 60);
        }
        
        await this.model.addStudySession(session);
        
        // Aggiorna statistiche gamification
        this.gamificationData.achievements.totalStudySessions++;
        this.gamificationData.achievements.totalStudyTime += session.duration * 60;
        
        // Aggiungi punti e XP
        this.addXP(session.duration * 2); // 2 XP per minuto
        this.addPoints(session.duration); // 1 punto per minuto
        
        // Aggiorna obiettivi giornalieri
        this.updateDailyGoal('study_sessions', 1);
        this.updateDailyGoal('study_time', session.duration * 60);
        this.updateDailyGoal('focus_time', session.duration * 60);
        
        this.checkForBadges();
        this.updateStreak();
        this.saveGamificationData();
        
        this.showNotification('Sessione salvata!', `Sessione di ${session.duration} minuti registrata.`);
    }

    // === METODI GAMIFICATION ===

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

    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    getXPForNextLevel(currentLevel) {
        return Math.pow(currentLevel, 2) * 100;
    }

    addXP(amount) {
        const oldLevel = this.gamificationData.level;
        this.gamificationData.xp += amount;
        this.gamificationData.level = this.calculateLevel(this.gamificationData.xp);
        
        if (this.gamificationData.level > oldLevel) {
            this.showLevelUpNotification(this.gamificationData.level);
            this.checkForBadges();
        }
        
        this.saveGamificationData();
        this.updateGamificationUI();
    }

    addPoints(amount) {
        this.gamificationData.totalPoints += amount;
        this.saveGamificationData();
        this.updateGamificationUI();
    }

    updateGamificationUI() {
        // Aggiorna livello
        const levelElement = document.querySelector('.user-level');
        if (levelElement) {
            levelElement.textContent = `Livello ${this.gamificationData.level}`;
        }
        
        // Aggiorna barra XP
        const xpFill = document.querySelector('.xp-fill');
        const xpText = document.querySelector('.xp-text');
        if (xpFill && xpText) {
            const currentLevelXP = Math.pow(this.gamificationData.level - 1, 2) * 100;
            const nextLevelXP = this.getXPForNextLevel(this.gamificationData.level);
            const progressXP = this.gamificationData.xp - currentLevelXP;
            const neededXP = nextLevelXP - currentLevelXP;
            const percentage = (progressXP / neededXP) * 100;
            
            xpFill.style.width = `${Math.min(percentage, 100)}%`;
            xpText.textContent = `${progressXP}/${neededXP} XP`;
        }
        
        // Aggiorna punti totali
        const pointsElement = document.querySelector('.total-points');
        if (pointsElement) {
            pointsElement.textContent = `${this.gamificationData.totalPoints} punti`;
        }
        
        this.updateRecentBadges();
        this.updateDailyGoalsUI();
    }

    updateRecentBadges() {
        const badgesContainer = document.querySelector('.recent-badges');
        if (!badgesContainer) return;
        
        badgesContainer.innerHTML = '';
        
        const recentBadges = this.gamificationData.badges.slice(-3).reverse();
        
        if (recentBadges.length === 0) {
            badgesContainer.innerHTML = '<span class="no-badges">Nessun badge ancora</span>';
            return;
        }
        
        recentBadges.forEach(badgeId => {
            const badge = this.badgeDefinitions[badgeId];
            if (badge) {
                const badgeElement = document.createElement('div');
                badgeElement.className = 'badge-item';
                badgeElement.innerHTML = `
                    <span class="badge-icon">${badge.icon}</span>
                    <span class="badge-name">${badge.name}</span>
                `;
                badgeElement.title = badge.description;
                badgesContainer.appendChild(badgeElement);
            }
        });
    }

    checkForBadges() {
        Object.keys(this.badgeDefinitions).forEach(badgeId => {
            if (!this.gamificationData.badges.includes(badgeId)) {
                const badge = this.badgeDefinitions[badgeId];
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

    awardBadge(badgeId) {
        this.gamificationData.badges.push(badgeId);
        this.showBadgeNotification(badgeId);
        this.saveGamificationData();
        this.updateGamificationUI();
    }

    showBadgeNotification(badgeId) {
        const badge = this.badgeDefinitions[badgeId];
        if (badge && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`🏆 Nuovo Badge Ottenuto!`, {
                body: `${badge.icon} ${badge.name}: ${badge.description}`,
                icon: 'images/icon48.png'
            });
        }
    }

    showLevelUpNotification(newLevel) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🎉 Livello Aumentato!`, {
                body: `Congratulazioni! Hai raggiunto il livello ${newLevel}!`,
                icon: 'images/icon48.png'
            });
        }
    }

    initializeDailyGoals() {
        if (this.gamificationData.dailyGoals.length === 0) {
            this.generateDailyGoals();
        }
    }

    generateDailyGoals() {
        const shuffled = [...this.dailyGoalTemplates].sort(() => 0.5 - Math.random());
        this.gamificationData.dailyGoals = shuffled.slice(0, 3).map(template => ({
            ...template,
            progress: 0,
            completed: false
        }));
        this.saveGamificationData();
    }

    resetDailyGoals() {
        const completedGoals = this.gamificationData.dailyGoals.filter(goal => goal.completed).length;
        if (completedGoals > 0) {
            this.gamificationData.achievements.dailyGoalsCompleted += completedGoals;
        }
        
        this.generateDailyGoals();
    }

    updateDailyGoal(type, amount = 1) {
        this.gamificationData.dailyGoals.forEach(goal => {
            if (goal.type === type && !goal.completed) {
                goal.progress += amount;
                if (goal.progress >= goal.target) {
                    goal.progress = goal.target;
                    goal.completed = true;
                    this.addXP(50);
                    this.addPoints(25);
                }
            }
        });
        
        this.saveGamificationData();
        this.updateDailyGoalsUI();
    }

    updateDailyGoalsUI() {
        const goalsContainer = document.querySelector('.daily-goals');
        if (!goalsContainer) return;
        
        goalsContainer.innerHTML = '';
        
        this.gamificationData.dailyGoals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            
            const percentage = Math.min((goal.progress / goal.target) * 100, 100);
            
            goalElement.innerHTML = `
                <div class="goal-info">
                    <span class="goal-icon">${goal.icon}</span>
                    <span class="goal-text">${goal.name}</span>
                    <span class="goal-progress">${goal.progress}/${goal.target}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            
            goalsContainer.appendChild(goalElement);
        });
    }

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

    // === METODI DI UTILITÀ ===

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
    }
}

// Inizializzazione dell'applicazione
document.addEventListener('DOMContentLoaded', function() {
    try {
        const model = new StudyPlanModel();
        const controller = new StudyPlanController(model);
        controller.init();
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
    }
});