/**
 * Piano di Studi Universitari - Background Script
 * Gestisce le operazioni in background dell'estensione
 */

// Inizializzazione dell'estensione
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        // Inizializza lo storage con valori predefiniti
        chrome.storage.sync.set({
            courses: [],
            exams: [],
            lastBackup: null,
            studySessions: [],
            studyMaterials: [],
            statistics: {
                totalCourses: 0,
                completedCourses: 0,
                totalCredits: 0,
                earnedCredits: 0,
                averageGrade: 0,
                totalStudyHours: 0,
                completedMaterials: 0,
                totalMaterials: 0
            }
        });
        
        // Mostra una notifica di benvenuto
        chrome.action.setBadgeText({ text: 'NEW' });
        chrome.action.setBadgeBackgroundColor({ color: '#4facfe' });
        
        // Rimuovi il badge dopo 5 secondi
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
        }, 5000);
    }
});

// Gestione dei messaggi
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getUpcomingExams') {
        getUpcomingExams().then(sendResponse);
        return true; // Indica che la risposta sarà asincrona
    } else if (message.action === 'exportData') {
        exportData().then(sendResponse);
        return true;
    } else if (message.action === 'importData') {
        importData(message.data).then(sendResponse);
        return true;
    } else if (message.action === 'checkUnimiPortal') {
        // Controlla se la tab corrente è su un portale UniMi
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'checkForUnimi'}, (response) => {
                    if (response && response.isUnimi) {
                        sendResponse({isUnimi: true});
                    } else {
                        sendResponse({isUnimi: false});
                    }
                });
            } else {
                sendResponse({isUnimi: false});
            }
        });
        return true; // Indica che la risposta sarà asincrona
    } else if (message.action === 'saveStudySession') {
        saveStudySession(message.session);
    } else if (message.action === 'saveMaterial') {
        saveMaterial(message.material);
    } else if (message.action === 'updateMaterialProgress') {
        updateMaterialProgress(message.materialId, message.progress);
    }
});

// Ottieni gli esami imminenti (prossimi 7 giorni)
async function getUpcomingExams() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['courses', 'exams'], ({ courses, exams }) => {
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);
            
            const upcomingExams = exams.filter(exam => {
                const examDate = new Date(exam.date);
                return examDate >= now && examDate <= nextWeek;
            }).map(exam => {
                const course = courses.find(c => c.id === exam.courseId);
                return {
                    ...exam,
                    courseName: course ? course.name : 'Corso sconosciuto'
                };
            });
            
            resolve(upcomingExams);
        });
    });
}

// Esporta i dati in formato JSON
async function exportData() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['courses', 'exams', 'statistics', 'studySessions', 'studyMaterials'], (data) => {
            const exportData = {
                courses: data.courses || [],
                exams: data.exams || [],
                statistics: data.statistics || {},
                studySessions: data.studySessions || [],
                studyMaterials: data.studyMaterials || [],
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData);
            const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
            
            resolve({ success: true, dataUri });
        });
    });
}

// Importa i dati da un file JSON
async function importData(jsonData) {
    return new Promise((resolve) => {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.courses || !Array.isArray(data.courses) || 
                !data.exams || !Array.isArray(data.exams)) {
                throw new Error('Formato dati non valido');
            }
            
            chrome.storage.sync.set({
                courses: data.courses,
                exams: data.exams,
                statistics: data.statistics || {},
                studySessions: data.studySessions || [],
                studyMaterials: data.studyMaterials || [],
                lastBackup: new Date().toISOString()
            }, () => {
                resolve({ success: true, message: 'Dati importati con successo' });
            });
        } catch (error) {
            resolve({ success: false, message: `Errore durante l'importazione: ${error.message}` });
        }
    });
}

// Funzione per salvare una sessione di studio
function saveStudySession(session) {
    chrome.storage.sync.get(['studySessions'], (result) => {
        const studySessions = result.studySessions || [];
        
        // Aggiungi la nuova sessione
        studySessions.push({
            ...session,
            id: Date.now() + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString()
        });
        
        // Salva le sessioni aggiornate
        chrome.storage.sync.set({ studySessions }, () => {
            // Aggiorna le statistiche
            updateStatistics();
        });
    });
}

// Funzione per salvare un materiale di studio
function saveMaterial(material) {
    chrome.storage.sync.get(['studyMaterials'], (result) => {
        const studyMaterials = result.studyMaterials || [];
        
        // Aggiungi il nuovo materiale
        studyMaterials.push({
            ...material,
            id: Date.now() + Math.floor(Math.random() * 1000),
            addedDate: new Date().toISOString(),
            progress: material.progress || 0
        });
        
        // Salva i materiali aggiornati
        chrome.storage.sync.set({ studyMaterials }, () => {
            // Aggiorna le statistiche
            updateStatistics();
        });
    });
}

// Funzione per aggiornare il progresso di un materiale
function updateMaterialProgress(materialId, progress) {
    chrome.storage.sync.get(['studyMaterials'], (result) => {
        const studyMaterials = result.studyMaterials || [];
        
        // Trova e aggiorna il materiale
        const updatedMaterials = studyMaterials.map(material => {
            if (material.id === materialId) {
                return { ...material, progress };
            }
            return material;
        });
        
        // Salva i materiali aggiornati
        chrome.storage.sync.set({ studyMaterials: updatedMaterials }, () => {
            // Aggiorna le statistiche
            updateStatistics();
        });
    });
}

// Funzione per il backup automatico dei dati
function backupData() {
    exportData().then((result) => {
        if (result.success) {
            const backupData = {
                key: 'piano_studio_backup',
                data: result.dataUri,
                timestamp: new Date().toISOString()
            };
            
            // Salva il backup in local storage
            chrome.storage.local.set({ 'auto_backup': backupData }, () => {
                console.log('Backup automatico completato:', new Date().toLocaleString());
            });
        }
    });
}

// Funzione per aggiornare le statistiche
function updateStatistics() {
    chrome.storage.sync.get(['courses', 'studySessions', 'studyMaterials'], (result) => {
        const courses = result.courses || [];
        const studySessions = result.studySessions || [];
        const studyMaterials = result.studyMaterials || [];
        
        // Calcola le statistiche dei corsi
        const totalCourses = courses.length;
        const completedCourses = courses.filter(course => course.status === 'completed').length;
        const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);
        const earnedCredits = courses
            .filter(course => course.status === 'completed')
            .reduce((sum, course) => sum + (course.credits || 0), 0);
        
        // Calcola la media dei voti (solo per i corsi completati con un voto)
        const coursesWithGrades = courses.filter(course => 
            course.status === 'completed' && course.grade !== null && !isNaN(course.grade)
        );
        
        const averageGrade = coursesWithGrades.length > 0
            ? coursesWithGrades.reduce((sum, course) => sum + course.grade, 0) / coursesWithGrades.length
            : 0;
        
        // Calcola le statistiche di studio
        const totalStudyHours = studySessions.reduce((sum, session) => {
            const durationMinutes = session.duration || 0;
            return sum + (durationMinutes / 60); // Converti minuti in ore
        }, 0);
        
        // Calcola le statistiche dei materiali
        const totalMaterials = studyMaterials.length;
        const completedMaterials = studyMaterials.filter(material => material.progress === 100).length;
        
        // Aggiorna le statistiche nello storage
        chrome.storage.sync.set({
            statistics: {
                totalCourses,
                completedCourses,
                totalCredits,
                earnedCredits,
                averageGrade,
                totalStudyHours,
                totalMaterials,
                completedMaterials
            }
        });
    });
}

// Funzione per creare un backup automatico dei dati
async function createBackup() {
    const data = await new Promise((resolve) => {
        chrome.storage.sync.get(['courses', 'exams'], resolve);
    });
    
    // Salva il backup in localStorage (potrebbe essere utile in caso di problemi con sync)
    const backup = {
        ...data,
        backupDate: new Date().toISOString()
    };
    
    chrome.storage.local.set({ backup });
}

// Crea un backup ogni giorno
chrome.alarms.create('dailyBackup', {
    periodInMinutes: 24 * 60 // Una volta al giorno
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyBackup') {
        createBackup();
    } else if (alarm.name === 'backupData') {
        backupData();
    }
});

// Imposta un timer per il backup automatico dei dati
chrome.alarms.create('backupData', { periodInMinutes: 24 * 60 }); // Ogni 24 ore