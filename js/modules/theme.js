/**
 * Module: theme.js
 * Gestion du thème clair/sombre
 */

/**
 * Met à jour l'icône du thème
 * @param {boolean} isDark - Si le thème sombre est actif
 * @param {boolean} isSystem - Si le thème suit les préférences système
 */
export function updateThemeIcon(isDark, isSystem) {
    const themeIcon = document.getElementById('theme-icon');
    if (!themeIcon) return;

    if (isDark) {
        // Icône lune pour le mode sombre
        themeIcon.setAttribute('d', 'M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z');
    } else {
        // Icône soleil pour le mode clair
        themeIcon.setAttribute('d', 'M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z');
    }
}

/**
 * Met à jour la couleur du thème (meta tag)
 * @param {boolean} isDark - Si le thème sombre est actif
 */
function updateThemeColor(isDark) {
    const themeColorMeta = document.getElementById('theme-color');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', isDark ? '#1a1a23' : '#ffffff');
    }
}

/**
 * Applique le thème
 * @param {boolean} isDark - Si le thème sombre doit être appliqué
 */
function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon(isDark, false);
    updateThemeColor(isDark);
}

/**
 * Initialise la gestion du thème
 */
export function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    const savedThemePreference = localStorage.getItem('themePreference');

    // Fonction pour initialiser le thème
    function initializeTheme() {
        let isDark;
        let isSystemBased = true;

        if (savedThemePreference === 'manual' && savedTheme !== null) {
            isDark = savedTheme === 'dark';
            isSystemBased = false;
        } else {
            isDark = prefersDarkScheme.matches;
            localStorage.setItem('themePreference', 'system');
        }

        applyTheme(isDark);

        if (isSystemBased) {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }
    }

    // Fonction pour basculer le thème
    function toggleThemeSystem() {
        const currentPreference = localStorage.getItem('themePreference');

        if (currentPreference === 'manual') {
            // Passer en mode automatique
            localStorage.setItem('themePreference', 'system');
            const isDark = prefersDarkScheme.matches;
            applyTheme(isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark, true);
        } else {
            // Passer en mode manuel
            const isCurrentlyDark = document.documentElement.classList.contains('dark');
            const newIsDark = !isCurrentlyDark;
            applyTheme(newIsDark);
            localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
            localStorage.setItem('themePreference', 'manual');
            updateThemeIcon(newIsDark, false);
        }
    }

    // Appliquer le thème initial
    initializeTheme();

    // Écouter les changements de préférences système
    prefersDarkScheme.addEventListener('change', (e) => {
        if (localStorage.getItem('themePreference') === 'system') {
            applyTheme(e.matches);
            localStorage.setItem('theme', e.matches ? 'dark' : 'light');
        } else {
            const isCurrentlyDark = document.documentElement.classList.contains('dark');
            if (isCurrentlyDark !== e.matches) {
                localStorage.setItem('themePreference', 'system');
                applyTheme(e.matches);
                localStorage.setItem('theme', e.matches ? 'dark' : 'light');
                updateThemeIcon(e.matches, true);
            }
        }
    });

    // Gestion du clic sur le bouton de thème
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleThemeSystem);
    }
}
