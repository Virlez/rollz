# Wiki Utilisateur Rollz

Ce guide explique comment utiliser Rollz au quotidien, depuis les lancers simples jusqu'aux formules avancées.

![Vue d'ensemble de Rollz](images/guide-accueil.png)

## 1. A quoi sert Rollz

Rollz est un lanceur de des pour les jeux de role. Il permet de :

- lancer des formules classiques comme `1d20 + 5` ou `2d6 + 3`
- lancer plusieurs formules en une seule fois
- utiliser des regles avancees directement dans la formule
- rejouer une formule depuis l'historique
- sauvegarder des favoris
- utiliser des modes speciaux comme `Avantage`, `Desavantage` et `Pair/Impair`

## 2. Lecture rapide d'une formule

Une formule suit en general ce schema :

`NdX + modificateur`

Exemples :

- `1d20`
- `1d20 + 5`
- `2d6 + 3`
- `4d8 - 1`
- `3d6 + 1d4 + 2`

Signification :

- `N` = le nombre de des
- `dX` = le type de de, donc le nombre de faces
- `+ 2` ou `- 1` = un modificateur ajoute ou retire du total

Exemple :

- `2d6 + 3` lance 2 des a 6 faces puis ajoute 3 au resultat final

![Exemple de lancer classique](images/guide-lancer-classique.png)

## 3. Des pris en charge

L'interface permet d'ajouter rapidement ces des :

- `d4`
- `d6`
- `d8`
- `d10`
- `d12`
- `d20`
- `d100`

Tu peux soit cliquer sur les boutons de des, soit taper la formule manuellement.

## 4. Lancer plusieurs formules a la fois

Tu peux separer plusieurs formules avec un point-virgule `;`.

Exemples :

- `1d20 + 4; 1d8 + 2`
- `2d6; 2d6; 1d20 + 3`

Chaque formule est lancee a la suite et Rollz affiche un resultat pour chaque bloc.

## 5. Modes speciaux

### Avantage

Le mode `Avantage` s'applique uniquement au premier groupe de des de la premiere formule.

Exemple :

- avec `1d20`, Rollz lance 2 des et garde le plus haut

### Desavantage

Le mode `Desavantage` s'applique lui aussi uniquement au premier groupe de des de la premiere formule.

Exemple :

- avec `1d20`, Rollz lance 2 des et garde le plus bas

### Pair/Impair

Le mode `Pair/Impair` sert a compter des reussites basees sur la parite des des.

Regles :

- un de pair compte pour `1` reussite
- un de impair compte pour `0`
- seul le premier groupe de des est pris en compte
- les groupes de des suivants sont ignores
- les modificateurs fixes sont ajoutes au total final, sauf en cas d'echec critique
- si tous les des du premier tirage sont pairs, Rollz effectue une relance bonus unique et ajoute les nouvelles reussites
- si tous les des du premier tirage sont impairs, le resultat tombe a `0` avec un echec critique

Exemple :

- `4d6` en mode `Pair/Impair`
- si les des donnent `2, 3, 4, 5`, cela fait `2` reussites

Important :

- le total affiche dans le resultat reste nomme `Reussites`
- `Avantage`, `Desavantage` et `Pair/Impair` s'excluent mutuellement

## 6. Formules avancees

Rollz prend en charge deux operateurs avances directement dans la formule :

- `>=` pour compter les reussites a partir d'un seuil
- `R` pour relancer certains des une seule fois

### 6.1. Seuil de reussite : `NdX>=T`

Format :

`NdX>=T`

Exemples :

- `8d6>=5`
- `4d10>=8`
- `6d6>=4 + 2`

Fonctionnement :

- Rollz lance les des
- chaque de dont la valeur finale est superieure ou egale au seuil compte comme `1` reussite
- le total affiche devient un nombre de reussites
- les modificateurs fixes restent appliques

Exemple detaille :

- `4d6>=5`
- resultats : `6, 5, 4, 1`
- total des reussites : `2`

### 6.2. Relance simple : `NdXRn`

Format :

`NdXRn`

Exemples :

- `2d6R2`
- `4d10R1`

Fonctionnement :

- chaque de dont la valeur est inferieure ou egale a `n` est relance une seule fois
- la valeur finale remplace l'ancienne pour le calcul du total
- Rollz affiche la valeur d'origine puis la nouvelle valeur conservee

Exemple detaille :

- `2d6R2`
- premier tirage : `2, 1`
- relances : `6, 5`
- total final : `11`

### 6.3. Relance + seuil : `NdXRn>=T`

Format :

`NdXRn>=T`

Exemple :

- `4d6R2>=5`

Fonctionnement :

- les relances sont appliquees d'abord
- le seuil est ensuite calcule sur les valeurs finales conservees

Exemple detaille :

- `4d6R2>=5`
- premier tirage : `1, 2, 4, 6`
- les des `1` et `2` sont relances
- nouvelles valeurs : `5, 3`
- serie finale : `5, 3, 4, 6`
- reussites avec `>=5` : `2`

![Exemple de formule avancee](images/guide-formule-avancee.png)

## 7. Compatibilites et limites

### Ce qui est autorise

- plusieurs groupes de des dans une formule : `3d6 + 1d4 + 2`
- plusieurs formules avec `;`
- modificateurs positifs et negatifs
- seuils et relances dans une meme formule avancee

### Ce qui est a savoir

- une formule doit contenir au moins un groupe de des
- `R` signifie une seule relance par de eligible
- la syntaxe avancee supportee actuellement est limitee a `R` et `>=`
- la syntaxe inline avancee ne peut pas etre combinee avec `Avantage`, `Desavantage` ou `Pair/Impair` sur la premiere formule
- en mode `Pair/Impair`, seul le premier groupe de des est utilise

## 8. Exemples utiles

### Lancers classiques

- `1d20 + 5`
- `2d6 + 3`
- `3d8 + 1d4 + 2`

### Formules avancees

- `8d6>=5`
- `2d6R2`
- `4d6R2>=5`

### Plusieurs formules

- `1d20 + 4; 1d8 + 2`
- `8d6>=5; 2d6R2`

## 9. Historique et favoris

### Historique

Chaque lancer est ajoute a l'historique avec :

- la formule
- le total
- un resume du lancer
- le mode utilise

Cliquer sur une entree de l'historique relance automatiquement cette formule avec son mode enregistre.

### Favoris

Tu peux sauvegarder une formule depuis l'historique pour la retrouver rapidement.

Les favoris conservent :

- la formule
- l'ordre choisi par l'utilisateur
- le mode `Pair/Impair` si la formule a ete sauvegardee dans ce mode

Quand tu charges un favori :

- la formule revient dans la barre de formule
- le mode `Pair/Impair` est reactive automatiquement si besoin
- le focus revient sur le conteneur de formule sans ouvrir le clavier virtuel mobile

![Historique et favoris](images/guide-historique-favoris.png)

## 10. Conseils pratiques

- utilise les boutons de des pour eviter les erreurs de syntaxe sur les lancers simples
- utilise `;` si tu veux preparer plusieurs lancers d'un coup
- utilise `R` pour les systemes qui relancent les faibles resultats
- utilise `>=` pour les systemes a seuil de reussite
- utilise `Pair/Impair` si tu veux compter les des pairs comme reussites

## 11. Mini aide-memoire

- `1d20 + 5` : un de a 20 faces plus 5
- `2d6R2` : relance chaque de de valeur `1` ou `2` une seule fois
- `6d10>=8` : compte les des de `8` ou plus comme reussites
- `4d6R2>=5` : relances puis seuil
- `1d20 + 4; 1d8 + 2` : deux lancers separes

## 12. Si une formule ne marche pas

Verifie ces points :

- la formule contient bien au moins un groupe de des
- il n'y a pas de separateur `;` vide
- le suffixe avance est bien colle au groupe de des, par exemple `4d6R2>=5`
- tu n'essaies pas de melanger syntaxe avancee et `Avantage`, `Desavantage` ou `Pair/Impair` sur la premiere formule

Si le bouton de lancer est desactive, regarde la ligne de previsualisation sous la formule : elle indique si la saisie est valide ou non.