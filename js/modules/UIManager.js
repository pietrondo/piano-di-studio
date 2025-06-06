/**
 * Piano di Studi Universitari - UI Manager
 * Gestisce il rendering e l'aggiornamento dell'interfaccia utente
 */

class UIManager {
    constructor(model, gamificationSystem = null) {
        this.model = model;
        this.gamificationSystem = gamificationSystem;
        this.currentTab = 'courses';
    }

    // === GESTIONE TAB ===

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

    // === RENDERING CORSI ===

    renderCourses() {
        const coursesList = document.getElementById('courses-list');
        if (!coursesList) return;
        
        coursesList.innerHTML = '';
        
        if (this.model.courses.length === 0) {
            coursesList.innerHTML = '<p class="empty-state">Nessun corso aggiunto ancora.</p>';
            return;
        }
        
        this.model.courses.forEach(course => {
            const courseElement = this.createCourseElement(course);
            coursesList.appendChild(courseElement);
        });
    }

    createCourseElement(course) {
        const courseDiv = document.createElement('div');
        courseDiv.className = 'course-item';
        courseDiv.innerHTML = `
            <div class="course-info">
                <h3>${course.name}</h3>
                <p>Crediti: ${course.credits} | Semestre: ${course.semester} | Anno: ${course.year}</p>
            </div>
            <div class="course-actions">
                <button class="btn btn-danger" onclick="controller.removeCourse('${course.id}')">Rimuovi</button>
            </div>
        `;
        return courseDiv;
    }

    // === RENDERING ESAMI ===

    renderExams() {
        const examsList = document.getElementById('exams-list');
        if (!examsList) return;
        
        examsList.innerHTML = '';
        
        if (this.model.exams.length === 0) {
            examsList.innerHTML = '<p class="empty-state">Nessun esame programmato.</p>';
            return;
        }
        
        // Ordina gli esami per data
        const sortedExams = [...this.model.exams].sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return dateA - dateB;
        });
        
        sortedExams.forEach(exam => {
            const examElement = this.createExamElement(exam);
            examsList.appendChild(examElement);
        });
    }

    createExamElement(exam) {
        const course = this.model.getCourse(exam.courseId);
        const courseName = course ? course.name : 'Corso non trovato';
        
        const examDate = new Date(exam.date + 'T' + (exam.time || '00:00'));
        const now = new Date();
        const isUpcoming = examDate > now;
        const daysDiff = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
        
        const examDiv = document.createElement('div');
        examDiv.className = `exam-item ${isUpcoming ? 'upcoming' : 'past'}`;
        examDiv.innerHTML = `
            <div class="exam-info">
                <h3>${courseName}</h3>
                <p class="exam-date">
                    📅 ${this.formatDate(exam.date)} 
                    ${exam.time ? `🕐 ${exam.time}` : ''}
                    ${isUpcoming && daysDiff <= 7 ? `<span class="urgent">(${daysDiff} giorni)</span>` : ''}
                </p>
                ${exam.location ? `<p class="exam-location">📍 ${exam.location}</p>` : ''}
                ${exam.notes ? `<p class="exam-notes">📝 ${exam.notes}</p>` : ''}
            </div>
            <div class="exam-actions">
                <button class="btn btn-danger" onclick="controller.removeExam('${exam.id}')">Rimuovi</button>
            </div>
        `;
        return examDiv;
    }

    // === RENDERING MATERIALI ===

    renderStudyMaterials() {
        const materialsList = document.getElementById('materials-list');
        if (!materialsList) return;
        
        materialsList.innerHTML = '';
        
        if (this.model.studyMaterials.length === 0) {
            materialsList.innerHTML = '<p class="empty-state">Nessun materiale aggiunto ancora.</p>';
            return;
        }
        
        // Raggruppa materiali per corso
        const materialsByCourse = {};
        this.model.studyMaterials.forEach(material => {
            if (!materialsByCourse[material.courseId]) {
                materialsByCourse[material.courseId] = [];
            }
            materialsByCourse[material.courseId].push(material);
        });
        
        Object.keys(materialsByCourse).forEach(courseId => {
            const course = this.model.getCourse(courseId);
            const courseName = course ? course.name : 'Corso non trovato';
            
            const courseSection = document.createElement('div');
            courseSection.className = 'materials-course-section';
            courseSection.innerHTML = `<h3>${courseName}</h3>`;
            
            const materialsContainer = document.createElement('div');
            materialsContainer.className = 'materials-container';
            
            materialsByCourse[courseId].forEach(material => {
                const materialElement = this.createMaterialElement(material);
                materialsContainer.appendChild(materialElement);
            });
            
            courseSection.appendChild(materialsContainer);
            materialsList.appendChild(courseSection);
        });
    }

    createMaterialElement(material) {
        const materialDiv = document.createElement('div');
        materialDiv.className = 'material-item';
        
        const typeIcon = this.getMaterialTypeIcon(material.type);
        
        materialDiv.innerHTML = `
            <div class="material-info">
                <h4>${typeIcon} ${material.title}</h4>
                <p class="material-type">${this.getMaterialTypeName(material.type)}</p>
                ${material.url ? `<a href="${material.url}" target="_blank" class="material-link">🔗 Apri link</a>` : ''}
                ${material.notes ? `<p class="material-notes">${material.notes}</p>` : ''}
            </div>
            <div class="material-actions">
                <button class="btn btn-danger" onclick="controller.removeStudyMaterial('${material.id}')">Rimuovi</button>
            </div>
        `;
        return materialDiv;
    }

    getMaterialTypeIcon(type) {
        const icons = {
            book: '📚',
            pdf: '📄',
            video: '🎥',
            website: '🌐',
            notes: '📝',
            other: '📎'
        };
        return icons[type] || icons.other;
    }

    getMaterialTypeName(type) {
        const names = {
            book: 'Libro',
            pdf: 'PDF',
            video: 'Video',
            website: 'Sito Web',
            notes: 'Appunti',
            other: 'Altro'
        };
        return names[type] || names.other;
    }

    // === AGGIORNAMENTO SELECT ===

    updateExamCourseSelect() {
        const select = document.getElementById('exam-course');
        if (!select) return;
        
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
        if (!select) return;
        
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
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleziona un corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            select.appendChild(option);
        });
    }

    // === GAMIFICATION UI ===

    updateGamificationUI() {
        if (!this.gamificationSystem) return;
        
        const data = this.gamificationSystem.getGamificationData();
        
        this.updateLevelDisplay(data);
        this.updateXPBar(data);
        this.updatePointsDisplay(data);
        this.updateRecentBadges(data);
        this.updateDailyGoalsUI(data);
    }

    updateLevelDisplay(data) {
        const levelElement = document.querySelector('.user-level');
        if (levelElement) {
            levelElement.textContent = data.level;
        }
    }

    updateXPBar(data) {
        const xpBarElement = document.querySelector('.xp-bar-fill');
        const xpTextElement = document.querySelector('.xp-text');
        
        if (!xpBarElement || !xpTextElement) return;
        
        const currentLevelXP = this.gamificationSystem.getXPForCurrentLevel(data.level);
        const nextLevelXP = this.gamificationSystem.getXPForNextLevel(data.level);
        const progressXP = data.xp - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progressPercent = (progressXP / neededXP) * 100;
        
        xpBarElement.style.width = `${Math.min(progressPercent, 100)}%`;
        xpTextElement.textContent = `${progressXP}/${neededXP} XP`;
    }

    updatePointsDisplay(data) {
        const pointsElement = document.querySelector('.total-points');
        if (pointsElement) {
            pointsElement.textContent = data.totalPoints.toLocaleString();
        }
    }

    updateRecentBadges(data) {
        const badgesContainer = document.querySelector('.recent-badges');
        if (!badgesContainer) return;
        
        badgesContainer.innerHTML = '';
        
        const recentBadges = data.badges.slice(-3).reverse();
        const badgeDefinitions = this.gamificationSystem.getBadgeDefinitions();
        
        if (recentBadges.length === 0) {
            badgesContainer.innerHTML = '<span class="no-badges">Nessun badge ancora</span>';
            return;
        }
        
        recentBadges.forEach(badgeId => {
            const badge = badgeDefinitions[badgeId];
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

    updateDailyGoalsUI(data) {
        const goalsContainer = document.querySelector('.daily-goals-list');
        if (!goalsContainer) return;
        
        goalsContainer.innerHTML = '';
        
        data.dailyGoals.forEach(goal => {
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

    // === UTILITÀ ===

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(title, message, type = 'info') {
        // Crea notifica in-app
        const notification = document.createElement('div');
        notification.className = `app-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Aggiungi event listener per chiusura
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Aggiungi al DOM
        document.body.appendChild(notification);

        // Mostra con animazione
        setTimeout(() => notification.classList.add('show'), 100);

        // Rimuovi automaticamente dopo 5 secondi
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // === REFRESH COMPLETO ===

    refreshAll() {
        this.renderCourses();
        this.renderExams();
        this.renderStudyMaterials();
        this.updateExamCourseSelect();
        this.updateStudySessionCourseSelect();
        this.updateMaterialCourseSelect();
        this.updateGamificationUI();
    }

    // === SETTERS ===

    setGamificationSystem(gamificationSystem) {
        this.gamificationSystem = gamificationSystem;
    }

    setModel(model) {
        this.model = model;
    }

    // === GESTIONE TEMI ===

    onThemeChanged(theme) {
        // Aggiorna eventuali elementi UI specifici per il tema
        console.log('UIManager: tema cambiato a', theme);
        
        // Aggiorna le notifiche se presenti
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            // Le notifiche useranno automaticamente le variabili CSS del nuovo tema
            notification.style.transition = 'all 0.3s ease';
        });
        
        // Aggiorna eventuali grafici o elementi dinamici
        this.updateDynamicElements(theme);
    }

    updateDynamicElements(theme) {
        // Aggiorna elementi che potrebbero aver bisogno di refresh per il nuovo tema
        const charts = document.querySelectorAll('.chart, .progress-bar');
        charts.forEach(chart => {
            // Forza il re-render degli elementi grafici
            chart.style.opacity = '0.8';
            setTimeout(() => {
                chart.style.opacity = '1';
            }, 150);
        });
    }

    // === GETTERS ===

    getCurrentTab() {
        return this.currentTab;
    }
}

// Esporta la classe per l'uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}