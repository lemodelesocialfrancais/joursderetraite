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
            message = `${description} représentent ${resultText} de prestations retraites (base + complémenataires).`;
        } else {
            // Sinon c'est un montant personnalisé, on utilise le montant formaté
            const amountInput = document.getElementById('amount');
            const amountValue = amountInput ? parseFloat(amountInput.value.replace(/\u00A0/g, '').replace(/,/g, '.')) : 0;

            description = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0
            }).format(amountValue);
            
            message = `${description} représentent ${resultText} de prestations retraites (base + complémenataires).`;
        }
        
        message = message.charAt(0).toUpperCase() + message.slice(1);
    } else {
        const comparisonShort = resultText.replace(/\.$/, '');
        message = `${comparisonShort}.`;
    }

    if (includeUrl) {
        const displayUrl = currentUrl.replace(/^https?:\/\//, '');
        // Assurer des sauts de ligne corrects pour LinkedIn
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
    
    // Texte principal - PLUS GRAND pour remplir l'espace
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Gérer le retour à la ligne avec wrapText - texte dans la moitié supérieure
    const lines = wrapText(ctx, fullText, canvas.width - 100);
    const lineHeight = 70;
    const textBlockHeight = lines.length * lineHeight;
    // Positionner le texte pour remplir l'espace
    const textStartY = 200;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, textStartY + index * lineHeight);
    });
    
    // Ajouter l'icône dans la moitié inférieure
    return new Promise((resolve) => {
        const iconUrl = 'https://lemodelesocialfrancais.github.io/joursderetraite/icon-512x512.png';
        const iconImg = new Image();
        iconImg.crossOrigin = 'anonymous';
        iconImg.onload = function() {
            // Dessiner l'icône plus haut et plus grand
            const iconSize = 380;
            const iconX = (canvas.width - iconSize) / 2;
            const iconY = 520; // Plus haut
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
        iconImg.onerror = function() {
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
 * Fonction helper pour gérer le retour à la ligne du texte
 * @param {CanvasRenderingContext2D} ctx - Contexte canvas
 * @param {string} text - Texte à wraps
 * @param {number} maxWidth - Largeur maximale
 * @returns {string[]} Tableau de lignes
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

/**
 * Partage sur les réseaux sociaux
 * @param {string} platform - La plateforme cible
 */
export function shareOnSocial(platform) {
    // Ces plateformes reçoivent l'URL via un paramètre séparé, donc on ne l'inclut pas dans le message
    const platformsWithUrlParam = ['facebook', 'messenger'];
    const platformsWithImageParam = ['pinterest'];
    const includeUrl = !platformsWithUrlParam.includes(platform);
    const includeImage = platformsWithImageParam.includes(platform);
    
    const message = getShareMessage(state.currentActiveMode, includeUrl);
    const currentUrl = SHARE_URL;

    // Génère l'URL de partage pour chaque plateforme au moment de l'appel
    let shareUrl;
    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(message)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
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
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(message)}`;
            break;
        case 'instagram':
            // Instagram : utiliser l'API Web Share sur mobile (même principe que Pinterest)
            if (navigator.share && isMobile()) {
                generateShareImageBlob(state.currentActiveMode).then(blob => {
                    if (blob) {
                        const file = new File([blob], 'jours-de-retraite.png', { type: 'image/png' });
                        
                        navigator.share({
                            title: 'JOURS DE RETRAITE',
                            text: message || 'Découvrez l\'équivalent temps de cotisations de retraite',
                            files: [file]
                        }).catch(err => {
                            console.warn('Erreur Web Share Instagram:', err);
                            showWarning("Partage Instagram non disponible. Essayez une autre méthode.");
                        });
                    }
                });
                return;
            } else {
                // Instagram web n'a pas d'API de partage directe
                // Proposer de télécharger l'image
                generateShareImageBlob(state.currentActiveMode).then(blob => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = 'jours-de-retraite-instagram.png';
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showSuccess("Image téléchargée ! Ouvrez Instagram et partagez cette image.");
                    }
                });
                return;
            }
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
            shareUrl = `fb-messenger://share?link=${encodeURIComponent(currentUrl)}`;
            break;
        default:
            shareUrl = null;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank');
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
 * Détecte la capacité SMS et Messenger, cache les boutons sur desktop
 */
export function checkSMSCapability() {
    if (!isMobile()) {
        const smsButtons = document.querySelectorAll('button[data-action="sms"]');
        smsButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        const messengerButtons = document.querySelectorAll('button[data-platform="messenger"]');
        messengerButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }
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

    const shareTitle = "Incroyable perspective sur les retraites en France!";
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
            title: shareTitle,
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
    window.open(pinterestUrl, '_blank');
}

/**
 * Solution de repli pour le partage
 * @param {string} text - Le texte à partager
 */
function fallbackShare(text) {
    showShareHelperPopup(text);
}
