/**
 * Piano di Studi Universitari - Theme Manager
 * Gestisce i temi dell'interfaccia (chiaro/scuro) e le preferenze utente
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.storageKey = 'theme-preference';
        this.themeToggleButton = null;
        
        // Inizializza il tema
        this.init();
    }

    // === INIZIALIZZAZIONE ===

    async init() {
        try {
            // Carica la preferenza salvata
            await this.loadThemePreference();
            
            // Applica il tema
            this.applyTheme(this.currentTheme);
            
            // Inizializza il toggle button
            this.initThemeToggle();
            
            console.log('ThemeManager inizializzato con tema:', this.currentTheme);
        } catch (error) {
            console.error('Errore durante l\'inizializzazione del ThemeManager:', error);
            // Fallback al tema chiaro
            this.applyTheme('light');
        }
    }

    async loadThemePreference() {
        return new Promise((resolve) => {
            try {
                const savedTheme = localStorage.getItem(this.storageKey);
                if (savedTheme) {
                    this.currentTheme = savedTheme;
                } else {
                    // Rileva la preferenza del sistema se disponibile
                    this.currentTheme = this.detectSystemTheme();
                }
            } catch (error) {
                console.warn('Errore nel caricamento del tema:', error);
                this.currentTheme = this.detectSystemTheme();
            }
            resolve();
        });
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // === GESTIONE TEMI ===

    applyTheme(theme) {
        const root = document.documentElement;
        
        // Rimuovi tutti i temi esistenti
        root.removeAttribute('data-theme');
        root.classList.remove('theme-light', 'theme-dark');
        
        // Applica il nuovo tema
        root.setAttribute('data-theme', theme);
        root.classList.add(`theme-${theme}`);
        
        this.currentTheme = theme;
        
        // Aggiorna l'icona del toggle se presente
        this.updateToggleIcon();
        
        // Salva la preferenza
        this.saveThemePreference();
        
        // Emetti evento per altri componenti
        this.emitThemeChangeEvent(theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Mostra notifica del cambio tema
        this.showThemeChangeNotification(newTheme);
    }

    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        } else {
            console.warn('Tema non valido:', theme);
        }
    }

    // === TOGGLE BUTTON ===

    initThemeToggle() {
        // Cerca il toggle esistente o crealo
        this.themeToggleButton = document.getElementById('theme-toggle');
        
        if (!this.themeToggleButton) {
            this.createThemeToggle();
        }
        
        if (this.themeToggleButton) {
            this.themeToggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // Aggiorna l'icona iniziale
            this.updateToggleIcon();
        }
    }

    createThemeToggle() {
        // Trova l'header dove inserire il toggle
        const header = document.querySelector('header');
        if (!header) return;
        
        // Crea il container per il toggle
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle-container';
        
        // Crea il button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'theme-toggle';
        toggleButton.className = 'theme-toggle-btn';
        toggleButton.setAttribute('aria-label', 'Cambia tema');
        toggleButton.innerHTML = '<span class="theme-icon">🌙</span>';
        
        toggleContainer.appendChild(toggleButton);
        header.appendChild(toggleContainer);
        
        this.themeToggleButton = toggleButton;
    }

    updateToggleIcon() {
        if (!this.themeToggleButton) return;
        
        const icon = this.themeToggleButton.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
        
        // Aggiorna l'aria-label
        const newLabel = this.currentTheme === 'light' ? 'Attiva tema scuro' : 'Attiva tema chiaro';
        this.themeToggleButton.setAttribute('aria-label', newLabel);
    }

    // === PERSISTENZA ===

    async saveThemePreference() {
        return new Promise((resolve) => {
            try {
                localStorage.setItem(this.storageKey, this.currentTheme);
            } catch (error) {
                console.warn('Errore nel salvataggio del tema:', error);
            }
            resolve();
        });
    }

    // === EVENTI ===

    emitThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
    }

    showThemeChangeNotification(theme) {
        // Cerca il UIManager per mostrare la notifica
        if (window.controller && window.controller.uiManager) {
            const themeName = theme === 'dark' ? 'scuro' : 'chiaro';
            window.controller.uiManager.showNotification(
                'Tema cambiato', 
                `Tema ${themeName} attivato`, 
                'info'
            );
        }
    }

    // === LISTENER PER CAMBIAMENTI SISTEMA ===

    initSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Cambia tema solo se l'utente non ha una preferenza esplicita
                try {
                    const savedTheme = localStorage.getItem(this.storageKey);
                    if (!savedTheme) {
                        const systemTheme = e.matches ? 'dark' : 'light';
                        this.applyTheme(systemTheme);
                    }
                } catch (error) {
                    console.warn('Errore nel controllo delle preferenze tema:', error);
                }
            });
        }
    }

    // === GETTER ===

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    isLightMode() {
        return this.currentTheme === 'light';
    }

    // === UTILITY ===

    getThemeColors() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
            primary: computedStyle.getPropertyValue('--primary-color').trim(),
            secondary: computedStyle.getPropertyValue('--secondary-color').trim(),
            background: computedStyle.getPropertyValue('--bg-white').trim(),
            text: computedStyle.getPropertyValue('--text-color').trim()
        };
    }

    // === METODI PER SVILUPPATORI ===

    debugThemeInfo() {
        console.log('=== THEME DEBUG INFO ===');
        console.log('Current theme:', this.currentTheme);
        console.log('System preference:', this.detectSystemTheme());
        console.log('Theme colors:', this.getThemeColors());
        console.log('Toggle button:', this.themeToggleButton);
    }
}

// Esporta la classe per l'uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}