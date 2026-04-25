# Rollz

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-222?style=for-the-badge&logo=githubpages&logoColor=white)](https://virlez.github.io/rollz/) [![PWA](https://img.shields.io/badge/PWA-Ready-117a65?style=for-the-badge)](https://web.dev/progressive-web-apps/) [![random.org](https://img.shields.io/badge/random.org-True%20Random-0b7fab?style=for-the-badge)](https://www.random.org/) [![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-f7df1e?style=for-the-badge&logo=javascript&logoColor=111)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Playwright](https://img.shields.io/badge/Playwright-E2E-2ead33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-Tests-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Languages](https://img.shields.io/badge/EN%20%2F%20FR-Bilingual-4a4a4a?style=for-the-badge)](#english)

<a id="english"></a>

## English

Rollz is a dark-fantasy TTRPG dice roller built with plain HTML, CSS, and JavaScript. It uses `random.org` when available and falls back to `crypto` when needed.

Detailed guides:

- English: [docs/WIKI_USER_GUIDE.md](docs/WIKI_USER_GUIDE.md)
- Français : [docs/WIKI_UTILISATEUR.md](docs/WIKI_UTILISATEUR.md)

### Highlights

- Classic and advanced formulas such as `2d6 + 4`, `8d6>=5`, `2d6R2`, `4d6R2>=5`
- Visual dice picker with `Classic` and `Expert` builders
- `Advantage`, `Disadvantage`, and `Success Mode`
- Favorites, roll history, bilingual UI, responsive layout
- Static deployment on GitHub Pages with PWA support

For full interface walkthroughs, rules, and examples, use the guides above.

### Run locally

This is a static project. Serve `app/` as the web root.

- Example: `npx http-server app`
- Windows: `cmd /c npx http-server app -p 8081 -c-1`

### Deployment

GitHub Pages should publish the `app/` directory.

Before deployment, run `npm run version:app` to bump the service worker and versioned asset URLs.

Useful examples:

- `npm run version:app`
- `npm run version:app -- --dry-run`
- `npm run version:app -- 2026-04-25-1`

### Testing

- `npm test`
- `npm run test:ui`
- `npm run typecheck:e2e`
- `npm run ci:e2e`
- `npm run test:e2e:coverage`
- `npm run report:e2e:coverage`

### Project structure

```text
rollz/
├── index.html
├── LICENSE
├── README.md
├── app/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── css/
│   │   ├── styles.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── builder.css
│   │   ├── results.css
│   │   ├── history.css
│   │   ├── favorites.css
│   │   ├── states.css
│   │   └── responsive.css
│   ├── fonts/
│   ├── icons/
│   └── js/
├── docs/
│   ├── WIKI_USER_GUIDE.md
│   ├── WIKI_UTILISATEUR.md
│   └── images/
├── scripts/
└── tests/
    ├── e2e/
    ├── playwright.config.ts
    └── tsconfig.e2e.json
```

Generated artifacts such as `coverage/` and `test-results/` are intentionally omitted from this tree.

### License

This repository is distributed under the custom license in [LICENSE](LICENSE).

- Reuse, modification, and redistribution are allowed for non-commercial purposes only
- Any reuse must credit `Virlez`, keep the license notice, and, when reasonably possible, link back to the original repository
- It is forbidden to include the code, documentation, or images from this repository in any paid product, paid service, SaaS, subscription offering, or billed client work without prior written permission

---

<a id="francais"></a>

## Français

Rollz est un lanceur de dés JDR/TTRPG dark fantasy conçu en HTML, CSS et JavaScript vanilla. Il utilise `random.org` quand disponible et bascule sur `crypto` si nécessaire.

Guides détaillés :

- Français : [docs/WIKI_UTILISATEUR.md](docs/WIKI_UTILISATEUR.md)
- English: [docs/WIKI_USER_GUIDE.md](docs/WIKI_USER_GUIDE.md)

### Points clés

- Formules classiques et avancées comme `2d6 + 4`, `8d6>=5`, `2d6R2`, `4d6R2>=5`
- Sélecteur de dés visuel avec constructeurs `Classique` et `Expert`
- Modes `Avantage`, `Désavantage` et `Réussites`
- Favoris, historique, interface bilingue et responsive
- Déploiement statique sur GitHub Pages avec support PWA

Pour les règles détaillées, les captures et les cas d'usage, utilise les guides ci-dessus.

### Lancer en local

Le projet est statique. Il faut servir `app/` comme racine web.

- Exemple : `npx http-server app`
- Windows : `cmd /c npx http-server app -p 8081 -c-1`

### Déploiement

GitHub Pages doit publier le dossier `app/`.

Avant une mise en production, lance `npm run version:app` pour incrémenter la version du service worker et des assets versionnés.

Exemples utiles :

- `npm run version:app`
- `npm run version:app -- --dry-run`
- `npm run version:app -- 2026-04-25-1`

### Tests

- `npm test`
- `npm run test:ui`
- `npm run typecheck:e2e`
- `npm run ci:e2e`
- `npm run test:e2e:coverage`
- `npm run report:e2e:coverage`

### Structure du projet

```text
rollz/
├── index.html
├── LICENSE
├── README.md
├── app/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── css/
│   │   ├── styles.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── builder.css
│   │   ├── results.css
│   │   ├── history.css
│   │   ├── favorites.css
│   │   ├── states.css
│   │   └── responsive.css
│   ├── fonts/
│   ├── icons/
│   └── js/
├── docs/
│   ├── WIKI_USER_GUIDE.md
│   ├── WIKI_UTILISATEUR.md
│   └── images/
├── scripts/
└── tests/
    ├── e2e/
    ├── playwright.config.ts
    └── tsconfig.e2e.json
```

Les artefacts générés comme `coverage/` et `test-results/` sont volontairement omis de cet arbre.

### Licence

Ce dépôt est distribué sous la licence personnalisée disponible dans [LICENSE](LICENSE).

- La réutilisation, la modification et la redistribution sont autorisées uniquement dans un cadre non commercial
- Toute réutilisation doit créditer `Virlez`, conserver la mention de licence et, lorsque c'est raisonnablement possible, renvoyer vers le dépôt d'origine
- Il est interdit d'inclure le code, la documentation ou les images de ce dépôt dans un produit payant, un service payant, un SaaS, une offre sur abonnement ou une prestation client facturée sans autorisation écrite préalable
