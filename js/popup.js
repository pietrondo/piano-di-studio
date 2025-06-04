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
    addCourse(course) {
        course.id = Date.now().toString();
        course.completed = false;
        course.grade = null;
        this.courses.push(course);
        return this.saveData();
    }

    // Rimuove un corso
    removeCourse(courseId) {
        this.courses = this.courses.filter(course => course.id !== courseId);
        // Rimuovi anche gli esami associati
        this.exams = this.exams.filter(exam => exam.courseId !== courseId);
        return this.saveData();
    }

    // Aggiorna un corso
    updateCourse(courseId, updates) {
        const index = this.courses.findIndex(course => course.id === courseId);
        if (index !== -1) {
            this.courses[index] = { ...this.courses[index], ...updates };
            return this.saveData();
        }
        return Promise.resolve();
    }

    // Aggiunge un nuovo esame
    addExam(exam) {
        exam.id = Date.now().toString();
        this.exams.push(exam);
        return this.saveData();
    }

    // Rimuove un esame
    removeExam(examId) {
        this.exams = this.exams.filter(exam => exam.id !== examId);
        return this.saveData();
    }

    // Metodi per le sessioni di studio
    addStudySession(session) {
        session.id = Date.now().toString();
        session.date = new Date().toISOString();
        this.studySessions.push(session);
        this.saveData();
        return session;
    }

    getStudySessions(courseId = null) {
        if (courseId) {
            return this.studySessions.filter(session => session.courseId === courseId);
        }
        return this.studySessions;
    }

    getTotalStudyTime() {
        return this.studySessions.reduce((total, session) => total + (session.duration || 0), 0);
    }

    // Metodi per i materiali di studio
    addStudyMaterial(material) {
        material.id = Date.now().toString();
        material.dateAdded = new Date().toISOString();
        material.currentPage = 0;
        material.completed = false;
        this.studyMaterials.push(material);
        this.saveData();
        return material;
    }

    updateMaterialProgress(materialId, currentPage) {
        const material = this.studyMaterials.find(m => m.id === materialId);
        if (material) {
            material.currentPage = currentPage;
            material.completed = currentPage >= material.totalPages;
            this.saveData();
            return material;
        }
        return null;
    }

    getStudyMaterials(courseId = null) {
        if (courseId) {
            return this.studyMaterials.filter(material => material.courseId === courseId);
        }
        return this.studyMaterials;
    }

    getCompletedMaterialsCount() {
        return this.studyMaterials.filter(material => material.completed).length;
    }

    // Calcola le statistiche
    getStatistics() {
        const totalCourses = this.courses.length;
        const completedCourses = this.courses.filter(course => course.completed).length;
        
        const totalCredits = this.courses.reduce((sum, course) => sum + parseInt(course.credits), 0);
        const completedCredits = this.courses
            .filter(course => course.completed)
            .reduce((sum, course) => sum + parseInt(course.credits), 0);
        
        const gradesWithCredits = this.courses
            .filter(course => course.completed && course.grade !== null)
            .map(course => ({
                grade: parseInt(course.grade),
                credits: parseInt(course.credits)
            }));
        
        let weightedSum = 0;
        let totalWeightedCredits = 0;
        
        gradesWithCredits.forEach(item => {
            weightedSum += item.grade * item.credits;
            totalWeightedCredits += item.credits;
        });
        
        const averageGrade = totalWeightedCredits > 0 ? 
            (weightedSum / totalWeightedCredits).toFixed(2) : 
            null;
        
        const progressPercentage = totalCredits > 0 ? 
            Math.round((completedCredits / totalCredits) * 100) : 
            0;
        
        // Calcolo ore totali di studio
        const totalStudyHours = Math.round(this.getTotalStudyTime() / 60); // Converti minuti in ore
        
        // Conteggio materiali completati
        const completedMaterials = this.getCompletedMaterialsCount();
        
        return {
            totalCourses,
            completedCourses,
            totalCredits,
            completedCredits,
            averageGrade,
            progressPercentage,
            totalStudyHours,
            completedMaterials
        };
    }
}

// Controller dell'interfaccia utente
class StudyPlanController {
    constructor(model) {
        this.model = model;
        this.timerInterval = null;
        this.timerRunning = false;
        this.timerPaused = false;
        this.timerSeconds = 0;
        
        // Configurazione Pomodoro
        this.pomodoroMode = false;
        this.pomodoroConfig = {
            workTime: 25 * 60, // 25 minuti in secondi
            shortBreak: 5 * 60, // 5 minuti in secondi
            longBreak: 15 * 60, // 15 minuti in secondi
            cycles: 0, // Cicli completati
            maxCycles: 4, // Cicli prima di una pausa lunga
            currentPhase: 'work' // 'work', 'shortBreak', 'longBreak'
        };
        
        this.initTabs();
        this.initForms();
        this.initEventListeners();
    }

    // Inizializza la navigazione a tab
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Rimuovi la classe active da tutti i tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Aggiungi la classe active al tab selezionato
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                // Aggiorna il contenuto del tab selezionato
                if (tabId === 'courses-tab') {
                    this.renderCourses();
                } else if (tabId === 'calendar-tab') {
                    this.renderCalendar();
                } else if (tabId === 'study-tab') {
                    this.renderStudySessions();
                } else if (tabId === 'materials-tab') {
                    this.renderStudyMaterials();
                } else if (tabId === 'stats-tab') {
                    this.renderStatistics();
                }
            });
        });
    }

    // Inizializza i form
    initForms() {
        // Form per aggiungere un corso
        const addCourseForm = document.getElementById('add-course-form');
        addCourseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const courseName = document.getElementById('course-name').value;
            const courseCredits = document.getElementById('course-credits').value;
            const courseSemester = document.getElementById('course-semester').value;
            const courseYear = document.getElementById('course-year').value;
            
            await this.model.addCourse({
                name: courseName,
                credits: parseInt(courseCredits),
                semester: courseSemester,
                year: courseYear
            });
            
            addCourseForm.reset();
            this.renderCourses();
            this.updateExamCourseSelect();
        });
        
        // Form per aggiungere un esame
        const addExamForm = document.getElementById('add-exam-form');
        addExamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const courseId = document.getElementById('exam-course').value;
            const examDate = document.getElementById('exam-date').value;
            const examTime = document.getElementById('exam-time').value;
            const examLocation = document.getElementById('exam-location').value;
            const examNotes = document.getElementById('exam-notes').value;
            
            await this.model.addExam({
                courseId,
                date: examDate,
                time: examTime,
                location: examLocation,
                notes: examNotes
            });
            
            addExamForm.reset();
            this.renderCalendar();
        });
    }

    // Inizializza gli event listener
    initEventListeners() {
        // Delegazione degli eventi per i pulsanti dei corsi
        document.getElementById('courses-container').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const courseId = e.target.dataset.courseId;
                await this.model.removeCourse(courseId);
                this.renderCourses();
                this.updateExamCourseSelect();
            } else if (e.target.classList.contains('btn-grade')) {
                const courseId = e.target.dataset.courseId;
                const grade = prompt('Inserisci il voto (18-30):', '');
                
                if (grade !== null) {
                    const gradeNum = parseInt(grade);
                    if (!isNaN(gradeNum) && gradeNum >= 18 && gradeNum <= 30) {
                        await this.model.updateCourse(courseId, {
                            completed: true,
                            grade: gradeNum
                        });
                        this.renderCourses();
                        this.renderStatistics();
                    } else {
                        alert('Inserisci un voto valido tra 18 e 30.');
                    }
                }
            }
        });
        
        // Timer controls
        document.getElementById('start-timer').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-timer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('stop-timer').addEventListener('click', () => this.stopTimer());
        
        // Event listener per il toggle della modalità Pomodoro
        document.getElementById('pomodoro-mode').addEventListener('change', (e) => {
            this.pomodoroMode = e.target.checked;
            const pomodoroInfo = document.getElementById('pomodoro-info');
            
            if (this.pomodoroMode) {
                pomodoroInfo.style.display = 'block';
                this.resetTimer();
                this.updateTimerDisplay(this.pomodoroConfig.workTime);
                this.updatePomodoroInfo();
            } else {
                pomodoroInfo.style.display = 'none';
                this.resetTimer();
                this.updateTimerDisplay(0);
            }
        });

        // Study session form
        document.getElementById('study-session-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStudySession();
        });

        // Material form
        document.getElementById('add-material-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudyMaterial();
        });
    }

    // Renderizza la lista dei corsi
    renderCourses() {
        const coursesContainer = document.getElementById('courses-container');
        coursesContainer.innerHTML = '';
        
        if (this.model.courses.length === 0) {
            coursesContainer.innerHTML = `
                <div class="empty-state">
                    <h4>Nessun corso aggiunto</h4>
                    <p>Aggiungi il tuo primo corso usando il form qui sopra.</p>
                </div>
            `;
            return;
        }
        
        // Ordina i corsi per anno e semestre
        const sortedCourses = [...this.model.courses].sort((a, b) => {
            const yearOrder = { '1': 1, '2': 2, '3': 3, 'magistrale': 4 };
            if (yearOrder[a.year] !== yearOrder[b.year]) {
                return yearOrder[a.year] - yearOrder[b.year];
            }
            return a.semester - b.semester;
        });
        
        sortedCourses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-card';
            courseElement.innerHTML = `
                <div class="course-header">
                    <span class="course-name">${course.name}</span>
                    <span class="course-credits">${course.credits} CFU</span>
                </div>
                <div class="course-info">
                    <span>${course.year ? (course.year === 'magistrale' ? 'Magistrale' : `${course.year}° Anno`) : 'Anno non specificato'}</span>
                    <span>${course.semester ? `${course.semester}° Semestre` : 'Semestre non specificato'}</span>
                    ${course.completed ? `<span>Voto: ${course.grade}</span>` : ''}
                </div>
                <div class="course-actions">
                    ${!course.completed ? `<button class="btn-small btn-grade" data-course-id="${course.id}">Registra Voto</button>` : ''}
                    <button class="btn-small btn-delete" data-course-id="${course.id}">Elimina</button>
                </div>
            `;
            coursesContainer.appendChild(courseElement);
        });
    }

    // Renderizza il calendario degli esami
    renderCalendar() {
        const calendarContainer = document.getElementById('calendar-container');
        calendarContainer.innerHTML = '';
        
        if (this.model.exams.length === 0) {
            calendarContainer.innerHTML = `
                <div class="empty-state">
                    <h4>Nessun esame programmato</h4>
                    <p>Programma il tuo primo esame usando il form qui sotto.</p>
                </div>
            `;
            return;
        }
        
        // Ordina gli esami per data
        const sortedExams = [...this.model.exams].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        
        // Raggruppa gli esami per mese
        const examsByMonth = {};
        sortedExams.forEach(exam => {
            const date = new Date(exam.date);
            const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
            
            if (!examsByMonth[monthYear]) {
                examsByMonth[monthYear] = [];
            }
            
            examsByMonth[monthYear].push(exam);
        });
        
        // Crea il calendario
        for (const monthYear in examsByMonth) {
            const [month, year] = monthYear.split('-');
            const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
            
            const monthElement = document.createElement('div');
            monthElement.className = 'month-section';
            monthElement.innerHTML = `<h4>${monthNames[parseInt(month) - 1]} ${year}</h4>`;
            
            const examsList = document.createElement('div');
            examsList.className = 'exams-list';
            
            examsByMonth[monthYear].forEach(exam => {
                const course = this.model.courses.find(c => c.id === exam.courseId);
                if (!course) return;
                
                const examDate = new Date(exam.date);
                const day = examDate.getDate();
                const examTime = exam.time;
                
                const examElement = document.createElement('div');
                examElement.className = 'exam-item';
                examElement.innerHTML = `
                    <div class="exam-date">
                        <span class="exam-day">${day}</span>
                        <span class="exam-time">${examTime}</span>
                    </div>
                    <div class="exam-details">
                        <h5>${course.name}</h5>
                        <p>${exam.location || ''}</p>
                        ${exam.notes ? `<p class="exam-notes"><strong>Note:</strong> ${exam.notes}</p>` : ''}
                    </div>
                `;
                
                examsList.appendChild(examElement);
            });
            
            monthElement.appendChild(examsList);
            calendarContainer.appendChild(monthElement);
        }
    }

    // Aggiorna il select dei corsi nel form degli esami
    updateExamCourseSelect() {
        const examCourseSelect = document.getElementById('exam-course');
        examCourseSelect.innerHTML = '<option value="">Seleziona corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            examCourseSelect.appendChild(option);
        });
    }
    
    populateStudyCoursesDropdown() {
        const dropdown = document.getElementById('study-course');
        dropdown.innerHTML = '<option value="">Seleziona corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            dropdown.appendChild(option);
        });
    }

    populateMaterialCoursesDropdown() {
        const dropdown = document.getElementById('material-course');
        dropdown.innerHTML = '<option value="">Seleziona corso</option>';
        
        this.model.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            dropdown.appendChild(option);
        });
    }

    // Renderizza le statistiche
    renderStatistics() {
        const stats = this.model.getStatistics();
        
        document.getElementById('total-credits').textContent = stats.totalCredits;
        document.getElementById('completed-courses').textContent = `${stats.completedCourses}/${stats.totalCourses}`;
        document.getElementById('average-grade').textContent = stats.averageGrade || '-';
        document.getElementById('total-study-hours').textContent = `${stats.totalStudyHours}h`;
        document.getElementById('completed-materials').textContent = stats.completedMaterials;
        
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = `${stats.progressPercentage}%`;
        
        document.getElementById('progress-text').textContent = `${stats.progressPercentage}%`;
    }

    // Inizializza l'applicazione
    async init() {
        await this.model.loadData();
        this.renderCourses();
        this.renderStudySessions();
        this.renderStudyMaterials();
        this.updateExamCourseSelect();
        this.populateStudyCoursesDropdown();
        this.populateMaterialCoursesDropdown();
        this.renderStatistics();
    }
    
    // Timer di studio
    startTimer() {
        if (this.timerPaused) {
            this.timerPaused = false;
        } else {
            if (this.pomodoroMode) {
                // In modalità pomodoro, iniziamo con il tempo di lavoro configurato
                this.timerSeconds = this.pomodoroConfig.workTime;
                this.pomodoroConfig.currentPhase = 'work';
            } else {
                this.timerSeconds = 0;
            }
        }
        
        this.timerRunning = true;
        document.getElementById('start-timer').disabled = true;
        document.getElementById('pause-timer').disabled = false;
        document.getElementById('stop-timer').disabled = false;
        
        // Nascondi il form di salvataggio della sessione
        document.getElementById('study-session-form').style.display = 'none';
        
        // Aggiungiamo la classe per lo stile del timer in esecuzione
        document.querySelector('.timer-circle').classList.add('timer-running');
        
        this.timerInterval = setInterval(() => {
            if (this.pomodoroMode) {
                // In modalità pomodoro, il timer va al contrario
                this.timerSeconds--;
                
                // Controlliamo se è finito il tempo della fase corrente
                if (this.timerSeconds <= 0) {
                    this.handlePomodoroPhaseEnd();
                }
            } else {
                // In modalità normale, il timer va in avanti
                this.timerSeconds++;
            }
            
            this.updateTimerDisplay();
        }, 1000);
    }
    
    pauseTimer() {
        if (this.timerRunning) {
            clearInterval(this.timerInterval);
            this.timerRunning = false;
            this.timerPaused = true;
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
            
            // Rimuoviamo la classe per lo stile del timer in esecuzione
            document.querySelector('.timer-circle').classList.remove('timer-running');
        }
    }
    
    stopTimer() {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        this.timerPaused = false;
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
        document.getElementById('stop-timer').disabled = true;
        
        // Rimuoviamo la classe per lo stile del timer in esecuzione
        document.querySelector('.timer-circle').classList.remove('timer-running');
        
        // Mostra il form per salvare la sessione di studio se il timer ha registrato del tempo
        // e non siamo in modalità pomodoro o siamo in fase di lavoro
        if (!this.pomodoroMode && this.timerSeconds > 0 || 
            (this.pomodoroMode && this.pomodoroConfig.currentPhase === 'work')) {
            document.getElementById('study-session-form').style.display = 'block';
        }
        
        // Resettiamo il timer se siamo in modalità pomodoro
        if (this.pomodoroMode) {
            this.resetTimer();
        }
    }
    
    updateTimerDisplay(seconds = null) {
        const timeToDisplay = seconds !== null ? seconds : this.timerSeconds;
        const hours = Math.floor(timeToDisplay / 3600);
        const minutes = Math.floor((timeToDisplay % 3600) / 60);
        const secs = timeToDisplay % 60;
        
        const display = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
        
        document.getElementById('timer-display').textContent = display;
        
        // Aggiorniamo il titolo del timer in modalità pomodoro
        if (this.pomodoroMode) {
            const timerTitle = document.querySelector('.study-timer-section h4');
            let phaseText = '';
            
            switch(this.pomodoroConfig.currentPhase) {
                case 'work':
                    phaseText = 'Concentrazione';
                    break;
                case 'shortBreak':
                    phaseText = 'Pausa Breve';
                    break;
                case 'longBreak':
                    phaseText = 'Pausa Lunga';
                    break;
            }
            
            timerTitle.textContent = `Timer Pomodoro - ${phaseText} (${this.pomodoroConfig.cycles + 1}/${this.pomodoroConfig.maxCycles})`;
        } else {
            document.querySelector('.study-timer-section h4').textContent = 'Timer di Studio';
        }
    }
    
    saveStudySession() {
        if ((!this.timerRunning && this.timerSeconds === 0) && 
            (!this.pomodoroMode || this.pomodoroConfig.currentPhase !== 'work')) {
            alert('Avvia il timer prima di salvare una sessione di studio!');
            return;
        }
        
        const courseId = document.getElementById('study-course').value;
        const topic = document.getElementById('study-topic').value;
        const notes = document.getElementById('study-notes').value;
        
        if (!courseId || !topic) {
            alert('Seleziona un corso e inserisci l\'argomento studiato!');
            return;
        }
        
        const course = this.model.courses.find(c => c.id === courseId);
        
        const session = {
            courseId,
            courseName: course.name,
            topic,
            notes,
            // In modalità pomodoro, salviamo il tempo di lavoro effettivo
            duration: this.pomodoroMode ? 
                Math.floor((this.pomodoroConfig.workTime - this.timerSeconds) / 60) : 
                Math.floor(this.timerSeconds / 60) // Durata in minuti
        };
        
        this.model.addStudySession(session);
        this.stopTimer();
        this.timerSeconds = 0;
        this.updateTimerDisplay();
        
        // Reset form
        document.getElementById('study-topic').value = '';
        document.getElementById('study-notes').value = '';
        document.getElementById('study-session-form').style.display = 'none';
        
        this.renderStudySessions();
        this.renderStatistics();
    }
    
    renderStudySessions() {
        const container = document.getElementById('study-sessions-container');
        container.innerHTML = '';
        
        const sessions = this.model.getStudySessions().sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        if (sessions.length === 0) {
            container.innerHTML = '<p>Nessuna sessione di studio registrata.</p>';
            return;
        }
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const formattedDate = sessionDate.toLocaleDateString('it-IT') + ' ' + 
                                sessionDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            
            const hours = Math.floor(session.duration / 60);
            const minutes = session.duration % 60;
            const durationText = hours > 0 ? 
                `${hours}h ${minutes}m` : 
                `${minutes}m`;
            
            const sessionCard = document.createElement('div');
            sessionCard.className = 'study-session-card';
            sessionCard.innerHTML = `
                <h4>
                    <span>${session.courseName} - ${session.topic}</span>
                    <span class="session-duration">${durationText}</span>
                </h4>
                <div class="session-date">${formattedDate}</div>
                ${session.notes ? `<p>${session.notes}</p>` : ''}
            `;
            
            container.appendChild(sessionCard);
        });
    }
    
    addStudyMaterial() {
        const courseId = document.getElementById('material-course').value;
        const title = document.getElementById('material-title').value;
        const type = document.getElementById('material-type').value;
        const url = document.getElementById('material-url').value;
        const totalPages = parseInt(document.getElementById('material-pages').value) || 0;
        const notes = document.getElementById('material-notes').value;
        
        if (!courseId || !title || totalPages <= 0) {
            alert('Compila tutti i campi obbligatori!');
            return;
        }
        
        const course = this.model.courses.find(c => c.id === courseId);
        
        const material = {
            courseId,
            courseName: course.name,
            title,
            type,
            url,
            totalPages,
            notes
        };
        
        this.model.addStudyMaterial(material);
        
        // Reset form
        document.getElementById('material-title').value = '';
        document.getElementById('material-url').value = '';
        document.getElementById('material-pages').value = '';
        document.getElementById('material-notes').value = '';
        
        this.renderStudyMaterials();
        this.renderStatistics();
    }
    
    renderStudyMaterials() {
        const container = document.getElementById('materials-container');
        container.innerHTML = '';
        
        const materials = this.model.getStudyMaterials().sort((a, b) => {
            return new Date(b.dateAdded) - new Date(a.dateAdded);
        });
        
        if (materials.length === 0) {
            container.innerHTML = '<p>Nessun materiale di studio aggiunto.</p>';
            return;
        }
        
        materials.forEach(material => {
            const progressPercentage = material.totalPages > 0 ? 
                Math.round((material.currentPage / material.totalPages) * 100) : 0;
            
            const materialCard = document.createElement('div');
            materialCard.className = 'material-card';
            materialCard.innerHTML = `
                <h4>${material.title}</h4>
                <div class="material-meta">
                    <span>${material.courseName}</span>
                    <span class="material-type ${material.type}">${material.type}</span>
                </div>
                <div class="material-progress">
                    <span>${material.currentPage}/${material.totalPages} pagine (${progressPercentage}%)</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                ${material.notes ? `<p>${material.notes}</p>` : ''}
                <div class="material-actions">
                    <button class="update-progress" data-id="${material.id}">Aggiorna Progresso</button>
                    ${material.url ? `<button class="view-material" data-url="${material.url}">Visualizza</button>` : ''}
                </div>
            `;
            
            container.appendChild(materialCard);
            
            // Aggiungi event listener per il pulsante di aggiornamento progresso
            const updateBtn = materialCard.querySelector('.update-progress');
            updateBtn.addEventListener('click', () => {
                this.updateMaterialProgress(material);
            });
            
            // Aggiungi event listener per il pulsante di visualizzazione
            const viewBtn = materialCard.querySelector('.view-material');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    chrome.tabs.create({ url: material.url });
                });
            }
        });
    }
    
    updateMaterialProgress(material) {
        const newPage = prompt(`Aggiorna progresso per "${material.title}"
Pagina attuale: ${material.currentPage}/${material.totalPages}
Nuova pagina:`, material.currentPage);
        
        if (newPage === null) return; // L'utente ha annullato
        
        const pageNum = parseInt(newPage);
        if (isNaN(pageNum) || pageNum < 0 || pageNum > material.totalPages) {
            alert(`Inserisci un numero valido tra 0 e ${material.totalPages}`);
            return;
        }
        
        this.model.updateMaterialProgress(material.id, pageNum);
        this.renderStudyMaterials();
        this.renderStatistics();
    }
    
    // Gestisce la fine di una fase Pomodoro
    handlePomodoroPhaseEnd() {
        // Suono di notifica (opzionale)
        // new Audio('notification.mp3').play();
        
        let nextPhase;
        let nextDuration;
        
        switch(this.pomodoroConfig.currentPhase) {
            case 'work':
                this.pomodoroConfig.cycles++;
                if (this.pomodoroConfig.cycles % this.pomodoroConfig.maxCycles === 0) {
                    nextPhase = 'longBreak';
                    nextDuration = this.pomodoroConfig.longBreakTime;
                } else {
                    nextPhase = 'shortBreak';
                    nextDuration = this.pomodoroConfig.shortBreakTime;
                }
                break;
            case 'shortBreak':
            case 'longBreak':
                nextPhase = 'work';
                nextDuration = this.pomodoroConfig.workTime;
                break;
        }
        
        this.pomodoroConfig.currentPhase = nextPhase;
        this.timerSeconds = nextDuration;
        
        // Aggiorna l'interfaccia
        this.updatePomodoroInfo();
        
        // Mostra notifica
        const phaseNames = {
            'work': 'Concentrazione',
            'shortBreak': 'Pausa Breve',
            'longBreak': 'Pausa Lunga'
        };
        
        alert(`Fase completata! Inizia: ${phaseNames[nextPhase]}`);
    }
    
    // Aggiorna le informazioni del Pomodoro nell'interfaccia
    updatePomodoroInfo() {
        if (!this.pomodoroMode) return;
        
        const currentPhaseElement = document.getElementById('current-phase');
        const cycleCounterElement = document.getElementById('cycle-counter');
        
        const phaseNames = {
            'work': 'Concentrazione',
            'shortBreak': 'Pausa Breve',
            'longBreak': 'Pausa Lunga'
        };
        
        currentPhaseElement.textContent = phaseNames[this.pomodoroConfig.currentPhase];
        cycleCounterElement.textContent = `Ciclo ${this.pomodoroConfig.cycles + 1}/${this.pomodoroConfig.maxCycles}`;
    }
    
    // Resetta il timer
    resetTimer() {
        this.timerSeconds = this.pomodoroMode ? this.pomodoroConfig.workTime : 0;
        this.pomodoroConfig.currentPhase = 'work';
        this.pomodoroConfig.cycles = 0;
        this.updateTimerDisplay();
        this.updatePomodoroInfo();
    }
}

// Inizializzazione dell'applicazione
// Importa il sistema di debug
const debugSystem = window.DebugSystem || null;

document.addEventListener('DOMContentLoaded', function() {
    // Inizializza il sistema di debug se disponibile
    if (debugSystem) {
        debugSystem.log('Inizializzazione applicazione');
    }
    
    try {
        const model = new StudyPlanModel();
        const controller = new StudyPlanController(model);
        controller.init();
        
        if (debugSystem) {
            debugSystem.log('Applicazione inizializzata con successo');
        }
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
        if (debugSystem) {
            debugSystem.error('Errore durante l\'inizializzazione', error);
        }
    }
});