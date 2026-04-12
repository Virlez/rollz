const DICE_BUTTONS_MARKUP = `
  <button class="die-btn" data-sides="4" aria-label="Add d4 to formula">
    <span class="die-num">D4</span>
    <div class="die-shape die-d4">
      <svg viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="d4g1" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stop-color="#2ecc71"/>
            <stop offset="100%" stop-color="#1a9c54"/>
          </linearGradient>
          <linearGradient id="d4g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1a9c54"/>
            <stop offset="100%" stop-color="#0e7a3a"/>
          </linearGradient>
          <linearGradient id="d4g3" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#25b865"/>
            <stop offset="100%" stop-color="#148a45"/>
          </linearGradient>
          <filter id="d4s"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1a9c54" flood-opacity="0.5"/></filter>
        </defs>
        <g filter="url(#d4s)">
          <polygon points="60,8 108,95 12,95" fill="url(#d4g1)"/>
          <polygon points="60,8 12,95 60,78" fill="url(#d4g2)" opacity="0.8"/>
          <polygon points="60,8 108,95 60,78" fill="url(#d4g3)" opacity="0.7"/>
          <polygon points="12,95 108,95 60,78" fill="#0a5e2a" opacity="0.6"/>
          <polygon points="60,14 44,52 76,52" fill="white" opacity="0.12"/>
          <line x1="60" y1="8" x2="12" y2="95" stroke="#34e87f" stroke-width="1" opacity="0.5"/>
          <line x1="60" y1="8" x2="108" y2="95" stroke="#34e87f" stroke-width="1" opacity="0.4"/>
          <line x1="12" y1="95" x2="108" y2="95" stroke="#0e7a3a" stroke-width="1.2" opacity="0.6"/>
          <line x1="60" y1="8" x2="60" y2="78" stroke="#34e87f" stroke-width="0.8" opacity="0.3"/>
        </g>
        <text x="60" y="75" text-anchor="middle" font-size="28" font-weight="bold" fill="white" font-family="sans-serif" opacity="0.95">4</text>
      </svg>
    </div>
    <span class="die-counter" data-count="0" aria-live="polite">0</span>
  </button>

  <button class="die-btn" data-sides="6" aria-label="Add d6 to formula">
    <span class="die-num">D6</span>
    <div class="die-shape die-d6">
      <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="d6g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#22d3ee"/>
            <stop offset="100%" stop-color="#0ea5c9"/>
          </linearGradient>
          <linearGradient id="d6g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0ea5c9"/>
            <stop offset="100%" stop-color="#0880a0"/>
          </linearGradient>
          <linearGradient id="d6g3" x1="0" y1="0" x2="1" y2="0.5">
            <stop offset="0%" stop-color="#38e0f0"/>
            <stop offset="100%" stop-color="#18b8d8"/>
          </linearGradient>
          <filter id="d6s"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0ea5c9" flood-opacity="0.45"/></filter>
        </defs>
        <g filter="url(#d6s)">
          <polygon points="15,28 55,12 95,28 55,44" fill="url(#d6g3)"/>
          <polygon points="15,28 55,44 55,90 15,74" fill="url(#d6g2)"/>
          <polygon points="55,44 95,28 95,74 55,90" fill="url(#d6g1)"/>
          <polygon points="18,28 55,14 92,28 55,42" fill="white" opacity="0.12"/>
          <line x1="15" y1="28" x2="55" y2="44" stroke="#40f0ff" stroke-width="0.8" opacity="0.4"/>
          <line x1="55" y1="44" x2="95" y2="28" stroke="#40f0ff" stroke-width="0.8" opacity="0.3"/>
          <line x1="55" y1="44" x2="55" y2="90" stroke="#08889a" stroke-width="0.8" opacity="0.5"/>
          <line x1="15" y1="28" x2="15" y2="74" stroke="#0880a0" stroke-width="0.8" opacity="0.4"/>
          <line x1="95" y1="28" x2="95" y2="74" stroke="#0880a0" stroke-width="0.8" opacity="0.3"/>
        </g>
        <text x="68" y="68" text-anchor="middle" font-size="30" font-weight="bold" fill="white" font-family="sans-serif" opacity="0.95">6</text>
      </svg>
    </div>
    <span class="die-counter" data-count="0" aria-live="polite">0</span>
  </button>

  <button class="die-btn" data-sides="8" aria-label="Add d8 to formula">
    <span class="die-num">D8</span>
    <div class="die-shape die-d8">
      <svg viewBox="0 0 110 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="d8g1" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#a855f7"/>
            <stop offset="100%" stop-color="#7c3aed"/>
          </linearGradient>
          <linearGradient id="d8g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7c3aed"/>
            <stop offset="100%" stop-color="#5b21b6"/>
          </linearGradient>
          <linearGradient id="d8g3" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6d28d9"/>
            <stop offset="100%" stop-color="#4c1d95"/>
          </linearGradient>
          <linearGradient id="d8g4" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#4c1d95"/>
            <stop offset="100%" stop-color="#2e1065"/>
          </linearGradient>
          <filter id="d8s"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#7c3aed" flood-opacity="0.5"/></filter>
        </defs>
        <g filter="url(#d8s)">
          <polygon points="55,4 100,28 100,74 55,98 10,74 10,28" fill="url(#d8g3)"/>
          <polygon points="55,4 10,28 55,52" fill="url(#d8g1)"/>
          <polygon points="55,4 100,28 55,52" fill="url(#d8g2)"/>
          <polygon points="10,28 10,74 55,52" fill="url(#d8g2)" opacity="0.85"/>
          <polygon points="100,28 100,74 55,52" fill="url(#d8g3)" opacity="0.9"/>
          <polygon points="10,74 55,98 55,52" fill="url(#d8g4)" opacity="0.8"/>
          <polygon points="100,74 55,98 55,52" fill="url(#d8g4)" opacity="0.7"/>
          <polygon points="55,6 25,26 55,42 85,26" fill="white" opacity="0.1"/>
          <polygon points="55,8 38,22 55,34 72,22" fill="white" opacity="0.08"/>
          <line x1="55" y1="4" x2="55" y2="98" stroke="#c084fc" stroke-width="0.8" opacity="0.4"/>
          <line x1="10" y1="28" x2="100" y2="74" stroke="#c084fc" stroke-width="0.5" opacity="0.2"/>
          <line x1="100" y1="28" x2="10" y2="74" stroke="#c084fc" stroke-width="0.5" opacity="0.2"/>
        </g>
        <text x="55" y="58" text-anchor="middle" font-size="26" font-weight="bold" fill="white" font-family="sans-serif" opacity="0.95">8</text>
      </svg>
    </div>
    <span class="die-counter" data-count="0" aria-live="polite">0</span>
  </button>

  <button class="die-btn" data-sides="10" aria-label="Add d10 to formula">
    <span class="die-num">D10</span>
    <div class="die-shape die-d10">
      <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="d10g1" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#ec4899"/>
            <stop offset="100%" stop-color="#be185d"/>
          </linearGradient>
          <linearGradient id="d10g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#be185d"/>
            <stop offset="100%" stop-color="#9d174d"/>
          </linearGradient>
          <linearGradient id="d10g3" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d63384"/>
            <stop offset="100%" stop-color="#a3155a"/>
          </linearGradient>
          <linearGradient id="d10g4" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#9d174d"/>
            <stop offset="100%" stop-color="#6b0f36"/>
          </linearGradient>
          <filter id="d10s"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#ec4899" flood-opacity="0.45"/></filter>
        </defs>
        <g filter="url(#d10s)">
          <polygon points="55,4 98,35 55,50 12,35" fill="url(#d10g1)"/>
          <polygon points="12,35 55,50 22,75 5,55" fill="url(#d10g2)"/>
          <polygon points="98,35 55,50 88,75 105,55" fill="url(#d10g3)"/>
          <polygon points="22,75 55,50 55,100" fill="url(#d10g4)" opacity="0.85"/>
          <polygon points="88,75 55,50 55,100" fill="url(#d10g4)" opacity="0.7"/>
          <polygon points="22,75 55,100 88,75" fill="#6b0f36" opacity="0.6"/>
          <polygon points="55,18 38,38 55,46 72,38" fill="white" opacity="0.12"/>
          <polygon points="55,22 45,36 55,42 65,36" fill="white" opacity="0.06"/>
          <line x1="55" y1="4" x2="55" y2="100" stroke="#f472b6" stroke-width="0.8" opacity="0.3"/>
          <line x1="12" y1="35" x2="98" y2="35" stroke="#f472b6" stroke-width="0.5" opacity="0.2"/>
        </g>
        <text x="55" y="52" text-anchor="middle" font-size="24" font-weight="bold" fill="white" font-family="sans-serif" opacity="0.95">10</text>
      </svg>
    </div>
    <span class="die-counter" data-count="0" aria-live="polite">0</span>
  </button>

  <button class="die-btn" data-sides="12" aria-label="Add d12 to formula">
    <span class="die-num">D12</span>
    <div class="die-shape die-d12">
      <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="d12g1" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </linearGradient>
          <linearGradient id="d12g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
          <linearGradient id="d12g3" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </linearGradient>
          <radialGradient id="d12g4" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </radialGradient>
          <filter id="d12s"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#ef4444" flood-opacity="0.45"/></filter>
        </defs>
        <g filter="url(#d12s)">
          <polygon points="55,4 88,12 104,38 104,68 88,94 55,102 22,94 6,68 6,38 22,12" fill="url(#d12g2)"/>
          <polygon points="55,22 78,36 72,60 38,60 32,36" fill="url(#d12g4)"/>
          <polygon points="55,4 88,12 78,36 55,22" fill="url(#d12g1)"/>
          <polygon points="55,4 22,12 32,36 55,22" fill="url(#d12g1)" opacity="0.9"/>
          <polygon points="88,12 104,38 72,60 78,36" fill="url(#d12g2)" opacity="0.85"/>
          <polygon points="104,38 104,68 72,60" fill="url(#d12g3)" opacity="0.8"/>
          <polygon points="22,12 6,38 38,60 32,36" fill="url(#d12g2)" opacity="0.8"/>
          <polygon points="6,38 6,68 38,60" fill="url(#d12g3)" opacity="0.75"/>
          <polygon points="6,68 22,94 38,60" fill="url(#d12g3)" opacity="0.65"/>
          <polygon points="104,68 88,94 72,60" fill="url(#d12g3)" opacity="0.6"/>
          <polygon points="22,94 55,102 88,94 72,60 38,60" fill="#7f1d1d" opacity="0.55"/>
          <polygon points="55,24 74,36 68,56 42,56 36,36" fill="white" opacity="0.08"/>
          <polygon points="55,26 66,35 62,48 48,48 44,35" fill="white" opacity="0.06"/>
        </g>
        <text x="55" y="52" text-anchor="middle" font-size="26" font-weight="bold" fill="white" font-family="sans-serif" opacity="0.95">12</text>
      </svg>
    </div>
    <span class="die-counter" data-count="0" aria-live="polite">0</span>
  </button>

  <button class="die-btn" data-sides="20" aria-label="Add d20 to formula">
    <span class="die-num">D20</span>
    <div class="die-shape die-d20">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="d20g1" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#fb923c"/>
            <stop offset="100%" stop-color="#f97316"/>
          </linearGradient>
          <linearGradient id="d20g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
          <linearGradient id="d20g3" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ea580c"/>
            <stop offset="100%" stop-color="#c2410c"/>
          </linearGradient>
          <linearGradient id="d20g4" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stop-color="#c2410c"/>
            <stop offset="100%" stop-color="#9a3412"/>
          </linearGradient>
          <filter id="d20s"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#f97316" flood-opacity="0.5"/></filter>
        </defs>
        <g filter="url(#d20s)">
          <polygon points="60,4 108,25 108,80 60,102 12,80 12,25" fill="url(#d20g3)"/>
          <polygon points="60,4 108,25 12,25" fill="url(#d20g1)"/>
          <polygon points="12,25 108,25 60,60" fill="url(#d20g2)"/>
          <polygon points="60,4 12,25 60,60" fill="url(#d20g1)" opacity="0.85"/>
          <polygon points="60,4 108,25 60,60" fill="url(#d20g2)" opacity="0.8"/>
          <polygon points="12,25 12,80 60,60" fill="url(#d20g3)" opacity="0.85"/>
          <polygon points="108,25 108,80 60,60" fill="url(#d20g3)" opacity="0.75"/>
          <polygon points="12,80 60,102 60,60" fill="url(#d20g4)" opacity="0.7"/>
          <polygon points="108,80 60,102 60,60" fill="url(#d20g4)" opacity="0.6"/>
          <polygon points="12,80 108,80 60,60" fill="url(#d20g4)" opacity="0.5"/>
          <polygon points="60,6 30,24 60,24 90,24" fill="white" opacity="0.15"/>
          <polygon points="60,8 42,22 60,22 78,22" fill="white" opacity="0.08"/>
          <line x1="60" y1="4" x2="60" y2="102" stroke="#fdba74" stroke-width="0.8" opacity="0.3"/>
          <line x1="12" y1="25" x2="108" y2="80" stroke="#fdba74" stroke-width="0.5" opacity="0.15"/>
          <line x1="108" y1="25" x2="12" y2="80" stroke="#fdba74" stroke-width="0.5" opacity="0.15"/>
          <line x1="12" y1="25" x2="108" y2="25" stroke="#fdba74" stroke-width="0.8" opacity="0.25"/>
        </g>
        <text x="60" y="50" text-anchor="middle" font-size="30" font-weight="bold" fill="white" font-family="sans-serif" opacity="0.95">20</text>
      </svg>
    </div>
    <span class="die-counter" data-count="0" aria-live="polite">0</span>
  </button>

  <button class="die-btn" data-sides="100" aria-label="Add d100 to formula">
    <span class="die-num">D100</span>
    <div class="die-shape die-d100">
      <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="d100g1" cx="40%" cy="35%" r="55%">
            <stop offset="0%" stop-color="#a78bfa"/>
            <stop offset="40%" stop-color="#7c3aed"/>
            <stop offset="100%" stop-color="#3b0e8a"/>
          </radialGradient>
          <radialGradient id="d100hl" cx="35%" cy="30%" r="25%">
            <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="white" stop-opacity="0"/>
          </radialGradient>
          <filter id="d100s"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#7c3aed" flood-opacity="0.5"/></filter>
        </defs>
        <g filter="url(#d100s)">
          <circle cx="55" cy="52" r="42" fill="url(#d100g1)"/>
          <polygon points="55,22 74,34 68,56 42,56 36,34" fill="none" stroke="#c4b5fd" stroke-width="1" opacity="0.25"/>
          <polygon points="55,18 80,32 72,62 38,62 30,32" fill="none" stroke="#c4b5fd" stroke-width="0.6" opacity="0.15"/>
          <ellipse cx="55" cy="55" rx="40" ry="12" fill="none" stroke="#a78bfa" stroke-width="0.8" opacity="0.2"/>
          <circle cx="55" cy="52" r="42" fill="url(#d100hl)"/>
          <circle cx="42" cy="38" r="8" fill="white" opacity="0.1"/>
          <circle cx="44" cy="36" r="3" fill="white" opacity="0.12"/>
          <ellipse cx="55" cy="86" rx="28" ry="5" fill="#1e0a4a" opacity="0.3"/>
        </g>
        <text x="55" y="56" text-anchor="middle" font-size="22" font-weight="bold" fill="white" font-family="sans-serif" opacity="0.95">%</text>
      </svg>
    </div>
    <span class="die-counter" data-count="0" aria-live="polite">0</span>
  </button>
`;

export function renderDicePalette() {
  const diceGrid = document.getElementById('dice-grid');
  if (!diceGrid || diceGrid.querySelector('.die-btn')) {
    return;
  }

  const modifierWidget = diceGrid.querySelector('.modifier-widget');
  if (modifierWidget) {
    modifierWidget.insertAdjacentHTML('beforebegin', DICE_BUTTONS_MARKUP);
    return;
  }

  diceGrid.insertAdjacentHTML('beforeend', DICE_BUTTONS_MARKUP);
}