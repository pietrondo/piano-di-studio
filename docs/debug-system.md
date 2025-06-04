# Documentazione Tecnica: Sistema di Debug

## Panoramica

Il sistema di debug è un modulo avanzato progettato per facilitare il monitoraggio, la diagnosi e la risoluzione dei problemi nell'estensione Piano di Studi Universitari. Implementato come singleton, è accessibile da qualsiasi parte dell'applicazione e fornisce strumenti completi per il logging, l'analisi delle performance, il monitoraggio dello storage e il testing.

## Architettura

Il sistema è implementato come classe singleton `DebugSystem` nel file `js/debug.js`. Un'istanza globale `debugSystem` viene esportata e resa disponibile in tutta l'applicazione.

```
┌─────────────────────────────────┐
│           DebugSystem           │
├─────────────────────────────────┤
│ - isEnabled: boolean            │
│ - logHistory: array             │
│ - errorHistory: array           │
│ - warningHistory: array         │
│ - maxHistorySize: number        │
│ - performanceMetrics: object    │
│ - storageUsage: object          │
│ - errorPatterns: array          │
├─────────────────────────────────┤
│ + log(message, data)            │
│ + warn(message, data)           │
│ + error(message, error)         │
│ + tracePerformance(name, fn)    │
│ + analyzeStorageUsage()         │
│ + testStorage()                 │
│ + testUI()                      │
│ + exportLogs()                  │
└─────────────────────────────────┘
```

## Funzionalità Principali

### 1. Sistema di Logging

Il sistema fornisce tre livelli di logging:

- **log()**: Per messaggi informativi generali
- **warn()**: Per avvisi e situazioni potenzialmente problematiche
- **error()**: Per errori e situazioni critiche

Ogni voce di log include:
- Timestamp ISO
- Messaggio
- Dati aggiuntivi (opzionali)
- Tipo di log

### 2. Gestione Errori Globale

Il sistema intercetta automaticamente:

- Errori JavaScript non gestiti (`window.addEventListener('error')`)
- Promise non gestite (`window.addEventListener('unhandledrejection')`)
- Chiamate a `console.error`

Questi errori vengono registrati nella cronologia degli errori per facilitare il debug.

### 3. Analisi delle Performance

La funzione `tracePerformance(name, fn)` consente di misurare il tempo di esecuzione di qualsiasi funzione:

```javascript
// Esempio di utilizzo
const risultato = debugSystem.tracePerformance('nomeFunzione', () => {
    // Codice da misurare
    return risultatoOperazione;
});
```

### 4. Monitoraggio dello Storage

La funzione `analyzeStorageUsage()` analizza l'utilizzo dello storage Chrome, fornendo:

- Dimensione di ogni chiave
- Dimensione totale utilizzata
- Formattazione leggibile delle dimensioni

### 5. Strumenti di Test

Il sistema include funzioni di test integrate:

- **testStorage()**: Verifica la funzionalità di lettura/scrittura dello storage
- **testUI()**: Verifica la presenza e il funzionamento degli elementi UI principali
- **simulateError()**: Genera un errore di test per verificare la gestione degli errori

### 6. Interfaccia Utente di Debug

Il sistema può generare un pannello di debug completo con:

- Controlli per abilitare/disabilitare il debug
- Statistiche sui log (conteggio di log, avvisi, errori)
- Visualizzatore di log con dettagli espandibili
- Strumenti di test interattivi
- Funzionalità di esportazione dei log

### 7. Esportazione dei Log

La funzione `exportLogs()` genera un file JSON contenente:

- Tutti i log, avvisi ed errori
- Timestamp di esportazione
- Informazioni sul browser (userAgent)
- Versione dell'estensione

## Integrazione nell'Applicazione

Il sistema di debug è integrato in vari componenti dell'applicazione:

1. **Background Service Worker**: Logging delle operazioni di salvataggio, backup e aggiornamento statistiche
2. **Popup UI**: Pannello di debug accessibile tramite tab dedicato
3. **Gestione Allarmi**: Logging degli eventi di allarme per i backup automatici

## Utilizzo per gli Sviluppatori

### Logging di Base

```javascript
if (debugSystem) {
    debugSystem.log('Messaggio informativo');
    debugSystem.warn('Avviso importante');
    debugSystem.error('Errore critico', errorObject);
}
```

### Misurazione Performance

```javascript
if (debugSystem) {
    const result = debugSystem.tracePerformance('nomeFunzione', () => {
        // Codice da misurare
        return risultatoOperazione;
    });
}
```

### Analisi Storage

```javascript
async function checkStorage() {
    if (debugSystem) {
        const usage = await debugSystem.analyzeStorageUsage();
        console.log('Utilizzo storage:', usage);
    }
}
```

### Test Funzionalità

```javascript
async function runTests() {
    if (debugSystem) {
        const storageOk = await debugSystem.testStorage();
        const uiOk = debugSystem.testUI();
        
        if (storageOk && uiOk) {
            console.log('Tutti i test superati!');
        }
    }
}
```

## Best Practices

1. **Controllo di Esistenza**: Verificare sempre che `debugSystem` esista prima di utilizzarlo
2. **Logging Contestuale**: Includere dati di contesto nei log per facilitare il debug
3. **Gestione Performance**: Utilizzare `tracePerformance` per le operazioni potenzialmente lente
4. **Logging Condizionale**: Utilizzare flag di ambiente per abilitare log dettagliati solo in sviluppo

## Estensione del Sistema

Il sistema di debug può essere esteso con nuove funzionalità:

1. **Metriche Aggiuntive**: Monitoraggio memoria, CPU, rete
2. **Visualizzazioni Grafiche**: Grafici per metriche di performance
3. **Integrazione Analytics**: Invio di metriche a servizi esterni
4. **Test Automatizzati**: Suite di test più completa

## Risoluzione Problemi Comuni

| Problema | Possibile Causa | Soluzione |
|---------|----------------|----------|
| Log non visibili | Debug disabilitato | Abilitare il debug dal pannello |
| Errori non catturati | Errori in codice asincrono | Utilizzare try/catch in funzioni async |
| Pannello debug non disponibile | CSS/JS non caricati | Verificare inclusione di debug.css e debug.js |
| Storage test fallito | Permessi insufficienti | Verificare permessi dell'estensione |

## Riferimenti

- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Extensions Debugging](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)