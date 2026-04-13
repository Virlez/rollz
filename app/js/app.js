import { DICE_SIDES } from './constants.js';
import { renderDicePalette } from './dice-palette.js';
import { dom } from './dom.js';
import { evaluateTokens } from './engine.js';
import { addFavoriteFormula, loadFavorites, removeFavoriteFormula, renderFavorites } from './favorites.js';
import { buildHistoryBreakdownSummary, loadHistory, pushHistory, renderHistory, saveHistory } from './history.js';
import { applyTranslations, getLang, loadLanguage, setLang, t } from './i18n.js';
import { normalizeRollMode, parseFormulaInput } from './parser.js';
import { renderResult } from './render.js';
import { state } from './state.js';
import {
  addDieToFormula,
  getFormulaCompatibilityIssues,
  registerServiceWorker,
  resetFormulaBuilderState,
  setModifier,
  setupInstallPrompt,
  showError,
  updateFormulaPreview,
  updateModifierUI,
  updateOfflineUI,
} from './ui.js';

function getCurrentRollMode() {
  return {
    advantageMode: state.advantageMode,
    successMode: state.successMode,
  };
}

function toggleLanguage() {
  setLang(getLang() === 'en' ? 'fr' : 'en');
  applyTranslations();
  updateModifierUI();
  updateFormulaPreview();

  if (state.lastResult && !dom.resultSection.hidden) {
    renderResult(state.lastResult);
  }

  renderHistory();
  renderFavorites();
}

async function doRoll(options = {}) {
  const raw = dom.formulaInput.value.trim();
  const formulas = parseFormulaInput(raw);
  const rollMode = normalizeRollMode(options.mode ?? getCurrentRollMode());

  if (formulas.length === 0) {
    showError(t('errorInvalid'));
    return;
  }

  const compatibilityIssues = getFormulaCompatibilityIssues(formulas, rollMode);
  if (compatibilityIssues.length > 0) {
    showError(compatibilityIssues[0]);
    return;
  }

  showError(null);
  dom.rollBtn.disabled = true;
  dom.rollBtn.classList.add('is-rolling');
  dom.spinnerOverlay.hidden = false;
  dom.spinnerOverlay.removeAttribute('aria-hidden');

  try {
    const renderedRolls = [];

    for (const [index, entry] of formulas.entries()) {
      state.currentRollSource = 'randomorg';
      const result = await evaluateTokens(entry.tokens, {
        advantageMode: index === 0 ? rollMode.advantageMode : 'none',
        successMode: index === 0 ? rollMode.successMode : false,
      });
      result.randomSource = state.currentRollSource;
      renderedRolls.push({ formula: entry.formula, result });
    }

    state.lastResult = renderedRolls;
    renderResult(renderedRolls);

    const breakdownSummary = renderedRolls
      .map((entry, index) => buildHistoryBreakdownSummary(formulas[index].tokens, entry.result))
      .join(' ; ');
    const totalSummary = renderedRolls.map(entry => String(entry.result.total)).join(' | ');

    pushHistory({
      formula: raw,
      total: totalSummary,
      breakdown: breakdownSummary,
      timestamp: Date.now(),
      mode: rollMode,
    });
  } catch (err) {
    showError(`${t('errorRoll')}${err.message}`);
  } finally {
    dom.rollBtn.disabled = false;
    dom.rollBtn.classList.remove('is-rolling');
    dom.spinnerOverlay.hidden = true;
    dom.spinnerOverlay.setAttribute('aria-hidden', 'true');
  }
}

function init() {
  renderDicePalette();
  loadLanguage();
  applyTranslations();
  updateModifierUI();
  updateOfflineUI();
  setupInstallPrompt();
  registerServiceWorker();
  loadHistory();
  loadFavorites();

  window.addEventListener('online', updateOfflineUI);
  window.addEventListener('offline', updateOfflineUI);

  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) langToggle.addEventListener('click', toggleLanguage);

  if (dom.advantageCheck) {
    dom.advantageCheck.addEventListener('change', () => {
      if (dom.advantageCheck.checked) {
        dom.disadvantageCheck.checked = false;
        if (dom.successCheck) dom.successCheck.checked = false;
        state.advantageMode = 'advantage';
        state.successMode = false;
      } else {
        state.advantageMode = 'none';
      }
      updateFormulaPreview();
    });
  }

  if (dom.disadvantageCheck) {
    dom.disadvantageCheck.addEventListener('change', () => {
      if (dom.disadvantageCheck.checked) {
        dom.advantageCheck.checked = false;
        if (dom.successCheck) dom.successCheck.checked = false;
        state.advantageMode = 'disadvantage';
        state.successMode = false;
      } else {
        state.advantageMode = 'none';
      }
      updateFormulaPreview();
    });
  }

  if (dom.successCheck) {
    dom.successCheck.addEventListener('change', () => {
      if (dom.successCheck.checked) {
        dom.advantageCheck.checked = false;
        dom.disadvantageCheck.checked = false;
        state.advantageMode = 'none';
        state.successMode = true;
      } else {
        state.successMode = false;
      }
      updateFormulaPreview();
    });
  }

  document.querySelectorAll('.die-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = Number(btn.dataset.sides);
      if (!DICE_SIDES.includes(sides)) return;
      addDieToFormula(sides);
    });
  });

  if (dom.modifierIncBtn) {
    dom.modifierIncBtn.addEventListener('click', () => {
      setModifier(state.modifier + 1);
    });
  }

  if (dom.modifierDecBtn) {
    dom.modifierDecBtn.addEventListener('click', () => {
      setModifier(state.modifier - 1);
    });
  }

  if (dom.modifierInput) {
    dom.modifierInput.addEventListener('input', () => {
      const rawValue = dom.modifierInput.value.trim();
      if (rawValue === '' || rawValue === '-') return;

      const nextValue = parseInt(rawValue, 10);
      if (!Number.isNaN(nextValue)) setModifier(nextValue);
    });

    dom.modifierInput.addEventListener('blur', () => {
      const rawValue = dom.modifierInput.value.trim();
      const nextValue = parseInt(rawValue, 10);
      setModifier(Number.isNaN(nextValue) ? 0 : nextValue);
    });
  }

  dom.formulaInput.addEventListener('input', () => {
    resetFormulaBuilderState();
    updateFormulaPreview();
  });

  dom.formulaInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !dom.rollBtn.disabled) doRoll();
  });

  dom.clearBtn.addEventListener('click', () => {
    dom.formulaInput.value = '';
    resetFormulaBuilderState();
    updateFormulaPreview();
    dom.resultSection.hidden = true;
    showError(null);
    dom.formulaInput.blur();
    dom.clearBtn.blur();
  });

  dom.rollBtn.addEventListener('click', doRoll);

  dom.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    renderHistory();
  });

  dom.historyList.addEventListener('click', async event => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const favoriteBtn = target ? target.closest('.favorite-btn') : null;
    if (favoriteBtn instanceof HTMLButtonElement) {
      event.stopPropagation();
      const formula = favoriteBtn.dataset.formula || '';
      if (!formula) return;

      if (favoriteBtn.getAttribute('aria-pressed') === 'true') {
        removeFavoriteFormula(formula);
      } else {
        addFavoriteFormula(formula);
      }

      renderFavorites();
      renderHistory();
      return;
    }

    const entryEl = target ? target.closest('.history-entry') : null;
    if (!(entryEl instanceof HTMLElement)) return;

    const index = parseInt(entryEl.dataset.index || '', 10);
    if (Number.isNaN(index) || !state.history[index]) return;

    const entry = state.history[index];
    resetFormulaBuilderState();
    dom.formulaInput.value = entry.formula;
    updateFormulaPreview();
    await doRoll({ mode: normalizeRollMode(entry.mode) });
  });

  if (dom.favoritesList) {
    dom.favoritesList.addEventListener('click', event => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const favoriteEntry = target ? target.closest('.favorite-entry') : null;
      if (!(favoriteEntry instanceof HTMLElement)) return;

      const formula = favoriteEntry.dataset.formula || '';
      if (!formula) return;

      const action = target && target.closest('button') ? target.closest('button').dataset.action : 'load';
      if (action === 'remove') {
        removeFavoriteFormula(formula);
        renderFavorites();
        renderHistory();
        return;
      }

      resetFormulaBuilderState();
      dom.formulaInput.value = formula;
      updateFormulaPreview();
      dom.formulaInputWrap?.focus({ preventScroll: true });
    });
  }

  updateFormulaPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
