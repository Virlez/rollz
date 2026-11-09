# Tests unitaires et tests de mutation

## Exécution

Utiliser Node.js 24 et les dépendances verrouillées :

```sh
npm ci
npm run typecheck:unit
npm run test:unit
npm run test:mutation
```

`npm test` lance désormais les tests unitaires puis les tests E2E existants.
`npm run test:core` conserve un point d'entrée pour les tests du package partagé.
Les navigateurs des tests E2E s'installent avec `npx playwright install --with-deps`.

Stryker exécute Vitest pour chaque mutation du code de production. Un mutant
« tué » signifie qu'au moins un test détecte la modification. Un mutant
« survivant » appelle une analyse : assertion manquante, comportement hors
contrat ou modification équivalente. Une absence de couverture reste une lacune,
et un timeout détecte une boucle bloquée mais ne remplace pas une assertion.

Rapports générés, exclus de Git :

- `reports/mutation/index.html` : exploration des mutants dans leur source ;
- `reports/mutation/mutation.json` : résultats complets exploitables par outil.

La CI `.github/workflows/test.yml` vérifie les types, les tests unitaires et le
build du bot avant la campagne de mutation. Les rapports sont conservés comme
artefacts pendant 14 jours, y compris si le seuil échoue. Aucun service externe
ni secret n'est nécessaire aux tests unitaires.

## Périmètre et méthode

Huit fichiers sont mutés : `parser`, `engine` et `random` dans `app/js/` et dans
`packages/core/src/`, plus `limits` et `roll-service` dans le package partagé.
Le site et le bot livrent deux implémentations distinctes : tester seulement le
package partagé ne protège pas le site. Les mêmes scénarios métier vérifient
chacune contre des résultats explicites, sans prendre l'une comme oracle de l'autre.

Les tests E2E ne sont pas utilisés comme moteur de mutation : les tests unitaires
isolent les règles et permettent des campagnes plus rapides et déterministes.
Le DOM, les favoris, le stockage, le service worker, le rendu et l'intégration du
bot Discord ne sont pas mutés dans cette campagne. Les E2E existants continuent
de compléter ce périmètre ; ce score n'est pas un score global de l'application.
Les déclarations TypeScript, constantes et fichiers `dist` générés ne sont pas
mutés. Aucun opérateur de mutation n'est désactivé et aucune annotation
`Stryker disable` n'est ajoutée.

Chaque source de hasard est contrôlée :

- tirages injectés vérifiant le nombre de dés et leurs faces, ainsi que le nombre
  d'appels pour détecter les relances supplémentaires ;
- `fetch` simulé pour les réponses valides, malformées et les erreurs réseau ;
- Web Crypto simulé avec les valeurs limites du rejet des entiers biaisés ;
- mocks restaurés après chaque test pour éviter les dépendances entre scénarios.

Les attentes portent sur des comportements observables : nombres, signes,
valeurs conservées et rejetées, marqueurs de réussite, provenance aléatoire,
ordre des exécutions et erreurs typées. Les cas valides à la limite accompagnent
les cas invalides juste au-delà pour détecter les mutations `>` / `>=`.

## Résultats

La référence est le commit `126f8509dc78065ac365e0592d460dc4b8bed190`.
La première campagne utilise les quatre tests initiaux, portés de `node:test`
vers Vitest sans changer leurs assertions, avec le même périmètre de mutation.
Elle mesure donc les tests unitaires initiaux, sans préjuger de la qualité des E2E.

Les mesures et l'analyse des survivants sont détaillées ci-dessous après la
campagne finale.

## Corrections des tests

| Fichier | Comportements protégés |
| --- | --- |
| `packages/core/tests/roll-core.test.ts` | Requête parsée complète ; erreur de validation précise et borne valide des répétitions. |
| `tests/unit/parser.test.ts` | Signes, casse, suffixes et nombres à plusieurs chiffres ; rejets partiels ; analyse indépendante des modes ; description et historique web. |
| `tests/unit/engine.test.ts` | Pools par faces sans réutilisation ; dés négatifs ; avantage et désavantage sur le premier dé ; relance unique ; seuil inclusif ; réussites, échec critique, bonus et groupes ignorés. |
| `tests/unit/limits.test.ts` | Valeurs par défaut et surcharges ; bornes inclusives et dépassements de chaque limite ; trim avant contrôle ; messages et type des erreurs. |
| `tests/unit/random.test.ts` | Paramètres HTTP et décodage ; erreurs et repli ; provenance isolée par source ; rejet crypto à la borne et remplissage de plusieurs lots. |
| `tests/unit/roll-service.test.ts` | Ordre des formules et répétitions ; propagation des modes et de la provenance ; validation avant tout accès réseau. |
| `tests/e2e/rolling.spec.ts` | Présence et valeurs exactes des dés bonus, même lorsque la relance ne change pas le total. |

Les quatre tests initiaux ne sont pas supprimés : ceux dont les assertions étaient
insuffisantes sont renforcés. En particulier, `assert.throws()` sans type ni
message pouvait réussir pour une erreur sans rapport avec la règle testée ; le
test de parsing ne vérifiait auparavant que deux longueurs.

Après la campagne intermédiaire à 90,41 %, les survivants ont guidé une seconde
correction : ajouter des cas à plusieurs chiffres, une formule valide suivie
d'une formule invalide, les indicateurs avancés pris séparément et un bonus avec
un nombre différent de dés pairs et impairs. Un bonus de deux dés contenant un
pair et un impair ne détectait pas l'inversion de la parité : les deux prédicats
retournaient le même total. Le nouveau scénario compte un pair parmi trois dés
bonus et vérifie aussi les détails retournés.

## Entretien

Le seuil bloquant de 85 % est fixé sur l'ensemble de ce périmètre ; les repères
visuels sont 90 % et 95 %. Il laisse une marge aux mutations équivalentes sans
masquer les survivants. Il ne garantit pas que chaque fichier dépasse 85 %.
Pour toute évolution, examiner le rapport et ajouter des cas métier avant
d'envisager une exclusion. Ne pas baisser le seuil simplement pour faire passer
la CI, ni tester des états impossibles uniquement pour gagner des points.

Une campagne ciblée accélère le travail local, mais la campagne complète fait foi :

```sh
npm run test:mutation -- --mutate app/js/engine.js
```

Les tests unitaires utilisent Vitest, y compris les quatre anciens tests
`node:test`, pour partager un seul runner avec Stryker. Les tests Playwright
restent séparés par la configuration Vitest explicite. Le lockfile versionne les
outils pour que `npm ci` reproduise les versions mesurées.
