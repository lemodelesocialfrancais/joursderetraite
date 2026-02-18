/**
 * Module: calculator.js
 * Fonctions de calcul pour l'équivalent retraites
 */

import { extractNumber, formatCurrency, getPeriodText } from './formatting.js';
import { state } from './state.js';
import { getExampleById } from './examples.js';

/**
 * Déclenche l'animation slideUp sur les éléments
 * @param {HTMLElement} element - L'élément conteneur
 */
export function triggerAnimation(element) {
    if (!element) return;

    const digits = element.querySelectorAll('.counter-digit span');
    digits.forEach((digit, index) => {
        digit.style.animation = 'none';
        digit.offsetHeight; // Force reflow
        digit.style.animation = `slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s backwards`;
    });
}

/**
 * Logique de calcul pour le mode temporel
 */
export function calculateLogic() {

    state.isCalculating = true;

    // Vérifier que nous sommes bien en mode temporel
    const temporalInputs = document.getElementById('temporal-inputs');
    if (temporalInputs.classList.contains('hidden')) {
        console.error("Erreur: calculateLogic() appelé alors que nous ne sommes pas en mode temporel");
        state.isCalculating = false;
        return;
    }

    // Récupérer la valeur brute du champ
    const amountInput = document.getElementById('amount');
    const rawValue = amountInput ? amountInput.value : '';

    // Si le champ est vide, ne rien faire
    if (rawValue.trim() === '') {
        state.isCalculating = false;
        return;
    }

    // Extraire le nombre de la valeur du champ
    const amount = extractNumber(rawValue);

    if (isNaN(amount) || amount < 0) {
        state.isCalculating = false;
        return;
    }

    // Incrémenter le compteur de calculs pour PWA
    state.calculationCount = (state.calculationCount || 0) + 1;
    localStorage.setItem('calculationCount', state.calculationCount.toString());

    // Montant total des retraites versées en France en 2025
    const totalRetraites = 420e9; // 420 milliards d'euros

    // Calcul du ratio
    const ratio = amount / totalRetraites;

    // Nombre de secondes dans une année
    const secondsInYear = 365.25 * 24 * 60 * 60;

    // Calcul des secondes équivalentes
    const equivalentSeconds = ratio * secondsInYear;

    // Conversion en années, mois, jours, heures, minutes et secondes
    const secondsInDay = 24 * 60 * 60;
    const secondsInHour = 60 * 60;
    const secondsInMinute = 60;

    // Calcul des années
    const years = Math.floor(equivalentSeconds / (365.25 * secondsInDay));
    let remainingSeconds = equivalentSeconds % (365.25 * secondsInDay);

    // Calcul des mois
    const daysInMonth = 365.25 / 12;
    const secondsInMonth = daysInMonth * secondsInDay;
    const months = Math.floor(remainingSeconds / secondsInMonth);
    remainingSeconds = remainingSeconds % secondsInMonth;

    // Calcul des jours, heures, minutes et secondes
    const days = Math.floor(remainingSeconds / secondsInDay);
    remainingSeconds = remainingSeconds % secondsInDay;
    const hours = Math.floor(remainingSeconds / secondsInHour);
    remainingSeconds = remainingSeconds % secondsInHour;
    const minutes = Math.floor(remainingSeconds / secondsInMinute);
    const seconds = Math.floor(remainingSeconds % secondsInMinute);

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
    const resultElement = document.getElementById('result-text-temporal');
    if (resultElement) {
        resultElement.innerHTML = finalHTML;
        triggerAnimation(resultElement);
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
    const resultSection = document.getElementById('result-section-temporal');
    const shareSection = document.getElementById('share-section-temporal');

    if (resultSection) {
        // Vérifier si c'est le premier affichage
        const isFirstTime = !resultSection.hasAttribute('data-shown-before');

        resultSection.classList.remove('hidden');

        if (isFirstTime) {
            // Marquer comme déjà affiché
            resultSection.setAttribute('data-shown-before', 'true');

            // Ajouter la classe d'animation comme au chargement de la page
            resultSection.classList.add('fade-in-slide-up');
        }
    }

    if (shareSection) {
        shareSection.classList.remove('hidden');
    }

    // Masquer les sections du mode financier
    const financialResultSection = document.getElementById('result-section-financial');
    const financialShareSection = document.getElementById('share-section-financial');
    if (financialResultSection) {
        financialResultSection.classList.add('hidden');
    }
    if (financialShareSection) {
        financialShareSection.classList.add('hidden');
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

    const temporalInputs = document.getElementById('temporal-inputs');

    if (temporalInputs.classList.contains('hidden')) {

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
    
    const objectTypeSelect = document.getElementById('object-type');
    const selectedValue = objectTypeSelect.value;
    let objectLabel = '';

    // Récupérer directement le label depuis examples.js (avec article)
    if (selectedValue === 'autre' || selectedValue === '') {
        objectLabel = document.getElementById('object-name').value || 'un objet';
    } else {
        const example = getExampleById(selectedValue);
        if (example && example.label) {
            // Enlever les parenthèses et leur contenu (ex: "(2025)", "(coût annuel)")
            objectLabel = example.label.split(' (')[0];
        }
    }

    // Récupérer la valeur brute du champ
    const rawPriceValue = document.getElementById('object-price').value;

    if (rawPriceValue.trim() === '') {
        alert("Veuillez entrer un prix pour l'objet.");
        return;
    }

    const objectPrice = extractNumber(rawPriceValue);
    const timePeriodValue = document.getElementById('time-period').value;

    if (isNaN(objectPrice) || objectPrice <= 0) {
        alert("Veuillez entrer un prix valide pour l'objet.");
        return;
    }

    let periodMultiplier;
    if (timePeriodValue === 'custom') {
        const rawPeriodValue = document.getElementById('custom-period').value;

        if (rawPeriodValue.trim() === '') {
            alert("Veuillez entrer une durée personnalisée.");
            return;
        }

        periodMultiplier = extractNumber(rawPeriodValue);
        if (isNaN(periodMultiplier) || periodMultiplier <= 0) {
            alert("Veuillez entrer une durée personnalisée valide.");
            return;
        }
    } else {
        periodMultiplier = parseFloat(timePeriodValue);
    }

    // Incrémenter le compteur de calculs pour PWA
    state.calculationCount = (state.calculationCount || 0) + 1;
    localStorage.setItem('calculationCount', state.calculationCount.toString());

    // Calcul du montant équivalent
    const annualRetirementAmount = 420e9;
    const periodAmount = annualRetirementAmount * periodMultiplier;
    const numberOfObjects = periodAmount / objectPrice;

    // Formatage du résultat
    let formattedNumber;
    let rawNumberFormatted;

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
        formattedNumber = numberOfObjects.toFixed(1).replace('.', ',');
        if (formattedNumber.endsWith(',0')) {
            formattedNumber = formattedNumber.slice(0, -2);
        }
    }

    const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));

    // Le label est utilisé tel quel (pas de pluriel en français pour "X fois le/la/un/une...")
    const safeObjectLabel = escapeHTML(objectLabel);

    // Affichage du résultat principal
    const mainResultText = document.getElementById('result-text-financial');
    const periodText = getPeriodText(periodMultiplier);

    // Déterminer si on doit ajouter "de" avant "fois" (pour millions/milliards)
    const foisText = (formattedNumber.includes('million') || formattedNumber.includes('milliard')) ? "de fois" : "fois";

    // Construction du HTML
    const resultHTML = `
        <div class="result-interpretation-header">Les prestations retraites de 2025 (<strong>${periodText}</strong>) pourraient financer&nbsp;:</div>
        <div class="result-grid-financial">
            <div class="result-box highlight">
                <span class="value counter-digit"><span>${formattedNumber}</span></span>
            </div>
            <span class="result-fois-text">${foisText} ${safeObjectLabel}</span>
        </div>
    `;

    mainResultText.innerHTML = resultHTML;
    triggerAnimation(mainResultText);

    // Texte simple pour le partage
    const priceText = numberOfObjects > 1 ? `à ${formatCurrency(objectPrice)} chacun` : `à ${formatCurrency(objectPrice)}`;
    const simpleText = `Avec ${periodText} de retraites (${formatCurrency(periodAmount)}), on peut avoir ${formattedNumber} ${foisText} ${objectLabel}.`;

    // Stocker les résultats
    state.storedFinancialResult = simpleText;
    // Pour compatibilité avec sharing.js
    const hiddenComparisonDiv = document.getElementById('comparison-result-text-financial');
    if (hiddenComparisonDiv) hiddenComparisonDiv.textContent = simpleText;

    // Afficher les sections du mode financier
    const financialResultSection = document.getElementById('result-section-financial');
    const financialShareSection = document.getElementById('share-section-financial');

    if (financialResultSection) {
        // Vérifier si c'est le premier affichage
        const isFirstTime = !financialResultSection.hasAttribute('data-shown-before');

        financialResultSection.classList.remove('hidden');

        if (isFirstTime) {
            // Marquer comme déjà affiché
            financialResultSection.setAttribute('data-shown-before', 'true');

            // Ajouter la classe d'animation comme au chargement de la page
            financialResultSection.classList.add('fade-in-slide-up');
        }
    }
    if (financialShareSection) {
        financialShareSection.classList.remove('hidden');
    }

    // Masquer les sections du mode temporel
    document.getElementById('result-section-temporal').classList.add('hidden');
    document.getElementById('share-section-temporal').classList.add('hidden');

    // Déclencher l'événement pour PWA
    window.dispatchEvent(new CustomEvent('calculationComplete', {
        detail: { mode: 'financial', count: state.calculationCount }
    }));

    state.currentActiveMode = 'financial';
    state.isCalculating = false;
}
