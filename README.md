# Rollz

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-222?style=for-the-badge&logo=githubpages&logoColor=white)](https://virlez.github.io/rollz/) [![PWA](https://img.shields.io/badge/PWA-Ready-117a65?style=for-the-badge)](https://web.dev/progressive-web-apps/) [![random.org](https://img.shields.io/badge/random.org-True%20Random-0b7fab?style=for-the-badge)](https://www.random.org/) [![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-f7df1e?style=for-the-badge&logo=javascript&logoColor=111)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Playwright](https://img.shields.io/badge/Playwright-E2E-2ead33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-Tests-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Languages](https://img.shields.io/badge/FR%20%2F%20EN-Bilingual-4a4a4a?style=for-the-badge)](#francais)

<a id="francais"></a>

## Français

Rollz est un lanceur de dés JDR/TTRPG au style dark fantasy, conçu en HTML, CSS et JavaScript vanilla, avec génération de nombres via `random.org`.

### Fonctionnalités

- Lancers classiques avec formules comme `2d6 + 4`, `1d20 - 2`, `3d8 + 1d4 + 5`
- Dés visuels interactifs : `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`
- Mode `Avantage` / `Désavantage`
- Mode `Réussites` :
	- seuls les résultats pairs comptent comme réussites
	- seul le premier groupe de dés est pris en compte
	- les bonus fixes sont ajoutés au total
	- relance bonus unique si tous les dés initiaux sont pairs
	- échec critique si tous les dés initiaux sont impairs
- Interface bilingue français / anglais
- Historique des lancers
- Design responsive pour desktop et mobile
- Déploiement simple sur GitHub Pages

### Règles du mode Réussites

- Chaque dé pair vaut `1` réussite
- Chaque dé impair vaut `0`
- Les groupes de dés après le premier sont ignorés
- Les modificateurs fixes (`+1`, `+2`, etc.) sont ajoutés, sauf en cas d'échec critique
- Si tous les dés du premier lancer sont pairs, le groupe est relancé une seule fois et les nouvelles réussites sont ajoutées
- Si tous les dés du premier lancer sont impairs, le résultat final est `0` avec le message `Échec critique`

### Utilisation

Tu peux utiliser l'application de deux façons :

- cliquer sur les dés pour construire automatiquement une formule
- taper une formule manuellement dans le champ dédié

Exemples :

- `3d6`
- `1d20 + 5`
- `4d8 + 2`
- `6d10 + 1`

### Lancer le projet en local

Le projet est statique : aucun build n'est nécessaire.

Les fichiers de l'application se trouvent dans le dossier `app/`. Pour un serveur local, il faut donc servir ce dossier comme racine web.

Exemple : `npx http-server app`

### Déploiement GitHub Pages

Rollz peut être publié sur GitHub Pages sans backend applicatif.

Le dépôt est organisé en séparant l'application et les tests : GitHub Pages doit publier le contenu du dossier `app/`, qui contient `index.html`, le manifeste, le service worker et les assets statiques.

Le projet inclut un mécanisme simple de cache-busting pour limiter les problèmes de cache navigateur après déploiement.

### Stack technique

- `HTML5`
- `CSS3`
- `JavaScript` vanilla
- `random.org` pour les tirages aléatoires

### Stack de tests E2E

- `Playwright` pour les tests end-to-end
- `TypeScript` pour la suite de tests et la configuration Playwright
- `http-server` pour servir localement le dossier `app/` pendant les tests
- Exécution multi-navigateurs sur `Chromium`, `Firefox` et `WebKit`

Couverture fonctionnelle :

- chargement initial de l'application et état par défaut de l'interface
- bascule de langue et persistance de la préférence utilisateur
- shell PWA : manifeste, installation, badge hors-ligne et fallback réseau
- construction de formule via les dés visuels et les modificateurs
- saisie manuelle, validation et aperçu de formule
- exécution des lancers, affichage des résultats et gestion des erreurs
- modes spéciaux comme avantage, désavantage et réussites
- historique des lancers, persistance locale et restauration après rechargement

Commandes utiles :

- `npm test`
- `npm run test:ui`
- `npm run typecheck:e2e`
- `npm run ci:e2e`

### Structure du projet

```text
rollz/
├── README.md
├── app/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── css/
│   ├── fonts/
│   ├── icons/
│   └── js/
├── scripts/
└── tests/
	├── e2e/
	├── playwright.config.ts
	└── tsconfig.e2e.json
```

---

<a id="english"></a>

## English

Rollz is a dark-fantasy styled TTRPG dice roller built with plain HTML, CSS, and JavaScript, using `random.org` for number generation.

### Features

- Classic dice formulas such as `2d6 + 4`, `1d20 - 2`, `3d8 + 1d4 + 5`
- Interactive visual dice: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`
- `Advantage` / `Disadvantage` mode
- `Success Mode`:
	- only even results count as successes
	- only the first dice group is used
	- flat modifiers are added to the total
	- one bonus reroll if all initial dice are even
	- critical failure if all initial dice are odd
- French / English interface
- Roll history
- Responsive layout for desktop and mobile
- Easy GitHub Pages deployment

### Success Mode Rules

- Each even die counts as `1` success
- Each odd die counts as `0`
- Any dice group after the first one is ignored
- Flat modifiers (`+1`, `+2`, etc.) are added, except on critical failure
- If every die in the first roll is even, the group is rerolled once and the extra successes are added
- If every die in the first roll is odd, the final result is `0` with the message `Fumble`

### Usage

You can use the app in two ways:

- click the dice to build a formula automatically
- type a formula manually in the input field

Examples:

- `3d6`
- `1d20 + 5`
- `4d8 + 2`
- `6d10 + 1`

### Run locally

This is a static project, so no build step is required.

The application files live under the `app/` directory, so your local static server should use that folder as its web root.

Example: `npx http-server app`

### GitHub Pages deployment

Rollz can be deployed to GitHub Pages without any application backend.

The repository separates the application from the test suite, so GitHub Pages must publish the `app/` directory, which contains `index.html`, the web manifest, the service worker, and the static assets.

The project includes a lightweight cache-busting mechanism to reduce browser cache issues after deployment.

### Tech stack

- `HTML5`
- `CSS3`
- Vanilla `JavaScript`
- `random.org` for random rolls

### E2E testing stack

- `Playwright` for end-to-end testing
- `TypeScript` for the test suite and Playwright configuration
- `http-server` to serve the `app/` directory locally during tests
- Cross-browser execution on `Chromium`, `Firefox`, and `WebKit`

Functional coverage:

- initial application load and default UI state
- language switching and persisted user preference
- PWA shell behavior: manifest, install flow, offline badge, and network fallback
- formula building through visual dice controls and modifiers
- manual input, validation, and formula preview
- roll execution, result rendering, and error handling
- special modes such as advantage, disadvantage, and success mode
- roll history, local persistence, and restoration after reload

Useful commands:

- `npm test`
- `npm run test:ui`
- `npm run typecheck:e2e`
- `npm run ci:e2e`

### Project structure

```text
rollz/
├── README.md
├── app/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── css/
│   ├── fonts/
│   ├── icons/
│   └── js/
├── scripts/
└── tests/
	├── e2e/
	├── playwright.config.ts
	└── tsconfig.e2e.json
```
