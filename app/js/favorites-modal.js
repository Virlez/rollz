import { dom } from './dom.js';
import { t } from './i18n.js';

export const NEW_CATEGORY_OPTION_VALUE = '__new__';

let activeResolver = null;
let activeConfig = null;
let previousActiveElement = null;

function setText(element, value) {
  if (element) element.textContent = value || '';
}

function setHidden(element, hidden) {
  if (element) element.hidden = hidden;
}

function setValue(element, value) {
  if (element) element.value = value || '';
}

function showError(message = '') {
  if (!dom.favoritesModalError) return;

  dom.favoritesModalError.textContent = message;
  dom.favoritesModalError.hidden = !message;
}

function getSelectedCategoryRequiresName() {
  return activeConfig?.showCategorySelect === true
    && activeConfig.allowCreateCategory === true
    && dom.favoritesModalCategorySelect?.value === NEW_CATEGORY_OPTION_VALUE;
}

function updateConditionalFields() {
  const shouldShowCategoryName = getSelectedCategoryRequiresName();
  setHidden(dom.favoritesModalCategoryNameField, !shouldShowCategoryName);

  if (!shouldShowCategoryName) {
    setValue(dom.favoritesModalCategoryNameInput, '');
  }
}

function getFirstFocusableElement() {
  if (!dom.favoritesModalSubmitBtn) return null;

  if (!dom.favoritesModalCategoryField?.hidden) {
    return getSelectedCategoryRequiresName()
      ? dom.favoritesModalCategoryNameInput || dom.favoritesModalCategorySelect || dom.favoritesModalSubmitBtn
      : dom.favoritesModalCategorySelect || dom.favoritesModalSubmitBtn;
  }

  if (!dom.favoritesModalNameField?.hidden) {
    return dom.favoritesModalNameInput || dom.favoritesModalSubmitBtn;
  }

  if (!dom.favoritesModalLabelField?.hidden) {
    return dom.favoritesModalLabelInput || dom.favoritesModalSubmitBtn;
  }

  return dom.favoritesModalSubmitBtn;
}

function collectValues() {
  return {
    categoryChoice: dom.favoritesModalCategorySelect?.value || '',
    categoryName: dom.favoritesModalCategoryNameInput?.value || '',
    name: dom.favoritesModalNameInput?.value || '',
    label: dom.favoritesModalLabelInput?.value || '',
  };
}

function closeFavoritesModal(result) {
  if (!dom.favoritesModal || !activeResolver) return;

  const resolve = activeResolver;
  activeResolver = null;
  activeConfig = null;

  dom.favoritesModal.hidden = true;
  dom.favoritesModal.setAttribute('aria-hidden', 'true');
  dom.favoritesModal.removeAttribute('data-variant');
  document.body.classList.remove('has-modal');
  showError('');

  const focusTarget = previousActiveElement;
  previousActiveElement = null;
  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus({ preventScroll: true });
  }

  resolve(result);
}

async function handleFavoritesModalSubmit(event) {
  event.preventDefault();
  if (!activeConfig) return;

  showError('');
  const rawValues = collectValues();
  const result = activeConfig.onSubmit ? await activeConfig.onSubmit(rawValues) : { value: rawValues };
  if (!result || result.error) {
    showError(result?.error || t('errorRoll'));
    return;
  }

  closeFavoritesModal(Object.prototype.hasOwnProperty.call(result, 'value') ? result.value : rawValues);
}

export function setupFavoritesModal() {
  if (!dom.favoritesModal || !dom.favoritesModalForm || dom.favoritesModal.dataset.ready === 'true') return;

  dom.favoritesModal.dataset.ready = 'true';
  dom.favoritesModal.addEventListener('click', event => {
    if (event.target === dom.favoritesModal) {
      closeFavoritesModal(null);
    }
  });

  dom.favoritesModalCloseBtn?.addEventListener('click', () => {
    closeFavoritesModal(null);
  });

  dom.favoritesModalCancelBtn?.addEventListener('click', () => {
    closeFavoritesModal(null);
  });

  dom.favoritesModalCategorySelect?.addEventListener('change', () => {
    showError('');
    updateConditionalFields();
  });

  dom.favoritesModalForm.addEventListener('submit', handleFavoritesModalSubmit);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeResolver) {
      event.preventDefault();
      closeFavoritesModal(null);
    }
  });
}

export function openFavoritesModal(config) {
  if (!dom.favoritesModal || !dom.favoritesModalForm || !dom.favoritesModalSubmitBtn || !dom.favoritesModalCancelBtn || !dom.favoritesModalCloseBtn) {
    return Promise.resolve(null);
  }

  if (activeResolver) {
    closeFavoritesModal(null);
  }

  activeConfig = config;
  previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  setText(dom.favoritesModalTitle, config.title);
  setText(dom.favoritesModalMessage, config.message || '');
  setHidden(dom.favoritesModalMessage, !config.message);
  setText(dom.favoritesModalSummary, config.summary || '');
  setHidden(dom.favoritesModalSummary, !config.summary);

  setHidden(dom.favoritesModalCategoryField, !config.showCategorySelect);
  setText(dom.favoritesModalCategoryLabel, config.categoryLabel || '');
  if (dom.favoritesModalCategorySelect) {
    dom.favoritesModalCategorySelect.innerHTML = '';
    (config.categoryOptions || []).forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      dom.favoritesModalCategorySelect.appendChild(optionEl);
    });

    if (config.showCategorySelect && config.allowCreateCategory) {
      const createOption = document.createElement('option');
      createOption.value = NEW_CATEGORY_OPTION_VALUE;
      createOption.textContent = t('favoriteModalCreateCategoryOption');
      dom.favoritesModalCategorySelect.appendChild(createOption);
    }
    dom.favoritesModalCategorySelect.value = config.categoryValue || dom.favoritesModalCategorySelect.value;
  }

  setHidden(dom.favoritesModalCategoryNameField, true);
  setText(dom.favoritesModalCategoryNameLabel, config.categoryNameLabel || '');
  setValue(dom.favoritesModalCategoryNameInput, config.categoryNameValue || '');

  setHidden(dom.favoritesModalNameField, !config.showNameInput);
  setText(dom.favoritesModalNameLabel, config.nameLabel || '');
  setValue(dom.favoritesModalNameInput, config.nameValue || '');

  setHidden(dom.favoritesModalLabelField, !config.showLabelInput);
  setText(dom.favoritesModalLabelLabel, config.labelLabel || '');
  setValue(dom.favoritesModalLabelInput, config.labelValue || '');

  dom.favoritesModalCancelBtn.textContent = config.cancelLabel || t('modalCancel');
  dom.favoritesModalSubmitBtn.textContent = config.submitLabel;
  dom.favoritesModalCloseBtn.setAttribute('aria-label', t('modalClose'));
  dom.favoritesModal.dataset.variant = config.variant || 'default';

  updateConditionalFields();
  showError('');
  dom.favoritesModal.hidden = false;
  dom.favoritesModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-modal');

  queueMicrotask(() => {
    getFirstFocusableElement()?.focus({ preventScroll: true });
  });

  return new Promise(resolve => {
    activeResolver = resolve;
  });
}