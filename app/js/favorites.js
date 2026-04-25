import { FAVORITES_KEY, MAX_FAVORITES } from './constants.js';
import { dom } from './dom.js';
import { NEW_CATEGORY_OPTION_VALUE, openFavoritesModal } from './favorites-modal.js';
import { t } from './i18n.js';
import { state } from './state.js';

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `fav_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function sanitizeName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeFavoriteEntry(entry) {
  if (typeof entry === 'string') {
    const formula = entry.trim();
    return formula
      ? { id: createId(), formula, label: '', timestamp: Date.now(), successMode: false }
      : null;
  }

  if (!entry || typeof entry !== 'object') return null;

  const formula = sanitizeName(entry.formula);
  if (!formula) return null;

  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : createId(),
    formula,
    label: sanitizeName(entry.label),
    timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now(),
    successMode: entry.successMode === true,
  };
}

function normalizeFavoriteCategory(entry) {
  if (!entry || typeof entry !== 'object' || !Array.isArray(entry.favorites)) return null;

  const favorites = entry.favorites.map(normalizeFavoriteEntry).filter(Boolean);

  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : createId(),
    name: sanitizeName(entry.name) || t('favoritesDefaultCategory'),
    collapsed: entry.collapsed === true,
    favorites,
  };
}

function createDefaultCategory() {
  return {
    id: createId(),
    name: t('favoritesDefaultCategory'),
    collapsed: false,
    favorites: [],
  };
}

function getFavoriteTotalCount() {
  return state.favorites.reduce((count, category) => count + category.favorites.length, 0);
}

function getCategoryById(categoryId) {
  return state.favorites.find(category => category.id === categoryId) || null;
}

function getCategoryByName(name) {
  const normalizedName = sanitizeName(name).toLocaleLowerCase();
  return state.favorites.find(category => category.name.toLocaleLowerCase() === normalizedName) || null;
}

function getFavoriteById(favoriteId) {
  for (const category of state.favorites) {
    const favorite = category.favorites.find(entry => entry.id === favoriteId);
    if (favorite) {
      return { category, favorite };
    }
  }

  return null;
}

function ensureDefaultCategory() {
  const defaultName = t('favoritesDefaultCategory').toLocaleLowerCase();
  const existingDefault = state.favorites.find(category => category.name.toLocaleLowerCase() === defaultName);
  if (existingDefault) return existingDefault;

  const defaultCategory = createDefaultCategory();
  state.favorites = [defaultCategory, ...state.favorites];
  return defaultCategory;
}

function ensureFavoriteCountLimit() {
  while (getFavoriteTotalCount() > MAX_FAVORITES) {
    const oldest = state.favorites
      .flatMap(category => category.favorites.map(favorite => ({ categoryId: category.id, favorite })))
      .sort((left, right) => left.favorite.timestamp - right.favorite.timestamp)[0];

    if (!oldest) return;

    const category = getCategoryById(oldest.categoryId);
    if (!category) return;

    category.favorites = category.favorites.filter(entry => entry.id !== oldest.favorite.id);
  }
}

function favoriteMatches(entry, formula, options = {}) {
  return entry.formula === formula.trim() && entry.successMode === (options.successMode === true);
}

export function loadFavorites() {
  try {
    const rawEntries = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    if (Array.isArray(rawEntries) && rawEntries.some(entry => entry && typeof entry === 'object' && Array.isArray(entry.favorites))) {
      state.favorites = rawEntries.map(normalizeFavoriteCategory).filter(Boolean);
    } else if (Array.isArray(rawEntries)) {
      const migratedFavorites = rawEntries.map(normalizeFavoriteEntry).filter(Boolean).slice(0, MAX_FAVORITES);
      state.favorites = migratedFavorites.length > 0
        ? [{ ...createDefaultCategory(), favorites: migratedFavorites }]
        : [];
    } else {
      state.favorites = [];
    }
  } catch {
    state.favorites = [];
  }

  renderFavorites();
}

export function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
  } catch {}
}

export function isFavoriteFormula(formula, options = {}) {
  return state.favorites.some(category => category.favorites.some(entry => favoriteMatches(entry, formula, options)));
}

export function getFavoriteCategories() {
  return state.favorites;
}

export function createFavoriteCategory(name) {
  const normalizedName = sanitizeName(name);
  if (!normalizedName) return null;

  const existingCategory = getCategoryByName(normalizedName);
  if (existingCategory) return existingCategory;

  const category = {
    id: createId(),
    name: normalizedName,
    collapsed: false,
    favorites: [],
  };

  state.favorites.push(category);
  saveFavorites();
  return category;
}

export async function promptCreateFavoriteCategory() {
  const response = await openFavoritesModal({
    title: t('favoriteCreateCategoryDialogTitle'),
    message: t('favoriteCreateCategoryDialogMessage'),
    submitLabel: t('favoriteCreateAction'),
    showNameInput: true,
    nameLabel: t('favoriteModalNameLabel'),
    onSubmit: values => {
      const name = sanitizeName(values.name);
      if (!name) {
        return { error: t('favoriteValidationRequired') };
      }

      if (getCategoryByName(name)) {
        return { error: t('favoriteCategoryDuplicateError') };
      }

      return { value: name };
    },
  });
  if (!response) return null;

  const category = createFavoriteCategory(response);
  if (category) {
    renderFavorites();
  }
  return category;
}

export function renameFavoriteCategory(categoryId, nextName) {
  const category = getCategoryById(categoryId);
  const normalizedName = sanitizeName(nextName);
  if (!category || !normalizedName) return false;

  const duplicateCategory = state.favorites.find(entry => entry.id !== categoryId && entry.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase());
  if (duplicateCategory) return false;

  category.name = normalizedName;
  saveFavorites();
  return true;
}

export async function promptRenameFavoriteCategory(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) return false;

  const response = await openFavoritesModal({
    title: t('favoriteRenameCategoryDialogTitle'),
    message: t('favoriteRenameCategoryDialogMessage'),
    summary: category.name,
    submitLabel: t('favoriteRenameAction'),
    showNameInput: true,
    nameLabel: t('favoriteModalNameLabel'),
    nameValue: category.name,
    onSubmit: values => {
      const nextName = sanitizeName(values.name);
      if (!nextName) {
        return { error: t('favoriteValidationRequired') };
      }

      const duplicateCategory = state.favorites.find(entry => entry.id !== categoryId && entry.name.toLocaleLowerCase() === nextName.toLocaleLowerCase());
      if (duplicateCategory) {
        return { error: t('favoriteCategoryDuplicateError') };
      }

      return { value: nextName };
    },
  });
  if (!response) return false;

  const renamed = renameFavoriteCategory(categoryId, response);
  if (renamed) {
    renderFavorites();
  }
  return renamed;
}

export function deleteFavoriteCategory(categoryId) {
  const index = state.favorites.findIndex(category => category.id === categoryId);
  if (index < 0) return false;

  state.favorites.splice(index, 1);
  saveFavorites();
  return true;
}

export async function promptDeleteFavoriteCategory(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) return false;

  const confirmed = await openFavoritesModal({
    title: t('favoriteDeleteCategoryDialogTitle'),
    message: category.favorites.length > 0 ? t('favoriteDeleteCategoryDialogMessage') : t('favoriteCategoryDelete'),
    summary: `${category.name} (${category.favorites.length})`,
    submitLabel: t('favoriteDeleteAction'),
    variant: 'danger',
    onSubmit: () => ({ value: true }),
  });
  if (!confirmed) return false;

  const deleted = deleteFavoriteCategory(categoryId);
  if (deleted) {
    renderFavorites();
  }
  return deleted;
}

export function toggleFavoriteCategoryCollapsed(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) return false;

  category.collapsed = !category.collapsed;
  saveFavorites();
  return true;
}

export function updateFavoriteLabel(favoriteId, label) {
  const normalizedLabel = sanitizeName(label);

  for (const category of state.favorites) {
    const favorite = category.favorites.find(entry => entry.id === favoriteId);
    if (!favorite) continue;

    favorite.label = normalizedLabel;
    saveFavorites();
    return true;
  }

  return false;
}

export async function promptEditFavoriteLabel(favoriteId) {
  const favoriteRecord = getFavoriteById(favoriteId);
  if (!favoriteRecord) return false;

  const response = await openFavoritesModal({
    title: t('favoriteEditLabelDialogTitle'),
    message: t('favoriteEditLabelDialogMessage'),
    summary: favoriteRecord.favorite.formula,
    submitLabel: t('favoriteEditLabelAction'),
    showLabelInput: true,
    labelLabel: t('favoriteModalLabelLabel'),
    labelValue: favoriteRecord.favorite.label,
    onSubmit: values => ({ value: sanitizeName(values.label) }),
  });
  if (response === null) return false;

  const updated = updateFavoriteLabel(favoriteId, response);
  if (updated) {
    renderFavorites();
  }
  return updated;
}

export function addFavoriteFormula(formula, options = {}) {
  const normalizedFormula = formula.trim();
  if (!normalizedFormula) return null;

  const targetCategory = options.categoryId
    ? getCategoryById(options.categoryId)
    : options.categoryName
      ? (getCategoryByName(options.categoryName) || createFavoriteCategory(options.categoryName))
      : ensureDefaultCategory();

  if (!targetCategory) return null;

  const existingFavorite = targetCategory.favorites.find(entry => favoriteMatches(entry, normalizedFormula, options));
  if (existingFavorite) {
    const nextLabel = sanitizeName(options.label);
    if (nextLabel && nextLabel !== existingFavorite.label) {
      existingFavorite.label = nextLabel;
      saveFavorites();
    }

    return { ...existingFavorite, categoryId: targetCategory.id };
  }

  const favorite = {
    id: createId(),
    formula: normalizedFormula,
    label: sanitizeName(options.label),
    timestamp: Date.now(),
    successMode: options.successMode === true,
  };

  targetCategory.favorites.unshift(favorite);
  ensureFavoriteCountLimit();
  saveFavorites();
  return { ...favorite, categoryId: targetCategory.id };
}

export function removeFavoriteFormula(formula, options = {}) {
  for (const category of state.favorites) {
    const index = category.favorites.findIndex(entry => favoriteMatches(entry, formula, options));
    if (index >= 0) {
      category.favorites.splice(index, 1);
      saveFavorites();
      return true;
    }
  }
  return false;
}

export function removeFavoriteById(favoriteId) {
  for (const category of state.favorites) {
    const index = category.favorites.findIndex(entry => entry.id === favoriteId);
    if (index >= 0) {
      category.favorites.splice(index, 1);
      saveFavorites();
      return true;
    }
  }

  return false;
}

export function moveFavoriteById(favoriteId, targetCategoryId, insertIndex) {
  const targetCategory = getCategoryById(targetCategoryId);
  if (!targetCategory) return false;

  for (const category of state.favorites) {
    const sourceIndex = category.favorites.findIndex(entry => entry.id === favoriteId);
    if (sourceIndex < 0) continue;

    const [favorite] = category.favorites.splice(sourceIndex, 1);
    let nextIndex = insertIndex;
    if (category.id === targetCategoryId && sourceIndex < insertIndex) {
      nextIndex -= 1;
    }

    const boundedIndex = Math.max(0, Math.min(nextIndex, targetCategory.favorites.length));

    targetCategory.favorites.splice(boundedIndex, 0, favorite);
    saveFavorites();
    return true;
  }

  return false;
}

export async function promptForFavoriteSave(formula, options = {}) {
  const defaultCategory = ensureDefaultCategory();
  const response = await openFavoritesModal({
    title: t('favoriteSaveDialogTitle'),
    message: t('favoriteSaveDialogMessage'),
    summary: formula,
    submitLabel: t('favoriteSaveAction'),
    showCategorySelect: true,
    allowCreateCategory: true,
    categoryLabel: t('favoriteModalCategoryLabel'),
    categoryNameLabel: t('favoriteModalNewCategoryLabel'),
    categoryOptions: state.favorites.map(category => ({
      value: category.id,
      label: category.name,
    })),
    categoryValue: defaultCategory.id,
    showLabelInput: true,
    labelLabel: t('favoriteModalLabelLabel'),
    onSubmit: values => {
      let category = getCategoryById(values.categoryChoice);

      if (values.categoryChoice === NEW_CATEGORY_OPTION_VALUE) {
        const nextName = sanitizeName(values.categoryName);
        if (!nextName) {
          return { error: t('favoriteValidationRequired') };
        }

        category = getCategoryByName(nextName) || createFavoriteCategory(nextName);
      }

      if (!category) {
        category = defaultCategory;
      }

      return {
        value: {
          categoryId: category.id,
          label: sanitizeName(values.label),
        },
      };
    },
  });
  if (!response) return null;

  return addFavoriteFormula(formula, {
    ...options,
    categoryId: response.categoryId,
    label: response.label,
  });
}

export function renderFavorites() {
  if (!dom.favoritesList || !dom.favoritesEmpty) return;

  dom.favoritesList.querySelectorAll('.favorite-category').forEach(entry => entry.remove());

  if (state.favorites.length === 0) {
    dom.favoritesEmpty.hidden = false;
    return;
  }

  dom.favoritesEmpty.hidden = true;

  state.favorites.forEach(category => {
    const categoryEl = document.createElement('section');
    categoryEl.className = 'favorite-category';
    categoryEl.dataset.categoryId = category.id;
    categoryEl.classList.toggle('is-collapsed', category.collapsed);

    const header = document.createElement('div');
    header.className = 'favorite-category-header';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'favorite-category-toggle';
    toggleButton.dataset.action = 'toggle-category';
    toggleButton.setAttribute('aria-expanded', category.collapsed ? 'false' : 'true');
    toggleButton.setAttribute('aria-label', category.collapsed ? t('favoriteCategoryExpand') : t('favoriteCategoryCollapse'));
    toggleButton.title = category.collapsed ? t('favoriteCategoryExpand') : t('favoriteCategoryCollapse');

    const chevron = document.createElement('span');
    chevron.className = 'favorite-category-chevron';
    chevron.textContent = category.collapsed ? '▸' : '▾';

    const name = document.createElement('span');
    name.className = 'favorite-category-name';
    name.textContent = category.name;

    const count = document.createElement('span');
    count.className = 'favorite-category-count';
    count.textContent = String(category.favorites.length);

    toggleButton.appendChild(chevron);
    toggleButton.appendChild(name);
    toggleButton.appendChild(count);

    const actions = document.createElement('div');
    actions.className = 'favorite-category-actions';

    const renameButton = document.createElement('button');
    renameButton.type = 'button';
    renameButton.className = 'favorite-category-btn';
    renameButton.dataset.action = 'rename-category';
    renameButton.textContent = '✎';
    renameButton.setAttribute('aria-label', t('favoriteCategoryRename'));
    renameButton.title = t('favoriteCategoryRename');

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'favorite-category-btn';
    deleteButton.dataset.action = 'delete-category';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', t('favoriteCategoryDelete'));
    deleteButton.title = t('favoriteCategoryDelete');

    actions.appendChild(renameButton);
    actions.appendChild(deleteButton);
    header.appendChild(toggleButton);
    header.appendChild(actions);
    categoryEl.appendChild(header);

    const content = document.createElement('div');
    content.className = 'favorite-category-content';
    content.dataset.categoryId = category.id;
    content.hidden = category.collapsed;

    if (category.favorites.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'favorite-category-empty';
      empty.textContent = t('favoriteCategoryEmpty');
      content.appendChild(empty);
    }

    category.favorites.forEach((entry, index) => {
      const favoriteEl = document.createElement('div');
      favoriteEl.className = 'favorite-entry';
      favoriteEl.role = 'listitem';
      favoriteEl.dataset.favoriteId = entry.id;
      favoriteEl.dataset.categoryId = category.id;
      favoriteEl.dataset.categoryIndex = String(index);
      favoriteEl.dataset.formula = entry.formula;
      favoriteEl.dataset.successMode = entry.successMode ? 'true' : 'false';

      const loadButton = document.createElement('button');
      loadButton.type = 'button';
      loadButton.className = 'favorite-load-btn';
      loadButton.dataset.action = 'load';
      loadButton.setAttribute('aria-label', t('favoriteLoad'));
      loadButton.title = t('favoriteLoad');

      const copy = document.createElement('span');
      copy.className = 'favorite-copy';

      if (entry.label) {
        const label = document.createElement('span');
        label.className = 'favorite-label';
        label.textContent = entry.label;
        copy.appendChild(label);
      }

      const formula = document.createElement('span');
      formula.className = 'favorite-formula';
      formula.textContent = entry.formula;
      copy.appendChild(formula);
      loadButton.appendChild(copy);

      if (entry.successMode) {
        const modeBadge = document.createElement('span');
        modeBadge.className = 'favorite-mode-badge';
        modeBadge.textContent = t('successLabel');
        loadButton.appendChild(modeBadge);
      }

      const actionWrap = document.createElement('div');
      actionWrap.className = 'favorite-actions';

      const dragHandle = document.createElement('button');
      dragHandle.type = 'button';
      dragHandle.className = 'favorite-drag-handle';
      dragHandle.draggable = true;
      dragHandle.dataset.action = 'drag';
      dragHandle.textContent = '::';
      dragHandle.setAttribute('aria-label', t('favoriteReorder'));
      dragHandle.title = t('favoriteReorder');

      const labelButton = document.createElement('button');
      labelButton.type = 'button';
      labelButton.className = 'favorite-label-btn';
      labelButton.dataset.action = 'edit-label';
      labelButton.textContent = 'Lbl';
      labelButton.setAttribute('aria-label', t('favoriteEditLabel'));
      labelButton.title = t('favoriteEditLabel');

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'favorite-remove-btn';
      removeButton.dataset.action = 'remove';
      removeButton.textContent = '×';
      removeButton.setAttribute('aria-label', t('favoriteDelete'));
      removeButton.title = t('favoriteDelete');

      favoriteEl.appendChild(loadButton);
      actionWrap.appendChild(dragHandle);
      actionWrap.appendChild(labelButton);
      actionWrap.appendChild(removeButton);
      favoriteEl.appendChild(actionWrap);
      content.appendChild(favoriteEl);
    });

    categoryEl.appendChild(content);
    dom.favoritesList.appendChild(categoryEl);
  });
}