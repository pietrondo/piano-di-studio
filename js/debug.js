/**
 * Sistema di Debug per Piano di Studi Universitari
 * Questo modulo fornisce strumenti avanzati per il debug dell'applicazione
 * e il rilevamento di problemi in tempo reale
 */

class DebugSystem {
    constructor() {
        this.isEnabled = false;
        this.logHistory = [];
        this.errorHistory = [];
        this.warningHistory = [];
        this.maxHistorySize = 200;
        this.performanceMetrics = {};
        this.storageUsage = {};
        this.errorPatterns = [];
        this.initFromStorage();
        this.setupGlobalErrorHandling();
    }

    /**
     * Inizializza il sistema di debug dalle impostazioni salvate
     */
    async initFromStorage() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['debugEnabled', 'debugSettings'], (result) => {
                this.isEnabled = result.debugEnabled === true;
                
                // Carica le impostazioni di debug se esistono
                if (result.debugSettings) {
                    this.maxHistorySize = result.debugSettings.maxHistorySize || this.maxHistorySize;
                    this.errorPatterns = result.debugSettings.errorPatterns || [];
                }
                
                resolve();
            });
        });
    }
    
    /**
     * Configura la gestione globale degli errori
     */
    setupGlobalErrorHandling() {
        // Intercetta gli errori non gestiti
        window.addEventListener('error', (event) => {
            this.error('Errore non gestito', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            return false; // Permette la propagazione dell'errore
        });
        
        // Intercetta le promise non gestite
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Promise non gestita', {
                reason: event.reason
            });
            return false; // Permette la propagazione dell'errore
        });
        
        // Sovrascrive console.error per catturare tutti gli errori di console
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.error('Console error', args);
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Abilita o disabilita il sistema di debug
     * @param {boolean} enabled - Stato di abilitazione
     */
    async setEnabled(enabled) {
        this.isEnabled = enabled;
        return new Promise((resolve) => {
            chrome.storage.sync.set({ debugEnabled: enabled }, resolve);
        });
    }

    /**
     * Registra un messaggio di log
     * @param {string} message - Messaggio da registrare
     * @param {any} data - Dati aggiuntivi (opzionale)
     */
    log(message, data = null) {
        if (!this.isEnabled) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            message,
            data,
            type: 'log'
        };
        
        console.log(`[DEBUG] ${message}`, data);
        this.logHistory.unshift(logEntry);
        this.trimHistory(this.logHistory);
    }

    /**
     * Registra un errore
     * @param {string} message - Messaggio di errore
     * @param {Error|any} error - Oggetto errore o dati aggiuntivi
     */
    error(message, error = null) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error,
            type: 'error'
        };
        
        console.error(`[ERROR] ${message}`, error);
        this.errorHistory.unshift(errorEntry);
        this.trimHistory(this.errorHistory);
    }

    /**
     * Registra un avviso
     * @param {string} message - Messaggio di avviso
     * @param {any} data - Dati aggiuntivi (opzionale)
     */
    warn(message, data = null) {
        if (!this.isEnabled) return;
        
        const warnEntry = {
            timestamp: new Date().toISOString(),
            message,
            data,
            type: 'warning'
        };
        
        console.warn(`[WARNING] ${message}`, data);
        this.warningHistory.unshift(warnEntry);
        this.trimHistory(this.warningHistory);
    }

    /**
     * Limita la dimensione della cronologia
     * @param {Array} history - Array della cronologia da limitare
     */
    trimHistory(history) {
        if (history.length > this.maxHistorySize) {
            history.length = this.maxHistorySize;
        }
    }

    /**
     * Ottiene tutta la cronologia di log
     * @returns {Array} Cronologia completa
     */
    getAllLogs() {
        return [...this.logHistory, ...this.warningHistory, ...this.errorHistory]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Esporta i log in formato JSON
     * @returns {string} JSON con tutti i log
     */
    exportLogs() {
        const exportData = {
            timestamp: new Date().toISOString(),
            logs: this.logHistory,
            warnings: this.warningHistory,
            errors: this.errorHistory,
            userAgent: navigator.userAgent,
            version: chrome.runtime.getManifest().version
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Pulisce tutte le cronologie
     */
    clearLogs() {
        this.logHistory = [];
        this.errorHistory = [];
        this.warningHistory = [];
    }

    /**
     * Monitora le prestazioni di una funzione
     * @param {Function} fn - Funzione da monitorare
     * @param {string} name - Nome della funzione (per il log)
     * @returns {Function} Funzione con monitoraggio delle prestazioni
     */
    tracePerformance(fn, name) {
        if (!this.isEnabled) return fn;
        
        return (...args) => {
            const start = performance.now();
            try {
                const result = fn(...args);
                const end = performance.now();
                this.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
                return result;
            } catch (error) {
                const end = performance.now();
                this.error(`Error in [${name}] after ${(end - start).toFixed(2)}ms`, error);
                throw error;
            }
        };
    }

    /**
     * Analizza l'utilizzo dello storage
     * @returns {Promise<Object>} Statistiche sull'utilizzo dello storage
     */
    async analyzeStorageUsage() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (items) => {
                const usage = {};
                let totalSize = 0;
                
                for (const key in items) {
                    const size = JSON.stringify(items[key]).length;
                    usage[key] = {
                        size,
                        sizeFormatted: this.formatBytes(size)
                    };
                    totalSize += size;
                }
                
                this.storageUsage = {
                    items: usage,
                    totalSize,
                    totalSizeFormatted: this.formatBytes(totalSize),
                    timestamp: new Date().toISOString()
                };
                
                resolve(this.storageUsage);
            });
        });
    }
    
    /**
     * Formatta i byte in una stringa leggibile
     * @param {number} bytes - Numero di byte
     * @returns {string} Stringa formattata
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Verifica la presenza di errori comuni
     * @returns {Array} Lista di problemi rilevati
     */
    checkForCommonIssues() {
        const issues = [];
        
        // Verifica problemi di storage
        if (this.storageUsage.totalSize > 100000) {
            issues.push({
                type: 'warning',
                message: 'Utilizzo elevato dello storage',
                details: `Utilizzo totale: ${this.storageUsage.totalSizeFormatted}`
            });
        }
        
        // Verifica errori ricorrenti
        const errorMessages = this.errorHistory.map(e => e.message);
        const duplicateErrors = errorMessages.filter((message, index) => 
            errorMessages.indexOf(message) !== index
        );
        
        if (duplicateErrors.length > 0) {
            const uniqueDuplicates = [...new Set(duplicateErrors)];
            issues.push({
                type: 'error',
                message: 'Errori ricorrenti rilevati',
                details: uniqueDuplicates.join('\n')
            });
        }
        
        return issues;
    }
    
    /**
     * Testa la funzionalità di storage
     */
    async testStorage() {
        try {
            this.log('Test storage: inizio');
            const testKey = '_debug_test_key';
            const testValue = { test: true, timestamp: Date.now() };
            
            // Salva un valore di test
            await new Promise((resolve, reject) => {
                chrome.storage.sync.set({ [testKey]: testValue }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });
            
            this.log('Test storage: scrittura completata');
            
            // Leggi il valore di test
            const result = await new Promise((resolve) => {
                chrome.storage.sync.get([testKey], (result) => {
                    resolve(result[testKey]);
                });
            });
            
            // Verifica che il valore sia corretto
            if (JSON.stringify(result) === JSON.stringify(testValue)) {
                this.log('Test storage: lettura completata con successo');
            } else {
                this.error('Test storage: errore di verifica', {
                    expected: testValue,
                    actual: result
                });
            }
            
            // Rimuovi il valore di test
            await new Promise((resolve) => {
                chrome.storage.sync.remove(testKey, resolve);
            });
            
            this.log('Test storage: pulizia completata');
            
            // Analizza l'utilizzo dello storage
            await this.analyzeStorageUsage();
            this.log('Test storage: analisi storage completata', this.storageUsage);
            
            return true;
        } catch (error) {
            this.error('Test storage: fallito', error);
            return false;
        }
    }
    
    /**
     * Testa la funzionalità dell'interfaccia utente
     */
    testUI() {
        try {
            this.log('Test UI: inizio');
            
            // Verifica che gli elementi principali esistano
            const tabs = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            
            if (tabs.length === 0) {
                this.error('Test UI: nessun tab trovato');
                return false;
            }
            
            if (tabContents.length === 0) {
                this.error('Test UI: nessun contenuto tab trovato');
                return false;
            }
            
            this.log(`Test UI: trovati ${tabs.length} tab e ${tabContents.length} contenuti tab`);
            
            // Verifica che i tab funzionino
            let activeTabFound = false;
            tabs.forEach(tab => {
                if (tab.classList.contains('active')) {
                    activeTabFound = true;
                }
            });
            
            if (!activeTabFound) {
                this.warn('Test UI: nessun tab attivo trovato');
            }
            
            this.log('Test UI: completato con successo');
            return true;
        } catch (error) {
            this.error('Test UI: fallito', error);
            return false;
        }
    }
    
    /**
     * Simula un errore per testare il sistema di debug
     */
    simulateError() {
        try {
            this.log('Simulazione errore: inizio');
            // Genera un errore di esempio
            const obj = null;
            obj.nonExistentMethod(); // Questo genererà un errore
        } catch (error) {
            this.error('Errore simulato per test', error);
        }
    }
    
    /**
     * Crea un pannello di debug nell'interfaccia
     * @param {HTMLElement} container - Elemento contenitore per il pannello
     */
    createDebugPanel(container) {
        const panel = document.createElement('div');
        panel.className = 'debug-panel';
        panel.innerHTML = `
            <div class="debug-header">
                <h3>Pannello di Debug</h3>
                <div class="debug-controls">
                    <button id="debug-toggle" class="${this.isEnabled ? 'active' : ''}">
                        ${this.isEnabled ? 'Disabilita' : 'Abilita'} Debug
                    </button>
                    <button id="debug-export">Esporta Log</button>
                    <button id="debug-clear">Pulisci Log</button>
                </div>
            </div>
            <div class="debug-content">
                <div class="debug-stats">
                    <div class="stat-item">Log: <span id="debug-log-count">0</span></div>
                    <div class="stat-item">Avvisi: <span id="debug-warn-count">0</span></div>
                    <div class="stat-item">Errori: <span id="debug-error-count">0</span></div>
                </div>
                <div class="debug-log-container">
                    <ul id="debug-log-list"></ul>
                </div>
                <div class="debug-test-tools">
                    <h4>Strumenti di Test</h4>
                    <div class="debug-test-buttons">
                        <button id="debug-test-storage">Test Storage</button>
                        <button id="debug-test-ui">Test UI</button>
                        <button id="debug-simulate-error">Simula Errore</button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(panel);
        this.initDebugPanelEvents(panel);
        this.updateDebugPanel(panel);
    }

    /**
     * Inizializza gli eventi del pannello di debug
     * @param {HTMLElement} panel - Pannello di debug
     */
    initDebugPanelEvents(panel) {
        const toggleBtn = panel.querySelector('#debug-toggle');
        const exportBtn = panel.querySelector('#debug-export');
        const clearBtn = panel.querySelector('#debug-clear');
        const testStorageBtn = panel.querySelector('#debug-test-storage');
        const testUIBtn = panel.querySelector('#debug-test-ui');
        const simulateErrorBtn = panel.querySelector('#debug-simulate-error');
        
        toggleBtn.addEventListener('click', () => {
            this.setEnabled(!this.isEnabled).then(() => {
                toggleBtn.textContent = this.isEnabled ? 'Disabilita Debug' : 'Abilita Debug';
                toggleBtn.classList.toggle('active', this.isEnabled);
            });
        });
        
        exportBtn.addEventListener('click', () => {
            const blob = new Blob([this.exportLogs()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-logs-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.log('Log esportati con successo');
        });
        
        clearBtn.addEventListener('click', () => {
            this.clearLogs();
            this.updateDebugPanel(panel);
            this.log('Log cancellati');
        });
        
        testStorageBtn.addEventListener('click', async () => {
            testStorageBtn.disabled = true;
            testStorageBtn.textContent = 'Test in corso...';
            await this.testStorage();
            testStorageBtn.disabled = false;
            testStorageBtn.textContent = 'Test Storage';
            this.updateDebugPanel(panel);
        });
        
        testUIBtn.addEventListener('click', () => {
            testUIBtn.disabled = true;
            testUIBtn.textContent = 'Test in corso...';
            setTimeout(() => {
                this.testUI();
                testUIBtn.disabled = false;
                testUIBtn.textContent = 'Test UI';
                this.updateDebugPanel(panel);
            }, 100);
        });
        
        simulateErrorBtn.addEventListener('click', () => {
            this.simulateError();
            this.updateDebugPanel(panel);
        });
    }

    /**
     * Aggiorna il pannello di debug con i dati più recenti
     * @param {HTMLElement} panel - Pannello di debug
     */
    updateDebugPanel(panel) {
        const logCount = panel.querySelector('#debug-log-count');
        const warnCount = panel.querySelector('#debug-warn-count');
        const errorCount = panel.querySelector('#debug-error-count');
        const logList = panel.querySelector('#debug-log-list');
        
        logCount.textContent = this.logHistory.length;
        warnCount.textContent = this.warningHistory.length;
        errorCount.textContent = this.errorHistory.length;
        
        // Aggiorna le classi di stato in base alla presenza di errori o avvisi
        panel.classList.toggle('has-errors', this.errorHistory.length > 0);
        panel.classList.toggle('has-warnings', this.warningHistory.length > 0);
        
        logList.innerHTML = '';
        
        this.getAllLogs().slice(0, 50).forEach(entry => {
            const li = document.createElement('li');
            li.className = `debug-entry debug-${entry.type}`;
            
            const time = new Date(entry.timestamp).toLocaleTimeString();
            li.innerHTML = `
                <span class="debug-time">${time}</span>
                <span class="debug-type">${entry.type.toUpperCase()}</span>
                <span class="debug-message">${this.escapeHtml(entry.message)}</span>
            `;
            
            if (entry.data || entry.error) {
                li.classList.add('has-details');
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'debug-details-btn';
                detailsBtn.textContent = 'Dettagli';
                detailsBtn.addEventListener('click', () => {
                    this.showDetailsModal(entry);
                });
                li.appendChild(detailsBtn);
            }
            
            logList.appendChild(li);
        });
        
        // Verifica problemi comuni
        if (this.isEnabled && (this.errorHistory.length > 0 || this.warningHistory.length > 0)) {
            const issues = this.checkForCommonIssues();
            if (issues.length > 0) {
                this.showIssuesNotification(issues);
            }
        }
    }
    
    /**
     * Mostra una finestra modale con i dettagli di un log
     * @param {Object} entry - Voce di log
     */
    showDetailsModal(entry) {
        // Rimuovi eventuali modali esistenti
        const existingModal = document.querySelector('.debug-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'debug-modal';
        
        const content = document.createElement('div');
        content.className = 'debug-modal-content';
        
        const header = document.createElement('div');
        header.className = 'debug-modal-header';
        header.innerHTML = `
            <h3>${entry.type.toUpperCase()}: ${this.escapeHtml(entry.message)}</h3>
            <button class="debug-modal-close">&times;</button>
        `;
        
        const body = document.createElement('div');
        body.className = 'debug-modal-body';
        
        const time = new Date(entry.timestamp).toLocaleString();
        body.innerHTML = `<p><strong>Timestamp:</strong> ${time}</p>`;
        
        const detailsData = entry.data || entry.error;
        if (detailsData) {
            const pre = document.createElement('pre');
            pre.className = 'debug-details-json';
            pre.textContent = JSON.stringify(detailsData, null, 2);
            body.appendChild(pre);
        }
        
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        
        document.body.appendChild(modal);
        
        // Gestisci la chiusura della modale
        const closeBtn = modal.querySelector('.debug-modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // Chiudi la modale cliccando fuori dal contenuto
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Mostra una notifica con i problemi rilevati
     * @param {Array} issues - Lista di problemi
     */
    showIssuesNotification(issues) {
        // Implementazione di una notifica semplice
        console.warn('Problemi rilevati:', issues);
        
        // In una versione più avanzata, si potrebbe mostrare una notifica UI
    }
    
    /**
     * Escape HTML per prevenire XSS
     * @param {string} html - Stringa da escapare
     * @returns {string} Stringa escapata
     */
    escapeHtml(html) {
        if (typeof html !== 'string') return '';
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Esporta l'istanza del sistema di debug
const debugSystem = new DebugSystem();

// Aggiungi al contesto globale per l'accesso dalla console
window.debugSystem = debugSystem;

// Il sistema di debug è disponibile globalmente come window.debugSystem