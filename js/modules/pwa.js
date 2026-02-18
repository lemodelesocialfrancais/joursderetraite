/**
 * Module: pwa.js
 * Gestion du Service Worker et de la PWA
 */

import { state } from './state.js';

/**
 * Affiche un indicateur de mode hors ligne
 */
export function showOfflineIndicator() {
    let offlineBanner = document.getElementById('offline-banner');
    if (!offlineBanner) {
        offlineBanner = document.createElement('div');
        offlineBanner.id = 'offline-banner';
        offlineBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background-color: #ff6b6b;
            color: white;
            text-align: center;
            padding: 8px;
            z-index: 10000;
            font-weight: bold;
            font-size: 14px;
        `;
        offlineBanner.innerHTML = "Mode hors ligne - L'application est entièrement fonctionnelle";
        document.body.appendChild(offlineBanner);
    } else {
        offlineBanner.style.display = 'block';
    }
}

/**
 * Cache l'indicateur de mode hors ligne
 */
export function hideOfflineIndicator() {
    const offlineBanner = document.getElementById('offline-banner');
    if (offlineBanner) {
        offlineBanner.style.display = 'none';
    }
}

/**
 * Détecte si l'utilisateur est sur Android
 */
function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

/**
 * Affiche le modal de chargement pour l'installation sur Android
 */
function showAndroidInstallModal() {
    const modal = document.createElement('div');
    modal.id = 'android-install-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(10, 25, 47, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 2rem;
        max-width: 320px;
        width: 90%;
        text-align: center;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Installation en cours';
    title.style.cssText = `
        color: #d4af37;
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        background: linear-gradient(135deg, #d4af37 0%, #e6c55a 50%, #f0d78c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    `;

    const subtitle = document.createElement('p');
    subtitle.id = 'install-subtitle';
    subtitle.textContent = 'L\'installation dure environ 5 secondes';
    subtitle.style.cssText = `
        color: #8892b0;
        font-size: 0.9rem;
        margin: 0 0 1.5rem 0;
        line-height: 1.4;
    `;

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        height: 8px;
        overflow: hidden;
        position: relative;
    `;

    const progressBar = document.createElement('div');
    progressBar.id = 'install-progress-bar';
    progressBar.style.cssText = `
        background: linear-gradient(90deg, #d4af37 0%, #e6c55a 50%, #f0d78c 100%);
        height: 100%;
        width: 0%;
        border-radius: 10px;
        transition: width 0.1s linear;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
    `;

    progressContainer.appendChild(progressBar);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(progressContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Animation de la barre de progression sur 5 secondes
    let progress = 0;
    const duration = 5000; // 5 secondes
    const interval = 50; // mise à jour toutes les 50ms pour plus de fluidité
    const increment = 100 / (duration / interval);

    const progressInterval = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            // Fermer le modal automatiquement à la fin
            setTimeout(() => {
                const modalElement = document.getElementById('android-install-modal');
                if (modalElement) {
                    modalElement.remove();
                }
            }, 500);
        }
        
        const bar = document.getElementById('install-progress-bar');
        if (bar) {
            bar.style.width = progress + '%';
        }
    }, interval);
}

/**
 * Déclenche l'invite d'installation
 */
export function promptInstall() {
    if (state.deferredPrompt) {
        // Afficher le modal de chargement sur Android
        if (isAndroid()) {
            showAndroidInstallModal();
        }

        state.deferredPrompt.prompt();

        state.deferredPrompt.userChoice.then((choiceResult) => {


            const installBtn = document.getElementById('install-btn');
            const snackbar = document.getElementById('pwa-snackbar');

            if (installBtn) {
                installBtn.style.display = 'none';
            }
            if (snackbar) {
                snackbar.classList.remove('show');
            }

            state.deferredPrompt = null;
        });
    }
}

/**
 * Ferme la snackbar
 */
export function dismissSnackbar() {
    const snackbar = document.getElementById('pwa-snackbar');
    if (snackbar) {
        snackbar.classList.remove('show');
        state.snackbarDismissed = true;
        localStorage.setItem('snackbarDismissed', 'true');
    }
}

/**
 * Affiche la snackbar PWA après 2 calculs
 */
export function showPWASnackbar() {
    // Ne pas afficher si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
    }

    // Ne pas afficher si l'utilisateur a déjà fermé la snackbar
    if (state.snackbarDismissed) {
        return;
    }

    // Ne pas afficher si pas d'invite d'installation disponible
    if (!state.deferredPrompt) {
        return;
    }

    const snackbar = document.getElementById('pwa-snackbar');

    if (snackbar) {
        snackbar.classList.remove('hidden');
        setTimeout(() => {
            snackbar.classList.add('show');
        }, 100);
    }
}

/**
 * Initialise le Service Worker et la PWA
 */
export function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js')
                .then(function () {


                    window.addEventListener('beforeinstallprompt', (event) => {

                        event.preventDefault();
                        state.deferredPrompt = event;
                    });
                })
                .catch(function () {

                });
        });

        // Gestion de l'état de connexion
        window.addEventListener('online', function () {

            hideOfflineIndicator();
        });

        window.addEventListener('offline', function () {

            showOfflineIndicator();
        });

        // Note: éviter de forcer un reload ici pour ne pas perturber Lighthouse/FCP
    }

    // Écouter l'événement de calcul terminé pour proposer l'installation
    window.addEventListener('calculationComplete', (event) => {
        const { count } = event.detail;


        // Proposer l'installation après 2 calculs
        if (count >= 2) {
            showPWASnackbar();
        }
    });
}
