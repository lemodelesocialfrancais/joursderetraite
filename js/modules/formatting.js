/**
 * Module: formatting.js
 * Fonctions de formatage des nombres et des montants
 */

// === FORMATEURS RÉUTILISÉS (créés une seule fois au chargement du module) ===
const CURRENCY_FORMATTER = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});
const BLUR_NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 10
});
const NBSP = '\u00A0';
const RE_NBSP = /\u00A0/g;
const RE_INVALID_CHARS = /[^\d.,]/g;
const RE_ANY_SPACE = /\s/g;
const RE_COMMA = /,/g;
const RE_GROUP_THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;
const DAYS_IN_YEAR = 365.25;

function getTotalThousandsSeparators(integerLength) {
    return integerLength > 3 ? Math.floor((integerLength - 1) / 3) : 0;
}

function countThousandsSeparatorsBeforeCursor(cursorPos, integerLength) {
    if (cursorPos <= 0 || integerLength <= 3) return 0;

    const totalSeparators = getTotalThousandsSeparators(integerLength);
    const cappedCursorPos = Math.min(cursorPos, integerLength);
    const separatorsAtOrAfterCursor = Math.floor((integerLength - cappedCursorPos) / 3);
    const separatorsBeforeCursor = totalSeparators - separatorsAtOrAfterCursor;

    return separatorsBeforeCursor > 0 ? separatorsBeforeCursor : 0;
}

/**
 * Formate les nombres avec des espaces insécables pour séparer les milliers
 * @param {HTMLInputElement} input - Le champ de saisie à formater
 */
export function formatNumberInput(input) {
    // Sauvegarder la position du curseur
    const start = input.selectionStart;
    const end = input.selectionEnd;

    // Récupérer la valeur actuelle et supprimer les espaces insécables pour le traitement
    let originalValue = input.value.replace(RE_NBSP, '');

    // Nettoyage: conserver uniquement chiffres, point et virgule
    originalValue = originalValue.replace(RE_INVALID_CHARS, '');

    // Remplacer les virgules par des points pour le traitement
    originalValue = originalValue.replace(RE_COMMA, '.');

    // Empêcher plus d'un point décimal
    const decimalPoints = originalValue.split('.');
    if (decimalPoints.length > 2) {
        originalValue = decimalPoints[0] + '.' + decimalPoints.slice(1).join('');
    }

    // Séparer la partie entière et la partie décimale
    const parts = originalValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] ? '.' + parts[1] : '';

    // Formater la partie entière avec des espaces insécables
    const formattedInteger = integerPart.replace(RE_GROUP_THOUSANDS, NBSP);

    // Mettre à jour la valeur du champ
    const newValue = formattedInteger + decimalPart;

    // Only update if the value actually changed
    if (input.value !== newValue) {
        input.value = newValue;

        // Calculate the new cursor position after formatting
        let newStart = start;
        let newEnd = end;
        const integerLength = integerPart.length;
        const totalSpaces = getTotalThousandsSeparators(integerLength);

        // Count spaces in the integer part up to the cursor position
        if (start <= integerLength) {
            newStart = start + countThousandsSeparatorsBeforeCursor(start, integerLength);
        } else {
            newStart = start + totalSpaces;
        }

        // Same calculation for end position
        if (end <= integerLength) {
            newEnd = end + countThousandsSeparatorsBeforeCursor(end, integerLength);
        } else {
            newEnd = end + totalSpaces;
        }

        // Ensure positions are within bounds
        newStart = Math.min(newStart, input.value.length);
        newEnd = Math.min(newEnd, input.value.length);

        // Restore selection
        input.setSelectionRange(newStart, newEnd);
    }
}

/**
 * Extrait le nombre d'un champ formaté
 * @param {string} value - La valeur formatée
 * @returns {number} Le nombre extrait ou NaN
 */
export function extractNumber(value) {
    // Convertir en chaîne au cas où ce serait un autre type
    value = String(value);

    // Remplacer les espaces insécables par des espaces normaux, puis supprimer tous les espaces
    value = value.replace(RE_NBSP, ' ').replace(RE_ANY_SPACE, '');

    // Remplacer les virgules par des points
    value = value.replace(RE_COMMA, '.');

    // Extraire le nombre
    const result = parseFloat(value);

    // Retourner NaN si la conversion échoue, sinon le nombre
    return isNaN(result) ? NaN : result;
}

/**
 * Autorise seulement les chiffres et la virgule dans les champs de saisie
 * @param {HTMLInputElement} input - Le champ de saisie
 */
export function allowOnlyNumbersAndComma(input) {
    const cleaned = input.value.replace(/[^\d.,\u00A0]/g, '');
    if (cleaned !== input.value) {
        input.value = cleaned;
    }
}

/**
 * Formate un nombre avec des espaces insécables lors de la perte de focus
 * @param {HTMLInputElement} input - Le champ de saisie
 */
export function formatNumberOnBlur(input) {
    const numericValue = extractNumber(input.value);

    if (!isNaN(numericValue) && numericValue >= 0) {
        const formattedValue = BLUR_NUMBER_FORMATTER.format(numericValue).replace(RE_ANY_SPACE, NBSP);

        if (input.value !== formattedValue) {
            input.value = formattedValue;
        }
    }
}

/**
 * Formate les montants en euros
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté
 */
export function formatCurrency(amount) {
    return CURRENCY_FORMATTER.format(amount);
}

/**
 * Obtient le texte de la période
 * @param {number} multiplier - Le multiplicateur de période
 * @returns {string} Le texte de la période
 */
export function getPeriodText(multiplier) {
    if (multiplier === 1) return "1 an";
    if (multiplier === 0.5) return "6 mois";
    if (multiplier === 0.25) return "3 mois";
    if (multiplier === 0.1) return "1 mois";
    if (Math.abs(multiplier - 0.033) < 0.001) return "10 jours";
    if (Math.abs(multiplier - 0.01) < 0.001) return "1 jour";

    // Pour les valeurs personnalisées
    const days = multiplier * DAYS_IN_YEAR;
    if (days >= 365) {
        const years = Math.floor(days / DAYS_IN_YEAR);
        return `${years} an${years > 1 ? 's' : ''}`;
    } else if (days >= 30) {
        const months = Math.floor(days / 30.44);
        return `${months} mois`;
    } else if (days >= 1) {
        const daysRounded = Math.floor(days);
        return `${daysRounded} jour${daysRounded > 1 ? 's' : ''}`;
    } else {
        const hours = Math.floor(days * 24);
        return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
}
