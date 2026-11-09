# Tests unitaires, intégration, E2E et mutation

## Exécution

Utiliser Node.js 24.15 ou plus récent dans la branche 24 et les dépendances verrouillées :

```sh
npm ci
npm run typecheck:unit
npm run test:unit
npm run typecheck:integration
npm run test:integration
npm run test:mutation
```

`npm test` lance les tests unitaires, les tests d’intégration puis les tests E2E.
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

La CI `.github/workflows/test.yml` vérifie les types et exécute les tests unitaires,
les tests d’intégration et le build du bot, puis lance les E2E et les mutations
dans des jobs séparés en parallèle.

| Déclenchement | Tests unitaires, intégration, types et build | E2E | Mutations |
| --- | --- | --- | --- |
| Pull request | Oui | Chromium | Oui, seuil bloquant de 90 % |
| Push sur `main` | Oui | Chromium, Firefox et WebKit | Oui, seuil bloquant de 90 % |
| Lancement manuel | Oui | Chromium, Firefox et WebKit | Oui, seuil bloquant de 90 % |

Aucune exécution planifiée ou nocturne n'est configurée. Chaque job E2E installe
uniquement son navigateur et les dépendances système nécessaires, avec
`playwright install --with-deps`. Les jobs E2E utilisent explicitement
`ubuntu-24.04`, compatible avec Playwright 1.59.1 : `ubuntu-latest` peut changer
vers une version non prise en charge (échec observé sur Ubuntu 26.04). La configuration Playwright démarre le serveur
HTTP local ; aucun site déployé n'est nécessaire. Un échec sur un navigateur
n'annule pas les autres navigateurs.

Les rapports HTML E2E et mutation ainsi que les traces Playwright disponibles
sont conservés comme artefacts pendant 14 jours, même en cas d'échec. Aucun
service externe ni secret n'est nécessaire aux tests unitaires.

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

Sur les mêmes **1 522 mutants**, les résultats mesurés sont :

| Campagne | Tests | Tués | Timeouts | Survivants | Non couverts | Score |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Initiale | 4 | 265 | 0 | 220 | 1 037 | 17,41 % |
| Intermédiaire | 119 | 1 369 | 7 | 142 | 4 | 90,41 % |
| Avant rééquilibrage | 141 | 1 423 | 7 | 90 | 2 | 93,96 % |
| Après rééquilibrage | 157 | 1 423 | 7 | 90 | 2 | **93,96 %** |

Le score final dépasse le **seuil bloquant de 90 %** demandé. Le score est
`(tués + timeouts) / (tués + timeouts + survivants + non couverts)`.
Les six timeouts crypto détectent des boucles rendues non terminantes ; le
septième détecte l'incrément inversé de la boucle de répétition.

Les compteurs par fichier et l'inventaire des mutants restants sont conservés
dans [MUTATION_RESULTS.json](MUTATION_RESULTS.json). Les survivants restent
inclus dans le score : gardes redondantes du parseur, structures initiales
réécrites avant retour dans les moteurs, conditions équivalentes pour des
requêtes parsées valides et changement de taille des lots crypto sans changement
des valeurs produites. Les deux non couverts concernent la garde `Number.isNaN`
sur un entier déjà contraint par la regex. Cette analyse s'applique aux requêtes
valides et à un RNG respectant le nombre de valeurs demandé ; elle ne constitue
pas une preuve générale d'équivalence.

Vérifications locales après rééquilibrage : **157 tests unitaires** et **122 E2E
Chromium** passent, ainsi que les vérifications TypeScript unitaires et E2E. La
campagne de mutation complète conserve le score de **93,96 %** en **5 min 25 s**,
avec un seuil bloquant de 90 % et un code de sortie 0. Le build du bot avait été
validé avant cette réorganisation, qui ne modifie aucune source de production.
Firefox et WebKit n'ont pas été exécutés localement.

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

## Répartition dans la pyramide de tests

La suite passe de **141 à 157 tests unitaires** et de **133 à 122 E2E par
navigateur**. Les huit variantes de calcul sont maintenant paramétrées dans
`tests/unit/engine.test.ts`, et chacune s'exécute contre le moteur web et le
moteur partagé. Les tirages injectés contrôlent le nombre et les faces des dés,
les résultats finaux et le nombre d'appels.

| Ancien E2E | Protection conservée |
| --- | --- |
| Ajout d'un modificateur : `1d6 + 4` | Cas unitaire : tirage 3, total 7. |
| Soustraction : `1d20 - 5` | Cas unitaire : tirage 15, total 10. |
| Somme de groupes : `2d6 + 1d4` | Cas unitaire : tirages 3, 4 et 2, total 9. |
| Modificateur négatif : `1d4 - 3` | Cas unitaire : tirage 4, total 1. |
| Grande formule : `3d6 + 2d4 + 1d8 + 10` | Cas unitaire : trois groupes distincts, total 28. |
| Avantage sur le premier dé de `2d6` | Cas unitaire : tirages 2, 5, 4 ; conserve 5 et 4, total 9. |
| Modificateur en mode réussites : `2d6 + 3` | Cas unitaire : tirages 4 et 3, total 4. |
| Comptage du bonus de réussites | Cas unitaire : tirages 2, 4 puis 6, 2, total 4. |

Trois scénarios navigateur redondants sont regroupés :

- le total avec avantage est vérifié dans le test des dés conservé et rejeté ;
- le total de réussites est vérifié dans le test des styles succès/échec ;
- le total nul d'échec critique est vérifié dans le test du message « Fumble ».

Ces E2E conservent le clic sur le mode, le vrai service web et l'affichage du
résultat. Le test de désavantage reste également au niveau navigateur. Les
répétitions, formules multiples et modes limités à la première formule restent
testés en E2E, car le service web possède sa propre orchestration, différente du
service du package partagé.

Les scénarios de responsive, focus/curseur, glisser-déposer, persistance après
rechargement, récupération après erreur et parcours complets restent en E2E.
Les tests de validation du builder, des favoris et de l'historique ne sont pas
réorganisés dans ce premier lot. Le score de mutation porte sur le périmètre
métier documenté et ne suffit pas à justifier la suppression d'une protection UI.

Le test de centrage mobile conserve ses critères de placement. Les rectangles
sont désormais lus dans une seule tâche navigateur et les assertions sont
réessayées pendant la stabilisation, pour éviter de comparer des positions
mesurées à différents instants de l'animation d'apparition.

## Tests d’intégration du front

Après le merge de la première PR (`796626afad601dd591a80bf7334239fbca6e65ba`),
une couche d’intégration remplace **33 E2E** : **157 tests unitaires**, **40 tests
d’intégration** et **89 E2E par navigateur** constituent la nouvelle répartition.
Les mesures de mutation et les 122 E2E décrits plus haut sont l’état historique
avant cette seconde migration.

`vitest.integration.config.mts` sélectionne uniquement `tests/integration/`.
Chaque test crée une nouvelle fenêtre jsdom à partir du **vrai `app/index.html`**
et importe le **vrai `app/js/app.js`** après réinitialisation du graphe de modules.
Les tests utilisent les événements DOM des contrôles et vérifient le résultat
rendu, les classes, les attributs et le stockage. Aucun module interne, moteur,
parseur, service de lancer ou fonction de rendu n’est mocké.

Les fenêtres sont fermées après chaque test : DOM, écouteurs, stockage et
singletons ne sont pas partagés entre scénarios. Le réseau est simulé avec des
réponses HTTP déterministes ; les tirages attendus vérifient le nombre de dés,
les faces et le nombre d’appels. Le localStorage est celui de jsdom, sans mock.
Les indisponibilités réseau/crypto sont injectées à leur frontière. `matchMedia`
et `scrollIntoView`, non implémentés par jsdom, disposent de substituts minimaux.
Aucune assertion de géométrie ou de visibilité CSS n’est faite dans cette couche.

| E2E déplacés | Nombre | Tests d’intégration qui les remplacent |
| --- | ---: | --- |
| Compteurs, combinaison des dés, sélection et bouton activé | 4 | `builder.test.ts` : événements des boutons de dés, formule, compteurs et aperçu. |
| Modificateurs et remise à zéro lors de la saisie manuelle | 4 | `builder.test.ts` : boutons +/−, saisie du modificateur et saisie manuelle. |
| Variantes de validation et remise à zéro de l’aperçu | 6 | `builder.test.ts` : formules valides, invalides et champ vide. |
| Effacement : bouton désactivé, compteurs et erreur | 3 | `builder.test.ts` : événement clear et état complet après effacement. |
| Exclusion du mode réussites avec avantage/désavantage | 2 | `builder.test.ts` : les six transitions entre les trois modes. |
| Avertissements de modes et suppression de l’avertissement | 4 | `builder.test.ts` : avertissements selon formule et mode. |
| Répétitions, syntaxe sans espace, groupes, portée des modes et syntaxe invalide | 6 | `rolling.test.ts` : rendu de chaque groupe, historique persisté, refus avant HTTP ; syntaxe invalide dans `builder.test.ts`. |
| Erreurs réseau/HTTP, espaces de saisie, groupes ignorés en mode réussites | 4 | `rolling.test.ts` : erreurs sans historique et contrôles rétablis, groupes ignorés ; espaces dans `builder.test.ts`. |

Des tests d’intégration complémentaires vérifient la persistance des résultats
dans l’ordre le plus récent d’abord, la récupération après une erreur et l’état
pendant une réponse HTTP en attente (bouton désactivé, spinner, puis restauration).
Ils attendent une condition observable, sans délai fixe.

Les E2E gardent un parcours de saisie valide/invalide, la construction classique
et experte, un lancer simple, la portée des modes dans un lancer répété, le rendu
avancé, la récupération après erreur, la persistance après rechargement, le
focus/curseur, le glisser-déposer et le responsive. Les contrôles propres au
navigateur (PWA, Web Crypto réel, CSS) restent également dans cette couche.

Stryker conserve son périmètre et son runner unitaire : les nouveaux tests
d’intégration s’exécutent séparément en CI et ne sont pas utilisés pour gonfler
le score de mutation historique de 93,96 %. Le seuil bloquant reste à 90 %.
Les sources de production et la planification CI ne sont pas modifiées : aucune
exécution nocturne n’est ajoutée.

Vérification locale de cette migration : **157 tests unitaires**, **40 intégrations**
et **89 E2E Chromium** passent. Les trois vérifications TypeScript (unitaire,
intégration, E2E), le build du bot et actionlint passent également. La suite
intégration a pris 4,87 s et la suite Chromium 50,8 s sur cet environnement ; ces
durées ne constituent pas un benchmark comparatif. La campagne de mutation
n’a pas été rejouée localement pour cette migration, car ses tests, sa
configuration et ses sources mutées sont inchangés ; elle est exécutée en CI.

Les outils d’intégration nécessitent les versions Node.js déclarées dans
`package.json` (22.22.2+, 24.15+ dans ces branches LTS, ou 26+). La CI utilise Node 24.

## Entretien

Le seuil bloquant de 90 % est fixé sur l'ensemble de ce périmètre ; les repères
visuels sont 90 % et 95 %. Il laisse une marge aux mutations équivalentes sans
masquer les survivants. Il ne garantit pas que chaque fichier dépasse 90 %.
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
