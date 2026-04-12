import { LANG_KEY } from './constants.js';

export const i18n = {
  en: {
    tagline: 'TTRPG Dice Roller',
    diceTitle: 'Choose Your Dice',
    diceHint: 'Click a die to add it to your formula',
    modifierIncrease: 'Increase modifier',
    modifierDecrease: 'Decrease modifier',
    modifierValue: 'Modifier value',
    formulaTitle: 'Roll Formula',
    formulaPlaceholder: 'e.g. 2d6 + 4  ·  1d20 - 2  ·  1d20 + 4 ; 1d8 + 2',
    formulaPreviewEmpty: 'Enter a formula or click dice above',
    formulaInvalid: 'Formula not recognised — try e.g. 2d6 + 4',
    rollBtn: 'Roll!',
    totalLabel: 'Total',
    historyTitle: 'Roll History',
    clearAll: 'Clear all',
    historyEmpty: 'No rolls yet — start rolling!',
    rolling: 'Rolling…',
    footerMain: 'True random numbers by <a href="https://www.random.org" target="_blank" rel="noopener noreferrer">random.org</a> &bull; <a href="https://github.com/Virlez/rollz" target="_blank" rel="noopener noreferrer">GitHub</a>',
    errorInvalid: 'Invalid formula. Try something like: 2d6 + 4',
    errorRoll: 'Roll failed: ',
    justNow: 'just now',
    mAgo: 'm ago',
    hAgo: 'h ago',
    advantageLabel: 'Advantage',
    disadvantageLabel: 'Disadvantage',
    successLabel: 'Success Mode',
    advantageTag: '(Advantage)',
    disadvantageTag: '(Disadvantage)',
    successTag: '(Success Mode)',
    keptLabel: 'kept',
    discardedLabel: 'discarded',
    advantageFirstOnly: 'Advantage/Disadvantage applies to the first die only',
    successFirstGroupOnly: 'In success mode, only the first dice group is used',
    successBonusAdded: 'Fixed modifiers are added to successes',
    multiRollModeFirstOnly: 'Advantage, disadvantage, and success mode apply to the first formula only',
    successTotalLabel: 'Successes',
    ignoredLabel: 'ignored',
    successesSuffix: 'successes',
    successBonusRerollLabel: 'Bonus reroll',
    successBonusRerollNote: 'All dice were even: one bonus reroll',
    criticalFailure: 'Fumble',
    offlineBadge: 'Offline mode',
    offlineRollNote: '⚡ Secure local draw via Web Crypto',
    installApp: 'Install app',
  },
  fr: {
    tagline: 'Lanceur de Dés JDR',
    diceTitle: 'Choisissez Vos Dés',
    diceHint: 'Cliquez sur un dé pour l\'ajouter à votre formule',
    modifierIncrease: 'Augmenter le modificateur',
    modifierDecrease: 'Diminuer le modificateur',
    modifierValue: 'Valeur du modificateur',
    formulaTitle: 'Formule de Lancer',
    formulaPlaceholder: 'ex. 2d6 + 4  ·  1d20 - 2  ·  1d20 + 4 ; 1d8 + 2',
    formulaPreviewEmpty: 'Entrez une formule ou cliquez sur les dés',
    formulaInvalid: 'Formule non reconnue — essayez ex. 2d6 + 4',
    rollBtn: 'Lancer !',
    totalLabel: 'Total',
    historyTitle: 'Historique des Lancers',
    clearAll: 'Tout effacer',
    historyEmpty: 'Aucun lancer — commencez à jouer !',
    rolling: 'Lancer en cours…',
    footerMain: 'Nombres aléatoires vrais par <a href="https://www.random.org" target="_blank" rel="noopener noreferrer">random.org</a> &bull; <a href="https://github.com/Virlez/rollz" target="_blank" rel="noopener noreferrer">GitHub</a>',
    errorInvalid: 'Formule invalide. Essayez par exemple : 2d6 + 4',
    errorRoll: 'Le lancer a échoué : ',
    justNow: 'à l\'instant',
    mAgo: ' min',
    hAgo: ' h',
    advantageLabel: 'Avantage',
    disadvantageLabel: 'Désavantage',
    successLabel: 'Mode réussites',
    advantageTag: '(Avantage)',
    disadvantageTag: '(Désavantage)',
    successTag: '(Réussites)',
    keptLabel: 'gardé',
    discardedLabel: 'écarté',
    advantageFirstOnly: 'L\'avantage/désavantage ne s\'applique qu\'au premier dé',
    successFirstGroupOnly: 'En mode réussites, seul le premier groupe de dés est pris en compte',
    successBonusAdded: 'Les bonus fixes sont ajoutés aux réussites',
    multiRollModeFirstOnly: 'L\'avantage, le désavantage et le mode réussites s\'appliquent uniquement a la premiere formule',
    successTotalLabel: 'Réussites',
    ignoredLabel: 'ignoré',
    successesSuffix: 'réussites',
    successBonusRerollLabel: 'Relance bonus',
    successBonusRerollNote: 'Tous les dés sont pairs : une relance bonus',
    criticalFailure: 'Échec critique',
    offlineBadge: 'Mode hors-ligne',
    offlineRollNote: '⚡ Tirage local sécurisé via Web Crypto',
    installApp: 'Installer',
  },
};

let currentLang = 'fr';

export function getLang() {
  return currentLang;
}

export function setLang(nextLang, options = {}) {
  currentLang = nextLang === 'en' ? 'en' : 'fr';

  if (options.persist !== false) {
    try {
      localStorage.setItem(LANG_KEY, currentLang);
    } catch {}
  }
}

export function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

export function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') currentLang = saved;
  } catch {}
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  document.documentElement.lang = currentLang;

  const flagEl = document.getElementById('lang-flag');
  if (flagEl) {
    flagEl.src = currentLang === 'en'
      ? 'https://flagcdn.com/w40/fr.png'
      : 'https://flagcdn.com/w40/gb.png';
    flagEl.alt = currentLang === 'en' ? 'FR' : 'EN';
  }
}
