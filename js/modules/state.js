/**
 * Module: state.js
 * État global partagé de l'application
 */

export const state = {
    // Variables pour stocker les résultats
    storedTemporalResult: '',
    storedFinancialResult: '',
    currentExampleLabel: '', // Stocke le label de l'exemple actif (temporel)

    // Variable pour suivre si on est en train de calculer
    isCalculating: false,

    // Variable pour suivre le mode actif
    currentActiveMode: null, // 'temporal' ou 'financial'

    // Variable pour suivre l'événement d'installation différée
    deferredPrompt: null,

    // Compteur de calculs pour l'invitation PWA
    calculationCount: parseInt(localStorage.getItem('calculationCount') || '0', 10),

    // Variable pour suivre si la snackbar a été fermée
    snackbarDismissed: localStorage.getItem('snackbarDismissed') === 'true'
};
