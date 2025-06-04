/**
 * Esempi di utilizzo del Sistema di Debug
 * Piano di Studi Universitari
 */

// Esempio 1: Logging di base
function exemploLoggingBase() {
    if (debugSystem) {
        debugSystem.log('Applicazione avviata');
        debugSystem.warn('Attenzione: memoria quasi esaurita');
        debugSystem.error('Errore di connessione al database', new Error('Connection failed'));
    }
}

// Esempio 2: Misurazione delle performance
function exemploPerformance() {
    if (debugSystem) {
        // Misura il tempo di esecuzione di una funzione
        debugSystem.tracePerformance('caricamentoDati', () => {
            // Simula caricamento dati
            const data = [];
            for (let i = 0; i < 1000; i++) {
                data.push({ id: i, name: `Item ${i}` });
            }
            return data;
        });
    }
}

// Esempio 3: Logging con contesto
function exemploLoggingContesto() {
    const userId = '12345';
    const courseId = 'MATH101';
    
    if (debugSystem) {
        debugSystem.log('Utente ha aggiunto un corso', {
            userId: userId,
            courseId: courseId,
            timestamp: new Date().toISOString(),
            action: 'ADD_COURSE'
        });
    }
}

// Esempio 4: Gestione errori con debug
async function exemploGestioneErrori() {
    try {
        // Operazione che potrebbe fallire
        const result = await chrome.storage.sync.get(['courses']);
        
        if (debugSystem) {
            debugSystem.log('Dati caricati con successo', {
                coursesCount: (result.courses || []).length
            });
        }
        
        return result;
    } catch (error) {
        if (debugSystem) {
            debugSystem.error('Errore durante il caricamento dei dati', error);
        }
        throw error;
    }
}

// Esempio 5: Debug condizionale
function exemploDebugCondizionale() {
    const isDevelopment = chrome.runtime.getManifest().version.includes('dev');
    
    if (debugSystem && isDevelopment) {
        debugSystem.log('Modalità sviluppo attiva');
        
        // Log dettagliati solo in sviluppo
        debugSystem.log('Stato dell\'applicazione', {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        });
    }
}

// Esempio 6: Monitoraggio dello storage
function exemploMonitoraggioStorage() {
    if (debugSystem) {
        chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
            debugSystem.log('Utilizzo storage', {
                bytes: bytesInUse,
                percentage: (bytesInUse / chrome.storage.sync.QUOTA_BYTES) * 100
            });
            
            if (bytesInUse > chrome.storage.sync.QUOTA_BYTES * 0.8) {
                debugSystem.warn('Storage quasi pieno', {
                    used: bytesInUse,
                    total: chrome.storage.sync.QUOTA_BYTES
                });
            }
        });
    }
}

// Esempio 7: Test automatici con debug
function exemploTestAutomatici() {
    if (debugSystem) {
        debugSystem.log('Avvio test automatici');
        
        // Test 1: Verifica storage
        debugSystem.tracePerformance('testStorage', () => {
            chrome.storage.sync.set({ testKey: 'testValue' }, () => {
                chrome.storage.sync.get(['testKey'], (result) => {
                    if (result.testKey === 'testValue') {
                        debugSystem.log('Test storage: PASSED');
                    } else {
                        debugSystem.error('Test storage: FAILED');
                    }
                    
                    // Pulizia
                    chrome.storage.sync.remove(['testKey']);
                });
            });
        });
        
        // Test 2: Verifica UI
        const testElement = document.getElementById('test-element');
        if (testElement) {
            debugSystem.log('Test UI: elemento trovato');
        } else {
            debugSystem.warn('Test UI: elemento non trovato');
        }
    }
}

// Esempio 8: Esportazione log per supporto
function exemploEsportazioneLog() {
    if (debugSystem) {
        const logData = debugSystem.exportLogs();
        
        // Crea un file scaricabile
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        debugSystem.log('Log esportati per supporto tecnico');
    }
}

// Esempio 9: Configurazione avanzata
function exemploConfigurazioneAvanzata() {
    if (debugSystem) {
        // Configura pattern di errori da monitorare
        debugSystem.errorPatterns = [
            /storage.*quota.*exceeded/i,
            /network.*error/i,
            /permission.*denied/i
        ];
        
        // Configura dimensione massima della cronologia
        debugSystem.maxHistorySize = 500;
        
        debugSystem.log('Configurazione debug aggiornata');
    }
}

// Esempio 10: Integrazione con analytics (se presente)
function exemploIntegrazione() {
    if (debugSystem && window.analytics) {
        // Invia metriche di performance ad analytics
        const metrics = debugSystem.performanceMetrics;
        
        Object.keys(metrics).forEach(functionName => {
            const metric = metrics[functionName];
            
            window.analytics.track('Performance Metric', {
                function: functionName,
                averageTime: metric.averageTime,
                callCount: metric.callCount,
                totalTime: metric.totalTime
            });
        });
        
        debugSystem.log('Metriche inviate ad analytics');
    }
}