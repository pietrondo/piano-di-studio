/**
 * Configurazione Jest per Piano di Studi Universitari
 */

module.exports = {
  // Ambiente di test
  testEnvironment: 'jsdom',
  
  // Percorsi da ignorare nei test
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Trasformazioni per i file
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Configurazione di Babel per i test
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel)/)',
  ],
  
  // Configurazione della copertura del codice
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/**/*.js',
    '!**/node_modules/**'
  ],
  
  // Configurazione dei reporter
  reporters: ['default'],
  
  // Configurazione dei moduli
  moduleFileExtensions: ['js', 'json'],
  
  // Configurazione dei mock
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Setup globale per i test
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Timeout per i test
  testTimeout: 10000,
  
  // Configurazione verbose
  verbose: true
};