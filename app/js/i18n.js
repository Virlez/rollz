import { EXPERT_MODE_KEY, LANG_KEY } from './constants.js';

export const i18n = {
  en: {
    tagline: 'TTRPG Dice Roller',
    diceTitle: 'Choose Your Dice',
    diceHint: 'Click a die to add it to your formula',
    expertToggleClassic: 'Classic',
    expertToggleExpert: 'Expert',
    expertModeLabel: 'Expert mode',
    expertModeSwitchTitle: 'Switch to expert mode',
    expertModeSwitchMessage: 'The classic builder will reset its selected dice and modifier. The formula text will stay in the field.',
    expertModeSwitchConfirm: 'Switch to expert mode',
    expertInsertDieLetter: 'Insert die letter',
    expertInsertThreshold: 'Insert success threshold',
    expertInsertReroll: 'Insert reroll marker',
    expertInsertSeparator: 'Insert another roll formula',
    expertInsertPlus: 'Insert plus sign',
    expertInsertMinus: 'Insert minus sign',
    expertBackspace: 'Delete previous character',
    modifierIncrease: 'Increase modifier',
    modifierDecrease: 'Decrease modifier',
    modifierValue: 'Modifier value',
    formulaTitle: 'Roll Formula',
    rollModesTitle: 'Roll modes',
    rollModesExclusive: 'Only one mode can be active at a time.',
    formulaPlaceholder: 'e.g. 2d6 + 4  ·  1d20 - 2  ·  1d20 + 4 ; 1d8 + 2',
    formulaPreviewEmpty: 'Enter a formula or click dice above',
    formulaInvalid: 'Formula not recognised — try e.g. 2d6 + 4',
    rollBtn: 'Roll!',
    totalLabel: 'Total',
    historyTitle: 'Roll History',
    favoritesTitle: 'Favorite Formulas',
    favoritesAddCategory: 'New category',
    favoritesDefaultCategory: 'General',
    clearAll: 'Clear all',
    historyEmpty: 'No rolls yet — start rolling!',
    favoritesEmpty: 'No favorites yet — save a formula from your history.',
    rolling: 'Rolling…',
    footerMain: 'True random numbers by <a href="https://www.random.org" target="_blank" rel="noopener noreferrer">random.org</a> &bull; <a href="https://github.com/Virlez/rollz" target="_blank" rel="noopener noreferrer">GitHub</a>',
    errorInvalid: 'Invalid formula. Try something like: 2d6 + 4',
    errorRoll: 'Roll failed: ',
    justNow: 'just now',
    mAgo: 'm ago',
    hAgo: 'h ago',
    advantageLabel: 'Advantage',
    disadvantageLabel: 'Disadvantage',
    successLabel: 'Even/Odd',
    advantageTag: '(Advantage)',
    disadvantageTag: '(Disadvantage)',
    successTag: '(Even/Odd)',
    keptLabel: 'kept',
    discardedLabel: 'discarded',
    advantageFirstOnly: 'Advantage/Disadvantage applies to the first die only',
    successFirstGroupOnly: 'In even/odd mode, only the first dice group is used',
    successBonusAdded: 'Fixed modifiers are added to the even count',
    multiRollModeFirstOnly: 'Advantage, disadvantage, and even/odd mode apply to the first formula only',
    successTotalLabel: 'Successes',
    ignoredLabel: 'ignored',
    successesSuffix: 'evens',
    successBonusRerollLabel: 'Bonus reroll',
    successBonusRerollNote: 'All dice were even: one bonus reroll',
    criticalFailure: 'Fumble',
    offlineBadge: 'Offline mode',
    offlineRollNote: '⚡ Secure local draw via Web Crypto',
    installApp: 'Install app',
    favoriteSaveShort: 'Save',
    favoriteSavedShort: 'Saved',
    favoriteAdd: 'Save this formula to favorites',
    favoriteRemove: 'Remove this formula from favorites',
    favoriteLoad: 'Load favorite formula',
    favoriteDelete: 'Delete favorite formula',
    favoriteReorder: 'Drag to reorder favorite',
    favoriteEditLabel: 'Edit favorite label',
    favoriteAddAnother: 'Save this formula in a category',
    favoriteChooseCategoryPrompt: 'Choose a category for this favorite. You can type a number or a new category name.',
    favoriteChooseCategoryHelp: 'Press Enter to use the default category, or type a new category name to create it.',
    favoriteLabelPrompt: 'Optional label for this favorite',
    favoriteCategoryCreatePrompt: 'Name of the new category',
    favoriteCategoryRenamePrompt: 'Rename this category',
    favoriteCategoryDelete: 'Delete category',
    favoriteCategoryRename: 'Rename category',
    favoriteCategoryExpand: 'Expand category',
    favoriteCategoryCollapse: 'Collapse category',
    favoriteCategoryEmpty: 'No favorites in this category yet.',
    favoriteDeleteCategoryConfirm: 'Delete this category and all its favorites?',
    modalCancel: 'Cancel',
    modalClose: 'Close dialog',
    favoriteSaveDialogTitle: 'Save favorite',
    favoriteSaveDialogMessage: 'Choose a category and add an optional label for this formula.',
    favoriteSaveAction: 'Save favorite',
    favoriteCreateCategoryDialogTitle: 'Create category',
    favoriteCreateCategoryDialogMessage: 'Create a category to organize your favorites.',
    favoriteCreateAction: 'Create category',
    favoriteRenameCategoryDialogTitle: 'Rename category',
    favoriteRenameCategoryDialogMessage: 'Update the category name.',
    favoriteRenameAction: 'Rename category',
    favoriteEditLabelDialogTitle: 'Edit favorite label',
    favoriteEditLabelDialogMessage: 'Update the optional label for this favorite.',
    favoriteEditLabelAction: 'Save label',
    favoriteDeleteCategoryDialogTitle: 'Delete category',
    favoriteDeleteCategoryDialogMessage: 'This will remove the category and all favorites inside it.',
    favoriteDeleteAction: 'Delete category',
    favoriteModalCategoryLabel: 'Category',
    favoriteModalNewCategoryLabel: 'New category name',
    favoriteModalNameLabel: 'Name',
    favoriteModalLabelLabel: 'Label',
    favoriteModalCreateCategoryOption: 'Create a new category…',
    favoriteValidationRequired: 'This field is required.',
    favoriteCategoryDuplicateError: 'A category with this name already exists.',
    favoriteMoveUp: 'Move favorite up',
    favoriteMoveDown: 'Move favorite down',
    historyReuseTitle: 'Click to re-roll this formula',
    inlineAdvancedToggleConflict: 'Advanced dice syntax cannot be combined with advantage, disadvantage, or even/odd mode',
  },
  fr: {
    tagline: 'Lanceur de Dés JDR',
    diceTitle: 'Choisissez Vos Dés',
    diceHint: 'Cliquez sur un dé pour l\'ajouter à votre formule',
    expertToggleClassic: 'Classique',
    expertToggleExpert: 'Expert',
    expertModeLabel: 'Mode expert',
    expertModeSwitchTitle: 'Passer en mode expert',
    expertModeSwitchMessage: 'Le builder classique reinitialisera ses des selectionnes et son modificateur. La formule texte restera dans le champ.',
    expertModeSwitchConfirm: 'Passer en mode expert',
    expertInsertDieLetter: 'Insérer la lettre d',
    expertInsertThreshold: 'Insérer un seuil de réussite',
    expertInsertReroll: 'Insérer un marqueur de relance',
    expertInsertSeparator: 'Insérer une autre formule de lancer',
    expertInsertPlus: 'Insérer un signe plus',
    expertInsertMinus: 'Insérer un signe moins',
    expertBackspace: 'Supprimer le caractère précédent',
    modifierIncrease: 'Augmenter le modificateur',
    modifierDecrease: 'Diminuer le modificateur',
    modifierValue: 'Valeur du modificateur',
    formulaTitle: 'Formule de Lancer',
    rollModesTitle: 'Modes de lancer',
    rollModesExclusive: 'Un seul mode actif a la fois.',
    formulaPlaceholder: 'ex. 2d6 + 4  ·  1d20 - 2  ·  1d20 + 4 ; 1d8 + 2',
    formulaPreviewEmpty: 'Entrez une formule ou cliquez sur les dés',
    formulaInvalid: 'Formule non reconnue — essayez ex. 2d6 + 4',
    rollBtn: 'Lancer !',
    totalLabel: 'Total',
    historyTitle: 'Historique des Lancers',
    favoritesTitle: 'Formules Favorites',
    favoritesAddCategory: 'Nouvelle categorie',
    favoritesDefaultCategory: 'General',
    clearAll: 'Tout effacer',
    historyEmpty: 'Aucun lancer — commencez à jouer !',
    favoritesEmpty: 'Aucun favori pour le moment — sauvegardez une formule depuis l\'historique.',
    rolling: 'Lancer en cours…',
    footerMain: 'Nombres aléatoires vrais par <a href="https://www.random.org" target="_blank" rel="noopener noreferrer">random.org</a> &bull; <a href="https://github.com/Virlez/rollz" target="_blank" rel="noopener noreferrer">GitHub</a>',
    errorInvalid: 'Formule invalide. Essayez par exemple : 2d6 + 4',
    errorRoll: 'Le lancer a échoué : ',
    justNow: 'à l\'instant',
    mAgo: ' min',
    hAgo: ' h',
    advantageLabel: 'Avantage',
    disadvantageLabel: 'Désavantage',
    successLabel: 'Pair/Impair',
    advantageTag: '(Avantage)',
    disadvantageTag: '(Désavantage)',
    successTag: '(Pair/Impair)',
    keptLabel: 'gardé',
    discardedLabel: 'écarté',
    advantageFirstOnly: 'L\'avantage/désavantage ne s\'applique qu\'au premier dé',
    successFirstGroupOnly: 'En pair/impair, seul le premier groupe de dés est pris en compte',
    successBonusAdded: 'Les bonus fixes sont ajoutés au compte des pairs',
    multiRollModeFirstOnly: 'L\'avantage, le désavantage et le mode pair/impair s\'appliquent uniquement a la premiere formule',
    successTotalLabel: 'Réussites',
    ignoredLabel: 'ignoré',
    successesSuffix: 'pairs',
    successBonusRerollLabel: 'Relance bonus',
    successBonusRerollNote: 'Tous les dés sont pairs : une relance bonus',
    criticalFailure: 'Échec critique',
    offlineBadge: 'Mode hors-ligne',
    offlineRollNote: '⚡ Tirage local sécurisé via Web Crypto',
    installApp: 'Installer',
    favoriteSaveShort: 'Sauver',
    favoriteSavedShort: 'Gardee',
    favoriteAdd: 'Ajouter cette formule aux favoris',
    favoriteRemove: 'Retirer cette formule des favoris',
    favoriteLoad: 'Charger la formule favorite',
    favoriteDelete: 'Supprimer la formule favorite',
    favoriteReorder: 'Glisser pour reclasser ce favori',
    favoriteEditLabel: 'Modifier le label du favori',
    favoriteAddAnother: 'Sauvegarder cette formule dans une categorie',
    favoriteChooseCategoryPrompt: 'Choisissez une categorie pour ce favori. Vous pouvez saisir un numero ou un nouveau nom de categorie.',
    favoriteChooseCategoryHelp: 'Validez pour utiliser la categorie par defaut, ou saisissez un nouveau nom pour la creer.',
    favoriteLabelPrompt: 'Label optionnel pour ce favori',
    favoriteCategoryCreatePrompt: 'Nom de la nouvelle categorie',
    favoriteCategoryRenamePrompt: 'Renommer cette categorie',
    favoriteCategoryDelete: 'Supprimer la categorie',
    favoriteCategoryRename: 'Renommer la categorie',
    favoriteCategoryExpand: 'Developper la categorie',
    favoriteCategoryCollapse: 'Replier la categorie',
    favoriteCategoryEmpty: 'Aucun favori dans cette categorie pour le moment.',
    favoriteDeleteCategoryConfirm: 'Supprimer cette categorie et tous ses favoris ?',
    modalCancel: 'Annuler',
    modalClose: 'Fermer la fenetre',
    favoriteSaveDialogTitle: 'Sauvegarder le favori',
    favoriteSaveDialogMessage: 'Choisissez une categorie et ajoutez un label optionnel pour cette formule.',
    favoriteSaveAction: 'Sauvegarder le favori',
    favoriteCreateCategoryDialogTitle: 'Creer une categorie',
    favoriteCreateCategoryDialogMessage: 'Creez une categorie pour organiser vos favoris.',
    favoriteCreateAction: 'Creer la categorie',
    favoriteRenameCategoryDialogTitle: 'Renommer la categorie',
    favoriteRenameCategoryDialogMessage: 'Mettez a jour le nom de cette categorie.',
    favoriteRenameAction: 'Renommer la categorie',
    favoriteEditLabelDialogTitle: 'Modifier le label du favori',
    favoriteEditLabelDialogMessage: 'Mettez a jour le label optionnel de ce favori.',
    favoriteEditLabelAction: 'Sauvegarder le label',
    favoriteDeleteCategoryDialogTitle: 'Supprimer la categorie',
    favoriteDeleteCategoryDialogMessage: 'Cette action supprimera la categorie et tous les favoris qu\'elle contient.',
    favoriteDeleteAction: 'Supprimer la categorie',
    favoriteModalCategoryLabel: 'Categorie',
    favoriteModalNewCategoryLabel: 'Nom de la nouvelle categorie',
    favoriteModalNameLabel: 'Nom',
    favoriteModalLabelLabel: 'Label',
    favoriteModalCreateCategoryOption: 'Creer une nouvelle categorie…',
    favoriteValidationRequired: 'Ce champ est obligatoire.',
    favoriteCategoryDuplicateError: 'Une categorie avec ce nom existe deja.',
    favoriteMoveUp: 'Monter ce favori',
    favoriteMoveDown: 'Descendre ce favori',
    historyReuseTitle: 'Cliquez pour relancer cette formule',
    inlineAdvancedToggleConflict: 'La syntaxe de dés avancée ne peut pas être combinée avec l\'avantage, le désavantage ou le mode pair/impair',
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

export function loadExpertMode() {
  try {
    return localStorage.getItem(EXPERT_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.dataset.i18nTitle));
    if (el instanceof HTMLButtonElement) {
      el.setAttribute('aria-label', t(el.dataset.i18nTitle));
    }
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
