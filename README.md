# Rollz

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-222?style=for-the-badge&logo=githubpages&logoColor=white)](https://virlez.github.io/rollz/) [![random.org](https://img.shields.io/badge/random.org-True%20Random-0b7fab?style=for-the-badge)](https://www.random.org/) [![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-f7df1e?style=for-the-badge&logo=javascript&logoColor=111)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Language](https://img.shields.io/badge/Language-4a4a4a?style=for-the-badge)](#francais)[![FR](https://img.shields.io/badge/FR-6b46c1?style=for-the-badge)](#francais)[![EN](https://img.shields.io/badge/EN-6b46c1?style=for-the-badge)](#english)

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

### Déploiement GitHub Pages

Rollz peut être publié tel quel sur GitHub Pages, car il ne dépend d'aucun backend applicatif.

Le projet inclut un mécanisme simple de cache-busting pour limiter les problèmes de cache navigateur après déploiement.

### Stack technique

- `HTML5`
- `CSS3`
- `JavaScript` vanilla
- `random.org` pour les tirages aléatoires

### Structure du projet

```text
rollz/
├── index.html
├── README.md
├── favicon.svg
├── og-image.svg
├── css/
│   └── styles.css
└── js/
		└── app.js
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

### GitHub Pages deployment

Rollz can be deployed directly to GitHub Pages because it does not require an application backend.

The project includes a lightweight cache-busting mechanism to reduce browser cache issues after deployment.

### Tech stack

- `HTML5`
- `CSS3`
- Vanilla `JavaScript`
- `random.org` for random rolls

### Project structure

```text
rollz/
├── index.html
├── README.md
├── favicon.svg
├── og-image.svg
├── css/
│   └── styles.css
└── js/
		└── app.js
```
