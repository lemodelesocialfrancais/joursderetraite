/**
 * Module: calculator.js
 * Fonctions de calcul pour l'équivalent retraites
 */

import { extractNumber, formatCurrency } from './formatting.js';
import { state } from './state.js';
import { getExampleById } from './examples.js';
import { DOM } from './dom-cache.js';
import { showError } from './toast.js';

// === CONSTANTES DE CALCUL (calculées une seule fois au chargement du module) ===
const TOTAL_RETRAITES = 420e9;
const SECONDS_IN_YEAR = 365.25 * 24 * 60 * 60;
const SECONDS_IN_DAY = 24 * 60 * 60;
const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_MONTH = (365.25 / 12) * SECONDS_IN_DAY;
const CALCULATION_COUNT_PERSIST_DELAY_MS = 400;

let __persistCalculationCountTimer = null;

function persistCalculationCount() {
    if (__persistCalculationCountTimer) {
        clearTimeout(__persistCalculationCountTimer);
        __persistCalculationCountTimer = null;
    }

    try {
        localStorage.setItem('calculationCount', String(state.calculationCount || 0));
    } catch {
        // Ignore storage errors
    }
}

function scheduleCalculationCountPersist() {
    if (__persistCalculationCountTimer) {
        clearTimeout(__persistCalculationCountTimer);
    }

    __persistCalculationCountTimer = setTimeout(() => {
        __persistCalculationCountTimer = null;
        persistCalculationCount();
    }, CALCULATION_COUNT_PERSIST_DELAY_MS);
}

window.addEventListener('pagehide', persistCalculationCount);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        persistCalculationCount();
    }
});

/**
 * Échappe les caractères HTML pour prévenir les attaques XSS
 * @param {*} value - La valeur à échapper
 * @returns {string} La valeur échappée
 */
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

/**
 * Déclenche l'animation slideUp sur les éléments
 * @param {HTMLElement} element - L'élément conteneur
 */
export function triggerAnimation(element) {
    if (!element) return;

    const digits = element.querySelectorAll('.counter-digit span');
    
    // Frame 1 : réinitialiser toutes les animations
    digits.forEach(digit => {
        digit.style.animation = 'none';
    });
    
    // Frame 2 : réactiver les animations (laisse le navigateur gérer le timing)
    requestAnimationFrame(() => {
        digits.forEach((digit, index) => {
            digit.style.animation = `slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s backwards`;
        });
    });
}

/**
 * Logique de calcul pour le mode temporel
 */
export function calculateLogic() {

    state.isCalculating = true;

    // Vérifier que nous sommes bien en mode temporel
    if (DOM.temporalInputs.classList.contains('hidden')) {
        console.error("Erreur: calculateLogic() appelé alors que nous ne sommes pas en mode temporel");
        state.isCalculating = false;
        return;
    }

    // Récupérer la valeur brute du champ
    const rawValue = DOM.amount ? DOM.amount.value : '';

    // Si le champ est vide, afficher une erreur
    if (rawValue.trim() === '') {
        showError("Veuillez entrer un montant.", "amount");
        state.isCalculating = false;
        return;
    }

    // Extraire le nombre de la valeur du champ
    const amount = extractNumber(rawValue);

    if (isNaN(amount) || amount < 0) {
        showError("Veuillez entrer un montant valide.", "amount");
        state.isCalculating = false;
        return;
    }

    // Incrémenter le compteur de calculs pour PWA
    state.calculationCount = (state.calculationCount || 0) + 1;
    scheduleCalculationCountPersist();

    // Calcul du ratio
    const ratio = amount / TOTAL_RETRAITES;

    // Calcul des secondes équivalentes
    const equivalentSeconds = ratio * SECONDS_IN_YEAR;

    // Calcul des années
    const years = Math.floor(equivalentSeconds / (365.25 * SECONDS_IN_DAY));
    let remainingSeconds = equivalentSeconds % (365.25 * SECONDS_IN_DAY);

    // Calcul des mois
    const months = Math.floor(remainingSeconds / SECONDS_IN_MONTH);
    remainingSeconds = remainingSeconds % SECONDS_IN_MONTH;

    // Calcul des jours, heures, minutes et secondes
    const days = Math.floor(remainingSeconds / SECONDS_IN_DAY);
    remainingSeconds = remainingSeconds % SECONDS_IN_DAY;
    const hours = Math.floor(remainingSeconds / SECONDS_IN_HOUR);
    remainingSeconds = remainingSeconds % SECONDS_IN_HOUR;
    const minutes = Math.floor(remainingSeconds / SECONDS_IN_MINUTE);
    const seconds = Math.floor(remainingSeconds % SECONDS_IN_MINUTE);

    // Calcul précis des millisecondes
    const totalMilliseconds = Math.round(equivalentSeconds * 1000);
    const milliseconds = totalMilliseconds % 1000;

    // Construction des cases de résultat
    let boxesHTML = '';
    let textResult = '';

    const addBox = (val, label) => {
        textResult += `${val} ${label} `;
        return `
        <div class="result-box">
            <span class="value counter-digit"><span>${val}</span></span>
            <span class="label">${label}</span>
        </div>`;
    };

    let hasContent = false;
    if (years > 0) { boxesHTML += addBox(years, years < 2 ? 'année' : 'années'); hasContent = true; }
    if (months > 0) { boxesHTML += addBox(months, 'mois'); hasContent = true; }
    if (days > 0) { boxesHTML += addBox(days, days < 2 ? 'jour' : 'jours'); hasContent = true; }
    if (hours > 0) { boxesHTML += addBox(hours, hours < 2 ? 'heure' : 'heures'); hasContent = true; }
    if (minutes > 0) { boxesHTML += addBox(minutes, minutes < 2 ? 'minute' : 'minutes'); hasContent = true; }
    if (seconds > 0) { boxesHTML += addBox(seconds, seconds < 2 ? 'seconde' : 'secondes'); hasContent = true; }

    if (!hasContent) {
        if (milliseconds > 0) {
            boxesHTML += addBox(milliseconds, milliseconds < 2 ? 'milliseconde' : 'millisecondes');
        } else if (equivalentSeconds > 0) {
            // Cas des montants infimes : on affiche 1 milliseconde au minimum
            boxesHTML += addBox(1, 'milliseconde');
        } else {
            boxesHTML += addBox(0, 'seconde');
        }
    }

    // Finaliser le HTML avec les textes d'interprétation
    let headerText = "Ce montant représente l'équivalent de&nbsp;:";

    if (state.currentExampleLabel) {
        const label = state.currentExampleLabel;

        // On capitalise la première lettre pour le début de phrase
        let capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        // Détection du pluriel pour l'accord du verbe
        const isPlural = label.toLowerCase().startsWith('les ') || label.toLowerCase().startsWith('des ');
        const verb = isPlural ? "représentent" : "représente";

        // On utilise directement le label car il est déjà narratif
        headerText = `<strong>${capitalizedLabel}</strong> ${verb}&nbsp;:`;
    }

    let finalHTML = `<div class="result-interpretation-header">${headerText}</div>`;
    finalHTML += `<div class="result-grid-temporal">`;
    finalHTML += boxesHTML;
    finalHTML += `<div class="result-interpretation-footer">de prestations retraites (2025).</div>`;
    finalHTML += `</div>`;

    // Affichage du résultat
    if (DOM.resultTextTemporal) {
        DOM.resultTextTemporal.innerHTML = finalHTML;
        triggerAnimation(DOM.resultTextTemporal);
    }

    // Stocker le résultat (format texte pour le partage)
    let fallbackResult = '0 seconde';
    if (milliseconds > 0) {
        fallbackResult = `${milliseconds} milliseconde${milliseconds < 2 ? '' : 's'}`;
    } else if (equivalentSeconds > 0) {
        fallbackResult = '1 milliseconde';
    }

    state.storedTemporalResult = textResult.trim() || fallbackResult;

    // Afficher les sections de résultat et de partage
    if (DOM.resultSectionTemporal) {
        // Vérifier si c'est le premier affichage
        const isFirstTime = !DOM.resultSectionTemporal.hasAttribute('data-shown-before');

        DOM.resultSectionTemporal.classList.remove('hidden');

        if (isFirstTime) {
            // Marquer comme déjà affiché
            DOM.resultSectionTemporal.setAttribute('data-shown-before', 'true');

            // Ajouter la classe d'animation comme au chargement de la page
            DOM.resultSectionTemporal.classList.add('fade-in-slide-up');
        }
    }

    if (DOM.shareSectionTemporal) {
        DOM.shareSectionTemporal.classList.remove('hidden');
    }

    // Masquer les sections du mode financier
    if (DOM.resultSectionFinancial) {
        DOM.resultSectionFinancial.classList.add('hidden');
    }
    if (DOM.shareSectionFinancial) {
        DOM.shareSectionFinancial.classList.add('hidden');
    }

    // Déclencher l'événement pour PWA
    window.dispatchEvent(new CustomEvent('calculationComplete', {
        detail: { mode: 'temporal', count: state.calculationCount }
    }));

    state.isCalculating = false;
}

/**
 * Fonction principale de calcul pour le mode temporel
 */
export function calculate() {

    if (DOM.temporalInputs.classList.contains('hidden')) {

        return;
    }

    calculateLogic();
}

/**
 * Calcul pour le mode financier (comparaison avec objets)
 */
export function calculateComparison() {
    // Fermer le dropdown avant le calcul pour éviter les clics parasites
    const openDropdown = document.querySelector('.custom-dropdown.open');
    if (openDropdown) {
        openDropdown.classList.remove('open');
    }
    
    // Vérifier si l'utilisateur a sélectionné un objet
    const triggerText = document.querySelector('#object-type-dropdown .trigger-text');
    if (triggerText && triggerText.textContent.includes('Sélectionnez')) {
        showError("Veuillez sélectionner un objet dans la liste.");
        const dropdown = document.getElementById('object-type-dropdown');
        if (dropdown) {
            dropdown.classList.add('field-error');
            setTimeout(() => dropdown.classList.remove('field-error'), 2000);
        }
        return;
    }
    
    const selectedValue = DOM.objectTypeSelect.value;
    const isCustomAmount = selectedValue === 'autre' || selectedValue === '';
    let objectLabel = '';

    // Récupérer directement le label depuis examples.js (avec article)
    if (!isCustomAmount) {
        const example = getExampleById(selectedValue);
        if (example && example.label) {
            // Enlever les parenthèses et leur contenu (ex: "(2025)", "(coût annuel)")
            objectLabel = example.label.split(' (')[0];
        }
    }

    // Récupérer la valeur brute du champ
    const rawPriceValue = DOM.objectPriceInput.value;

    if (rawPriceValue.trim() === '') {
        showError("Veuillez entrer un montant de comparaison.", "object-price");
        return;
    }

    const objectPrice = extractNumber(rawPriceValue);
    const timePeriodValue = DOM.timePeriodSelect.value;

    if (isNaN(objectPrice) || objectPrice <= 0) {
        showError("Veuillez entrer un montant de comparaison valide.", "object-price");
        return;
    }

    let periodMultiplier;
    if (timePeriodValue === 'custom') {
        const rawPeriodValue = DOM.customPeriod.value;

        if (rawPeriodValue.trim() === '') {
            showError("Veuillez entrer une durée personnalisée.", "custom-period");
            return;
        }

        periodMultiplier = extractNumber(rawPeriodValue);
        if (isNaN(periodMultiplier) || periodMultiplier <= 0) {
            showError("Veuillez entrer une durée personnalisée valide.", "custom-period");
            return;
        }
    } else {
        periodMultiplier = parseFloat(timePeriodValue);
    }

    // Incrémenter le compteur de calculs pour PWA
    state.calculationCount = (state.calculationCount || 0) + 1;
    scheduleCalculationCountPersist();

    // Calcul du montant équivalent
    const periodAmount = TOTAL_RETRAITES * periodMultiplier;
    const numberOfObjects = periodAmount / objectPrice;

    // Formatage du résultat
    let formattedNumber;
    let rawNumberFormatted;
    let isPercentage = false;

    if (numberOfObjects >= 1e9) {
        const valueInBillions = numberOfObjects / 1e9;
        rawNumberFormatted = valueInBillions.toFixed(1).replace('.', ',');
        if (rawNumberFormatted.endsWith(',0')) {
            rawNumberFormatted = rawNumberFormatted.slice(0, -2);
        }
        formattedNumber = rawNumberFormatted + (valueInBillions < 2 ? ' milliard' : ' milliards');
    } else if (numberOfObjects >= 1e6) {
        const valueInMillions = numberOfObjects / 1e6;
        rawNumberFormatted = valueInMillions.toFixed(1).replace('.', ',');
        if (rawNumberFormatted.endsWith(',0')) {
            rawNumberFormatted = rawNumberFormatted.slice(0, -2);
        }
        formattedNumber = rawNumberFormatted + (valueInMillions < 2 ? ' million' : ' millions');
    } else if (numberOfObjects >= 1e3) {
        // Formatage avec espaces insécables pour les milliers (ex: "1 500" au lieu de "1,5 mille")
        formattedNumber = Math.floor(numberOfObjects).toLocaleString('fr-FR').replace(/\s/g, '\u00A0');
    } else if (numberOfObjects >= 1) {
        if (numberOfObjects % 1 !== 0) {
            formattedNumber = numberOfObjects.toFixed(1).replace('.', ',');
            if (formattedNumber.endsWith(',0')) {
                formattedNumber = formattedNumber.slice(0, -2);
            }
        } else {
            formattedNumber = Math.floor(numberOfObjects).toLocaleString();
        }
    } else {
        const percentage = numberOfObjects * 100;
        isPercentage = true;
        
        if (percentage >= 10) {
            formattedNumber = percentage.toFixed(1).replace('.', ',');
            if (formattedNumber.endsWith(',0')) {
                formattedNumber = formattedNumber.slice(0, -2);
            }
            formattedNumber += '%';
        } else if (percentage >= 1) {
            formattedNumber = percentage.toFixed(1).replace('.', ',') + '%';
        } else if (percentage >= 0.1) {
            formattedNumber = percentage.toFixed(2).replace('.', ',') + '%';
        } else if (percentage >= 0.001) {
            formattedNumber = percentage.toFixed(3).replace('.', ',') + '%';
        } else {
            formattedNumber = '< 0,001%';
        }
    }

    // Le label est utilisé tel quel (pas de pluriel en français pour "X fois le/la/un/une...")
    const safeObjectLabel = escapeHTML(objectLabel);

    // Affichage du résultat principal
    const customAmountText = formatCurrency(objectPrice);
    const safeCustomAmountText = escapeHTML(customAmountText);

    // Construction du HTML selon le mode (pourcentage ou nombre)
    let resultHTML;
    let simpleText;
    
    if (isPercentage) {
        if (isCustomAmount) {
            resultHTML = `
                <div class="result-interpretation-header">Les prestations retraites de 2025 représentent&nbsp;:</div>
                <div class="result-grid-financial">
                    <div class="result-box highlight">
                        <span class="value counter-digit"><span>${formattedNumber}</span></span>
                    </div>
                    <span class="result-fois-text">de ${safeCustomAmountText}</span>
                </div>
            `;
            simpleText = `Avec ${formatCurrency(periodAmount)} de prestations retraites, cela représente ${formattedNumber} de ${customAmountText}.`;
        } else {
            resultHTML = `
                <div class="result-interpretation-header">Les prestations retraites de 2025 représentent&nbsp;:</div>
                <div class="result-grid-financial">
                    <div class="result-box highlight">
                        <span class="value counter-digit"><span>${formattedNumber}</span></span>
                    </div>
                    <span class="result-fois-text">de ${safeObjectLabel}</span>
                </div>
            `;
            simpleText = `Avec ${formatCurrency(periodAmount)} de prestations retraites, cela représente ${formattedNumber} de ${objectLabel}.`;
        }
    } else {
        const foisText = (formattedNumber.includes('million') || formattedNumber.includes('milliard')) ? "de fois" : "fois";
        if (isCustomAmount) {
            resultHTML = `
                <div class="result-interpretation-header">Les prestations retraites de 2025 représentent&nbsp;:</div>
                <div class="result-grid-financial">
                    <div class="result-box highlight">
                        <span class="value counter-digit"><span>${formattedNumber}</span></span>
                    </div>
                    <span class="result-fois-text">${foisText} ${safeCustomAmountText}</span>
                </div>
            `;
            simpleText = `Avec ${formatCurrency(periodAmount)} de prestations retraites, cela représente ${formattedNumber} ${foisText} ${customAmountText}.`;
        } else {
            resultHTML = `
                <div class="result-interpretation-header">Les prestations retraites de 2025 pourraient financer&nbsp;:</div>
                <div class="result-grid-financial">
                    <div class="result-box highlight">
                        <span class="value counter-digit"><span>${formattedNumber}</span></span>
                    </div>
                    <span class="result-fois-text">${foisText} ${safeObjectLabel}</span>
                </div>
            `;
            simpleText = `Avec ${formatCurrency(periodAmount)} de prestations retraites, on pourrait avoir ${formattedNumber} ${foisText} ${objectLabel}.`;
        }
    }

    DOM.resultTextFinancial.innerHTML = resultHTML;
    triggerAnimation(DOM.resultTextFinancial);

    // Stocker les résultats
    state.storedFinancialResult = simpleText;
    // Pour compatibilité avec sharing.js
    if (DOM.comparisonResultTextFinancial) DOM.comparisonResultTextFinancial.textContent = simpleText;

    // Afficher les sections du mode financier
    if (DOM.resultSectionFinancial) {
        // Vérifier si c'est le premier affichage
        const isFirstTime = !DOM.resultSectionFinancial.hasAttribute('data-shown-before');

        DOM.resultSectionFinancial.classList.remove('hidden');

        if (isFirstTime) {
            // Marquer comme déjà affiché
            DOM.resultSectionFinancial.setAttribute('data-shown-before', 'true');

            // Ajouter la classe d'animation comme au chargement de la page
            DOM.resultSectionFinancial.classList.add('fade-in-slide-up');
        }
    }
    if (DOM.shareSectionFinancial) {
        DOM.shareSectionFinancial.classList.remove('hidden');
    }

    // Masquer les sections du mode temporel
    DOM.resultSectionTemporal.classList.add('hidden');
    DOM.shareSectionTemporal.classList.add('hidden');

    // Déclencher l'événement pour PWA
    window.dispatchEvent(new CustomEvent('calculationComplete', {
        detail: { mode: 'financial', count: state.calculationCount }
    }));

    state.currentActiveMode = 'financial';
    state.isCalculating = false;
}
