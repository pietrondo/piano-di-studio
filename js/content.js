/**
 * Piano di Studi Universitari - Content Script
 * Interagisce con le pagine web visitate dall'utente
 */

// Configurazione per il rilevamento automatico delle pagine universitarie
const universityPortals = [
    {
        domain: 'esse3.unibo.it',
        name: 'Università di Bologna',
        selectors: {
            examTable: '.table-esami',
            examName: '.nome-esame',
            examDate: '.data-esame',
            examCredits: '.crediti-esame'
        }
    },
    {
        domain: 'esse3.unipd.it',
        name: 'Università di Padova',
        selectors: {
            examTable: '.table-esami',
            examName: '.nome-esame',
            examDate: '.data-esame',
            examCredits: '.crediti-esame'
        }
    },
    {
        domain: 'esse3.unimi.it',
        name: 'Università di Milano',
        selectors: {
            examTable: '.table-esami',
            examName: '.nome-esame',
            examDate: '.data-esame',
            examCredits: '.crediti-esame'
        }
    },
    // Aggiungi altri portali universitari secondo necessità
];

// Funzione per rilevare il portale universitario
function detectUniversityPortal() {
    const url = window.location.href;
    if (url.includes('unimi.it')) {
        return 'unimi';
    } else if (url.includes('unibo.it')) {
        return 'unibo';
    } else if (url.includes('unipd.it')) {
        return 'unipd';
    }
    return null;
}

// Funzione per estrarre informazioni sugli esami dalla pagina
function extractExamInfo() {
    const portal = detectUniversityPortal();
    if (!portal) return [];

    let exams = [];

    switch (portal) {
        case 'unimi':
            // Logica di estrazione per Unimi
            // Estrazione dalla pagina degli esami
            if (window.location.href.includes('unimia') || window.location.href.includes('studente')) {
                // Estrazione dalla pagina del libretto
                document.querySelectorAll('table.records-table tr, table.esami-sostenuti tr, table.table-striped tr').forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        const nameCell = cells[0] || cells[1];
                        const creditsCell = cells[2] || cells[3];
                        
                        if (nameCell && creditsCell) {
                            const name = nameCell.textContent.trim();
                            // Estrai i CFU usando una regex per trovare numeri
                            const creditsText = creditsCell.textContent.trim();
                            const creditsMatch = creditsText.match(/(\d+)\s*CFU|\s*(\d+)\s*$/i);
                            const credits = creditsMatch ? (creditsMatch[1] || creditsMatch[2]) : '';
                            
                            if (name && credits && !name.toLowerCase().includes('insegnamento')) {
                                exams.push({
                                    name: name,
                                    credits: credits,
                                    portal: 'unimi'
                                });
                            }
                        }
                    }
                });
            }
            
            // Estrazione dalla pagina del piano di studi
            if (window.location.href.includes('piano-studi')) {
                document.querySelectorAll('.piano-studi-riga, .attdid-riga').forEach(row => {
                    const nameElement = row.querySelector('.nome-insegnamento, .attdid-insegnamento');
                    const creditsElement = row.querySelector('.cfu, .attdid-cfu');
                    
                    if (nameElement && creditsElement) {
                        const name = nameElement.textContent.trim();
                        const credits = creditsElement.textContent.trim().replace('CFU', '').trim();
                        
                        if (name && credits) {
                            exams.push({
                                name: name,
                                credits: credits,
                                portal: 'unimi'
                            });
                        }
                    }
                });
            }
            
            // Estrazione dalla pagina degli appelli d'esame
            if (window.location.href.includes('appelli') || window.location.href.includes('esami')) {
                document.querySelectorAll('table.table-appelli tr, table.esami-table tr').forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        const name = cells[0]?.textContent.trim();
                        const date = cells[1]?.textContent.trim() || cells[2]?.textContent.trim();
                        const location = cells[3]?.textContent.trim() || '';
                        
                        if (name && date && !name.toLowerCase().includes('insegnamento')) {
                            exams.push({
                                name: name,
                                date: date,
                                location: location,
                                portal: 'unimi'
                            });
                        }
                    }
                });
            }
            break;

        case 'unibo':
            // Logica di estrazione per Unibo
            document.querySelectorAll('table.exams-table tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 4) {
                    exams.push({
                        name: cells[0].textContent.trim(),
                        date: cells[1].textContent.trim(),
                        location: cells[2].textContent.trim(),
                        credits: cells[3].textContent.trim(),
                        portal: 'unibo'
                    });
                }
            });
            break;

        case 'unipd':
            // Logica di estrazione per Unipd
            document.querySelectorAll('div.exam-item').forEach(item => {
                exams.push({
                    name: item.querySelector('.exam-name').textContent.trim(),
                    date: item.querySelector('.exam-date').textContent.trim(),
                    location: item.querySelector('.exam-location').textContent.trim(),
                    credits: item.querySelector('.exam-credits').textContent.trim(),
                    portal: 'unipd'
                });
            });
            break;
    }

    return exams;
}

// Funzione per mostrare il popup di importazione
function showImportPopup(exams) {
    if (exams.length === 0) return;

    // Crea il popup
    const popup = document.createElement('div');
    popup.className = 'study-plan-import-popup';
    popup.innerHTML = `
        <div class="import-popup-content">
            <h3>Importa Esami nel Piano di Studi</h3>
            <p>Sono stati trovati ${exams.length} esami. Vuoi importarli?</p>
            <div class="exams-list">
                ${exams.map(exam => `
                    <div class="exam-item">
                        <input type="checkbox" id="exam-${exam.name.replace(/\s+/g, '-')}" checked>
                        <label for="exam-${exam.name.replace(/\s+/g, '-')}">
                            ${exam.name} (${exam.credits || 'N/A'} CFU)
                            ${exam.date ? `<span class="exam-date">Data: ${exam.date}</span>` : ''}
                            ${exam.portal ? `<span class="exam-portal">${exam.portal.toUpperCase()}</span>` : ''}
                        </label>
                    </div>
                `).join('')}
            </div>
            <div class="import-actions">
                <button id="import-selected">Importa Selezionati</button>
                <button id="cancel-import">Annulla</button>
            </div>
        </div>
    `;

    // Stili CSS inline per il popup
    const style = document.createElement('style');
    style.textContent = `
        .study-plan-import-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        .import-popup-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .exams-list {
            margin: 15px 0;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #eee;
            padding: 10px;
        }
        .exam-item {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f0f0f0;
        }
        .exam-date {
            display: block;
            font-size: 0.8em;
            color: #666;
            margin-left: 24px;
        }
        .exam-portal {
            display: inline-block;
            font-size: 0.7em;
            background-color: #1565C0;
            color: white;
            padding: 2px 5px;
            border-radius: 3px;
            margin-left: 8px;
            vertical-align: middle;
        }
        .import-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        .import-actions button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #import-selected {
            background-color: #4CAF50;
            color: white;
        }
        #cancel-import {
            background-color: #f44336;
            color: white;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(popup);

    // Event listeners
    document.getElementById('import-selected').addEventListener('click', () => {
        const selectedExams = exams.filter((exam, index) => {
            const checkbox = document.getElementById(`exam-${exam.name.replace(/\s+/g, '-')}`);
            return checkbox && checkbox.checked;
        });

        if (selectedExams.length > 0) {
            chrome.runtime.sendMessage({
                action: 'importExams',
                exams: selectedExams
            });
        }

        popup.remove();
    });

    document.getElementById('cancel-import').addEventListener('click', () => {
        popup.remove();
    });
}

// Importa gli esami nell'estensione
function importExams(exams) {
    chrome.runtime.sendMessage({
        action: 'importExams',
        exams: exams
    }, response => {
        if (response && response.success) {
            showNotification('Esami importati con successo!');
        } else {
            showNotification('Errore durante l\'importazione degli esami.');
        }
    });
}

// Mostra una notifica temporanea
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        z-index: 10000;
        transition: opacity 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Esegui il codice quando la pagina è completamente caricata
document.addEventListener('DOMContentLoaded', () => {
    // Controlla se siamo su un portale universitario supportato
    const portal = detectUniversityPortal();
    if (portal) {
        // Aggiungi un pulsante per attivare l'estrazione manuale
        const button = document.createElement('button');
        button.textContent = 'Estrai Esami per Piano di Studi';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(button);

        button.addEventListener('click', () => {
            const exams = extractExamInfo();
            showImportPopup(exams);
        });

        // Tenta l'estrazione automatica dopo un breve ritardo
        setTimeout(() => {
            const exams = extractExamInfo();
            if (exams.length > 0) {
                showImportPopup(exams);
            }
        }, 2000);
    }
});

// Aggiungi un listener per i messaggi dal background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkForUnimi') {
        const isUnimi = window.location.href.includes('unimi.it');
        sendResponse({ isUnimi });
    }
    return true;
});