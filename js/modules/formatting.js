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

/**
 * Formate les nombres avec des espaces insécables pour séparer les milliers
 * @param {HTMLInputElement} input - Le champ de saisie à formater
 */
export function formatNumberInput(input) {
    // Sauvegarder la position du curseur
    const start = input.selectionStart;
    const end = input.selectionEnd;

    // Récupérer la valeur actuelle et supprimer les espaces insécables pour le traitement
    let originalValue = input.value.replace(/\u00A0/g, '');

    // Si la valeur contient autre chose que des chiffres, un point ou une virgule, ne rien faire
    if (!/^[0-9.,\b]*$/.test(originalValue)) {
        originalValue = originalValue.replace(/[^\d.,]/g, '');
    }

    // Remplacer les virgules par des points pour le traitement
    originalValue = originalValue.replace(/,/g, '.');

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
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');

    // Mettre à jour la valeur du champ
    const newValue = formattedInteger + decimalPart;

    // Only update if the value actually changed
    if (input.value !== newValue) {
        input.value = newValue;

        // Calculate the new cursor position after formatting
        let newStart = start;
        let newEnd = end;

        // Count spaces in the integer part up to the cursor position
        if (start <= integerPart.length) {
            const digitsBeforeCursor = integerPart.substring(0, start);
            let spacesAdded = 0;
            for (let i = 0; i < digitsBeforeCursor.length; i++) {
                const digitsToRight = integerPart.length - i;
                if ((digitsToRight % 3 === 0) && (digitsToRight < integerPart.length)) {
                    spacesAdded++;
                }
            }
            newStart = start + spacesAdded;
        } else {
            const totalDigits = integerPart.length;
            const totalSpaces = totalDigits > 3 ? Math.floor((totalDigits - 1) / 3) : 0;
            newStart = start + totalSpaces;
        }

        // Same calculation for end position
        if (end <= integerPart.length) {
            let spacesAdded = 0;
            for (let i = 0; i < integerPart.substring(0, end).length; i++) {
                const digitsToRight = integerPart.length - i;
                if ((digitsToRight % 3 === 0) && (digitsToRight < integerPart.length)) {
                    spacesAdded++;
                }
            }
            newEnd = end + spacesAdded;
        } else {
            const totalDigits = integerPart.length;
            const totalSpaces = totalDigits > 3 ? Math.floor((totalDigits - 1) / 3) : 0;
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
    value = value.replace(/\u00A0/g, ' ').replace(/\s/g, '');

    // Remplacer les virgules par des points
    value = value.replace(/,/g, '.');

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
    input.value = input.value.replace(/[^\d.,\u00A0]/g, '');
}

/**
 * Formate un nombre avec des espaces insécables lors de la perte de focus
 * @param {HTMLInputElement} input - Le champ de saisie
 */
export function formatNumberOnBlur(input) {
    const numericValue = extractNumber(input.value);

    if (!isNaN(numericValue) && numericValue >= 0) {
        const formattedValue = numericValue.toLocaleString('fr-FR', {
            maximumFractionDigits: 10
        }).replace(/\s/g, '\u00A0');

        input.value = formattedValue;
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
    const days = multiplier * 365.25;
    if (days >= 365) {
        const years = Math.floor(days / 365.25);
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
