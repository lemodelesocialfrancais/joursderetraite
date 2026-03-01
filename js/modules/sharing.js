/**
 * Module: sharing.js
 * Fonctions de partage sur les réseaux sociaux
 */

import { state } from './state.js';
import { showError, showWarning, showSuccess } from './toast.js';

// === URL DE PARTAGE ===
const SHARE_URL = 'https://lemodelesocialfrancais.github.io/joursderetraite/';

// === REGEX PARTAGÉES (pré-compilées pour performance) ===
const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const INSTAGRAM_WEB_URL = 'https://www.instagram.com/';
const INSTAGRAM_MOBILE_CAMERA_URL = 'instagram://camera';
const SNAPCHAT_WEB_URL = 'https://web.snapchat.com/';
const SNAPCHAT_MOBILE_URL = 'https://www.snapchat.com/';
const TIKTOK_WEB_URL = 'https://www.tiktok.com/upload';
const TIKTOK_MOBILE_URL = 'https://www.tiktok.com/';
const TUMBLR_WEB_URL = 'https://www.tumblr.com/new/photo';
const INSTAGRAM_MODAL_ID = 'instagram-share-modal';
const INSTAGRAM_MODAL_OVERLAY_ID = 'instagram-share-overlay';
const INSTAGRAM_DRAG_FILENAME = 'jours-de-retraite-instagram.png';
const SNAPCHAT_DRAG_FILENAME = 'jours-de-retraite-snapchat.png';
const TIKTOK_DRAG_FILENAME = 'jours-de-retraite-tiktok.png';
const TUMBLR_DRAG_FILENAME = 'jours-de-retraite-tumblr.png';

let closeInstagramModal = null;

/**
 * Génère un nom de fichier unique avec horodatage
 * @param {string} baseName - Nom de base (ex: 'jours-de-retraite-tiktok')
 * @param {string} extension - Extension (ex: 'png')
 * @returns {string} Nom unique (ex: 'jours-de-retraite-tiktok-20260301-1248.png')
 */
function generateUniqueFilename(baseName, extension) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `${baseName}-${stamp}.${extension}`;
}

/**
 * Affiche une notification système native
 * @param {string} title - Titre de la notification
 * @param {string} body - Corps du message
 */
function showSystemNotification(title, body) {
    if (!('Notification' in window)) {
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'share-notification',
            requireInteraction: false
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    tag: 'share-notification',
                    requireInteraction: false
                });
            }
        });
    }
}

/**
 * Détecte si l'utilisateur est sur mobile
 * @returns {boolean}
 */
function isMobile() {
    return MOBILE_REGEX.test(navigator.userAgent);
}

/**
 * Détecte si l'utilisateur est sur un ordinateur
 * @returns {boolean}
 */
export function isDesktop() {
    return !isMobile();
}

/**
 * Ouvre une popup de partage centrée (desktop)
 * @param {string} url
 * @param {string} popupName
 * @param {number} width
 * @param {number} height
 * @returns {Window|null}
 */
function openCenteredSharePopup(url, popupName = 'share-popup', width = 740, height = 760) {
    const screenLeft = typeof window.screenLeft !== 'undefined' ? window.screenLeft : window.screenX;
    const screenTop = typeof window.screenTop !== 'undefined' ? window.screenTop : window.screenY;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

    const left = Math.max(0, Math.round(screenLeft + (viewportWidth - width) / 2));
    const top = Math.max(0, Math.round(screenTop + (viewportHeight - height) / 2));
    const features = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'scrollbars=yes',
        'resizable=yes',
        'toolbar=no',
        'menubar=no',
        'location=no',
        'status=no'
    ].join(',');

    const popup = window.open(url, popupName, features);
    if (popup && typeof popup.focus === 'function') {
        popup.focus();
    }

    return popup;
}

/**
 * Stratégie d'ouverture des liens de partage:
 * - Desktop: popup centrée avec fallback nouvel onglet
 * - Mobile: navigation directe (permet le réveil de l'app native si disponible)
 * @param {string} url
 * @param {string} popupName
 * @param {number} width
 * @param {number} height
 */
function openShareUrlWithDeviceStrategy(url, popupName = 'social-share', width = 760, height = 760) {
    if (!url) return;

    if (isDesktop()) {
        const popup = openCenteredSharePopup(url, popupName, width, height);
        if (!popup) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        return;
    }

    window.location.href = url;
}

/**
 * Tente d'ouvrir une app mobile via deep link, puis fallback web si l'app n'est pas disponible.
 * @param {string} appUrl
 * @param {string} fallbackUrl
 * @param {number} timeoutMs
 */
function openMobileAppWithFallback(appUrl, fallbackUrl, timeoutMs = 1200) {
    let appOpened = false;
    let timerId = null;

    function cleanup() {
        if (timerId) {
            window.clearTimeout(timerId);
            timerId = null;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handlePageHide);
    }

    function markAppOpened() {
        appOpened = true;
        cleanup();
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            markAppOpened();
        }
    }

    function handlePageHide() {
        markAppOpened();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    timerId = window.setTimeout(function () {
        if (!appOpened && fallbackUrl) {
            window.location.href = fallbackUrl;
        }
        cleanup();
    }, timeoutMs);

    window.location.href = appUrl;
}

/**
 * Vérifie si la copie d'image vers le presse-papiers est supportée
 * @returns {boolean}
 */
function supportsImageClipboard() {
    return window.isSecureContext &&
        typeof navigator.clipboard?.write === 'function' &&
        typeof window.ClipboardItem !== 'undefined';
}

/**
 * Garantit un Blob PNG, requis par ClipboardItem
 * @param {Blob} sourceBlob
 * @returns {Promise<Blob>}
 */
function ensurePngBlob(sourceBlob) {
    if (sourceBlob && sourceBlob.type === 'image/png') {
        return Promise.resolve(sourceBlob);
    }

    return new Promise((resolve, reject) => {
        if (!sourceBlob) {
            reject(new Error('Blob image introuvable'));
            return;
        }

        const objectUrl = URL.createObjectURL(sourceBlob);
        const image = new Image();

        image.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Canvas indisponible'));
                return;
            }

            ctx.drawImage(image, 0, 0);
            canvas.toBlob(function (pngBlob) {
                URL.revokeObjectURL(objectUrl);
                if (!pngBlob) {
                    reject(new Error('Conversion PNG impossible'));
                    return;
                }
                resolve(pngBlob);
            }, 'image/png');
        };

        image.onerror = function () {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Impossible de convertir l'image en PNG"));
        };

        image.src = objectUrl;
    });
}

/**
 * Ferme le modal Instagram actif (si présent)
 */
function closeInstagramShareModal() {
    if (typeof closeInstagramModal === 'function') {
        closeInstagramModal();
        closeInstagramModal = null;
    }
}


/**
 * Ouvre un modal desktop pour partager une image (Instagram/Snapchat)
 * @param {Object} options
 * @param {string} options.imageUrl
 * @param {string} [options.imageAlt]
 * @param {string} [options.openUrl]
 * @param {string} [options.openPopupName]
 * @param {number} [options.openPopupWidth]
 * @param {number} [options.openPopupHeight]
 * @param {Blob|null} [options.imageBlob]
 * @param {string} [options.filename]
 * @param {string} [options.modalTitle]
 * @param {string} [options.modalInstructions]
 * @param {string} [options.dragHintText]
 * @param {string} [options.openButtonLabel]
 * @param {boolean} [options.enableClipboard]
 * @param {Function} [options.onClose]
 * @param {Function} [options.onOpenPlatform]
 */
export function openInstagramDesktopShareModal(options = {}) {
    const imageUrl = options.imageUrl;
    const imageAlt = options.imageAlt || 'Image à partager';
    const imageBlob = options.imageBlob instanceof Blob ? options.imageBlob : null;
    const filename = typeof options.filename === 'string' && options.filename
        ? options.filename
        : INSTAGRAM_DRAG_FILENAME;
    const onClose = typeof options.onClose === 'function' ? options.onClose : null;
    const onOpenPlatform = typeof options.onOpenPlatform === 'function' ? options.onOpenPlatform : null;

    const openUrl = options.openUrl || options.instagramUrl || INSTAGRAM_WEB_URL;
    const openPopupName = options.openPopupName || 'instagram-web-share';
    const openPopupWidth = Number(options.openPopupWidth) || 1100;
    const openPopupHeight = Number(options.openPopupHeight) || 820;
    const enableClipboard = options.enableClipboard === true;

    const modalTitle = options.modalTitle || 'Partager sur Instagram';
    const modalInstructions = options.modalInstructions || "Étape 1 : Sauvegardez l'image. Étape 2 : Ouvrez Instagram, cliquez sur Créer (+), puis importez l'image enregistrée.";
    const dragHintText = options.dragHintText || "Vous pouvez aussi glisser-déposer l'image vers la zone d'import.";
    const openButtonLabel = options.openButtonLabel || 'Ouvrir';

    if (!imageUrl) {
        showWarning("Aucune image disponible pour le partage.");
        return;
    }

    closeInstagramShareModal();

    const overlay = document.createElement('div');
    overlay.id = INSTAGRAM_MODAL_OVERLAY_ID;
    overlay.className = 'instagram-share-overlay';

    const modal = document.createElement('div');
    modal.id = INSTAGRAM_MODAL_ID;
    modal.className = 'instagram-share-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'instagram-share-title');

    const title = document.createElement('h3');
    title.id = 'instagram-share-title';
    title.className = 'instagram-share-title';
    title.textContent = modalTitle;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'instagram-share-close';
    closeBtn.setAttribute('aria-label', 'Fermer la fenêtre de partage');
    closeBtn.innerHTML = '&times;';

    const header = document.createElement('div');
    header.className = 'instagram-share-header';
    header.appendChild(title);
    header.appendChild(closeBtn);

    const instructions = document.createElement('p');
    instructions.className = 'instagram-share-instructions';
    instructions.textContent = modalInstructions;

    const imageWrap = document.createElement('div');
    imageWrap.className = 'instagram-share-image-wrap';

    const imageEl = document.createElement('img');
    imageEl.className = 'instagram-share-image';
    imageEl.src = imageUrl;
    imageEl.alt = imageAlt;
    imageEl.draggable = true;
    imageEl.setAttribute('draggable', 'true');
    imageWrap.appendChild(imageEl);

    const dragHint = document.createElement('p');
    dragHint.className = 'instagram-share-drag-hint';
    dragHint.textContent = dragHintText;

    const actions = document.createElement('div');
    actions.className = 'instagram-share-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'instagram-share-save-btn';
    saveBtn.textContent = "Sauvegarder l'image";

    const openPlatformBtn = document.createElement('a');
    openPlatformBtn.className = 'instagram-share-open-btn';
    openPlatformBtn.textContent = openButtonLabel;

    if (onOpenPlatform) {
        openPlatformBtn.href = '#';
    } else {
        openPlatformBtn.href = openUrl;
        // Pour les liens Web classiques sur Desktop, target="_blank" est souhaitable.
        // Sur Mobile, on évite target="_blank" pour TOUS les liens (y compris http)
        // car cela permet à l'OS d'intercepter les Universal Links (Instagram, etc.) 
        // ou les Deep Links (TikTok) sans ouvrir d'onglet vide fantôme.
        if (!isMobile() && openUrl && (openUrl.startsWith('http') || openUrl.startsWith('https'))) {
            openPlatformBtn.target = '_blank';
            openPlatformBtn.rel = 'noopener noreferrer';
        }
    }

    let copyBtn = null;
    if (enableClipboard) {
        copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'instagram-share-copy-btn';
        copyBtn.textContent = "Copier l'image";
        actions.appendChild(copyBtn);
    }

    actions.appendChild(saveBtn);
    actions.appendChild(openPlatformBtn);

    modal.appendChild(header);
    modal.appendChild(instructions);
    modal.appendChild(imageWrap);
    if (dragHintText) {
        modal.appendChild(dragHint);
    }
    modal.appendChild(actions);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    let modalClosed = false;
    let copyInProgress = false;
    const dragBlobPng = imageBlob;

    function finalizeClose() {
        if (modalClosed) return;
        modalClosed = true;
        document.removeEventListener('keydown', handleEscape);
        overlay.removeEventListener('click', handleOverlayClick);
        closeBtn.removeEventListener('click', finalizeClose);
        saveBtn.removeEventListener('click', handleSaveClick);
        openPlatformBtn.removeEventListener('click', handleOpenPlatformClick);
        if (copyBtn) {
            copyBtn.removeEventListener('click', handleCopyClick);
        }

        overlay.remove();
        modal.remove();

        if (typeof onClose === 'function') {
            onClose();
        }

        if (closeInstagramModal === finalizeClose) {
            closeInstagramModal = null;
        }
    }

    function handleSaveClick() {
        if (modalClosed) return;
        try {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = filename;
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSuccess("Sauvegarde de l'image lancée.");
        } catch (error) {
            console.error('Erreur sauvegarde image:', error);
            showError("Impossible de sauvegarder l'image automatiquement.");
        }
    }

    function handleOpenPlatformClick(e) {
        if (onOpenPlatform) {
            e.preventDefault();
            onOpenPlatform();
        } else if (openPlatformBtn.href === '#' || !openPlatformBtn.href) {
            e.preventDefault();
            openShareUrlWithDeviceStrategy(
                openUrl,
                openPopupName,
                openPopupWidth,
                openPopupHeight
            );
        }
    }

    async function resolvePngBlobForClipboard() {
        if (imageBlob) {
            return ensurePngBlob(imageBlob);
        }

        const response = await fetch(imageUrl, { mode: 'cors' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const sourceBlob = await response.blob();
        return ensurePngBlob(sourceBlob);
    }

    async function handleCopyClick() {
        if (!copyBtn || modalClosed || copyInProgress) return;

        if (!supportsImageClipboard()) {
            showWarning("Votre navigateur ne permet pas la copie d'image. Utilisez la sauvegarde ou le glisser-déposer.");
            return;
        }

        copyInProgress = true;
        const defaultLabel = "Copier l'image";
        copyBtn.disabled = true;
        copyBtn.textContent = 'Copie...';

        try {
            const pngBlob = await resolvePngBlobForClipboard();
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': pngBlob
                })
            ]);

            showSuccess("Image copiée dans le presse-papiers.");
            copyBtn.textContent = 'Copiée !';
            setTimeout(function () {
                if (!modalClosed && copyBtn) {
                    copyBtn.textContent = defaultLabel;
                    copyBtn.disabled = false;
                }
            }, 1200);
        } catch (error) {
            console.error('Erreur copie image:', error);
            showError("Impossible de copier l'image automatiquement.");
            if (!modalClosed) {
                copyBtn.textContent = defaultLabel;
                copyBtn.disabled = false;
            }
        } finally {
            copyInProgress = false;
        }
    }

    function handleEscape(event) {
        if (event.key === 'Escape') {
            finalizeClose();
        }
    }

    function handleOverlayClick(event) {
        if (event.target === overlay) {
            finalizeClose();
        }
    }

    imageEl.addEventListener('dragstart', function (event) {
        if (!event.dataTransfer) return;

        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.dropEffect = 'copy';
        event.dataTransfer.setData('text/uri-list', imageUrl);
        event.dataTransfer.setData('text/plain', imageUrl);
        event.dataTransfer.setData('DownloadURL', `image/png:${filename}:${imageUrl}`);

        if (dragBlobPng && event.dataTransfer.items && typeof event.dataTransfer.items.add === 'function') {
            try {
                const dragFile = new File([dragBlobPng], filename, { type: 'image/png' });
                event.dataTransfer.items.add(dragFile);
            } catch (dragError) {
                console.warn('Ajout de fichier au drag indisponible:', dragError);
            }
        }
    });

    closeBtn.addEventListener('click', finalizeClose);
    overlay.addEventListener('click', handleOverlayClick);
    saveBtn.addEventListener('click', handleSaveClick);
    openPlatformBtn.addEventListener('click', handleOpenPlatformClick);
    if (copyBtn) {
        copyBtn.addEventListener('click', handleCopyClick);
    }
    document.addEventListener('keydown', handleEscape);

    closeInstagramModal = finalizeClose;
}

/**
 * Ouvre le modal desktop pour Snapchat
 * @param {Object} options
 */
function openSnapchatDesktopShareModal(options = {}) {
    openInstagramDesktopShareModal({
        ...options,
        modalTitle: 'Partager sur Snapchat',
        modalInstructions: "Étape 1 : Copiez ou sauvegardez l'image. Étape 2 : Ouvrez Snapchat dans la popup, puis importez ou collez l'image.",
        dragHintText: "Vous pouvez aussi glisser-déposer l'image vers Snapchat Web.",
        openButtonLabel: 'Ouvrir Snapchat',
        openUrl: SNAPCHAT_WEB_URL,
        openPopupName: 'snapchat-web-share',
        openPopupWidth: 1100,
        openPopupHeight: 820,
        enableClipboard: true,
        filename: options.filename || SNAPCHAT_DRAG_FILENAME
    });
}

/**
 * Ouvre le modal desktop pour TikTok
 * @param {Object} options
 */
function openTiktokDesktopShareModal(options = {}) {
    openInstagramDesktopShareModal({
        ...options,
        modalTitle: 'Partager sur TikTok',
        modalInstructions: "Étape 1 : Copiez ou sauvegardez l'image. Étape 2 : Ouvrez TikTok dans la popup, puis importez l'image.",
        dragHintText: "Vous pouvez aussi glisser-déposer l'image vers TikTok Web.",
        openButtonLabel: 'Ouvrir TikTok',
        openUrl: TIKTOK_WEB_URL,
        openPopupName: 'tiktok-web-share',
        openPopupWidth: 1100,
        openPopupHeight: 820,
        enableClipboard: true,
        filename: options.filename || TIKTOK_DRAG_FILENAME
    });
}

/**
 * Ouvre le modal desktop pour Tumblr
 * @param {Object} options
 */
function openTumblrDesktopShareModal(options = {}) {
    openInstagramDesktopShareModal({
        ...options,
        modalTitle: 'Partager sur Tumblr',
        modalInstructions: "Étape 1 : Copiez, sauvegardez ou glissez-déposez l'image. Étape 2 : Ouvrez Tumblr dans la popup, créez un post photo, puis importez l'image.",
        dragHintText: "Vous pouvez aussi glisser-déposer l'image directement dans l'éditeur Tumblr.",
        openButtonLabel: 'Ouvrir Tumblr',
        openUrl: TUMBLR_WEB_URL,
        openPopupName: 'tumblr-web-share',
        openPopupWidth: 1100,
        openPopupHeight: 820,
        enableClipboard: true,
        filename: options.filename || TUMBLR_DRAG_FILENAME
    });
}

/**
 * Initialise les boutons de partage en clonant le template
 * et en configurant l'event delegation
 */
export function initShareButtons() {
    const template = document.getElementById('share-buttons-template');
    if (!template) {
        console.error('Template share-buttons-template introuvable');
        return;
    }

    const temporalShareSection = document.querySelector('#result-section-temporal .share-section');
    const financialShareSection = document.querySelector('#result-section-financial .share-section');

    if (temporalShareSection) {
        const temporalButtons = template.content.cloneNode(true);
        temporalShareSection.querySelector('.share-buttons').appendChild(temporalButtons);
    }

    if (financialShareSection) {
        const financialButtons = template.content.cloneNode(true);
        financialShareSection.querySelector('.share-buttons').appendChild(financialButtons);
    }

    document.addEventListener('click', handleShareClick);
}

/**
 * Gestionnaire d'événements pour les boutons de partage et copie
 * @param {Event} e - L'événement de clic
 */
function handleShareClick(e) {
    const btn = e.target.closest('[data-platform], [data-action]');
    if (!btn) return;

    const platform = btn.dataset.platform;
    const action = btn.dataset.action;

    if (action === 'copy') {
        copyResult(state.currentActiveMode);
    } else if (action === 'native-share') {
        nativeShare(state.currentActiveMode);
    } else if (action === 'email') {
        shareVia('email');
    } else if (action === 'sms') {
        shareVia('sms');
    } else if (platform) {
        shareOnSocial(platform);
    }
}

/**
 * Extrait le résultat depuis le DOM (fallback si l'état global est vide)
 * @param {string} mode - 'temporal' ou 'financial'
 * @returns {string|null} Le texte du résultat ou null
 */
function extractResultFromDOM(mode) {
    if (mode === 'temporal') {
        const temporalGrid = document.querySelector('.result-grid-temporal');
        if (temporalGrid) {
            const boxes = temporalGrid.querySelectorAll('.result-box');
            const parts = [];
            boxes.forEach(box => {
                const val = box.querySelector('.value span')?.textContent || '';
                const label = box.querySelector('.label')?.textContent || '';
                parts.push(`${val} ${label}`);
            });
            return parts.join(' ');
        }
        return document.getElementById('result-text-temporal')?.textContent || null;
    } else {
        const comparisonEl = document.getElementById('comparison-result-text-financial');
        const comparisonText = comparisonEl?.textContent || '';
        return comparisonText.trim() || document.getElementById('result-text-financial')?.textContent || null;
    }
}

/**
 * Récupère le texte du résultat (commun à copyResult et getShareMessage)
 * @param {string} mode - 'temporal' ou 'financial'
 * @returns {string|null} Le texte du résultat ou null si vide
 */
function getResultText(mode) {
    // Priorité : état global
    let resultText = mode === 'temporal'
        ? state.storedTemporalResult
        : state.storedFinancialResult;

    // Fallback : DOM
    if (!resultText?.trim()) {
        console.warn("Résultat stocké vide, tentative de récupération depuis le DOM...");
        resultText = extractResultFromDOM(mode);
    }

    return resultText?.trim() || null;
}

/**
 * Copie le résultat dans le presse-papiers
 * @param {string} mode - 'temporal' ou 'financial'
 */
export function copyResult(mode = 'temporal') {
    const message = getShareMessage(mode, true);
    const copyBtn = document.querySelector(`#result-section-${mode} .copy-btn`);

    if (!copyBtn) {
        console.error("Bouton de copie introuvable");
    }

    if (!message) {
        showWarning("Aucun résultat à copier. Veuillez d'abord effectuer un calcul.");
        return;
    }

    navigator.clipboard.writeText(message).then(function () {
        if (copyBtn) {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(function () {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        }
    }).catch(function (err) {
        console.error('Erreur lors de la copie: ', err);
        showError("Erreur lors de la copie. Vérifiez les permissions de votre navigateur.");
    });
}

/**
 * Génère le message de partage
 * @param {string} mode - 'temporal' ou 'financial'
 * @param {boolean} includeUrl - Inclure l'URL dans le message (défaut: true)
 * @returns {string} Le message formaté
 */
function getShareMessage(mode, includeUrl = true) {
    const resultText = getResultText(mode);

    if (!resultText) {
        return null;
    }

    const currentUrl = SHARE_URL;

    let message;
    if (mode === 'temporal') {
        let description;

        // Si c'est un exemple, on utilise le label de l'exemple
        if (state.currentExampleLabel) {
            description = state.currentExampleLabel;
            message = `${description} représentent ${resultText} de prestations retraites (base + complémentaires).`;
        } else {
            // Sinon c'est un montant personnalisé, on utilise le montant formaté
            const amountInput = document.getElementById('amount');
            const amountValue = amountInput ? parseFloat(amountInput.value.replace(/\u00A0/g, '').replace(/,/g, '.')) : 0;

            description = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0
            }).format(amountValue);

            message = `${description} représentent ${resultText} de prestations retraites (base + complémentaires).`;
        }

        message = message.charAt(0).toUpperCase() + message.slice(1);
    } else {
        const comparisonShort = resultText.replace(/\.$/, '');
        message = `${comparisonShort}.`;
    }

    if (includeUrl) {
        const displayUrl = currentUrl.replace(/^https?:\/\//, '');
        // On affiche l'URL simplifiée à la fin du message
        message += `\nÀ vous de tester sur :\n${displayUrl}`;
        console.log('Final message with URL:', message);
    }

    return message;
}

/**
 * Génère une image dynamique avec le texte du résultat pour Pinterest
 * @param {string} mode - 'temporal' ou 'financial'
 * @returns {Promise<Blob>} Le blob de l'image générée
 */
async function generateShareImageBlob(mode) {
    const resultText = getResultText(mode);
    if (!resultText) {
        return null;
    }

    // Créer le canvas - format carré Pinterest
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Dimensions carrées (1000x1000)
    canvas.width = 1000;
    canvas.height = 1000;

    // Fond dégradé (bleu marine et doré, thème du site)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#112240');
    gradient.addColorStop(1, '#0a192f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ajouter une bordure dorée
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Titre principal
    ctx.fillStyle = '#e6c55a';
    ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JOURS DE RETRAITE', canvas.width / 2, 80);

    // Ligne décorative
    ctx.beginPath();
    ctx.moveTo(100, 110);
    ctx.lineTo(canvas.width - 100, 110);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Préparer le texte du résultat - UTILISER L'EXEMPLE AU LIEU DU MONTANT
    let fullText;
    if (mode === 'temporal') {
        // Utiliser le label de l'exemple au lieu du montant
        if (state.currentExampleLabel) {
            // Capitaliser la première lettre
            const label = state.currentExampleLabel.charAt(0).toUpperCase() + state.currentExampleLabel.slice(1);
            fullText = `${label}\nreprésente\n${resultText}\nde prestations retraites\n(base + complémentaires).`;
        } else {
            // Fallback vers le montant si pas d'exemple
            const amountInput = document.getElementById('amount');
            const amountValue = amountInput ? parseFloat(amountInput.value.replace(/\u00A0/g, '').replace(/,/g, '.')) : 0;
            const formattedAmount = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0
            }).format(amountValue);
            fullText = `${formattedAmount}\nreprésentent\n${resultText}\nde prestations retraites\n(base + complémentaires).`;
        }
    } else {
        fullText = `${resultText}\n(base + complémentaires).`;
    }

    // Mise en page : garantir que le texte reste au-dessus de l'icône
    const textMaxWidth = canvas.width - 120;
    const textTop = 155;
    const iconSize = 320;
    const iconY = 590;
    const textBottom = iconY - 45;
    const textMaxHeight = textBottom - textTop;

    const fittedText = fitWrappedTextBlock(ctx, fullText, {
        maxWidth: textMaxWidth,
        maxHeight: textMaxHeight,
        maxFontSize: 50,
        minFontSize: 20,
        lineHeightRatio: 1.25
    });

    const centeredTextStartY = textTop + Math.max(0, (textMaxHeight - fittedText.totalHeight) / 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fittedText.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textBaseline = 'top';

    fittedText.lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, centeredTextStartY + index * fittedText.lineHeight);
    });
    ctx.textBaseline = 'alphabetic';

    // Ajouter l'icône dans la moitié inférieure
    return new Promise((resolve) => {
        const iconUrl = 'https://lemodelesocialfrancais.github.io/joursderetraite/icon-512x512.png';
        const iconImg = new Image();
        iconImg.crossOrigin = 'anonymous';
        iconImg.onload = function () {
            // Dessiner l'icône dans la zone basse sans chevauchement du texte
            const iconX = (canvas.width - iconSize) / 2;
            ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);

            // URL en bas - PLUS GRAND et plus haut
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('lemodelesocialfrancais.github.io/joursderetraite', canvas.width / 2, 960);

            // Convertir en Blob
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        };
        iconImg.onerror = function () {
            // Si l'icône ne charge pas, résoudre avec le texte seulement
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('lemodelesocialfrancais.github.io/joursderetraite', canvas.width / 2, 960);
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        };
        iconImg.src = iconUrl;
    });
}

/**
 * Ajuste automatiquement la taille de police pour faire tenir un bloc de texte
 * dans une zone de largeur/hauteur donnée.
 * @param {CanvasRenderingContext2D} ctx - Contexte canvas
 * @param {string} text - Texte à afficher
 * @param {Object} options - Paramètres de fitting
 * @returns {{ lines: string[], fontSize: number, lineHeight: number, totalHeight: number }}
 */
function fitWrappedTextBlock(ctx, text, options) {
    const maxWidth = options.maxWidth;
    const maxHeight = options.maxHeight;
    const maxFontSize = options.maxFontSize || 50;
    const minFontSize = options.minFontSize || 20;
    const lineHeightRatio = options.lineHeightRatio || 1.25;
    const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 2) {
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        const lines = wrapText(ctx, text, maxWidth);
        const lineHeight = Math.round(fontSize * lineHeightRatio);
        const totalHeight = lines.length * lineHeight;

        if (totalHeight <= maxHeight) {
            return { lines, fontSize, lineHeight, totalHeight };
        }
    }

    // Filet de sécurité : taille minimale
    ctx.font = `bold ${minFontSize}px ${fontFamily}`;
    const fallbackLines = wrapText(ctx, text, maxWidth);
    const fallbackLineHeight = Math.round(minFontSize * lineHeightRatio);

    return {
        lines: fallbackLines,
        fontSize: minFontSize,
        lineHeight: fallbackLineHeight,
        totalHeight: fallbackLines.length * fallbackLineHeight
    };
}

/**
 * Fonction helper pour gérer le retour à la ligne du texte
 * @param {CanvasRenderingContext2D} ctx - Contexte canvas
 * @param {string} text - Texte à wraps
 * @param {number} maxWidth - Largeur maximale
 * @returns {string[]} Tableau de lignes
 */
function wrapText(ctx, text, maxWidth) {
    const lines = [];
    const paragraphs = String(text).split('\n');

    paragraphs.forEach(paragraph => {
        const words = paragraph.trim().split(/\s+/).filter(Boolean);

        if (words.length === 0) {
            lines.push('');
            return;
        }

        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = `${currentLine} ${word}`;
            const width = ctx.measureText(testLine).width;
            if (width <= maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }

        lines.push(currentLine);
    });

    return lines;
}

/**
 * Partage sur les réseaux sociaux
 * @param {string} platform - La plateforme cible
 */
export function shareOnSocial(platform) {
    // Ces plateformes reçoivent l'URL via un paramètre séparé, donc on ne l'inclut pas dans le message
    const platformsWithUrlParam = ['facebook', 'messenger', 'reddit', 'tumblr'];
    const platformsWithImageParam = ['pinterest'];
    const includeUrl = !platformsWithUrlParam.includes(platform);
    const includeImage = platformsWithImageParam.includes(platform);

    const message = getShareMessage(state.currentActiveMode, includeUrl);
    const currentUrl = SHARE_URL;

    // Génère l'URL de partage pour chaque plateforme au moment de l'appel
    let shareUrl;
    const messageWithUrl = getShareMessage(state.currentActiveMode, true);
    switch (platform) {
        case 'facebook':
            if (messageWithUrl) {
                navigator.clipboard.writeText(messageWithUrl).then(() => {
                    showSystemNotification('Texte copié !', 'Collez-le dans la fenêtre Facebook qui va s\'ouvrir.');
                }).catch(err => {
                    console.error('Erreur copie:', err);
                });
            }
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
            break;
        case 'threads':
            shareUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(message || '')}`;
            break;
        case 'tumblr':
            if (isDesktop()) {
                generateShareImageBlob(state.currentActiveMode).then(blob => {
                    if (!blob) {
                        showWarning("Veuillez d'abord effectuer un calcul avant de partager.");
                        return;
                    }

                    const previewUrl = URL.createObjectURL(blob);
                    openTumblrDesktopShareModal({
                        imageUrl: previewUrl,
                        imageBlob: blob,
                        filename: TUMBLR_DRAG_FILENAME,
                        imageAlt: 'Image générée pour Tumblr',
                        onClose: function () {
                            URL.revokeObjectURL(previewUrl);
                        }
                    });
                }).catch(err => {
                    console.error('Erreur génération image Tumblr desktop:', err);
                    showError("Impossible de préparer l'image pour Tumblr.");
                });
                return;
            }

            nativeShare(state.currentActiveMode);
            return;
        case 'mastodon':
            if (!isDesktop()) {
                nativeShare(state.currentActiveMode);
                return;
            }
            shareUrl = `https://mastodonshare.com/?text=${encodeURIComponent(message || '')}`;
            break;
        case 'reddit':
            const redditTitle = messageWithUrl || "Découvrez l'équivalent temps de cotisations de retraite";
            shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(redditTitle)}`;
            break;
        case 'bluesky':
            shareUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(message)}`;
            break;
        case 'linkedin':
            console.log('LinkedIn message:', message);
            const encodedMessage = encodeURIComponent(message);
            console.log('Encoded message:', encodedMessage);
            shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedMessage}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            break;
        case 'telegram':
            if (isMobile()) {
                // Sur Mobile, le lien profond tg://msg est le seul moyen d'avoir le message 
                // exactement comme on veut (lien à la fin) sans que Telegram ne rajoute 
                // une copie du lien au début.
                shareUrl = `tg://msg?text=${encodeURIComponent(message)}`;
            } else {
                // Sur Desktop, on utilise le lien Web classique.
                // Note : Telegram Web (t.me) rajoutera le lien au début car le paramètre 'url' est obligatoire.
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(message)}`;
            }
            break;
        case 'instagram':
            if (isMobile()) {
                // Mobile : modal guidé étape par étape
                generateShareImageBlob(state.currentActiveMode).then(blob => {
                    if (!blob) {
                        showWarning("Veuillez d'abord effectuer un calcul avant de partager.");
                        return;
                    }

                    const previewUrl = URL.createObjectURL(blob);
                    openInstagramDesktopShareModal({
                        imageUrl: previewUrl,
                        imageBlob: blob,
                        filename: generateUniqueFilename('jours-de-retraite-instagram', 'png'),
                        imageAlt: 'Image générée pour Instagram',
                        modalTitle: 'Partager sur Instagram',
                        modalInstructions: "Étape 1 : Sauvegardez l'image. Étape 2 : Ouvrez Instagram, appuyez sur + (Nouveau post), puis importez l'image depuis votre galerie.",
                        dragHintText: '',
                        openButtonLabel: 'Ouvrir Instagram',
                        openUrl: INSTAGRAM_WEB_URL,
                        openPopupName: 'instagram-share',
                        enableClipboard: false,
                        onClose: function () {
                            URL.revokeObjectURL(previewUrl);
                        }
                    });
                }).catch(err => {
                    console.error('Erreur génération image Instagram mobile:', err);
                    showError("Impossible de préparer l'image pour Instagram.");
                });
                return;
            }

            // Desktop : modal intelligent (sauvegarde + drag & drop)
            generateShareImageBlob(state.currentActiveMode).then(blob => {
                if (!blob) {
                    showWarning("Veuillez d'abord effectuer un calcul avant de partager.");
                    return;
                }

                const previewUrl = URL.createObjectURL(blob);
                openInstagramDesktopShareModal({
                    imageUrl: previewUrl,
                    imageBlob: blob,
                    filename: INSTAGRAM_DRAG_FILENAME,
                    imageAlt: 'Image générée pour Instagram',
                    modalTitle: 'Partager sur Instagram',
                    modalInstructions: "Étape 1 : Sauvegardez l'image. Étape 2 : Ouvrez Instagram dans la popup, cliquez sur Créer (+), puis importez l'image.",
                    dragHintText: "Vous pouvez aussi glisser-déposer l'image vers Instagram Web.",
                    openButtonLabel: 'Ouvrir Instagram',
                    openUrl: INSTAGRAM_WEB_URL,
                    openPopupName: 'instagram-web-share',
                    openPopupWidth: 1100,
                    openPopupHeight: 820,
                    enableClipboard: false,
                    onClose: function () {
                        URL.revokeObjectURL(previewUrl);
                    }
                });
            }).catch(err => {
                console.error('Erreur génération image Instagram desktop:', err);
                showError("Impossible de préparer l'image pour Instagram.");
            });
            return;
        case 'snapchat':
            if (isMobile()) {
                // Mobile : modal guidé étape par étape
                generateShareImageBlob(state.currentActiveMode).then(blob => {
                    if (!blob) {
                        showWarning("Veuillez d'abord effectuer un calcul avant de partager.");
                        return;
                    }

                    const previewUrl = URL.createObjectURL(blob);
                    openInstagramDesktopShareModal({
                        imageUrl: previewUrl,
                        imageBlob: blob,
                        filename: generateUniqueFilename('jours-de-retraite-snapchat', 'png'),
                        imageAlt: 'Image générée pour Snapchat',
                        modalTitle: 'Partager sur Snapchat',
                        modalInstructions: "Étape 1 : Sauvegardez l'image. Étape 2 : Ouvrez Snapchat, appuyez sur l'icône Galerie (Cartes), puis importez l'image.",
                        dragHintText: '',
                        openButtonLabel: 'Ouvrir Snapchat',
                        openUrl: SNAPCHAT_MOBILE_URL,
                        openPopupName: 'snapchat-share',
                        enableClipboard: false,
                        onClose: function () {
                            URL.revokeObjectURL(previewUrl);
                        }
                    });
                }).catch(err => {
                    console.error('Erreur génération image Snapchat mobile:', err);
                    showError("Impossible de préparer l'image pour Snapchat.");
                });
                return;
            }

            generateShareImageBlob(state.currentActiveMode).then(blob => {
                if (!blob) {
                    showWarning("Veuillez d'abord effectuer un calcul avant de partager.");
                    return;
                }

                const previewUrl = URL.createObjectURL(blob);
                openSnapchatDesktopShareModal({
                    imageUrl: previewUrl,
                    imageBlob: blob,
                    filename: SNAPCHAT_DRAG_FILENAME,
                    imageAlt: 'Image générée pour Snapchat',
                    onClose: function () {
                        URL.revokeObjectURL(previewUrl);
                    }
                });
            }).catch(err => {
                console.error('Erreur génération image Snapchat desktop:', err);
                showError("Impossible de préparer l'image pour Snapchat.");
            });
            return;
        case 'tiktok':
            if (isMobile()) {
                // Mobile : modal guidé étape par étape
                generateShareImageBlob(state.currentActiveMode).then(blob => {
                    if (!blob) {
                        showWarning("Veuillez d'abord effectuer un calcul avant de partager.");
                        return;
                    }

                    const previewUrl = URL.createObjectURL(blob);
                    openInstagramDesktopShareModal({
                        imageUrl: previewUrl,
                        imageBlob: blob,
                        filename: generateUniqueFilename('jours-de-retraite-tiktok', 'png'),
                        imageAlt: 'Image générée pour TikTok',
                        modalTitle: 'Partager sur TikTok',
                        modalInstructions: "Étape 1 : Sauvegardez l'image. Étape 2 : Ouvrez TikTok, appuyez sur +, puis importez l'image depuis votre galerie.",
                        dragHintText: '',
                        openButtonLabel: 'Ouvrir TikTok',
                        openUrl: 'snssdk1233://camera',
                        openPopupName: 'tiktok-share',
                        enableClipboard: false,
                        onClose: function () {
                            URL.revokeObjectURL(previewUrl);
                        }
                    });
                }).catch(err => {
                    console.error('Erreur génération image TikTok mobile:', err);
                    showError("Impossible de préparer l'image pour TikTok.");
                });
                return;
            }

            generateShareImageBlob(state.currentActiveMode).then(blob => {
                if (!blob) {
                    showWarning("Veuillez d'abord effectuer un calcul avant de partager.");
                    return;
                }

                const previewUrl = URL.createObjectURL(blob);
                openTiktokDesktopShareModal({
                    imageUrl: previewUrl,
                    imageBlob: blob,
                    filename: TIKTOK_DRAG_FILENAME,
                    imageAlt: 'Image générée pour TikTok',
                    onClose: function () {
                        URL.revokeObjectURL(previewUrl);
                    }
                });
            }).catch(err => {
                console.error('Erreur génération image TikTok desktop:', err);
                showError("Impossible de préparer l'image pour TikTok.");
            });
            return;
        case 'pinterest':
            // Pour Pinterest : utiliser l'API Web Share si disponible (mobile)
            // Sinon, ouvrir Pinterest avec l'image statique

            // Essayer d'abord avec l'API Web Share (mobile)
            if (navigator.share && isMobile()) {
                generateShareImageBlob(state.currentActiveMode).then(blob => {
                    if (blob) {
                        // Créer un fichier à partir du blob
                        const file = new File([blob], 'jours-de-retraite.png', { type: 'image/png' });

                        navigator.share({
                            title: 'JOURS DE RETRAITE',
                            text: message || 'Découvrez l\'équivalent temps de cotisations de retraite',
                            files: [file]
                        }).catch(err => {
                            console.warn('Erreur Web Share:', err);
                            // Fallback vers Pinterest classique
                            openPinterestFallback(currentUrl, message);
                        });
                    } else {
                        openPinterestFallback(currentUrl, message);
                    }
                });
            } else {
                // Sur desktop ou si Web Share non disponible, utiliser Pinterest classique
                openPinterestFallback(currentUrl, message);
            }
            return;
        case 'messenger':
            if (isDesktop()) {
                const messengerText = getShareMessage(state.currentActiveMode, true) || currentUrl;

                navigator.clipboard.writeText(messengerText).then(() => {
                    showSuccess("Lien copié. Collez-le dans Messenger.");
                }).catch(err => {
                    console.warn("Copie Messenger desktop indisponible:", err);
                    showWarning("Ouvrez Messenger puis collez le lien manuellement.");
                });

                openShareUrlWithDeviceStrategy('https://www.messenger.com/', 'messenger-share');
                return;
            }

            // Mobile: deep link Messenger (laisse l'OS ouvrir l'application native)
            shareUrl = `fb-messenger://share/?link=${encodeURIComponent(currentUrl)}`;
            break;
        default:
            shareUrl = null;
    }

    if (shareUrl) {
        openShareUrlWithDeviceStrategy(
            shareUrl,
            `${platform || 'social'}-share`
        );
        return;
    }

    // Plateformes "récalcitrantes" (pas d'URL de partage de texte brut simple)
    // On essaie l'API native si disponible sur mobile
    if (navigator.share && !isDesktop()) {
        navigator.share({
            title: "Perspective Retraites",
            text: message,
            url: currentUrl
        }).catch(err => {
            console.warn("Erreur partage natif:", err);
            copyToClipboardFallback(message);
        });
    } else {
        // Fallback sur Desktop : Copie dans le presse-papiers
        copyToClipboardFallback(message);
    }
}

/**
 * Helper pour copier dans le presse-papiers avec alerte
 * @param {string} text - Texte à copier
 */
function copyToClipboardFallback(text) {
    navigator.clipboard.writeText(text).then(() => {
        showSuccess("Le texte de partage a été copié ! Vous pouvez le coller dans votre application.");
    }).catch(err => {
        console.error("Erreur copie clipboard:", err);
        showError("Impossible de copier automatiquement. Veuillez copier le résultat manuellement.");
    });
}

/**
 * Partage via email ou SMS
 * @param {string} method - 'email' ou 'sms'
 */
export function shareVia(method) {
    const message = getShareMessage(state.currentActiveMode);

    if (!message) {
        showWarning("Veuillez d'abord effectuer un calcul.");
        return;
    }

    if (method === 'email') {
        const subject = encodeURIComponent("Calculatrice d'équivalent retraites");
        const body = encodeURIComponent(message);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } else if (method === 'sms') {
        const body = encodeURIComponent(message);
        window.location.href = `sms:?body=${body}`;
    }
}

/**
 * Détecte les capacités par appareil:
 * - desktop: cache le bouton SMS
 * - mobile: cache le bouton Mastodon (desktop only)
 */
export function checkSMSCapability() {
    if (!isMobile()) {
        const smsButtons = document.querySelectorAll('button[data-action="sms"]');
        smsButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        return;
    }

    const mastodonButtons = document.querySelectorAll('button[data-platform="mastodon"]');
    mastodonButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}

/**
 * Détecte la plateforme exacte de l'utilisateur
 * @returns {Object} { isWindows, isMac, isLinux, isMobile }
 */
function detectPlatform() {
    const userAgent = navigator.userAgent;
    const isWindows = /Windows NT/.test(userAgent);
    const isMac = /Mac OS X/.test(userAgent) && !/iPhone|iPad/.test(userAgent);
    const isLinux = /Linux/.test(userAgent) && !/Android/.test(userAgent);

    return { isWindows, isMac, isLinux, isMobile: isMobile() };
}

/**
 * Partage natif de l'appareil
 * @param {string} mode - 'temporal' ou 'financial'
 */
export function nativeShare(mode = 'temporal') {
    if (!getResultText(mode)) {
        showWarning("Aucun résultat à partager. Veuillez d'abord effectuer un calcul.");
        return;
    }

    const platform = detectPlatform();

    // Sur Windows et Linux : utiliser la popup de copie avec URL incluse
    if (platform.isWindows || platform.isLinux) {
        const messageWithUrl = getShareMessage(mode, true);
        showShareHelperPopup(messageWithUrl);
        return;
    }

    // Sur Mac et mobile : utiliser le partage natif (URL passée séparément)
    const messageWithoutUrl = getShareMessage(mode, false);
    if (navigator.share) {
        navigator.share({
            text: messageWithoutUrl,
            url: SHARE_URL
        }).catch(error => {
            if (error.name !== 'AbortError') {
                fallbackShare(messageWithoutUrl);
            }
        });
    } else {
        fallbackShare(messageWithoutUrl);
    }
}

/**
 * Affiche une popup d'aide pour le partage sur desktop
 * @param {string} text - Le texte complet à copier
 */
function showShareHelperPopup(text) {
    // Supprimer la popup existante si elle existe
    const existingPopup = document.getElementById('share-helper-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Créer la popup avec le thème du site (bleu marine et doré)
    const popup = document.createElement('div');
    popup.id = 'share-helper-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #112240 0%, #0a192f 100%);
        padding: 24px;
        border-radius: 12px;
        border: 2px solid #d4af37;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(212, 175, 55, 0.2);
        z-index: 10000;
        max-width: 90%;
        width: 500px;
        font-family: inherit;
        color: #ffffff;
    `;

    popup.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #e6c55a; text-shadow: 0 0 10px rgba(230, 197, 90, 0.3);">📋 Partage</h3>
        <p style="margin: 0 0 12px 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
            Voici votre message à partager :
        </p>
        <textarea id="share-helper-text" readonly style="
            width: 100%;
            min-height: 80px;
            padding: 12px;
            border: 1px solid rgba(212, 175, 55, 0.4);
            border-radius: 8px;
            font-size: 14px;
            resize: none;
            overflow: hidden;
            margin-bottom: 16px;
            font-family: inherit;
            box-sizing: border-box;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
        ">${text}</textarea>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="share-helper-close" style="
                padding: 10px 20px;
                border: 1px solid rgba(212, 175, 55, 0.4);
                background: rgba(255, 255, 255, 0.05);
                color: rgba(255, 255, 255, 0.9);
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            ">Fermer</button>
            <button id="share-helper-copy" style="
                padding: 10px 20px;
                border: 1px solid #d4af37;
                background: linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
                color: #e6c55a;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            ">📋 Copier</button>
        </div>
    `;

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.id = 'share-helper-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 25, 47, 0.8);
        z-index: 9999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Focus sur le textarea (sans sélectionner le texte pour plus d'esthétique)
    const textarea = document.getElementById('share-helper-text');

    // Ajuster la hauteur automatiquement au contenu
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';

    textarea.focus();

    // Gestionnaires d'événements
    const closePopup = () => {
        popup.remove();
        overlay.remove();
    };

    const closeBtn = document.getElementById('share-helper-close');
    const copyBtn = document.getElementById('share-helper-copy');

    // Effets de survol pour le bouton Fermer
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.borderColor = '#d4af37';
        closeBtn.style.color = '#e6c55a';
        closeBtn.style.background = 'rgba(212, 175, 55, 0.1)';
        closeBtn.style.transform = 'translateY(-2px)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.borderColor = 'rgba(212, 175, 55, 0.4)';
        closeBtn.style.color = 'rgba(255, 255, 255, 0.9)';
        closeBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        closeBtn.style.transform = 'translateY(0)';
    });

    // Effets de survol pour le bouton Copier
    copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.borderColor = '#d4af37';
        copyBtn.style.color = '#f0d78c';
        copyBtn.style.background = 'linear-gradient(145deg, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.25) 100%)';
        copyBtn.style.transform = 'translateY(-2px)';
        copyBtn.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)';
    });
    copyBtn.addEventListener('mouseleave', () => {
        copyBtn.style.borderColor = '#d4af37';
        copyBtn.style.color = '#e6c55a';
        copyBtn.style.background = 'linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)';
        copyBtn.style.transform = 'translateY(0)';
        copyBtn.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
    });

    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);

    copyBtn.addEventListener('click', () => {
        textarea.select();
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copié !';
            // Garder la couleur dorée du bouton, ne pas changer en vert
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 5000);
        }).catch(err => {
            console.error('Erreur copie:', err);
            showError("Erreur lors de la copie. Veuillez sélectionner et copier manuellement.");
        });
    });

    // Fermer avec Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

/**
 * Ouvre Pinterest avec l'image statique (fallback)
 * @param {string} currentUrl - URL à partager
 * @param {string} message - Message de partage
 */
function openPinterestFallback(currentUrl, message) {
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&description=${encodeURIComponent(message || 'Découvrez l\'équivalent temps de cotisations de retraite')}&media=${encodeURIComponent('https://lemodelesocialfrancais.github.io/joursderetraite/icon-512x512.png')}`;
    openShareUrlWithDeviceStrategy(pinterestUrl, 'pinterest-share');
}

/**
 * Solution de repli pour le partage
 * @param {string} text - Le texte à partager
 */
function fallbackShare(text) {
    showShareHelperPopup(text);
}
