/**
 * Module: toast.js
 * Système de notifications non-bloquantes avec highlight de champs
 */

let toastContainer = null;
let currentToast = null;
let documentClickHandler = null;
let documentClickBindTimer = null;
let toastRemoveTimer = null;
let toastReplaceTimer = null;
let toastAutoCloseTimer = null;

const ICONS = {
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e6c55a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

const DEFAULT_DURATIONS = {
    error: 0,
    warning: 5000,
    success: 3000,
    info: 4000
};
const TOAST_REMOVE_DELAY_MS = 300;
const TOAST_REPLACE_DELAY_MS = 250;
const DOC_CLICK_BIND_DELAY_MS = 100;
const FIELD_HIGHLIGHT_DELAY_MS = 100;
const DEFAULT_HIGHLIGHT_DURATION_MS = 2000;
const CLOSE_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function getContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function clearTimer(timerName) {
    if (timerName === 'documentClickBindTimer' && documentClickBindTimer) {
        clearTimeout(documentClickBindTimer);
        documentClickBindTimer = null;
        return;
    }
    if (timerName === 'toastRemoveTimer' && toastRemoveTimer) {
        clearTimeout(toastRemoveTimer);
        toastRemoveTimer = null;
        return;
    }
    if (timerName === 'toastReplaceTimer' && toastReplaceTimer) {
        clearTimeout(toastReplaceTimer);
        toastReplaceTimer = null;
        return;
    }
    if (timerName === 'toastAutoCloseTimer' && toastAutoCloseTimer) {
        clearTimeout(toastAutoCloseTimer);
        toastAutoCloseTimer = null;
    }
}

function unbindDocumentClickClose() {
    if (documentClickHandler) {
        document.removeEventListener('click', documentClickHandler);
        documentClickHandler = null;
    }
    clearTimer('documentClickBindTimer');
}

function closeToast(toast, immediate) {
    if (!toast) return;

    unbindDocumentClickClose();
    clearTimer('toastAutoCloseTimer');

    if (immediate) {
        toast.remove();
        if (toast === currentToast) {
            currentToast = null;
        }
        return;
    }

    clearTimer('toastRemoveTimer');
    toast.classList.add('toast-out');
    toastRemoveTimer = setTimeout(function() {
        toastRemoveTimer = null;
        toast.remove();
        if (toast === currentToast) {
            currentToast = null;
        }
    }, TOAST_REMOVE_DELAY_MS);
}

export function showToast(message, type, duration) {
    type = type || 'info';

    const container = getContainer();
    const hasExistingToast = currentToast !== null;

    // Si un toast existe déjà, le remplacer avec animation
    if (hasExistingToast) {
        currentToast.classList.remove('toast-out');
        currentToast.classList.add('toast-replacing');

        unbindDocumentClickClose();
        clearTimer('toastAutoCloseTimer');
        clearTimer('toastReplaceTimer');

        const oldToast = currentToast;
        toastReplaceTimer = setTimeout(function() {
            toastReplaceTimer = null;
            oldToast.remove();
        }, TOAST_REPLACE_DELAY_MS);
    }

    // Créer le nouveau toast
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;

    // Animation d'entrée différente si remplacement
    if (hasExistingToast) {
        toast.classList.add('toast-replace-in');
    }

    toast.innerHTML = 
        '<span class="toast-icon">' + (ICONS[type] || ICONS.info) + '</span>' +
        '<span class="toast-message">' + message + '</span>' +
        '<button class="toast-close" aria-label="Fermer la notification">' + CLOSE_ICON_SVG + '</button>';

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeToast(toast);
    });
    
    // Pour tous les types : fermeture au clic n'importe où sur la page
    toast.style.cursor = 'pointer';

    // Créer un handler pour fermer au clic sur le document
    unbindDocumentClickClose();
    documentClickHandler = function() {
        closeToast(toast);
    };

    // Ajouter le handler avec un petit délai pour éviter que le clic actuel ne ferme immédiatement
    documentClickBindTimer = setTimeout(function() {
        documentClickBindTimer = null;
        document.addEventListener('click', documentClickHandler);
    }, DOC_CLICK_BIND_DELAY_MS);

    container.appendChild(toast);
    currentToast = toast;

    // Auto-fermeture (sauf pour les erreurs)
    const actualDuration = duration !== undefined ? duration : DEFAULT_DURATIONS[type];
    clearTimer('toastAutoCloseTimer');
    if (actualDuration > 0) {
        toastAutoCloseTimer = setTimeout(function() {
            toastAutoCloseTimer = null;
            closeToast(toast);
        }, actualDuration);
    }

    return toast;
}

export function highlightField(fieldId, duration) {
    duration = duration || DEFAULT_HIGHLIGHT_DURATION_MS;

    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.add('field-error');
    field.focus();

    setTimeout(function() {
        field.classList.remove('field-error');
    }, duration);
}

export function showError(message, fieldId) {
    showToast(message, 'error', 0);
    if (fieldId) {
        setTimeout(function() {
            highlightField(fieldId);
        }, FIELD_HIGHLIGHT_DELAY_MS);
    }
}

export function showSuccess(message) {
    showToast(message, 'success', 3000);
}

export function showWarning(message, fieldId) {
    showToast(message, 'warning', 5000);
    if (fieldId) {
        setTimeout(function() {
            highlightField(fieldId);
        }, FIELD_HIGHLIGHT_DELAY_MS);
    }
}

export function showInfo(message) {
    showToast(message, 'info', 4000);
}
