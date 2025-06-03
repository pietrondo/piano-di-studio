# Piano di Studi Universitari - Estensione Chrome

## Descrizione

Questa estensione Chrome aiuta gli studenti universitari a gestire il proprio piano di studi in modo semplice ed efficace. Permette di tenere traccia dei corsi, programmare gli esami, monitorare i progressi accademici, gestire i tempi di studio e tracciare i materiali studiati.

## Funzionalità

- **Gestione Corsi**: Aggiungi, modifica ed elimina i corsi del tuo piano di studi
- **Calendario Esami**: Programma e visualizza le date degli esami
- **Gestione Tempi di Studio**: Cronometra le tue sessioni di studio e tieni traccia del tempo dedicato a ciascun corso
- **Tracciamento Materiali**: Cataloga e monitora il progresso di studio su libri, dispense, slide, articoli e video
- **Statistiche**: Monitora i CFU acquisiti, la media dei voti, le ore di studio e i materiali completati
- **Integrazione con Portali Universitari**: Rilevamento automatico e importazione dei dati dai principali portali universitari italiani
- **Backup e Ripristino**: Esporta e importa i tuoi dati

## Installazione

### Installazione da Chrome Web Store (Consigliata)

1. Visita il Chrome Web Store
2. Cerca "Piano di Studi Universitari"
3. Clicca su "Aggiungi a Chrome"

### Installazione Manuale (Per sviluppatori)

1. Scarica o clona questo repository
2. Apri Chrome e vai a `chrome://extensions/`
3. Attiva la "Modalità sviluppatore" (in alto a destra)
4. Clicca su "Carica estensione non pacchettizzata"
5. Seleziona la cartella del progetto

## Utilizzo

1. Clicca sull'icona dell'estensione nella barra degli strumenti di Chrome
2. Nella scheda "Corsi", aggiungi i corsi del tuo piano di studi
3. Nella scheda "Calendario", programma le date degli esami
4. Nella scheda "Studio", gestisci le tue sessioni di studio con il timer integrato
5. Nella scheda "Materiali", tieni traccia dei materiali didattici e del loro progresso
6. Nella scheda "Statistiche", monitora i tuoi progressi complessivi

## Struttura del Progetto

```
piano-studio/
├── manifest.json        # Configurazione dell'estensione
├── popup.html          # Interfaccia principale dell'estensione
├── css/
│   └── popup.css       # Stili dell'interfaccia
├── js/
│   ├── popup.js        # Logica dell'interfaccia utente
│   ├── background.js    # Script di background
│   └── content.js       # Script per l'interazione con le pagine web
└── images/
    ├── icon.svg        # Icona vettoriale
    ├── icon16.png      # Icona 16x16
    ├── icon32.png      # Icona 32x32
    ├── icon48.png      # Icona 48x48
    └── icon128.png     # Icona 128x128
```

## Portali Universitari Supportati

- **Università degli Studi di Milano (esse3.unimi.it)** - Supporto completo e ottimizzato
- Università di Bologna (esse3.unibo.it) - Supporto base
- Università di Padova (esse3.unipd.it) - Supporto base

## Funzionalità Specifiche per UniMi

- **Estrazione Dati Avanzata**: Importazione automatica da libretto elettronico, piano di studi e appelli d'esame
- **Riconoscimento Pagine**: Identificazione automatica delle diverse pagine del portale UniMi
- **Integrazione Contestuale**: Pulsanti di importazione dati nelle pagine rilevanti

## Contribuire

Se desideri contribuire al progetto, puoi:

1. Fare un fork del repository
2. Creare un branch per la tua modifica (`git checkout -b feature/nome-feature`)
3. Fare commit delle tue modifiche (`git commit -am 'Aggiungi una nuova feature'`)
4. Fare push al branch (`git push origin feature/nome-feature`)
5. Aprire una Pull Request

## Licenza

Questo progetto è distribuito con licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## Privacy

L'estensione memorizza tutti i dati localmente nel tuo browser utilizzando Chrome Storage. Nessun dato viene inviato a server esterni.

## Contatti

Per segnalazioni di bug o suggerimenti, apri un issue su GitHub o contatta lo sviluppatore all'indirizzo email: [tuo-indirizzo-email@esempio.com](mailto:tuo-indirizzo-email@esempio.com).