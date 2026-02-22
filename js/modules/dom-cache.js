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

export function initDOMCache() {
    // Mode temporel
    DOM.amount = document.getElementById('amount');
    DOM.temporalInputs = document.getElementById('temporal-inputs');
    DOM.resultTextTemporal = document.getElementById('result-text-temporal');
    DOM.resultSectionTemporal = document.getElementById('result-section-temporal');
    DOM.shareSectionTemporal = DOM.resultSectionTemporal?.querySelector('.share-section');
    
    // Mode financier
    DOM.financialInputs = document.getElementById('financial-inputs');
    DOM.objectTypeSelect = document.getElementById('object-type');
    DOM.objectPriceInput = document.getElementById('object-price');
    DOM.timePeriodSelect = document.getElementById('time-period');
    DOM.customPeriod = document.getElementById('custom-period');
    DOM.customPeriodContainer = document.getElementById('custom-period-container');
    DOM.resultTextFinancial = document.getElementById('result-text-financial');
    DOM.resultSectionFinancial = document.getElementById('result-section-financial');
    DOM.shareSectionFinancial = DOM.resultSectionFinancial?.querySelector('.share-section');
    DOM.comparisonResultTextFinancial = document.getElementById('comparison-result-text-financial');
    
    // Dropdowns
    DOM.objectTypeOptions = document.getElementById('object-type-options');
    DOM.objectTypeTrigger = document.getElementById('object-type-trigger');
    DOM.objectTypeDropdown = document.getElementById('object-type-dropdown');
    
    // UI générale
    DOM.currentExample = document.getElementById('current-example');
    DOM.modeToggle = document.querySelector('.mode-toggle');
    DOM.modesContainer = document.querySelector('.modes-container');
    DOM.temporalModeBtn = document.getElementById('temporal-mode-btn');
    DOM.financialModeBtn = document.getElementById('financial-mode-btn');
}
