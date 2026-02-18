/**
 * Module: sharing.js
 * Fonctions de partage sur les réseaux sociaux
 */

import { state } from './state.js';

/**
 * Détecte si l'utilisateur est sur un ordinateur
 * @returns {boolean}
 */
export function isDesktop() {
    return !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

/**
 * Copie le résultat dans le presse-papiers
 * @param {string} mode - 'temporal' ou 'financial'
 */
export function copyResult(mode = 'temporal') {
    let resultText;
    let copyBtn;

    // Utiliser les résultats stockés dans l'état global pour éviter de copier la structure HTML
    if (mode === 'temporal') {
        resultText = state.storedTemporalResult;
        copyBtn = document.querySelector('#result-section-temporal .copy-btn');
    } else {
        resultText = state.storedFinancialResult;
        copyBtn = document.querySelector('#result-section-financial .copy-btn');
    }

    // Fallback si l'état est vide (ne devrait pas arriver si un calcul a été fait)
    if (!resultText || resultText.trim() === "") {
        console.warn("Résultat stocké vide, tentative de récupération depuis le DOM...");
        if (mode === 'temporal') {
            // Tentative de reconstruction propre pour le mode temporel
            const temporalGrid = document.querySelector('.result-grid-temporal');
            if (temporalGrid) {
                const boxes = temporalGrid.querySelectorAll('.result-box');
                const parts = [];
                boxes.forEach(box => {
                    const val = box.querySelector('.value span').textContent;
                    const label = box.querySelector('.label').textContent;
                    parts.push(`${val} ${label}`);
                });
                resultText = parts.join(' ');
            } else {
                resultText = document.getElementById('result-text-temporal').textContent;
            }
        } else {
            const comparisonElement = document.getElementById('comparison-result-text-financial');
            const comparisonText = comparisonElement ? comparisonElement.textContent : "";
            resultText = comparisonText.trim() !== "" ? comparisonText : document.getElementById('result-text-financial').textContent;
        }
    }

    if (!resultText || resultText.trim() === "") {
        alert("Aucun résultat à copier. Veuillez d'abord effectuer un calcul.");
        return;
    }

    if (!copyBtn) {
        console.error("Bouton de copie introuvable");
        // On continue quand même pour copier le texte
    }

    navigator.clipboard.writeText(resultText).then(function () {
        if (copyBtn) {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(function () {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        }
    }).catch(function (err) {
        console.error('Erreur lors de la copie: ', err);
        alert('Erreur lors de la copie. Vérifiez les permissions de votre navigateur.');
    });
}

/**
 * Génère le message de partage
 * @param {string} mode - 'temporal' ou 'financial'
 * @returns {string} Le message formaté
 */
function getShareMessage(mode) {
    let resultText;

    if (mode === 'temporal') {
        resultText = state.storedTemporalResult;
    } else {
        resultText = state.storedFinancialResult;
    }

    // Fallback DOM si l'état est vide
    if (!resultText || resultText.trim() === "") {
        if (mode === 'temporal') {
            const temporalGrid = document.querySelector('.result-grid-temporal');
            if (temporalGrid) {
                const boxes = temporalGrid.querySelectorAll('.result-box');
                const parts = [];
                boxes.forEach(box => {
                    const val = box.querySelector('.value span').textContent;
                    const label = box.querySelector('.label').textContent;
                    parts.push(`${val} ${label}`);
                });
                resultText = parts.join(' ');
            } else {
                resultText = document.getElementById('result-text-temporal').textContent;
            }
        } else {
            const comparisonElement = document.getElementById('comparison-result-text-financial');
            const comparisonText = comparisonElement ? comparisonElement.textContent : "";
            resultText = comparisonText.trim() !== "" ? comparisonText : document.getElementById('result-text-financial').textContent;
        }
    }

    if (!resultText || resultText.trim() === "") {
        return null;
    }

    const currentUrl = window.location.href;
    
    let message;
    if (mode === 'temporal') {
        let description;
        
        // Si c'est un exemple, on utilise le label de l'exemple
        if (state.currentExampleLabel) {
            description = state.currentExampleLabel;
            message = `J'ai calculé : ${description} = ${resultText} de retraites.\nÀ vous de tester sur ${currentUrl}`;
        } else {
            // Sinon c'est un montant personnalisé, on utilise le montant formaté
            const amountInput = document.getElementById('amount');
            const amountValue = amountInput ? parseFloat(amountInput.value.replace(/\u00A0/g, '').replace(/,/g, '.')) : 0;

            description = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0
            }).format(amountValue);
            
            message = `J'ai calculé : ${description} = ${resultText} de retraites.\nÀ vous de tester sur ${currentUrl}`;
        }
    } else {
        const comparisonShort = resultText.replace(/\.$/, '');
        message = `J'ai calculé : ${comparisonShort}.\nÀ vous de tester sur ${currentUrl}`;
    }

    return message;
}

/**
 * Partage sur les réseaux sociaux
 * @param {string} platform - La plateforme cible
 */
export function shareOnSocial(platform) {
    const message = getShareMessage(state.currentActiveMode);
    if (!message) {
        alert("Veuillez d'abord effectuer un calcul.");
        return;
    }

    const currentUrl = window.location.href;
    // Le message contient déjà l'URL, pas besoin de l'ajouter à nouveau

    // Liste des plateformes avec partage direct par URL
    const directPlatforms = {
        'facebook': `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(message)}`,
        'twitter': `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        'linkedin': `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
        'whatsapp': `https://wa.me/?text=${encodeURIComponent(message)}`,
        'telegram': `https://t.me/share?text=${encodeURIComponent(message)}`,
        'pinterest': `https://pinterest.com/pin/create/button/?description=${encodeURIComponent(message)}`,
        'messenger': `https://www.messenger.com/share/?link=${encodeURIComponent(currentUrl)}`
    };

    if (directPlatforms[platform]) {
        // Traitement spécial pour LinkedIn : partage URL + copie du message séparément
        if (platform === 'linkedin') {
            window.open(directPlatforms[platform], '_blank');
            navigator.clipboard.writeText(message).catch(err => {
                console.warn('Erreur copie message LinkedIn:', err);
            });
        } else {
            window.open(directPlatforms[platform], '_blank');
        }
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
        alert("Propulsé par Jours de Retraite !\n\nLe texte de partage a été copié dans votre presse-papiers. Vous pouvez maintenant le coller dans votre application.");
    }).catch(err => {
        console.error("Erreur copie clipboard:", err);
        alert("Impossible de copier automatiquement. Veuillez copier le résultat manuellement.");
    });
}

/**
 * Partage via email ou SMS
 * @param {string} method - 'email' ou 'sms'
 */
export function shareVia(method) {
    const message = getShareMessage(state.currentActiveMode);

    if (!message) {
        alert("Veuillez d'abord effectuer un calcul.");
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
 * Détecte la capacité SMS et cache le bouton si non disponible
 */
export function checkSMSCapability() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobile) {
        const smsButtons = document.querySelectorAll('button[onclick*="shareVia(\'sms\')"]');
        smsButtons.forEach(btn => {
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
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    return { isWindows, isMac, isLinux, isMobile };
}

/**
 * Partage natif de l'appareil
 * @param {string} mode - 'temporal' ou 'financial'
 */
export function nativeShare(mode = 'temporal') {
    const message = getShareMessage(mode);

    if (!message) {
        alert("Aucun résultat à partager. Veuillez d'abord effectuer un calcul.");
        return;
    }

    const shareTitle = "Incroyable perspective sur les retraites en France!";
    const shareText = message;
    
    const platform = detectPlatform();

    // Sur Windows et Linux : utiliser la popup de copie (le partage natif ne transmet pas le texte)
    if (platform.isWindows || platform.isLinux) {
        showShareHelperPopup(shareText);
        return;
    }

    // Sur Mac et mobile : utiliser le partage natif (fonctionne avec texte)
    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareText,
            url: window.location.href
        }).catch(error => {
            if (error.name !== 'AbortError') {
                fallbackShare(shareText);
            }
        });
    } else {
        fallbackShare(shareText);
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
            alert('Erreur lors de la copie. Veuillez sélectionner et copier manuellement.');
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
 * Solution de repli pour le partage
 * @param {string} text - Le texte à partager
 */
function fallbackShare(text) {
    showShareHelperPopup(text);
}