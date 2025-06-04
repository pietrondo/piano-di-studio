/**
 * Piano di Studi Universitari - Background Script
 * Gestisce le operazioni in background dell'estensione
 */

// Importa il sistema di debug se disponibile
let debugSystem = null;

// Inizializza il sistema di debug
function initDebugSystem() {
    try {
        // Verifica se il sistema di debug è disponibile
        chrome.storage.local.get(['debugSystemEnabled'], (result) => {
            const isDebugEnabled = result.debugSystemEnabled === true;
            
            if (isDebugEnabled && typeof DebugSystem !== 'undefined') {
                debugSystem = DebugSystem;
                debugSystem.log('Background script: Sistema di debug inizializzato');
            }
        });
    } catch (error) {
        console.error('Errore durante l\'inizializzazione del sistema di debug:', error);
    }
}

// Inizializzazione dell'estensione
// Inizializza il sistema di debug
initDebugSystem();

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
        }, () => {
            if (debugSystem) {
                debugSystem.log('Estensione installata: storage inizializzato');
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
    if (debugSystem) {
        debugSystem.log('Messaggio ricevuto', { action: message.action, sender: sender.id });
    }
    
    try {
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
            // Controlla se la tab corrente è su un portale universitario
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
        } else if (message.action === 'toggleDebug') {
            // Gestione dell'attivazione/disattivazione del debug
            const isEnabled = message.enabled === true;
            chrome.storage.local.set({ debugSystemEnabled: isEnabled }, () => {
                if (isEnabled) {
                    initDebugSystem();
                    if (debugSystem) {
                        debugSystem.log('Sistema di debug attivato');
                    }
                } else if (debugSystem) {
                    debugSystem.log('Sistema di debug disattivato');
                    debugSystem = null;
                }
                sendResponse({ success: true, debugEnabled: isEnabled });
            });
            return true;
        }
    } catch (error) {
        console.error('Errore nella gestione del messaggio:', error);
        if (debugSystem) {
            debugSystem.error('Errore nella gestione del messaggio', { action: message.action, error });
        }
        sendResponse({ success: false, error: error.message });
        return true;
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
    if (debugSystem) {
        debugSystem.log('Avvio esportazione dati');
    }
    
    return new Promise((resolve) => {
        try {
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
                
                if (debugSystem) {
                    debugSystem.log('Esportazione dati completata', {
                        courses: exportData.courses.length,
                        exams: exportData.exams.length,
                        studySessions: exportData.studySessions.length,
                        studyMaterials: exportData.studyMaterials.length
                    });
                }
                
                resolve({ success: true, dataUri });
            });
        } catch (error) {
            console.error('Errore durante l\'esportazione dei dati:', error);
            if (debugSystem) {
                debugSystem.error('Errore durante l\'esportazione dei dati', error);
            }
            resolve({ success: false, error: error.message });
        }
    });
}

// Importa i dati da un file JSON
async function importData(jsonData) {
    if (debugSystem) {
        debugSystem.log('Avvio importazione dati');
    }
    
    return new Promise((resolve) => {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.courses || !Array.isArray(data.courses) || 
                !data.exams || !Array.isArray(data.exams)) {
                throw new Error('Formato dati non valido');
            }
            
            if (debugSystem) {
                debugSystem.log('Validazione dati completata', {
                    courses: data.courses.length,
                    exams: data.exams.length,
                    studySessions: (data.studySessions || []).length,
                    studyMaterials: (data.studyMaterials || []).length
                });
            }
            
            chrome.storage.sync.set({
                courses: data.courses,
                exams: data.exams,
                statistics: data.statistics || {},
                studySessions: data.studySessions || [],
                studyMaterials: data.studyMaterials || [],
                lastBackup: new Date().toISOString()
            }, () => {
                if (debugSystem) {
                    debugSystem.log('Importazione dati completata con successo');
                }
                resolve({ success: true, message: 'Dati importati con successo' });
            });
        } catch (error) {
            console.error('Errore durante l\'importazione dei dati:', error);
            if (debugSystem) {
                debugSystem.error('Errore durante l\'importazione dei dati', error);
            }
            resolve({ success: false, message: `Errore durante l'importazione: ${error.message}` });
        }
    });
}

// Funzione per salvare una sessione di studio
function saveStudySession(session) {
    if (debugSystem) {
        debugSystem.log('Salvataggio sessione di studio', { courseId: session.courseId, duration: session.duration });
    }
    
    try {
        chrome.storage.sync.get(['studySessions'], (result) => {
            const studySessions = result.studySessions || [];
            
            // Aggiungi la nuova sessione
            const newSession = {
                ...session,
                id: Date.now() + Math.floor(Math.random() * 1000),
                timestamp: new Date().toISOString()
            };
            
            studySessions.push(newSession);
            
            // Salva le sessioni aggiornate
            chrome.storage.sync.set({ studySessions }, () => {
                if (debugSystem) {
                    debugSystem.log('Sessione di studio salvata', { sessionId: newSession.id, totalSessions: studySessions.length });
                }
                // Aggiorna le statistiche
                updateStatistics();
            });
        });
    } catch (error) {
        console.error('Errore durante il salvataggio della sessione di studio:', error);
        if (debugSystem) {
            debugSystem.error('Errore durante il salvataggio della sessione di studio', error);
        }
    }
}

// Funzione per salvare un materiale di studio
function saveMaterial(material) {
    if (debugSystem) {
        debugSystem.log('Salvataggio materiale di studio', { title: material.title, type: material.type });
    }
    
    try {
        chrome.storage.sync.get(['studyMaterials'], (result) => {
            const studyMaterials = result.studyMaterials || [];
            
            // Aggiungi il nuovo materiale
            const newMaterial = {
                ...material,
                id: Date.now() + Math.floor(Math.random() * 1000),
                addedDate: new Date().toISOString(),
                progress: material.progress || 0
            };
            
            studyMaterials.push(newMaterial);
            
            // Salva i materiali aggiornati
            chrome.storage.sync.set({ studyMaterials }, () => {
                if (debugSystem) {
                    debugSystem.log('Materiale di studio salvato', { materialId: newMaterial.id, totalMaterials: studyMaterials.length });
                }
                // Aggiorna le statistiche
                updateStatistics();
            });
        });
    } catch (error) {
        console.error('Errore durante il salvataggio del materiale di studio:', error);
        if (debugSystem) {
            debugSystem.error('Errore durante il salvataggio del materiale di studio', error);
        }
    }
}

// Funzione per aggiornare il progresso di un materiale
function updateMaterialProgress(materialId, progress) {
    if (debugSystem) {
        debugSystem.log('Aggiornamento progresso materiale', { materialId, progress });
    }
    
    try {
        chrome.storage.sync.get(['studyMaterials'], (result) => {
            const studyMaterials = result.studyMaterials || [];
            
            // Trova e aggiorna il materiale
            const updatedMaterials = studyMaterials.map(material => {
                if (material.id === materialId) {
                    return { ...material, progress };
                }
                return material;
            });
            
            // Verifica se il materiale è stato trovato
            const materialFound = updatedMaterials.some(material => material.id === materialId);
            
            if (!materialFound && debugSystem) {
                debugSystem.warn('Materiale non trovato per aggiornamento progresso', { materialId });
                return;
            }
            
            // Salva i materiali aggiornati
            chrome.storage.sync.set({ studyMaterials: updatedMaterials }, () => {
                if (debugSystem) {
                    debugSystem.log('Progresso materiale aggiornato', { materialId, progress });
                }
                // Aggiorna le statistiche
                updateStatistics();
            });
        });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento del progresso del materiale:', error);
        if (debugSystem) {
            debugSystem.error('Errore durante l\'aggiornamento del progresso del materiale', error);
        }
    }
}

// Funzione per il backup automatico dei dati
function backupData() {
    if (debugSystem) {
        debugSystem.log('Avvio backup automatico dei dati');
    }
    
    try {
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
                    if (debugSystem) {
                        debugSystem.log('Backup automatico completato', { timestamp: backupData.timestamp });
                    }
                });
            } else if (debugSystem) {
                debugSystem.warn('Backup automatico fallito', { error: result.error || 'Errore sconosciuto' });
            }
        }).catch(error => {
            console.error('Errore durante il backup automatico:', error);
            if (debugSystem) {
                debugSystem.error('Errore durante il backup automatico', error);
            }
        });
    } catch (error) {
        console.error('Errore durante il backup automatico:', error);
        if (debugSystem) {
            debugSystem.error('Errore durante il backup automatico', error);
        }
    }
}

// Funzione per aggiornare le statistiche
function updateStatistics() {
    if (debugSystem) {
        debugSystem.log('Aggiornamento statistiche');
    }
    
    try {
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
            
            // Crea l'oggetto statistiche
            const statistics = {
                totalCourses,
                completedCourses,
                totalCredits,
                earnedCredits,
                averageGrade,
                totalStudyHours,
                totalMaterials,
                completedMaterials
            };
            
            // Aggiorna le statistiche nello storage
            chrome.storage.sync.set({ statistics }, () => {
                if (debugSystem) {
                    debugSystem.log('Statistiche aggiornate', statistics);
                }
            });
        });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento delle statistiche:', error);
        if (debugSystem) {
            debugSystem.error('Errore durante l\'aggiornamento delle statistiche', error);
        }
    }
}

// Funzione per creare un backup automatico dei dati
async function createBackup() {
    if (debugSystem) {
        debugSystem.log('Creazione backup giornaliero');
    }
    
    try {
        const data = await new Promise((resolve) => {
            chrome.storage.sync.get(['courses', 'exams'], resolve);
        });
        
        // Salva il backup in localStorage (potrebbe essere utile in caso di problemi con sync)
        const backup = {
            ...data,
            backupDate: new Date().toISOString()
        };
        
        chrome.storage.local.set({ backup }, () => {
            if (debugSystem) {
                debugSystem.log('Backup giornaliero completato', {
                    courses: (backup.courses || []).length,
                    exams: (backup.exams || []).length,
                    timestamp: backup.backupDate
                });
            }
        });
    } catch (error) {
        console.error('Errore durante la creazione del backup giornaliero:', error);
        if (debugSystem) {
            debugSystem.error('Errore durante la creazione del backup giornaliero', error);
        }
    }
}

// Imposta un allarme per il backup giornaliero
chrome.alarms.create('dailyBackup', {
    delayInMinutes: 1, // Primo backup dopo 1 minuto
    periodInMinutes: 24 * 60 // Ripeti ogni 24 ore
});

if (debugSystem) {
    debugSystem.log('Allarme backup giornaliero configurato');
}

// Gestisci gli allarmi
chrome.alarms.onAlarm.addListener((alarm) => {
    if (debugSystem) {
        debugSystem.log('Allarme ricevuto', { name: alarm.name });
    }
    
    if (alarm.name === 'dailyBackup') {
        createBackup();
    } else if (alarm.name === 'backupData') {
        backupData();
    }
});

// Imposta un timer per il backup automatico dei dati
chrome.alarms.create('backupData', { periodInMinutes: 24 * 60 }); // Ogni 24 ore