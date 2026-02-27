/**
 * Module: examples.js
 * Contient les exemples de valeurs célèbres pour la calculatrice
 * Source unique de vérité pour le mode temporel ET le mode financier
 */

// Tableau des exemples de valeurs célèbres
export const examples = [
    // --- Budgets et institutions ---
    { id: "unesco", value: 289000000, label: "le budget annuel de l'UNESCO (2025)" },
    { id: "armees", value: 50500000000, label: "le budget du ministère des Armées (2025)" },
    { id: "education", value: 64500000000, label: "le budget du ministère de l'Éducation nationale (2025)" },
    { id: "securite", value: 17000000000, label: "le budget du ministère de l'Intérieur (2025)" },
    { id: "transition_eco", value: 39000000000, label: "le budget du ministère de la Transition écologique et de la Cohésion des territoires (2025)" },
    { id: "justice", value: 10500000000, label: "le budget du ministère de la Justice (2025)" },
    { id: "affaires_etrangeres", value: 6000000000, label: "le budget du ministère des Affaires étrangères (2025)" },
    { id: "culture", value: 4000000000, label: "le budget du ministère de la Culture (2025)" },
    { id: "travail", value: 53600000000, label: "le budget du ministère du Travail, de la Santé, des Solidarités et des Familles (2025)" },
    { id: "ue", value: 199000000000, label: "le budget annuel de l'UE (2025)" },

    // --- Salaires et revenus ---
    { id: "mbappe", value: 82000000, label: "le salaire annuel de Kylian Mbappé (2025)" },
    { id: "pdg", value: 6500000, label: "la rémunération annuelle moyenne (fixe + variable) d'un PDG du CAC 40" },
    { id: "macron", value: 192456, label: "la rémunération annuelle brute estimée d'Emmanuel Macron" },
    { id: "depute", value: 91649, label: "la rémunération annuelle brute estimée d'un député" },
    { id: "senateur", value: 91649, label: "la rémunération annuelle brute estimée d'un sénateur" },
    { id: "ministre", value: 128304, label: "la rémunération annuelle brute estimée d'un ministre" },

    // --- Postes publics ---
    { id: "infirmiere", value: 46000, label: "le salaire brut annuel d'une infirmière" },
    { id: "policier", value: 46000, label: "le salaire brut annuel d'un policier" },
    { id: "pompier", value: 44700, label: "le salaire brut annuel d'un sapeur-pompier" },
    { id: "professeur", value: 46000, label: "le salaire brut annuel d'un professeur" },
    { id: "nounou", value: 20000, label: "le salaire brut annuel d'une auxiliaire de crèche" },

    // --- Immobilier et biens ---
    { id: "eti", value: 1324000000000, label: "la capitalisation totale du CAC 40 (31/12/2025)" },
    { id: "appartement_paris", value: 565000, label: "le prix moyen d'un appartement à Paris" },
    { id: "superyacht", value: 150000000, label: "le prix d'un superyacht de luxe" },
    { id: "avion_presidentiel", value: 225000000, label: "le coût estimé d'acquisition et d'aménagement de l'avion présidentiel français (A330)" },

    // --- Projets militaires et industriels ---
    { id: "suffren", value: 1500000000, label: "le prix d'un sous-marin Suffren" },
    { id: "epr", value: 19000000000, label: "le coût de construction de la centrale EPR de Flamanville" },
    { id: "pang", value: 10000000000, label: "le coût de construction d'un porte-avions PANG" },
    { id: "ariane", value: 115000000, label: "le coût d'un lancement d'Ariane 6" },

    // --- Grands projets et infrastructures ---
    { id: "jo_paris", value: 6650000000, label: "les dépenses publiques estimées liées aux JO de Paris 2024" },
    { id: "tunnel_manche", value: 50000000000, label: "le coût de construction du tunnel sous la Manche (ajusté de l'inflation)" },
    { id: "manhattan", value: 28500000000, label: "le coût de construction du Projet Manhattan (ajusté de l'inflation)" },
    { id: "messmer", value: 130000000000, label: "le coût de construction du Plan Messmer (ajusté de l'inflation)" },
    { id: "apollo", value: 220000000000, label: "le coût de construction du programme Apollo (ajusté de l'inflation)" },
    { id: "cern", value: 5250000000, label: "le coût de construction du LHC (au CERN) (ajusté de l'inflation)" },
    { id: "iss", value: 210000000000, label: "le coût de construction de la Station spatiale internationale (ISS) (ajusté de l'inflation)" },
    { id: "iter", value: 25000000000, label: "le coût de construction du Projet ITER" },
    { id: "hinkley", value: 5000000000, label: "le coût de construction de la centrale de Hinkley Point C" },

    // --- Monuments français ---
    { id: "tour_eiffel", value: 35000000, label: "le coût de construction de la Tour Eiffel (ajusté de l'inflation)" },
    { id: "arc_triomphe", value: 70000000, label: "le coût de construction de l'Arc de Triomphe (ajusté de l'inflation)" },
    { id: "opera_garnier", value: 330000000, label: "le coût de construction de l'Opéra Garnier (ajusté de l'inflation)" },
    { id: "centre_pompidou", value: 150000000, label: "le coût de construction du Centre Pompidou (ajusté de l'inflation)" },
    { id: "grande_arche", value: 240000000, label: "le coût de construction de la Grande Arche de La Défense (ajusté de l'inflation)" },
    { id: "opera_bastille", value: 775000000, label: "le coût de construction de l'Opéra Bastille (ajusté de l'inflation)" },
    { id: "pyramide_louvre", value: 25000000, label: "le coût de construction de la Pyramide du Louvre (ajusté de l'inflation)" },
    { id: "stade_france", value: 575000000, label: "le coût de construction du Stade de France (ajusté de l'inflation)" },
    { id: "pont_normandie", value: 650000000, label: "le coût de construction du Pont de Normandie (ajusté de l'inflation)" },
    { id: "viaduc_millau", value: 560000000, label: "le coût de construction du Viaduc de Millau (ajusté de l'inflation)" },

    // --- Marchés et valeurs boursières ---
    { id: "gold_market_cap", value: 26000000000000, label: "la capitalisation estimée du marché mondial de l'or (au 31/12/2025)" },
    { id: "btc_market_cap", value: 1500000000000, label: "la capitalisation de tous les bitcoins (au 31/12/2025)" },
    { id: "apple_market_cap", value: 3423000000000, label: "la capitalisation boursière d'Apple (au 31/12/2025)" },
    { id: "google_market_cap", value: 3149000000000, label: "la capitalisation boursière de Google (au 31/12/2025)" },
    { id: "amazon_market_cap", value: 2102000000000, label: "la capitalisation boursière d'Amazon (au 31/12/2025)" },
    { id: "tesla_market_cap", value: 1277000000000, label: "la capitalisation boursière de Tesla (au 31/12/2025)" },
    { id: "fortune_arnault", value: 172800000000, label: "l'estimation de la fortune de Bernard Arnault (au 31/12/2025)" },
    { id: "pib_france", value: 2980000000000, label: "le PIB de la France (2025)" },

    // --- Divertissement ---
    { id: "avatar", value: 340000000, label: "le budget d'Avatar (ajusté de l'inflation)" },

    // --- Petit quotidien ---
    { id: "frites", value: 1, label: "une portion de frites à la cantine" },
    { id: "frites_double", value: 2, label: "une double portion de frites à la cantine" },

    // --- Publics ---
    { id: "place_prison", value: 270000, label: "le coût de construction d'une place de prison" }
];

const examplesMap = new Map(examples.map(ex => [ex.id, ex]));

let lastIndex = -1;
let remainingExampleIndices = [];

/**
 * Reconstruit et mélange la liste des indices restants à afficher.
 * Évite de rejouer immédiatement le dernier exemple au changement de cycle.
 */
function refillRemainingExampleIndices() {
    remainingExampleIndices = examples.map((_, index) => index);

    if (lastIndex >= 0 && examples.length > 1) {
        remainingExampleIndices = remainingExampleIndices.filter(index => index !== lastIndex);
    }

    // Fisher-Yates shuffle
    for (let i = remainingExampleIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingExampleIndices[i], remainingExampleIndices[j]] = [remainingExampleIndices[j], remainingExampleIndices[i]];
    }
}

/**
 * Obtient un exemple aléatoire du tableau (différent du précédent)
 * @returns {Object} Un objet exemple avec value et label
 */
export function getRandomExample() {
    if (examples.length <= 1) {
        lastIndex = 0;
        return examples[0];
    }

    if (remainingExampleIndices.length === 0) {
        refillRemainingExampleIndices();
    }

    const nextIndex = remainingExampleIndices.pop();
    lastIndex = nextIndex;
    return examples[nextIndex];
}

/**
 * Met à jour une valeur d'exemple par id (si présent)
 * @param {string} id
 * @param {number} value
 */
export function updateExampleValueById(id, value) {
    if (!id) return;
    const entry = examples.find(ex => ex.id === id);
    if (!entry) return;
    if (typeof value === 'number' && isFinite(value)) {
        entry.value = value;
    }
}

/**
 * Obtient tous les exemples pour le mode financier
 * @returns {Array} Tableau de tous les exemples
 */
export function getFinancialExamples() {
    return examples;
}

/**
 * Obtient un exemple par son id
 * @param {string} id
 * @returns {Object|undefined} L'exemple trouvé ou undefined
 */
export function getExampleById(id) {
    return examplesMap.get(id);
}
