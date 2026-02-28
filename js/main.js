/**
 * main.js - Point d'entrée de l'application
 * Importe les modules et initialise les bindings UI
 */

// Imports des modules (critiques au lancement)
import { initInAppRedirect } from './modules/in-app-redirect.js';
import { formatNumberInput, allowOnlyNumbersAndComma, formatNumberOnBlur } from './modules/formatting.js';
import { toggleMethodology, setRandomExample, resetForm, switchMode, updateObjectPrice, handleInput, initCustomDropdowns } from './modules/ui.js';
import { initTheme } from './modules/theme.js';
import { initPWA, promptInstall, dismissSnackbar } from './modules/pwa.js';
import { initDOMCache, DOM } from './modules/dom-cache.js';

const PWA_THEME_COLOR = '#0a192f';
const MOBILE_TAP_GLOW_CLASS = 'mobile-tap-glow';
const MOBILE_TAP_GLOW_DURATION_MS = 2200;

function upsertThemeColorMeta(media) {
    const selector = media
        ? `meta[name="theme-color"][media="${media}"]`
        : 'meta[name="theme-color"]:not([media])';
    let meta = document.head.querySelector(selector);

    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        if (media) {
            meta.setAttribute('media', media);
        }
        document.head.appendChild(meta);
    }

    meta.setAttribute('content', PWA_THEME_COLOR);
}

function forcePwaThemeColor() {
    upsertThemeColorMeta();
    upsertThemeColorMeta('(prefers-color-scheme: light)');
    upsertThemeColorMeta('(prefers-color-scheme: dark)');
}

function initMobileTapFeedback() {
    if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        return;
    }

    const glowTimers = new WeakMap();

    document.addEventListener('click', function (event) {
        const button = event.target.closest('button');
        if (!button || button.disabled) {
            return;
        }

        const previousTimer = glowTimers.get(button);
        if (previousTimer) {
            window.clearTimeout(previousTimer);
        }

        button.classList.remove(MOBILE_TAP_GLOW_CLASS);
        // Force un nouveau cycle visuel même en tap rapide
        void button.offsetWidth;
        button.classList.add(MOBILE_TAP_GLOW_CLASS);

        const timerId = window.setTimeout(function () {
            button.classList.remove(MOBILE_TAP_GLOW_CLASS);
            glowTimers.delete(button);
        }, MOBILE_TAP_GLOW_DURATION_MS);

        glowTimers.set(button, timerId);

        // Évite que le focus reste collé jusqu'au prochain tap
        window.setTimeout(function () {
            if (typeof button.blur === 'function') {
                button.blur();
            }
        }, 40);
    });
}

// Fallback pour les erreurs de chargement des modules
// Cette fonction ne dépend d'aucun module externe
function showFallbackError(message) {
    var fallbackEl = document.getElementById('fallback-message');
    var textEl = document.getElementById('fallback-text');
    if (fallbackEl && textEl) {
        textEl.textContent = message;
        fallbackEl.classList.remove('hidden');
    } else {
        alert(message);
    }
}


// Exposer les fonctions globalement pour compatibilité (anciens handlers inline / cache SW)
window.formatNumberInput = formatNumberInput;
window.allowOnlyNumbersAndComma = allowOnlyNumbersAndComma;
window.formatNumberOnBlur = formatNumberOnBlur;
window.handleInput = handleInput;

// Promise qui se résout quand les modules différés sont chargés
let __deferredResolve;
const __deferredReady = new Promise(resolve => {
    __deferredResolve = resolve;
});

// Placeholders async : attendent le chargement des modules sans polling
window.calculate = async function () {
    await __deferredReady;
    window.__calculate();
};

window.calculateComparison = async function () {
    await __deferredReady;
    window.__calculateComparison();
};

window.toggleMethodology = toggleMethodology;
window.setRandomExample = setRandomExample;
window.resetForm = resetForm;
window.switchMode = switchMode;
window.updateObjectPrice = updateObjectPrice;
window.initCustomDropdowns = initCustomDropdowns;

window.promptInstall = promptInstall;
window.dismissSnackbar = dismissSnackbar;

function bindUIEventListeners() {
    // Toggle de mode
    DOM.temporalModeBtn?.addEventListener('click', function () {
        switchMode('temporal');
    });
    DOM.financialModeBtn?.addEventListener('click', function () {
        switchMode('financial');
    });

    // Saisie mode temporel
    DOM.amount?.addEventListener('input', function () {
        allowOnlyNumbersAndComma(this);
        formatNumberInput(this);
        handleInput();
    });
    DOM.amount?.addEventListener('blur', function () {
        formatNumberOnBlur(this);
    });

    // Actions mode temporel
    document.getElementById('example-btn')?.addEventListener('click', function () {
        setRandomExample();
    });
    document.getElementById('calculate-btn-temporal')?.addEventListener('click', function () {
        if (DOM.amount) {
            formatNumberOnBlur(DOM.amount);
        }
        window.calculate();
    });
    document.getElementById('reset-btn-temporal')?.addEventListener('click', function () {
        resetForm();
    });

    // Saisie mode financier
    DOM.objectTypeSelect?.addEventListener('change', function () {
        updateObjectPrice();

        const selectedValue = this.value;
        const isCustomAmount = selectedValue === 'autre' || selectedValue === '';
        const isFinancialModeActive = DOM.modesContainer?.getAttribute('data-active-mode') === 'financial';

        // Auto-calcul si un élément de la liste est choisi (hors "Montant personnalisé")
        if (isFinancialModeActive && !isCustomAmount) {
            window.calculateComparison();
        }
    });
    DOM.objectPriceInput?.addEventListener('input', function () {
        allowOnlyNumbersAndComma(this);
        formatNumberInput(this);
    });
    DOM.objectPriceInput?.addEventListener('blur', function () {
        formatNumberOnBlur(this);
    });
    document.getElementById('compare-btn-financial')?.addEventListener('click', function () {
        window.calculateComparison();
    });

    // Divers UI
    document.getElementById('methodology-header')?.addEventListener('click', function () {
        toggleMethodology();
    });
    document.getElementById('snackbar-install-btn')?.addEventListener('click', function () {
        promptInstall();
    });
    document.getElementById('snackbar-close-btn')?.addEventListener('click', function () {
        dismissSnackbar();
    });
    document.getElementById('fallback-close-btn')?.addEventListener('click', function () {
        document.getElementById('fallback-message')?.classList.add('hidden');
    });
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function () {
    // Détection et redirection depuis les navigateurs in-app (en premier)
    initInAppRedirect();
    
    forcePwaThemeColor();
    initMobileTapFeedback();

    // Initialiser le cache DOM en premier (tous les autres modules en dépendent)
    initDOMCache();

    // Brancher les événements UI
    bindUIEventListeners();
    
    // Initialiser le thème
    initTheme();

    // Initialiser la PWA
    initPWA();



    // Détection des appareils peu puissants pour optimisations
    (function detectLowPerfDevice() {
        const isLowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        if (isLowCPU || isLowMemory) {
            document.documentElement.classList.add('low-perf-device');
        }
    })();

    // Activer le mode temporel par défaut (critique pour l'affichage initial)
    switchMode('temporal');

    // Gestion de la période personnalisée (le dropdown financier est initialisé à la demande)
    if (DOM.timePeriodSelect && DOM.customPeriodContainer) {
        DOM.timePeriodSelect.addEventListener('change', function () {
            if (this.value === 'custom') {
                DOM.customPeriodContainer.classList.remove('hidden');
            } else {
                DOM.customPeriodContainer.classList.add('hidden');
            }
        });
    }

    // Gestion de la touche Entrée pour le mode temporel
    DOM.amount?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            formatNumberOnBlur(this);
            window.calculate();
        }
    });

    // Gestion de la touche Entrée pour le mode financier
    DOM.objectPriceInput?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            formatNumberOnBlur(this);
            window.calculateComparison();
        }
    });

    // Bateau : priorité max (preload + affichage dès que possible)
    requestAnimationFrame(function showPriorityImages() {
        document.querySelectorAll('img[data-src].pwa-priority-img').forEach(function (img) {
            var url = img.getAttribute('data-src');
            if (url) {
                img.setAttribute('fetchpriority', 'high');
                img.src = url;
                img.removeAttribute('data-src');
            }
        });
    });

    // Autres images PWA : ~1,5 s après
    setTimeout(function loadPwaImages() {
        document.querySelectorAll('img[data-src].pwa-deferred-img').forEach(function (img) {
            var url = img.getAttribute('data-src');
            if (url) {
                img.src = url;
                img.removeAttribute('data-src');
            }
        });
    }, 1500);

    // Charger les modules différés quand le navigateur est inactif
    // Utilise requestIdleCallback pour s'adapter à la puissance de l'appareil
    // Fallback setTimeout pour les anciens navigateurs
    function loadDeferredModules() {
        Promise.all([
            import('./modules/calculator.js'),
            import('./modules/sharing.js')
        ]).then(function (results) {
            var calculator = results[0];
            var sharing = results[1];

            window.__calculate = calculator.calculate;
            window.__calculateComparison = calculator.calculateComparison;

            window.checkSMSCapability = sharing.checkSMSCapability;

            // Initialiser les boutons de partage (clone le template)
            sharing.initShareButtons();

            sharing.checkSMSCapability();
            
            // Résoudre la Promise pour débloquer les appels en attente
            __deferredResolve();
        }).catch(function (err) {
            console.error('Erreur chargement modules différés:', err);
            
            // Fallbacks pour éviter les erreurs si les modules ne chargent pas
            window.__calculate = function () { showFallbackError("Erreur de chargement. Veuillez rafraîchir la page."); };
            window.__calculateComparison = function () { showFallbackError("Erreur de chargement. Veuillez rafraîchir la page."); };
            
            // Résoudre quand même pour débloquer les appels en attente
            __deferredResolve();
        });
    }

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            forcePwaThemeColor();
        }
    });

    if ('requestIdleCallback' in window) {
        requestIdleCallback(loadDeferredModules, { timeout: 2000 });
    } else {
        // Fallback Safari : double rAF + délai adaptatif selon la puissance de l'appareil
        var isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        var baseDelay = isLowEndDevice ? 500 : 200;
        
        setTimeout(function() {
            requestAnimationFrame(function() {
                requestAnimationFrame(loadDeferredModules);
            });
        }, baseDelay);
    }

    // Pré-chauffer le layout du mode financier pour éviter la saccade au premier switch
    // Version simplifiée : force le calcul du layout en arrière-plan pendant l'idle time
    function warmupFinancialModeLayout() {
        if (!DOM.financialInputs || !DOM.financialInputs.hasAttribute('hidden')) return;

        // Rendre visible hors écran, forcer le layout, puis restaurer
        DOM.financialInputs.style.cssText = 'position:absolute;visibility:hidden;top:-9999px;';
        DOM.financialInputs.removeAttribute('hidden');
        
        void DOM.financialInputs.offsetHeight;
        
        DOM.financialInputs.setAttribute('hidden', '');
        DOM.financialInputs.style.cssText = '';
    }

    // Exécuter pendant l'idle time du navigateur
    if ('requestIdleCallback' in window) {
        requestIdleCallback(warmupFinancialModeLayout, { timeout: 2000 });
    } else {
        setTimeout(warmupFinancialModeLayout, 1500);
    }
});
