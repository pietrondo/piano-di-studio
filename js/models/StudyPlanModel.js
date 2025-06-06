/**
 * Piano di Studi Universitari - Study Plan Model
 * Gestisce i dati e le operazioni CRUD per corsi, esami, sessioni di studio e materiali
 */

class StudyPlanModel {
    constructor() {
        this.courses = [];
        this.exams = [];
        this.studySessions = [];
        this.studyMaterials = [];
    }

    // Carica i dati dal Chrome Storage
    async loadData() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['courses', 'exams', 'studySessions', 'studyMaterials'], (result) => {
                if (result.courses) this.courses = result.courses;
                if (result.exams) this.exams = result.exams;
                if (result.studySessions) this.studySessions = result.studySessions;
                if (result.studyMaterials) this.studyMaterials = result.studyMaterials;
                resolve();
            });
        });
    }

    // Salva i dati nel Chrome Storage
    async saveData() {
        return new Promise((resolve) => {
            chrome.storage.sync.set({
                courses: this.courses,
                exams: this.exams,
                studySessions: this.studySessions,
                studyMaterials: this.studyMaterials
            }, resolve);
        });
    }

    // === GESTIONE CORSI ===

    // Aggiunge un nuovo corso
    async addCourse(course) {
        course.id = Date.now().toString();
        this.courses.push(course);
        await this.saveData();
        return course;
    }

    // Rimuove un corso
    async removeCourse(courseId) {
        this.courses = this.courses.filter(course => course.id !== courseId);
        await this.saveData();
    }

    // Ottiene un corso per ID
    getCourse(courseId) {
        return this.courses.find(course => course.id === courseId);
    }

    // Ottiene tutti i corsi
    getCourses() {
        return this.courses;
    }

    // === GESTIONE ESAMI ===

    // Aggiunge un nuovo esame
    async addExam(exam) {
        exam.id = Date.now().toString();
        this.exams.push(exam);
        await this.saveData();
        return exam;
    }

    // Rimuove un esame
    async removeExam(examId) {
        this.exams = this.exams.filter(exam => exam.id !== examId);
        await this.saveData();
    }

    // Ottiene un esame per ID
    getExam(examId) {
        return this.exams.find(exam => exam.id === examId);
    }

    // Ottiene tutti gli esami
    getExams() {
        return this.exams;
    }

    // Ottiene esami per corso
    getExamsByCourse(courseId) {
        return this.exams.filter(exam => exam.courseId === courseId);
    }

    // === GESTIONE SESSIONI DI STUDIO ===

    // Aggiunge una sessione di studio
    async addStudySession(session) {
        session.id = Date.now().toString();
        session.date = new Date().toISOString();
        this.studySessions.push(session);
        await this.saveData();
        return session;
    }

    // Rimuove una sessione di studio
    async removeStudySession(sessionId) {
        this.studySessions = this.studySessions.filter(session => session.id !== sessionId);
        await this.saveData();
    }

    // Ottiene una sessione per ID
    getStudySession(sessionId) {
        return this.studySessions.find(session => session.id === sessionId);
    }

    // Ottiene tutte le sessioni di studio
    getStudySessions() {
        return this.studySessions;
    }

    // Ottiene sessioni per corso
    getStudySessionsByCourse(courseId) {
        return this.studySessions.filter(session => session.courseId === courseId);
    }

    // === GESTIONE MATERIALI DI STUDIO ===

    // Aggiunge materiale di studio
    async addStudyMaterial(material) {
        material.id = Date.now().toString();
        this.studyMaterials.push(material);
        await this.saveData();
        return material;
    }

    // Rimuove materiale di studio
    async removeStudyMaterial(materialId) {
        this.studyMaterials = this.studyMaterials.filter(material => material.id !== materialId);
        await this.saveData();
    }

    // Ottiene un materiale per ID
    getStudyMaterial(materialId) {
        return this.studyMaterials.find(material => material.id === materialId);
    }

    // Ottiene tutti i materiali di studio
    getStudyMaterials() {
        return this.studyMaterials;
    }

    // Ottiene materiali per corso
    getStudyMaterialsByCourse(courseId) {
        return this.studyMaterials.filter(material => material.courseId === courseId);
    }

    // === STATISTICHE ===

    // Calcola il tempo totale di studio
    getTotalStudyTime() {
        return this.studySessions.reduce((total, session) => total + (session.duration || 0), 0);
    }

    // Calcola il numero totale di sessioni
    getTotalStudySessions() {
        return this.studySessions.length;
    }

    // Ottiene statistiche per corso
    getCourseStats(courseId) {
        const sessions = this.getStudySessionsByCourse(courseId);
        const totalTime = sessions.reduce((total, session) => total + (session.duration || 0), 0);
        const totalSessions = sessions.length;
        const materials = this.getStudyMaterialsByCourse(courseId).length;
        const exams = this.getExamsByCourse(courseId).length;

        return {
            totalTime,
            totalSessions,
            materials,
            exams
        };
    }

    // === BACKUP E RIPRISTINO ===

    // Esporta tutti i dati
    exportData() {
        return {
            courses: this.courses,
            exams: this.exams,
            studySessions: this.studySessions,
            studyMaterials: this.studyMaterials,
            exportDate: new Date().toISOString()
        };
    }

    // Importa dati da backup
    async importData(data) {
        if (data.courses) this.courses = data.courses;
        if (data.exams) this.exams = data.exams;
        if (data.studySessions) this.studySessions = data.studySessions;
        if (data.studyMaterials) this.studyMaterials = data.studyMaterials;
        
        await this.saveData();
    }

    // Pulisce tutti i dati
    async clearAllData() {
        this.courses = [];
        this.exams = [];
        this.studySessions = [];
        this.studyMaterials = [];
        await this.saveData();
    }
}

// Esporta la classe per l'uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyPlanModel;
} else {
    window.StudyPlanModel = StudyPlanModel;
}