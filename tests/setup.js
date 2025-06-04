/**
 * Setup globale per i test Jest
 * Piano di Studi Universitari
 */

// Configurazione dell'ambiente DOM per i test
document.body.innerHTML = `
<div id="app">
  <div class="tab-buttons">
    <button class="tab-button active" data-tab="courses">Corsi</button>
    <button class="tab-button" data-tab="calendar">Calendario</button>
    <button class="tab-button" data-tab="study">Studio</button>
    <button class="tab-button" data-tab="materials">Materiali</button>
    <button class="tab-button" data-tab="stats">Statistiche</button>
    <button class="tab-button" data-tab="debug">Debug</button>
  </div>
  
  <div class="tab-content" id="courses-tab">
    <!-- Contenuto tab corsi -->
  </div>
  
  <div class="tab-content" id="calendar-tab" style="display: none;">
    <!-- Contenuto tab calendario -->
  </div>
  
  <div class="tab-content" id="study-tab" style="display: none;">
    <!-- Contenuto tab studio -->
  </div>
  
  <div class="tab-content" id="materials-tab" style="display: none;">
    <!-- Contenuto tab materiali -->
  </div>
  
  <div class="tab-content" id="stats-tab" style="display: none;">
    <!-- Contenuto tab statistiche -->
  </div>
  
  <div class="tab-content" id="debug-tab" style="display: none;">
    <!-- Contenuto tab debug -->
  </div>
</div>
`;

// Mock delle funzioni globali
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock dell'API Chrome se non è già definita
if (!global.chrome) {
  global.chrome = {
    storage: {
      sync: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        getBytesInUse: jest.fn(),
        QUOTA_BYTES: 102400 // 100KB
      }
    },
    runtime: {
      lastError: null,
      getManifest: jest.fn().mockReturnValue({ version: '1.0.0' })
    }
  };
}

// Estensione di Jest con matcher personalizzati
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  }
});

// Funzioni di utilità per i test
global.waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Configurazione dei timeout
jest.setTimeout(10000);