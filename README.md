# Piano di Studi Universitari - Estensione Chrome

## Descrizione

Questa estensione Chrome aiuta gli studenti universitari a gestire il proprio piano di studi in modo semplice ed efficace. Permette di tenere traccia dei corsi, programmare gli esami, monitorare i progressi accademici, gestire i tempi di studio e tracciare i materiali studiati.

## Funzionalità

- **Gestione Corsi**: Aggiungi, modifica ed elimina i corsi del tuo piano di studi
- **Calendario Esami**: Programma e visualizza le date degli esami
- **Gestione Tempi di Studio**: Cronometra le tue sessioni di studio e tieni traccia del tempo dedicato a ciascun corso
- **Sistema Pomodoro Integrato**: Timer Pomodoro con cicli personalizzabili per ottimizzare la concentrazione
- **Sistema di Gamification**: 
  - **Livelli e Punti Esperienza**: Guadagna XP e sali di livello completando sessioni di studio
  - **Badge e Achievements**: Sblocca badge speciali raggiungendo traguardi specifici
  - **Obiettivi Giornalieri**: Completa sfide quotidiane per mantenere la motivazione
  - **Indicatore di Focus**: Visualizzazione dinamica dello stato di concentrazione durante lo studio
- **Tracciamento Materiali**: Cataloga e monitora il progresso di studio su libri, dispense, slide, articoli e video
- **Statistiche**: Monitora i CFU acquisiti, la media dei voti, le ore di studio e i materiali completati
- **Integrazione con Portali Universitari**: Rilevamento automatico e importazione dei dati dai principali portali universitari italiani
- **Backup e Ripristino**: Esporta e importa i tuoi dati
- **Sistema di Debug Avanzato**: Strumenti di debugging e monitoraggio per sviluppatori e utenti avanzati

## Installazione

### Metodo 1: Installazione da Chrome Web Store (Consigliato)
1. Vai al Chrome Web Store
2. Cerca "Piano di Studi Universitari"
3. Clicca su "Aggiungi a Chrome"

### Metodo 2: Installazione Manuale
1. Scarica il codice sorgente
2. Apri Chrome e vai su `chrome://extensions/`
3. Abilita la "Modalità sviluppatore"
4. Clicca su "Carica estensione non pacchettizzata"
5. Seleziona la cartella del progetto

### Installazione per Sviluppatori

Se vuoi contribuire al progetto o eseguire i test:

1. Clona il repository
2. Installa le dipendenze: `npm install`
3. Esegui i test: `npm test`
4. Avvia il server di sviluppo: `npm start`

## Utilizzo

1. Clicca sull'icona dell'estensione nella barra degli strumenti di Chrome
2. Nella scheda "Corsi", aggiungi i corsi del tuo piano di studi
3. Nella scheda "Calendario", programma le date degli esami
4. Nella scheda "Studio", gestisci le tue sessioni di studio con:
   - **Timer Pomodoro**: Utilizza la tecnica Pomodoro per ottimizzare la concentrazione
   - **Sistema di Gamification**: Guadagna punti, XP e badge completando sessioni di studio
   - **Obiettivi Giornalieri**: Completa le sfide quotidiane per mantenere la motivazione
   - **Indicatore di Focus**: Osserva la pianta che cresce durante le sessioni di studio
5. Nella scheda "Materiali", tieni traccia dei materiali didattici e del loro progresso
6. Nella scheda "Statistiche", monitora i tuoi progressi complessivi
7. Nella scheda "Debug", accedi agli strumenti di debugging (per sviluppatori e utenti avanzati)

### Sistema di Gamification

Il sistema di gamification è progettato per mantenere alta la motivazione durante lo studio:

- **Livelli**: Sali di livello guadagnando punti esperienza (XP) attraverso lo studio
- **Punti**: Guadagna punti completando sessioni di studio e raggiungendo obiettivi
- **Badge**: Sblocca badge speciali per traguardi come "Prima Sessione", "Maestro Pomodoro", "Studioso Notturno"
- **Obiettivi Giornalieri**: Completa sfide quotidiane come "Studia per 2 ore" o "Completa 4 sessioni Pomodoro"
- **Indicatore di Focus**: Una pianta animata che cambia aspetto in base alla fase di studio (lavoro, pausa breve, pausa lunga)

## Struttura del Progetto

```
## Struttura del Progetto

```
piano-studio/
├── manifest.json          # Configurazione dell'estensione
├── popup.html             # Interfaccia principale
├── package.json           # Configurazione npm e dipendenze
├── jest.config.js         # Configurazione test Jest
├── css/
│   ├── popup.css          # Stili dell'interfaccia
│   └── debug.css          # Stili del sistema di debug
├── js/
│   ├── popup.js           # Logica dell'interfaccia
│   ├── background.js      # Service worker
│   └── debug.js           # Sistema di debug avanzato
├── docs/
│   └── debug-system.md    # Documentazione tecnica del debug
├── examples/
│   └── debug-usage.js     # Esempi di utilizzo del debug
├── tests/
│   ├── setup.js           # Configurazione ambiente test
│   └── debug-system.test.js # Test unitari del sistema debug
└── icons/                 # Icone dell'estensione
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```



## Contribuire

Se desideri contribuire al progetto, puoi:

1. Fare un fork del repository
2. Creare un branch per la tua modifica (`git checkout -b feature/nome-feature`)
3. Fare commit delle tue modifiche (`git commit -am 'Aggiungi una nuova feature'`)
4. Fare push al branch (`git push origin feature/nome-feature`)
5. Aprire una Pull Request

### Contribuire al Sistema di Debug

Se vuoi migliorare il sistema di debug, ecco alcune aree su cui puoi concentrarti:

- Aggiungere nuovi strumenti di analisi e diagnostica
- Migliorare l'interfaccia utente del pannello di debug
- Implementare visualizzazioni grafiche per le metriche di performance
- Aggiungere supporto per l'esportazione dei log in diversi formati
- Creare test automatici per verificare il corretto funzionamento del sistema

## Licenza

Questo progetto è distribuito con licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## Sistema di Debug

L'estensione include un sistema di debug avanzato per sviluppatori e utenti esperti. Questo sistema permette di:

- **Monitorare i log**: Visualizza log, avvisi ed errori generati dall'applicazione
- **Analizzare le performance**: Monitora i tempi di esecuzione delle funzioni critiche
- **Verificare l'utilizzo dello storage**: Controlla quanto spazio viene utilizzato nel Chrome Storage
- **Esportare i log**: Salva i log per analisi offline o per segnalare problemi
- **Testare funzionalità**: Esegui test rapidi su storage e interfaccia utente

### Come utilizzare il sistema di debug

1. Apri l'estensione e vai alla scheda "Debug"
2. Clicca su "Abilita Debug" per attivare il sistema
3. Utilizza i controlli disponibili per esportare o cancellare i log
4. Visualizza i log recenti direttamente nel pannello
5. Utilizza gli strumenti di test per verificare funzionalità specifiche

### Per sviluppatori

Il sistema di debug è implementato come singleton e può essere utilizzato in qualsiasi parte dell'applicazione:

```javascript
// Esempio di utilizzo del sistema di debug
if (debugSystem) {
    debugSystem.log('Messaggio informativo');
    debugSystem.warn('Avviso importante');
    debugSystem.error('Errore critico', errorObject);
    
    // Misura performance
    debugSystem.tracePerformance('nomeFunzione', () => {
        // Codice da misurare
    });
}
```

#### Documentazione e Risorse

Per un'implementazione efficace del sistema di debug, sono disponibili diverse risorse:

- **Esempi di Utilizzo**: Il file `examples/debug-usage.js` contiene diversi scenari pratici di utilizzo del sistema di debug.
- **Documentazione Tecnica**: Il file `docs/debug-system.md` fornisce una documentazione dettagliata dell'architettura e delle funzionalità del sistema.
- **Test Unitari**: I test in `tests/debug-system.test.js` mostrano come testare le funzionalità del sistema e possono servire come riferimento per l'implementazione.

#### Esecuzione dei Test

Per verificare il corretto funzionamento del sistema di debug:

```bash
# Esegui tutti i test
npm test

# Esegui i test con modalità watch (utile durante lo sviluppo)
npm run test:watch

# Genera report di copertura del codice
npm run test:coverage
```

## Privacy

L'estensione memorizza tutti i dati localmente nel tuo browser utilizzando Chrome Storage. Nessun dato viene inviato a server esterni.

## Contatti

Per segnalazioni di bug o suggerimenti, apri un issue su GitHub o contatta lo sviluppatore all'indirizzo email: [tuo-indirizzo-email@esempio.com](mailto:tuo-indirizzo-email@esempio.com).