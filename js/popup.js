/**
 * Piano di Studi Universitari - Popup Initialization
 * Script di inizializzazione per il popup dell'estensione
 */

// Inizializza l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', async function() {
    try {
        window.studyPlanController = new StudyPlanController();
        await window.studyPlanController.init();
        console.log('Applicazione inizializzata con successo');
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
    }
});