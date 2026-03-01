/**
 * Module: dom-cache.js
 * Cache des références DOM pour éviter les recherches répétées
 * Les éléments sont récupérés une seule fois au démarrage
 */

export const DOM = {
    // Mode temporel
    amount: null,
    temporalInputs: null,
    resultTextTemporal: null,
    resultSectionTemporal: null,
    shareSectionTemporal: null,
    
    // Mode financier
    financialInputs: null,
    objectTypeSelect: null,
    objectPriceInput: null,
    timePeriodSelect: null,
    customPeriod: null,
    customPeriodContainer: null,
    resultTextFinancial: null,
    resultSectionFinancial: null,
    shareSectionFinancial: null,
    comparisonResultTextFinancial: null,
    
    // Dropdowns
    objectTypeOptions: null,
    objectTypeTrigger: null,
    objectTypeDropdown: null,
    
    // UI générale
    currentExample: null,
    modeToggle: null,
    modesContainer: null,
    temporalModeBtn: null,
    financialModeBtn: null
};

const ID_MAPPINGS = [
    ['amount', 'amount'],
    ['temporalInputs', 'temporal-inputs'],
    ['resultTextTemporal', 'result-text-temporal'],
    ['resultSectionTemporal', 'result-section-temporal'],
    ['financialInputs', 'financial-inputs'],
    ['objectTypeSelect', 'object-type'],
    ['objectPriceInput', 'object-price'],
    ['timePeriodSelect', 'time-period'],
    ['customPeriod', 'custom-period'],
    ['customPeriodContainer', 'custom-period-container'],
    ['resultTextFinancial', 'result-text-financial'],
    ['resultSectionFinancial', 'result-section-financial'],
    ['comparisonResultTextFinancial', 'comparison-result-text-financial'],
    ['objectTypeOptions', 'object-type-options'],
    ['objectTypeTrigger', 'object-type-trigger'],
    ['objectTypeDropdown', 'object-type-dropdown'],
    ['currentExample', 'current-example'],
    ['temporalModeBtn', 'temporal-mode-btn'],
    ['financialModeBtn', 'financial-mode-btn']
];

const SELECTOR_MAPPINGS = [
    ['modeToggle', '.mode-toggle'],
    ['modesContainer', '.modes-container']
];

export function initDOMCache() {
    const doc = document;

    for (let i = 0; i < ID_MAPPINGS.length; i++) {
        const mapping = ID_MAPPINGS[i];
        DOM[mapping[0]] = doc.getElementById(mapping[1]);
    }

    for (let i = 0; i < SELECTOR_MAPPINGS.length; i++) {
        const mapping = SELECTOR_MAPPINGS[i];
        DOM[mapping[0]] = doc.querySelector(mapping[1]);
    }

    DOM.shareSectionTemporal = DOM.resultSectionTemporal?.querySelector('.share-section') || null;
    DOM.shareSectionFinancial = DOM.resultSectionFinancial?.querySelector('.share-section') || null;
}
