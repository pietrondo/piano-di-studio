/**
 * Sistema di Debug per Piano di Studi Universitari
 * Questo modulo fornisce strumenti per il debug dell'applicazione
 */

class DebugSystem {
    constructor() {
        this.isEnabled = false;
        this.logHistory = [];
        this.errorHistory = [];
        this.warningHistory = [];
        this.maxHistorySize = 100;
        this.initFromStorage();
    }

    /**
     * Inizializza il sistema di debug dalle impostazioni salvate
     */
    async initFromStorage() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['debugEnabled'], (result) => {
                this.isEnabled = result.debugEnabled === true;
                resolve();
            });
        });
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
                    <div>Log: <span id="debug-log-count">0</span></div>
                    <div>Avvisi: <span id="debug-warn-count">0</span></div>
                    <div>Errori: <span id="debug-error-count">0</span></div>
                </div>
                <div class="debug-log-container">
                    <ul id="debug-log-list"></ul>
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
        });
        
        clearBtn.addEventListener('click', () => {
            this.clearLogs();
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
        
        logList.innerHTML = '';
        
        this.getAllLogs().slice(0, 50).forEach(entry => {
            const li = document.createElement('li');
            li.className = `debug-entry debug-${entry.type}`;
            
            const time = new Date(entry.timestamp).toLocaleTimeString();
            li.innerHTML = `
                <span class="debug-time">${time}</span>
                <span class="debug-type">${entry.type.toUpperCase()}</span>
                <span class="debug-message">${entry.message}</span>
            `;
            
            if (entry.data || entry.error) {
                li.classList.add('has-details');
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'debug-details-btn';
                detailsBtn.textContent = 'Dettagli';
                detailsBtn.addEventListener('click', () => {
                    console.log('Debug entry details:', entry);
                    alert(JSON.stringify(entry.data || entry.error, null, 2));
                });
                li.appendChild(detailsBtn);
            }
            
            logList.appendChild(li);
        });
    }
}

// Esporta l'istanza del sistema di debug
const debugSystem = new DebugSystem();

// Aggiungi al contesto globale per l'accesso dalla console
window.debugSystem = debugSystem;

// Esporta il sistema di debug
export default debugSystem;