/**
 * Module: ui.js
 * Fonctions d'interface utilisateur
 */

import { state } from './state.js';
import { formatNumberInput } from './formatting.js';
import { getFinancialExamples, getExampleById } from './examples.js';

// calculate et getRandomExample sont chargés 500 ms après le lancement (main.js) et exposés sur window

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
    const dropdownOptions = document.getElementById('object-type-options');
    const nativeSelect = document.getElementById('object-type');
    
    if (!dropdownOptions || !nativeSelect) return;
    
    const financialExamples = getFinancialExamples();
    
    // Vider les options existantes (garder seulement "Objet personnalisé")
    const customOptionDiv = dropdownOptions.querySelector('[data-value="autre"]');
    dropdownOptions.innerHTML = '';
    if (customOptionDiv) {
        dropdownOptions.appendChild(customOptionDiv);
    } else {
        // Créer l'option personnalisée si elle n'existe pas
        const newCustomOption = document.createElement('div');
        newCustomOption.className = 'dropdown-option';
        newCustomOption.setAttribute('data-value', 'autre');
        newCustomOption.textContent = 'Objet personnalisé';
        dropdownOptions.appendChild(newCustomOption);
    }
    
    // Vider le select natif aussi
    // IMPORTANT: On ne met PAS d'option vide pour que les index correspondent parfaitement
    // entre le dropdown personnalisé et le select natif
    nativeSelect.innerHTML = '';
    const customNativeOption = document.createElement('option');
    customNativeOption.value = 'autre';
    customNativeOption.textContent = 'Objet personnalisé';
    nativeSelect.appendChild(customNativeOption);
    
    // Ajouter les options depuis examples.js
    financialExamples.forEach(example => {
        // Option pour le dropdown personnalisé
        const divOption = document.createElement('div');
        divOption.className = 'dropdown-option';
        divOption.setAttribute('data-value', example.id);
        divOption.setAttribute('data-price', example.value.toString());
        divOption.textContent = cleanLabelForDropdown(example.label);
        dropdownOptions.appendChild(divOption);
        
        // Option pour le select natif
        const selectOption = document.createElement('option');
        selectOption.value = example.id;
        selectOption.setAttribute('data-price', example.value.toString());
        selectOption.textContent = cleanLabelForDropdown(example.label);
        nativeSelect.appendChild(selectOption);
    });
}

/**
 * Initialise les dropdowns personnalisés
 * Version optimisée pour performances sur tous les appareils
 */
export function initCustomDropdowns() {
    // Peupler le dropdown financier avec les données centralisées
    populateFinancialDropdown();
    
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

        thumb.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
            startY = e.pageY;
            startScrollTop = scrollContainer.scrollTop;
            thumb.style.background = 'var(--gold-400)';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            // Calcul optimisé avec valeurs cachées
            const deltaY = e.pageY - startY;
            const maxThumbPos = cachedTrackHeight - cachedThumbHeight;
            const moveRatio = deltaY / maxThumbPos;
            scrollContainer.scrollTop = startScrollTop + (moveRatio * cachedMaxScroll);
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                thumb.style.background = 'var(--gold-500)';
                document.body.style.userSelect = '';
            }
        });

        // Click sur la track pour sauter
        scrollbar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (e.target === scrollbar) {
                const rect = scrollbar.getBoundingClientRect();
                const clickPos = e.clientY - rect.top;
                const trackHeight = rect.height;
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
                if (openDropdown !== dropdown) openDropdown.classList.remove('open');
            });
            dropdown.classList.toggle('open');
            
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
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    });
}

/**
 * Bascule l'accordéon méthodologie
 */
export function toggleMethodology() {
    const accordion = document.getElementById('methodology-section');
    if (accordion) {
        accordion.classList.toggle('open');
    }
}

/**
 * Définit un exemple aléatoire
 */
export function setRandomExample() {

    if (typeof window.getRandomExample !== 'function' || typeof window.calculate !== 'function') {
        setTimeout(setRandomExample, 200);
        return;
    }
    const temporalInputs = document.getElementById('temporal-inputs');

    if (temporalInputs.classList.contains('hidden')) {
        alert("Le bouton 'Exemple aléatoire' n'est disponible que dans le mode temporel.");
        return;
    }

    const randomExample = window.getRandomExample();
    const formattedValue = randomExample.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    const amountInput = document.getElementById('amount');

    if (amountInput) {
        amountInput.value = formattedValue;
        state.currentExampleLabel = randomExample.label; // Utiliser le label propre (ex: "l'UNESCO (2025)")
    }

    formatNumberInput(document.getElementById('amount'));

    // Mettre à jour l'affichage de l'exemple actuel
    const currentExampleElement = document.getElementById('current-example');
    if (currentExampleElement) {
        let label = randomExample.label;

        // Nettoyer le label pour le marquee (enlever l'article au début ET mettre une majuscule)
        let cleanLabelForMarquee = label.replace(/^(le|la|les|l'|un|une|des)\s+/i, '').replace(/^l'/i, '');
        cleanLabelForMarquee = cleanLabelForMarquee.charAt(0).toUpperCase() + cleanLabelForMarquee.slice(1);

        const parts = label.split(/\s+[-–—]\s+/);
        if (parts.length > 1) {
            label = parts.slice(1).join(' - ');
        }

        // Structure pour le marquee
        currentExampleElement.innerHTML = `<span class="marquee-content">${cleanLabelForMarquee}</span>`;
        currentExampleElement.classList.remove('scrolling');

        // Attendre que le rendu soit stable pour mesurer le débordement réel
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const marqueeContent = currentExampleElement.querySelector('.marquee-content');
                if (!marqueeContent) return;

                const currentExampleStyle = window.getComputedStyle(currentExampleElement);
                const paddingLeft = parseFloat(currentExampleStyle.paddingLeft);
                const paddingRight = parseFloat(currentExampleStyle.paddingRight);
                const availableWidth = currentExampleElement.clientWidth - paddingLeft - paddingRight;
                const scrollWidth = marqueeContent.scrollWidth;

                if (scrollWidth > availableWidth) {
                    currentExampleElement.classList.add('scrolling');

                    // Calculer la distance de défilement nécessaire (réduire l'espace vide à la fin)
                    const scrollDistance = -(scrollWidth - availableWidth + 10); // Réduit à 10px d'espace vide
                    currentExampleElement.style.setProperty('--scroll-distance', `${scrollDistance}px`);

                    // Durée de l'animation ajustée pour le ping-pong avec 30% de pause (mouvement sur 40% du temps)
                    const baseDuration = Math.max(4, (scrollWidth - availableWidth) / 25);
                    marqueeContent.style.animationDuration = `${baseDuration}s`;
                }
            });
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
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.value = '';
    }

    const currentExampleElement = document.getElementById('current-example');
    if (currentExampleElement) {
        currentExampleElement.textContent = '';
    }
    state.currentExampleLabel = '';

    // Masquer les sections de résultat temporel uniquement
    const resultTemporal = document.getElementById('result-section-temporal');
    const shareTemporal = document.getElementById('share-section-temporal');

    if (resultTemporal) resultTemporal.classList.add('hidden');
    if (shareTemporal) shareTemporal.classList.add('hidden');

    // Réinitialiser le texte temporel
    const resultTextTemporal = document.getElementById('result-text-temporal');
    if (resultTextTemporal) resultTextTemporal.textContent = '';

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

    state.isCalculating = true;

    // Mise à jour de l'état global
    state.currentActiveMode = mode;

    // Mise à jour du data-attribute pour la pilule glissante
    const modeToggle = document.querySelector('.mode-toggle');
    if (modeToggle) {
        modeToggle.setAttribute('data-active', mode);
    }

    // 1. Mise à jour du conteneur pour déclencher les animations CSS
    const modesContainer = document.querySelector('.modes-container');
    if (modesContainer) {
        modesContainer.setAttribute('data-active-mode', mode);
    }

    // 2. Gestion des attributs 'hidden' pour l'accessibilité et le layout
    // On s'assure que les deux sont présents dans le DOM pour la transition
    const temporalInputs = document.getElementById('temporal-inputs');
    const financialInputs = document.getElementById('financial-inputs');

    if (temporalInputs) temporalInputs.removeAttribute('hidden');
    if (financialInputs) financialInputs.removeAttribute('hidden');

    // 3. Mise à jour des boutons du toggle
    const temporalModeBtn = document.getElementById('temporal-mode-btn');
    const financialModeBtn = document.getElementById('financial-mode-btn');

    if (mode === 'temporal') {
        if (temporalModeBtn) temporalModeBtn.classList.add('active');
        if (financialModeBtn) financialModeBtn.classList.remove('active');

        // Gérer la visibilité des résultats (immédiat pour éviter confusion visuelle)
        toggleResultSections('temporal');

    } else {
        if (financialModeBtn) financialModeBtn.classList.add('active');
        if (temporalModeBtn) temporalModeBtn.classList.remove('active');

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
    const resultTemporal = document.getElementById('result-section-temporal');
    const shareTemporal = document.getElementById('share-section-temporal');
    const resultFinancial = document.getElementById('result-section-financial');
    const shareFinancial = document.getElementById('share-section-financial');

    // On cache tout d'abord
    if (resultTemporal) resultTemporal.classList.add('hidden');
    if (shareTemporal) shareTemporal.classList.add('hidden');
    if (resultFinancial) resultFinancial.classList.add('hidden');
    if (shareFinancial) shareFinancial.classList.add('hidden');

    // On réaffiche seulement ce qui est pertinent et contient des données
    if (activeMode === 'temporal' && state.storedTemporalResult) {
        if (resultTemporal) resultTemporal.classList.remove('hidden');
        if (shareTemporal) shareTemporal.classList.remove('hidden');
    } else if (activeMode === 'financial' && state.storedFinancialResult) {
        if (resultFinancial) resultFinancial.classList.remove('hidden');
        if (shareFinancial) shareFinancial.classList.remove('hidden');
    }
}

/**
 * Met à jour le prix en fonction de l'objet sélectionné
 * Utilise les données centralisées de examples.js
 */
export function updateObjectPrice() {
    const objectTypeSelect = document.getElementById('object-type');
    const objectPriceInput = document.getElementById('object-price');
    const customObjectInput = document.getElementById('custom-object-input');
    const objectNameInput = document.getElementById('object-name');
    const customPeriodContainer = document.getElementById('custom-period-container');

    if (!objectTypeSelect || !objectPriceInput) return;

    const selectedValue = objectTypeSelect.value;

    if (selectedValue === 'autre') {
        objectPriceInput.value = '';
        if (objectNameInput) objectNameInput.value = '';
        if (customObjectInput) customObjectInput.classList.remove('hidden');
        objectPriceInput.disabled = false;
    } else if (selectedValue === '') {
        objectPriceInput.value = '';
        if (objectNameInput) objectNameInput.value = '';
        if (customObjectInput) customObjectInput.classList.add('hidden');
        objectPriceInput.disabled = false;
    } else {
        // Récupérer l'exemple depuis examples.js via l'ID
        const example = getExampleById(selectedValue);
        if (example) {
            const formattedPrice = example.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
            objectPriceInput.value = formattedPrice;
            if (objectNameInput) {
                // Utiliser le label nettoyé pour le nom de l'objet
                objectNameInput.value = cleanLabelForDropdown(example.label);
            }
        }
        if (customObjectInput) customObjectInput.classList.add('hidden');
        objectPriceInput.disabled = true;
    }

    // Gérer la période personnalisée
    const timePeriodSelect = document.getElementById('time-period');
    if (timePeriodSelect && customPeriodContainer) {
        if (timePeriodSelect.value === 'custom') {
            customPeriodContainer.classList.remove('hidden');
        } else {
            customPeriodContainer.classList.add('hidden');
        }
    }
}

/**
 * Gère l'entrée de l'utilisateur (masque l'exemple affiché)
 */
export function handleInput() {
    const currentExampleElement = document.getElementById('current-example');
    if (currentExampleElement) {
        currentExampleElement.textContent = '';
    }
    state.currentExampleLabel = '';
}
