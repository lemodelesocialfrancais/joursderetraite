/**
 * Module: ui.js
 * Fonctions d'interface utilisateur
 */

import { state } from './state.js';
import { formatNumberInput } from './formatting.js';
import { getFinancialExamples, getExampleById, getRandomExample } from './examples.js';
import { DOM } from './dom-cache.js';
import { showWarning } from './toast.js';

// calculate est chargé en différé (main.js) et exposé sur window

// Cache pour le padding du conteneur marquee (ne change jamais)
let __marqueePaddingCache = null;
let __customDropdownsInitialized = false;
let __dropdownOutsideClickBound = false;

/**
 * Nettoie le label pour l'affichage dans le dropdown financier
 * Enlève l'article initial et formate
 * @param {string} label - Le label original
 * @returns {string} Le label nettoyé
 */
function cleanLabelForDropdown(label) {
    // Enlever l'article au début (le, la, les, l', un, une, des)
    let cleaned = label.replace(/^(le|la|les|l'|un|une|des)\s+/i, '').replace(/^l'/i, '');
    // Majuscule au début
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
}

/**
 * Peuple le dropdown financier avec les exemples depuis examples.js
 * Appelé une seule fois au démarrage
 */
export function populateFinancialDropdown() {
    if (!DOM.objectTypeOptions || !DOM.objectTypeSelect) return;
    
    const financialExamples = getFinancialExamples();
    
    // Vider les options existantes (garder seulement "Montant personnalisé")
    const customOptionDiv = DOM.objectTypeOptions.querySelector('[data-value="autre"]');
    DOM.objectTypeOptions.innerHTML = '';
    if (customOptionDiv) {
        DOM.objectTypeOptions.appendChild(customOptionDiv);
    } else {
        // Créer l'option personnalisée si elle n'existe pas
        const newCustomOption = document.createElement('div');
        newCustomOption.className = 'dropdown-option';
        newCustomOption.setAttribute('data-value', 'autre');
        newCustomOption.textContent = 'Montant personnalisé';
        DOM.objectTypeOptions.appendChild(newCustomOption);
    }
    
    // Vider le select natif aussi
    // IMPORTANT: On ne met PAS d'option vide pour que les index correspondent parfaitement
    // entre le dropdown personnalisé et le select natif
    DOM.objectTypeSelect.innerHTML = '';
    const customNativeOption = document.createElement('option');
    customNativeOption.value = 'autre';
    customNativeOption.textContent = 'Montant personnalisé';
    DOM.objectTypeSelect.appendChild(customNativeOption);
    
    // Ajouter les options depuis examples.js
    financialExamples.forEach(example => {
        // Option pour le dropdown personnalisé
        const divOption = document.createElement('div');
        divOption.className = 'dropdown-option';
        divOption.setAttribute('data-value', example.id);
        divOption.setAttribute('data-price', example.value.toString());
        divOption.textContent = cleanLabelForDropdown(example.label);
        DOM.objectTypeOptions.appendChild(divOption);
        
        // Option pour le select natif
        const selectOption = document.createElement('option');
        selectOption.value = example.id;
        selectOption.setAttribute('data-price', example.value.toString());
        selectOption.textContent = cleanLabelForDropdown(example.label);
        DOM.objectTypeSelect.appendChild(selectOption);
    });
}

/**
 * Initialise les dropdowns personnalisés
 * Version optimisée pour performances sur tous les appareils
 */
export function initCustomDropdowns() {
    if (__customDropdownsInitialized) return;

    // Peupler le dropdown financier avec les données centralisées
    populateFinancialDropdown();
    __customDropdownsInitialized = true;
    
    const customDropdowns = document.querySelectorAll('.custom-dropdown');

    customDropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const optionsContainer = dropdown.querySelector('.dropdown-options');
        const options = dropdown.querySelectorAll('.dropdown-option');
        const nativeSelect = dropdown.parentElement.querySelector('select');
        const triggerText = trigger.querySelector('.trigger-text');

        // Créer un wrapper pour les options et la scrollbar
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; max-height: 300px; height: 100%; overflow: hidden;';

        // Créer le conteneur de défilement pour les options
        const scrollContainer = document.createElement('div');
        scrollContainer.style.cssText = 'max-height: 300px; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none;';
        scrollContainer.className = 'dropdown-scroll-container';

        // Déplacer les options dans le conteneur de défilement
        options.forEach(opt => scrollContainer.appendChild(opt));

        // Créer la scrollbar personnalisée
        const scrollbar = document.createElement('div');
        scrollbar.className = 'custom-scrollbar';
        scrollbar.style.cssText = 'position: absolute; top: 8px; right: 4px; width: 10px; height: calc(100% - 16px); background: transparent; border-radius: 5px; pointer-events: auto; z-index: 10; cursor: pointer; opacity: 0; transition: opacity 0.3s ease;';

        const thumb = document.createElement('div');
        thumb.className = 'custom-scrollbar-thumb';
        thumb.style.cssText = 'position: absolute; top: 0; left: 2px; width: 6px; background: var(--gold-500); border-radius: 3px; box-shadow: 0 0 8px rgba(212, 175, 55, 0.6); transition: background 0.2s ease; min-height: 40px; cursor: pointer;';

        scrollbar.appendChild(thumb);
        wrapper.appendChild(scrollContainer);
        wrapper.appendChild(scrollbar);
        optionsContainer.appendChild(wrapper);

        // Variables pré-calculées pour optimiser les performances
        let cachedScrollHeight = 0;
        let cachedClientHeight = 0;
        let cachedMaxScroll = 0;
        let cachedTrackHeight = 0;
        let cachedThumbHeight = 40;

        /**
         * Met à jour les valeurs cachées (appelé à l'ouverture et resize)
         */
        function updateCachedValues() {
            cachedScrollHeight = scrollContainer.scrollHeight;
            cachedClientHeight = scrollContainer.clientHeight;
            cachedMaxScroll = cachedScrollHeight - cachedClientHeight;
            cachedTrackHeight = cachedClientHeight - 16;
            cachedThumbHeight = Math.max(40, (cachedClientHeight / cachedScrollHeight) * cachedTrackHeight);
            thumb.style.height = cachedThumbHeight + 'px';
        }

        /**
         * Met à jour la scrollbar - Version optimisée
         * Utilise les valeurs cachées pour éviter les reflows
         */
        function updateScrollbar() {
            // Masquer si pas de scroll nécessaire
            if (cachedScrollHeight <= cachedClientHeight) {
                scrollbar.style.opacity = '0';
                return;
            }

            scrollbar.style.opacity = '1';
            
            // Calcul optimisé de la position du thumb
            const scrollTop = scrollContainer.scrollTop;
            const maxThumbPos = cachedTrackHeight - cachedThumbHeight;
            const thumbPos = cachedMaxScroll > 0 ? (scrollTop / cachedMaxScroll) * maxThumbPos : 0;

            thumb.style.transform = `translateY(${thumbPos}px)`;
        }

        // Mettre à jour sur scroll avec RAF pour fluidité
        let ticking = false;
        scrollContainer.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateScrollbar();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Variables pour le drag
        let isDragging = false;
        let startY = 0;
        let startScrollTop = 0;
        
        function stopDrag() {
            if (!isDragging) return;
            isDragging = false;
            thumb.style.background = 'var(--gold-500)';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        function onMouseMove(e) {
            if (!isDragging) return;

            // Calcul optimisé avec valeurs cachées
            const deltaY = e.pageY - startY;
            const maxThumbPos = cachedTrackHeight - cachedThumbHeight;
            if (maxThumbPos <= 0 || cachedMaxScroll <= 0) return;

            const moveRatio = deltaY / maxThumbPos;
            scrollContainer.scrollTop = startScrollTop + (moveRatio * cachedMaxScroll);
        }

        function onMouseUp() {
            stopDrag();
        }

        thumb.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
            startY = e.pageY;
            startScrollTop = scrollContainer.scrollTop;
            thumb.style.background = 'var(--gold-400)';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        // Click sur la track pour sauter
        scrollbar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (e.target === scrollbar) {
                const rect = scrollbar.getBoundingClientRect();
                const clickPos = e.clientY - rect.top;
                const trackHeight = rect.height;
                if (trackHeight <= cachedThumbHeight || cachedMaxScroll <= 0) return;
                const scrollRatio = (clickPos - cachedThumbHeight / 2) / (trackHeight - cachedThumbHeight);
                scrollContainer.scrollTop = scrollRatio * cachedMaxScroll;
            }
        });

        // Empêcher la fermeture du dropdown lors d'un clic à l'intérieur
        optionsContainer.addEventListener('mousedown', (e) => e.stopPropagation());
        optionsContainer.addEventListener('click', (e) => e.stopPropagation());

        // Toggle dropdown - avec mise à jour des valeurs cachées à l'ouverture
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Fermer les autres dropdowns ouverts
            document.querySelectorAll('.custom-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) {
                    openDropdown.classList.remove('open');
                    // Fallback pour :has() - retirer .dropdown-open du card parent
                    const parentCard = openDropdown.closest('.card');
                    if (parentCard) parentCard.classList.remove('dropdown-open');
                }
            });
            dropdown.classList.toggle('open');
            
            // Fallback pour :has() - toggler .dropdown-open sur le card parent
            const parentCard = dropdown.closest('.card');
            if (parentCard) {
                if (dropdown.classList.contains('open')) {
                    parentCard.classList.add('dropdown-open');
                } else {
                    parentCard.classList.remove('dropdown-open');
                }
            }
            
            // Mettre à jour les valeurs cachées si le dropdown est ouvert
            if (dropdown.classList.contains('open')) {
                // Utiliser requestAnimationFrame pour s'assurer que le DOM est à jour
                requestAnimationFrame(() => {
                    updateCachedValues();
                    updateScrollbar();
                });
            }
        });

        // Handle option click via event delegation
        scrollContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.dropdown-option');
            if (!option) return;
            
            e.stopPropagation();
            
            const value = option.getAttribute('data-value');
            const text = option.textContent;

            // Fermer le dropdown IMMÉDIATEMENT avant toute autre chose
            // Cela permet au clic suivant (sur "Comparer") d'atteindre le bouton
            dropdown.classList.remove('open');
            
            // Fallback pour :has() - retirer .dropdown-open du card parent
            const parentCard = dropdown.closest('.card');
            if (parentCard) parentCard.classList.remove('dropdown-open');

            // Update trigger
            triggerText.textContent = text;

            // Sync with native select
            if (nativeSelect) {
                nativeSelect.value = value;
                updateObjectPrice();
                const event = new Event('change', { bubbles: true });
                nativeSelect.dispatchEvent(event);
            }

            // Update selected state in UI
            scrollContainer.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Close on click outside
    if (!__dropdownOutsideClickBound) {
        __dropdownOutsideClickBound = true;
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
                // Fallback pour :has() - retirer .dropdown-open du card parent
                const parentCard = dropdown.closest('.card');
                if (parentCard) parentCard.classList.remove('dropdown-open');
            });
        });
    }
}

/**
 * Bascule l'accordéon méthodologie
 */
export function toggleMethodology() {
    const accordion = document.getElementById('methodology-section');
    if (accordion) {
        if (!accordion.hasAttribute('data-content-loaded')) {
            const template = document.getElementById('methodology-template');
            const target = document.getElementById('methodology-content-target');
            if (template && target) {
                target.appendChild(template.content.cloneNode(true));
                accordion.setAttribute('data-content-loaded', 'true');
            }
        }
        accordion.classList.toggle('open');
    }
}

/**
 * Définit un exemple aléatoire
 */
export function setRandomExample() {
    if (typeof window.calculate !== 'function') {
        setTimeout(setRandomExample, 200);
        return;
    }

    if (DOM.temporalInputs.classList.contains('hidden')) {
        showWarning("Le bouton 'Exemple aléatoire' n'est disponible que dans le mode temporel.");
        return;
    }

    const randomExample = getRandomExample();
    const formattedValue = randomExample.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');

    if (DOM.amount) {
        DOM.amount.value = formattedValue;
        state.currentExampleLabel = randomExample.label;
    }

    formatNumberInput(DOM.amount);

    if (DOM.currentExample) {
        let label = randomExample.label;

        let cleanLabelForMarquee = label.replace(/^(le|la|les|l'|un|une|des)\s+/i, '').replace(/^l'/i, '');
        cleanLabelForMarquee = cleanLabelForMarquee.charAt(0).toUpperCase() + cleanLabelForMarquee.slice(1);

        const parts = label.split(/\s+[-–—]\s+/);
        if (parts.length > 1) {
            label = parts.slice(1).join(' - ');
        }

        DOM.currentExample.innerHTML = `<span class="marquee-content">${cleanLabelForMarquee}</span>`;
        DOM.currentExample.classList.remove('scrolling');

        requestAnimationFrame(() => {
            const marqueeContent = DOM.currentExample.querySelector('.marquee-content');
            if (!marqueeContent) return;

            if (__marqueePaddingCache === null) {
                const style = getComputedStyle(DOM.currentExample);
                __marqueePaddingCache = {
                    left: parseFloat(style.paddingLeft),
                    right: parseFloat(style.paddingRight)
                };
            }
            
            const availableWidth = DOM.currentExample.clientWidth - __marqueePaddingCache.left - __marqueePaddingCache.right;
            const scrollWidth = marqueeContent.scrollWidth;

            if (scrollWidth > availableWidth) {
                DOM.currentExample.classList.add('scrolling');
                const scrollDistance = -(scrollWidth - availableWidth + 10);
                DOM.currentExample.style.setProperty('--scroll-distance', `${scrollDistance}px`);
                const baseDuration = Math.max(4, (scrollWidth - availableWidth) / 25);
                marqueeContent.style.animationDuration = `${baseDuration}s`;
            }
        });
    } else {
        state.currentExampleLabel = '';
    }

    window.calculate();
}

/**
 * Réinitialise le formulaire du mode temporel uniquement
 */
export function resetForm() {
    if (DOM.amount) {
        DOM.amount.value = '';
    }

    if (DOM.currentExample) {
        DOM.currentExample.textContent = '';
    }
    state.currentExampleLabel = '';

    // Masquer les sections de résultat temporel uniquement
    if (DOM.resultSectionTemporal) DOM.resultSectionTemporal.classList.add('hidden');
    if (DOM.shareSectionTemporal) DOM.shareSectionTemporal.classList.add('hidden');

    // Réinitialiser le texte temporel
    if (DOM.resultTextTemporal) DOM.resultTextTemporal.textContent = '';

    // Réinitialiser uniquement l'état temporel
    state.storedTemporalResult = '';
}

/**
 * Bascule entre les modes temporel et financier (Version Premium)
 * Utilise des transitions CSS pilotées par data-attribute
 * @param {string} mode - 'temporal' ou 'financial'
 */
export function switchMode(mode) {
    if (state.currentActiveMode === mode) return;

    // Initialiser le dropdown financier uniquement au premier accès du mode financier.
    if (mode === 'financial') {
        initCustomDropdowns();
    }

    state.isCalculating = true;

    // Mise à jour de l'état global
    state.currentActiveMode = mode;

    // Mise à jour du data-attribute pour la pilule glissante
    if (DOM.modeToggle) {
        DOM.modeToggle.setAttribute('data-active', mode);
    }

    // 1. Mise à jour du conteneur pour déclencher les animations CSS
    if (DOM.modesContainer) {
        DOM.modesContainer.setAttribute('data-active-mode', mode);
    }

    // 2. Gestion des attributs 'hidden' pour l'accessibilité et le layout
    // On s'assure que les deux sont présents dans le DOM pour la transition
    if (DOM.temporalInputs) DOM.temporalInputs.removeAttribute('hidden');
    if (DOM.financialInputs) DOM.financialInputs.removeAttribute('hidden');

    // 3. Mise à jour des boutons du toggle
    if (mode === 'temporal') {
        if (DOM.temporalModeBtn) DOM.temporalModeBtn.classList.add('active');
        if (DOM.financialModeBtn) DOM.financialModeBtn.classList.remove('active');

        // Gérer la visibilité des résultats (immédiat pour éviter confusion visuelle)
        toggleResultSections('temporal');

    } else {
        if (DOM.financialModeBtn) DOM.financialModeBtn.classList.add('active');
        if (DOM.temporalModeBtn) DOM.temporalModeBtn.classList.remove('active');

        toggleResultSections('financial');
    }

    setTimeout(() => {
        state.isCalculating = false;
    }, 600); // Correspond à la durée de transition CSS
}

/**
 * Helper pour basculer la visibilité des sections de résultats/partage
 */
function toggleResultSections(activeMode) {
    // On cache tout d'abord
    if (DOM.resultSectionTemporal) DOM.resultSectionTemporal.classList.add('hidden');
    if (DOM.shareSectionTemporal) DOM.shareSectionTemporal.classList.add('hidden');
    if (DOM.resultSectionFinancial) DOM.resultSectionFinancial.classList.add('hidden');
    if (DOM.shareSectionFinancial) DOM.shareSectionFinancial.classList.add('hidden');

    // On réaffiche seulement ce qui est pertinent et contient des données
    if (activeMode === 'temporal' && state.storedTemporalResult) {
        if (DOM.resultSectionTemporal) DOM.resultSectionTemporal.classList.remove('hidden');
        if (DOM.shareSectionTemporal) DOM.shareSectionTemporal.classList.remove('hidden');
    } else if (activeMode === 'financial' && state.storedFinancialResult) {
        if (DOM.resultSectionFinancial) DOM.resultSectionFinancial.classList.remove('hidden');
        if (DOM.shareSectionFinancial) DOM.shareSectionFinancial.classList.remove('hidden');
    }
}

/**
 * Met à jour le prix en fonction de l'objet sélectionné
 * Utilise les données centralisées de examples.js
 */
export function updateObjectPrice() {
    if (!DOM.objectTypeSelect || !DOM.objectPriceInput) return;

    const selectedValue = DOM.objectTypeSelect.value;

    if (selectedValue === 'autre') {
        DOM.objectPriceInput.value = '';
        DOM.objectPriceInput.disabled = false;
    } else if (selectedValue === '') {
        DOM.objectPriceInput.value = '';
        DOM.objectPriceInput.disabled = false;
    } else {
        // Récupérer l'exemple depuis examples.js via l'ID
        const example = getExampleById(selectedValue);
        if (example) {
            const formattedPrice = example.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
            DOM.objectPriceInput.value = formattedPrice;
        }
        DOM.objectPriceInput.disabled = true;
    }

    // Gérer la période personnalisée
    if (DOM.timePeriodSelect && DOM.customPeriodContainer) {
        if (DOM.timePeriodSelect.value === 'custom') {
            DOM.customPeriodContainer.classList.remove('hidden');
        } else {
            DOM.customPeriodContainer.classList.add('hidden');
        }
    }
}

/**
 * Gère l'entrée de l'utilisateur (masque l'exemple affiché)
 */
export function handleInput() {
    if (DOM.currentExample) {
        DOM.currentExample.textContent = '';
    }
    state.currentExampleLabel = '';
}
