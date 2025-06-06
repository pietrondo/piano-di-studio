/**
 * Piano di Studi Universitari - Form Manager
 * Gestisce l'inizializzazione e la gestione degli eventi dei form
 */

class FormManager {
    constructor(model, uiManager, gamificationSystem = null, pomodoroSystem = null) {
        this.model = model;
        this.uiManager = uiManager;
        this.gamificationSystem = gamificationSystem;
        this.pomodoroSystem = pomodoroSystem;
    }

    // === INIZIALIZZAZIONE FORM ===

    initForms() {
        this.initCourseForm();
        this.initExamForm();
        this.initStudySessionForm();
        this.initStudyMaterialForm();
        this.initImportExportForms();
    }

    // === FORM CORSI ===

    initCourseForm() {
        const form = document.getElementById('course-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCourseSubmit(form);
        });
    }

    handleCourseSubmit(form) {
        const formData = new FormData(form);
        const courseData = {
            name: formData.get('course-name').trim(),
            credits: parseInt(formData.get('course-credits')),
            semester: formData.get('course-semester'),
            year: parseInt(formData.get('course-year'))
        };

        // Validazione
        if (!courseData.name) {
            this.showFormError('Il nome del corso è obbligatorio');
            return;
        }

        if (!courseData.credits || courseData.credits <= 0) {
            this.showFormError('I crediti devono essere un numero positivo');
            return;
        }

        if (!courseData.year || courseData.year <= 0) {
            this.showFormError('L\'anno deve essere un numero positivo');
            return;
        }

        // Controlla duplicati
        const existingCourse = this.model.courses.find(c => 
            c.name.toLowerCase() === courseData.name.toLowerCase()
        );
        
        if (existingCourse) {
            this.showFormError('Esiste già un corso con questo nome');
            return;
        }

        // Aggiungi corso
        this.model.addCourse(courseData);
        
        // Aggiorna UI
        this.uiManager.refreshAll();
        
        // Reset form
        form.reset();
        
        // Notifica successo
        this.uiManager.showNotification('Successo', 'Corso aggiunto con successo!', 'success');
        
        // Aggiorna gamification
        if (this.gamificationSystem) {
            this.gamificationSystem.updateAchievements(this.model);
        }
    }

    // === FORM ESAMI ===

    initExamForm() {
        const form = document.getElementById('exam-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleExamSubmit(form);
        });
    }

    handleExamSubmit(form) {
        const formData = new FormData(form);
        const examData = {
            courseId: formData.get('exam-course'),
            date: formData.get('exam-date'),
            time: formData.get('exam-time') || null,
            location: formData.get('exam-location').trim() || null,
            notes: formData.get('exam-notes').trim() || null
        };

        // Validazione
        if (!examData.courseId) {
            this.showFormError('Seleziona un corso per l\'esame');
            return;
        }

        if (!examData.date) {
            this.showFormError('La data dell\'esame è obbligatoria');
            return;
        }

        // Controlla che la data non sia nel passato
        const examDate = new Date(examData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (examDate < today) {
            this.showFormError('La data dell\'esame non può essere nel passato');
            return;
        }

        // Controlla duplicati
        const existingExam = this.model.exams.find(e => 
            e.courseId === examData.courseId && e.date === examData.date
        );
        
        if (existingExam) {
            this.showFormError('Esiste già un esame per questo corso in questa data');
            return;
        }

        // Aggiungi esame
        this.model.addExam(examData);
        
        // Aggiorna UI
        this.uiManager.refreshAll();
        
        // Reset form
        form.reset();
        
        // Notifica successo
        this.uiManager.showNotification('Successo', 'Esame aggiunto con successo!', 'success');
    }

    // === FORM SESSIONI DI STUDIO ===

    initStudySessionForm() {
        const form = document.getElementById('study-session-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStudySessionSubmit(form);
        });
    }

    handleStudySessionSubmit(form) {
        const formData = new FormData(form);
        const sessionData = {
            courseId: formData.get('session-course'),
            duration: parseInt(formData.get('session-duration')),
            date: formData.get('session-date') || new Date().toISOString().split('T')[0],
            notes: formData.get('session-notes').trim() || null
        };

        // Validazione
        if (!sessionData.courseId) {
            this.showFormError('Seleziona un corso per la sessione di studio');
            return;
        }

        if (!sessionData.duration || sessionData.duration <= 0) {
            this.showFormError('La durata deve essere un numero positivo (in minuti)');
            return;
        }

        if (sessionData.duration > 600) { // Max 10 ore
            this.showFormError('La durata massima è di 600 minuti (10 ore)');
            return;
        }

        // Aggiungi sessione
        this.model.addStudySession(sessionData);
        
        // Aggiorna UI
        this.uiManager.refreshAll();
        
        // Reset form
        form.reset();
        
        // Notifica successo
        this.uiManager.showNotification('Successo', 'Sessione di studio registrata!', 'success');
        
        // Aggiorna gamification
        if (this.gamificationSystem) {
            // Calcola XP e punti basati sulla durata
            const xpGained = Math.floor(sessionData.duration / 5); // 1 XP ogni 5 minuti
            const pointsGained = Math.floor(sessionData.duration / 2); // 1 punto ogni 2 minuti
            
            this.gamificationSystem.addXP(xpGained);
            this.gamificationSystem.addPoints(pointsGained);
            
            // Aggiorna obiettivi giornalieri
            this.gamificationSystem.updateDailyGoal('study_time', sessionData.duration);
            this.gamificationSystem.updateDailyGoal('study_sessions', 1);
            
            // Controlla badge
            this.gamificationSystem.checkForBadges(this.model);
            
            // Aggiorna UI gamification
            this.uiManager.updateGamificationUI();
        }
    }

    // === FORM MATERIALI DI STUDIO ===

    initStudyMaterialForm() {
        const form = document.getElementById('study-material-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStudyMaterialSubmit(form);
        });
    }

    handleStudyMaterialSubmit(form) {
        const formData = new FormData(form);
        const materialData = {
            courseId: formData.get('material-course'),
            title: formData.get('material-title').trim(),
            type: formData.get('material-type'),
            url: formData.get('material-url').trim() || null,
            notes: formData.get('material-notes').trim() || null
        };

        // Validazione
        if (!materialData.courseId) {
            this.showFormError('Seleziona un corso per il materiale');
            return;
        }

        if (!materialData.title) {
            this.showFormError('Il titolo del materiale è obbligatorio');
            return;
        }

        if (!materialData.type) {
            this.showFormError('Seleziona il tipo di materiale');
            return;
        }

        // Validazione URL se presente
        if (materialData.url && !this.isValidUrl(materialData.url)) {
            this.showFormError('L\'URL inserito non è valido');
            return;
        }

        // Controlla duplicati
        const existingMaterial = this.model.studyMaterials.find(m => 
            m.courseId === materialData.courseId && 
            m.title.toLowerCase() === materialData.title.toLowerCase()
        );
        
        if (existingMaterial) {
            this.showFormError('Esiste già un materiale con questo titolo per questo corso');
            return;
        }

        // Aggiungi materiale
        this.model.addStudyMaterial(materialData);
        
        // Aggiorna UI
        this.uiManager.refreshAll();
        
        // Reset form
        form.reset();
        
        // Notifica successo
        this.uiManager.showNotification('Successo', 'Materiale aggiunto con successo!', 'success');
        
        // Aggiorna gamification
        if (this.gamificationSystem) {
            this.gamificationSystem.updateAchievements(this.model);
        }
    }

    // === FORM IMPORT/EXPORT ===

    initImportExportForms() {
        this.initExportForm();
        this.initImportForm();
    }

    initExportForm() {
        const exportBtn = document.getElementById('export-data');
        if (!exportBtn) return;

        exportBtn.addEventListener('click', () => {
            this.handleDataExport();
        });
    }

    handleDataExport() {
        try {
            const data = this.model.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `piano-studi-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.uiManager.showNotification('Successo', 'Dati esportati con successo!', 'success');
        } catch (error) {
            console.error('Errore durante l\'esportazione:', error);
            this.uiManager.showNotification('Errore', 'Errore durante l\'esportazione dei dati', 'error');
        }
    }

    initImportForm() {
        const importInput = document.getElementById('import-file');
        const importBtn = document.getElementById('import-data');
        
        if (!importInput || !importBtn) return;

        importBtn.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleDataImport(file);
            }
        });
    }

    handleDataImport(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Conferma prima dell'importazione
                if (confirm('L\'importazione sovrascriverà tutti i dati esistenti. Continuare?')) {
                    this.model.importData(data);
                    this.uiManager.refreshAll();
                    this.uiManager.showNotification('Successo', 'Dati importati con successo!', 'success');
                }
            } catch (error) {
                console.error('Errore durante l\'importazione:', error);
                this.uiManager.showNotification('Errore', 'File non valido o corrotto', 'error');
            }
        };
        
        reader.onerror = () => {
            this.uiManager.showNotification('Errore', 'Errore nella lettura del file', 'error');
        };
        
        reader.readAsText(file);
    }

    // === UTILITÀ ===

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showFormError(message) {
        this.uiManager.showNotification('Errore', message, 'error');
    }

    // === SETTERS ===

    setGamificationSystem(gamificationSystem) {
        this.gamificationSystem = gamificationSystem;
    }

    setPomodoroSystem(pomodoroSystem) {
        this.pomodoroSystem = pomodoroSystem;
    }

    setModel(model) {
        this.model = model;
    }

    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }
}

// Esporta la classe per l'uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormManager;
} else {
    window.FormManager = FormManager;
}