/**
 * main.js - Point d'entrée de l'application
 * Importe tous les modules et expose les fonctions globalement pour les attributs onclick du HTML
 */

// Imports des modules (critiques au lancement)
import { formatNumberInput, allowOnlyNumbersAndComma, formatNumberOnBlur } from './modules/formatting.js';
import { toggleMethodology, setRandomExample, resetForm, switchMode, updateObjectPrice, handleInput, initCustomDropdowns } from './modules/ui.js';
import { initTheme } from './modules/theme.js';
import { initPWA, promptInstall, dismissSnackbar } from './modules/pwa.js';


// Exposer les fonctions globalement pour les attributs onclick dans le HTML
window.formatNumberInput = formatNumberInput;
window.allowOnlyNumbersAndComma = allowOnlyNumbersAndComma;
window.formatNumberOnBlur = formatNumberOnBlur;
window.handleInput = handleInput;

// Placeholders pour calcul / partage si l'utilisateur clique avant le chargement différé (500 ms)
window.calculate = function () {
    if (typeof window.__calculate === 'function') window.__calculate();
    else setTimeout(window.calculate, 100);
};
window.calculateComparison = function () {
    if (typeof window.__calculateComparison === 'function') window.__calculateComparison();
    else setTimeout(window.calculateComparison, 100);
};
window.copyResult = function (mode) {
    if (typeof window.__copyResult === 'function') window.__copyResult(mode);
    else setTimeout(function () { window.copyResult(mode); }, 100);
};
window.shareOnSocial = function (network) {
    if (typeof window.__shareOnSocial === 'function') window.__shareOnSocial(network);
    else setTimeout(function () { window.shareOnSocial(network); }, 100);
};
window.shareVia = function (method) {
    if (typeof window.__shareVia === 'function') window.__shareVia(method);
    else setTimeout(function () { window.shareVia(method); }, 100);
};
window.nativeShare = function (mode) {
    if (typeof window.__nativeShare === 'function') window.__nativeShare(mode);
    else setTimeout(function () { window.nativeShare(mode); }, 100);
};

window.toggleMethodology = toggleMethodology;
window.setRandomExample = setRandomExample;
window.resetForm = resetForm;
window.switchMode = switchMode;
window.updateObjectPrice = updateObjectPrice;
window.initCustomDropdowns = initCustomDropdowns;

window.promptInstall = promptInstall;
window.dismissSnackbar = dismissSnackbar;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function () {
    // Initialiser le thème
    initTheme();

    // Initialiser la PWA
    initPWA();



    // Effet premium de première visite
    try {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hasSeen = localStorage.getItem('sparkleSeen') === 'true';
        if (!prefersReducedMotion && !hasSeen) {
            setTimeout(() => {
                document.body.classList.add('sparkle-pass');
                const primaryBtn = document.querySelector('.btn-primary');
                if (primaryBtn) {
                    primaryBtn.classList.add('one-shot-shimmer');
                }
                localStorage.setItem('sparkleSeen', 'true');

                setTimeout(() => {
                    document.body.classList.remove('sparkle-pass');
                    if (primaryBtn) primaryBtn.classList.remove('one-shot-shimmer');
                }, 1600);
            }, 300);
        }
    } catch {
        // Ignore storage/matchMedia errors
    }

    // Activer le mode temporel par défaut (critique pour l'affichage initial)
    switchMode('temporal');

    // Initialisation différée pour préserver les animations de chargement
    // Mais on initialise les dropdowns plus tôt car ils sont nécessaires pour le mode financier
    const initDeferred = () => {
        // Initialiser les dropdowns personnalisés
        initCustomDropdowns();

        // Gestion de la période personnalisée
        const timePeriodSelect = document.getElementById('time-period');
        const customPeriodContainer = document.getElementById('custom-period-container');

        if (timePeriodSelect && customPeriodContainer) {
            timePeriodSelect.addEventListener('change', function () {
                if (this.value === 'custom') {
                    customPeriodContainer.classList.remove('hidden');
                } else {
                    customPeriodContainer.classList.add('hidden');
                }
            });
        }
    };

    // Initialiser les dropdowns plus tôt (100ms au lieu de 200-400ms)
    // pour éviter le ralentissement au premier changement de mode
    setTimeout(initDeferred, 100);

    // Gestion de la touche Entrée pour le mode temporel
    document.getElementById('amount')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            formatNumberOnBlur(this);
            calculate();
        }
    });

    // Gestion de la touche Entrée pour le mode financier
    document.getElementById('object-price')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            formatNumberOnBlur(this);
            calculateComparison();
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

    // Charger calculator, sharing 600 ms après le lancement (réduit le travail JS au démarrage)
    // Note: examples.js est maintenant importé directement par ui.js
    setTimeout(function loadDeferredModules() {
        Promise.all([
            import('./modules/calculator.js'),
            import('./modules/examples.js'),
            import('./modules/sharing.js')
        ]).then(function (results) {
            var calculator = results[0];
            var examples = results[1];
            var sharing = results[2];

            window.__calculate = calculator.calculate;
            window.__calculateComparison = calculator.calculateComparison;

            window.getRandomExample = examples.getRandomExample;

            window.__copyResult = sharing.copyResult;
            window.__shareOnSocial = sharing.shareOnSocial;
            window.__shareVia = sharing.shareVia;
            window.__nativeShare = sharing.nativeShare;
            window.checkSMSCapability = sharing.checkSMSCapability;

            sharing.checkSMSCapability();
        }).catch(function (err) {
            console.error('Erreur chargement modules différés:', err);
        });
    }, 600);

    // Pré-chauffer le layout du mode financier après le chargement initial
    // Cette technique "layout warming" élimine le ralentissement au premier changement de mode
    // sans impacter les performances de chargement initial
    function warmupFinancialModeLayout() {
        var financialInputs = document.getElementById('financial-inputs');
        if (!financialInputs) return;

        // Sauvegarder l'état de l'attribut hidden
        var hadHiddenAttribute = financialInputs.hasAttribute('hidden');

        // Retirer temporairement l'attribut hidden pour permettre le calcul du layout
        if (hadHiddenAttribute) {
            financialInputs.removeAttribute('hidden');
        }

        // Sauvegarder les styles actuels
        var originalVisibility = financialInputs.style.visibility;
        var originalPosition = financialInputs.style.position;
        var originalTop = financialInputs.style.top;
        var originalLeft = financialInputs.style.left;
        var originalOpacity = financialInputs.style.opacity;
        var originalPointerEvents = financialInputs.style.pointerEvents;
        var originalZIndex = financialInputs.style.zIndex;

        // Rendre l'élément invisible mais présent dans le flux pour le calcul de layout
        financialInputs.style.visibility = 'hidden';
        financialInputs.style.position = 'absolute';
        financialInputs.style.top = '-9999px';
        financialInputs.style.left = '-9999px';
        financialInputs.style.opacity = '0';
        financialInputs.style.pointerEvents = 'none';
        financialInputs.style.zIndex = '-1';

        // Retirer temporairement content-visibility pour forcer le calcul du layout
        financialInputs.style.contentVisibility = 'visible';

        // Forcer un reflow synchrone - c'est ici que le layout est calculé
        void financialInputs.offsetHeight;

        // Restaurer content-visibility pour optimiser le mode caché
        financialInputs.style.contentVisibility = '';

        // Restaurer les styles originaux
        financialInputs.style.visibility = originalVisibility;
        financialInputs.style.position = originalPosition;
        financialInputs.style.top = originalTop;
        financialInputs.style.left = originalLeft;
        financialInputs.style.opacity = originalOpacity;
        financialInputs.style.pointerEvents = originalPointerEvents;
        financialInputs.style.zIndex = originalZIndex;

        // Remettre l'attribut hidden si nécessaire
        if (hadHiddenAttribute) {
            financialInputs.setAttribute('hidden', '');
        }
    }

    // Exécuter le pré-chauffage après un délai suffisant pour ne pas impacter le chargement
    // Utiliser requestIdleCallback si disponible, sinon setTimeout
    if ('requestIdleCallback' in window) {
        requestIdleCallback(function () {
            setTimeout(warmupFinancialModeLayout, 100);
        }, { timeout: 2000 });
    } else {
        setTimeout(warmupFinancialModeLayout, 1500);
    }
});
