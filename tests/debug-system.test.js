/**
 * Test unitari per il sistema di debug
 * Piano di Studi Universitari
 */

// Mock dell'API Chrome
const mockChromeStorage = {
    sync: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        getBytesInUse: jest.fn(),
        QUOTA_BYTES: 102400 // 100KB
    }
};

const mockChromeRuntime = {
    lastError: null,
    getManifest: jest.fn().mockReturnValue({ version: '1.0.0' })
};

global.chrome = {
    storage: mockChromeStorage,
    runtime: mockChromeRuntime
};

// Mock di window e console
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

const mockConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock di performance
const mockPerformance = {
    now: jest.fn()
};

global.performance = mockPerformance;

// Import del sistema di debug
import debugSystem from '../js/debug.js';

describe('Sistema di Debug', () => {
    beforeEach(() => {
        // Reset dei mock
        jest.clearAllMocks();
        
        // Reset del sistema di debug
        debugSystem.isEnabled = true;
        debugSystem.logHistory = [];
        debugSystem.errorHistory = [];
        debugSystem.warningHistory = [];
        debugSystem.performanceMetrics = {};
        debugSystem.storageUsage = {};
        
        // Mock di console
        console.log = mockConsole.log;
        console.warn = mockConsole.warn;
        console.error = mockConsole.error;
        
        // Mock di chrome.storage.sync.get
        mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
            callback({ debugEnabled: true });
        });
        
        // Mock di performance.now
        mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);
    });
    
    afterEach(() => {
        // Ripristina console originale
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });
    
    describe('Funzionalità di logging', () => {
        test('log() dovrebbe aggiungere un messaggio alla cronologia dei log', () => {
            debugSystem.log('Test message');
            
            expect(debugSystem.logHistory.length).toBe(1);
            expect(debugSystem.logHistory[0].message).toBe('Test message');
            expect(debugSystem.logHistory[0].type).toBe('log');
            expect(mockConsole.log).toHaveBeenCalled();
        });
        
        test('warn() dovrebbe aggiungere un avviso alla cronologia degli avvisi', () => {
            debugSystem.warn('Test warning');
            
            expect(debugSystem.warningHistory.length).toBe(1);
            expect(debugSystem.warningHistory[0].message).toBe('Test warning');
            expect(debugSystem.warningHistory[0].type).toBe('warning');
            expect(mockConsole.warn).toHaveBeenCalled();
        });
        
        test('error() dovrebbe aggiungere un errore alla cronologia degli errori', () => {
            const testError = new Error('Test error');
            debugSystem.error('Test error message', testError);
            
            expect(debugSystem.errorHistory.length).toBe(1);
            expect(debugSystem.errorHistory[0].message).toBe('Test error message');
            expect(debugSystem.errorHistory[0].type).toBe('error');
            expect(debugSystem.errorHistory[0].error.name).toBe('Error');
            expect(debugSystem.errorHistory[0].error.message).toBe('Test error');
            expect(mockConsole.error).toHaveBeenCalled();
        });
        
        test('getAllLogs() dovrebbe restituire tutti i log ordinati per timestamp', () => {
            // Aggiungi log con timestamp diversi
            debugSystem.logHistory = [
                { timestamp: '2023-01-01T10:00:00.000Z', message: 'Log 1', type: 'log' }
            ];
            debugSystem.warningHistory = [
                { timestamp: '2023-01-01T11:00:00.000Z', message: 'Warning 1', type: 'warning' }
            ];
            debugSystem.errorHistory = [
                { timestamp: '2023-01-01T09:00:00.000Z', message: 'Error 1', type: 'error' }
            ];
            
            const allLogs = debugSystem.getAllLogs();
            
            expect(allLogs.length).toBe(3);
            expect(allLogs[0].message).toBe('Warning 1'); // Il più recente
            expect(allLogs[1].message).toBe('Log 1');
            expect(allLogs[2].message).toBe('Error 1'); // Il più vecchio
        });
        
        test('clearLogs() dovrebbe cancellare tutte le cronologie', () => {
            // Aggiungi alcuni log
            debugSystem.log('Test log');
            debugSystem.warn('Test warning');
            debugSystem.error('Test error');
            
            // Verifica che i log siano stati aggiunti
            expect(debugSystem.logHistory.length).toBe(1);
            expect(debugSystem.warningHistory.length).toBe(1);
            expect(debugSystem.errorHistory.length).toBe(1);
            
            // Cancella i log
            debugSystem.clearLogs();
            
            // Verifica che i log siano stati cancellati
            expect(debugSystem.logHistory.length).toBe(0);
            expect(debugSystem.warningHistory.length).toBe(0);
            expect(debugSystem.errorHistory.length).toBe(0);
        });
    });
    
    describe('Funzionalità di performance', () => {
        test('tracePerformance() dovrebbe misurare il tempo di esecuzione di una funzione', () => {
            const testFn = jest.fn().mockReturnValue('result');
            
            const result = debugSystem.tracePerformance('testFunction', testFn);
            
            expect(result).toBe('result');
            expect(testFn).toHaveBeenCalled();
            expect(mockPerformance.now).toHaveBeenCalledTimes(2);
            expect(mockConsole.log).toHaveBeenCalledWith(
                expect.stringContaining('Performance [testFunction]'),
                expect.anything()
            );
        });
        
        test('tracePerformance() dovrebbe gestire gli errori', () => {
            const testError = new Error('Test error');
            const testFn = jest.fn().mockImplementation(() => {
                throw testError;
            });
            
            expect(() => {
                debugSystem.tracePerformance('errorFunction', testFn);
            }).toThrow(testError);
            
            expect(testFn).toHaveBeenCalled();
            expect(mockPerformance.now).toHaveBeenCalledTimes(2);
            expect(mockConsole.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in [errorFunction]'),
                expect.anything()
            );
        });
    });
    
    describe('Funzionalità di storage', () => {
        test('analyzeStorageUsage() dovrebbe analizzare l\'utilizzo dello storage', async () => {
            // Mock di chrome.storage.sync.get per restituire dati di test
            mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
                callback({
                    key1: 'short value',
                    key2: { complex: 'object', with: { nested: 'values' } }
                });
            });
            
            const usage = await debugSystem.analyzeStorageUsage();
            
            expect(usage.items).toBeDefined();
            expect(usage.items.key1).toBeDefined();
            expect(usage.items.key2).toBeDefined();
            expect(usage.totalSize).toBeGreaterThan(0);
            expect(usage.totalSizeFormatted).toContain('Bytes');
        });
        
        test('testStorage() dovrebbe testare le funzionalità di storage', async () => {
            // Mock delle funzioni di storage per simulare un test riuscito
            mockChromeStorage.sync.set.mockImplementation((data, callback) => callback());
            mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
                if (keys[0].startsWith('_debug_test_key')) {
                    const testValue = { test: true, timestamp: expect.any(Number) };
                    callback({ [keys[0]]: testValue });
                } else {
                    callback({});
                }
            });
            mockChromeStorage.sync.remove.mockImplementation((key, callback) => callback());
            
            const result = await debugSystem.testStorage();
            
            expect(result).toBe(true);
            expect(mockChromeStorage.sync.set).toHaveBeenCalled();
            expect(mockChromeStorage.sync.get).toHaveBeenCalled();
            expect(mockChromeStorage.sync.remove).toHaveBeenCalled();
        });
    });
    
    describe('Funzionalità di utilità', () => {
        test('formatBytes() dovrebbe formattare i byte in modo leggibile', () => {
            expect(debugSystem.formatBytes(0)).toBe('0 Bytes');
            expect(debugSystem.formatBytes(1023)).toBe('1023 Bytes');
            expect(debugSystem.formatBytes(1024)).toBe('1 KB');
            expect(debugSystem.formatBytes(1048576)).toBe('1 MB');
            expect(debugSystem.formatBytes(1073741824)).toBe('1 GB');
        });
        
        test('escapeHtml() dovrebbe escapare i caratteri HTML', () => {
            const input = '<script>alert("XSS");</script>';
            const expected = '&lt;script&gt;alert(&quot;XSS&quot;);&lt;/script&gt;';
            
            expect(debugSystem.escapeHtml(input)).toBe(expected);
        });
    });
    
    describe('Configurazione', () => {
        test('setEnabled() dovrebbe aggiornare lo stato di abilitazione', async () => {
            await debugSystem.setEnabled(false);
            
            expect(debugSystem.isEnabled).toBe(false);
            expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
                { debugEnabled: false },
                expect.any(Function)
            );
            
            await debugSystem.setEnabled(true);
            
            expect(debugSystem.isEnabled).toBe(true);
            expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
                { debugEnabled: true },
                expect.any(Function)
            );
        });
    });
});