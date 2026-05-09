# Guide utilisateur du bot Discord Rollz

Ce guide explique comment utiliser le bot Rollz sur Discord au quotidien: lancer des des, enregistrer des favoris, choisir la visibilite des resultats et comprendre la publication dans les salons.

## 1. A quoi sert le bot

Le bot Discord Rollz permet de:

- lancer des formules de des directement dans Discord
- reutiliser les memes capacites de lancer que la webapp Rollz
- sauvegarder des favoris personnels
- publier les jets soit dans le salon courant, soit dans un salon dedie, soit dans les deux selon la configuration du serveur
- garder certains jets prives avec une reponse ephemere

## 2. Premiere utilisation

La commande principale pour lancer des des est:

`/roll`

Les favoris se gerent avec:

`/favorite`

Les reglages du serveur se gerent avec:

`/rollz`

Si une commande n'apparait pas:

- le bot n'est peut-etre pas encore enregistre sur le serveur
- les commandes globales Discord peuvent mettre du temps a apparaitre
- un administrateur doit parfois finir la configuration du serveur

## 3. Faire un jet simple

Commande:

`/roll formula:<formule>`

Exemples:

- `/roll formula:1d20`
- `/roll formula:1d20+7`
- `/roll formula:2d6+3`

La formule suit la meme logique que la webapp Rollz. Exemples de syntaxes courantes:

- `1d20+5`
- `2d6+3`
- `3x 1d20+6`
- `1d20+5;1d8+2`
- `4d6R1>=4`

## 4. Utiliser un mode de lancer

La commande `/roll` peut recevoir un parametre `mode`.

Valeurs disponibles:

- `normal`
- `advantage`
- `disadvantage`
- `success`

Exemples:

- `/roll formula:1d20+5 mode:advantage`
- `/roll formula:1d20+5 mode:disadvantage`
- `/roll formula:6d10>=8 mode:success`

Rappel:

- `advantage` et `disadvantage` s'appliquent au premier groupe de des concerne
- `success` sert a compter des reussites, selon la formule fournie

## 5. Rendre un jet public ou prive

La commande `/roll` et la sous-commande `/favorite roll` acceptent un parametre `visibility`.

Valeurs disponibles:

- `public`
- `prive`

Comportement:

- `public`: le jet suit le mode de publication configure pour le serveur
- `prive`: le jet reste visible uniquement par toi, sous forme de reponse ephemere

Exemples:

- `/roll formula:1d20+7 visibility:public`
- `/roll formula:1d20+7 visibility:prive`

Important:

- un jet prive n'est jamais publie dans le salon dedie
- si tu veux tester une formule sans spammer le serveur, utilise `visibility:prive`

## 6. Lancer plusieurs formules ou repetitions

Le bot accepte les memes mecanismes pratiques que Rollz:

- `;` pour separer plusieurs formules
- `3x` pour repeter une expression complete

Exemples:

- `/roll formula:1d20+4;1d8+2`
- `/roll formula:3x 1d20+6`
- `/roll formula:2x 1d20+5;1d6+3`

## 7. Formules avancees

Le bot comprend aussi les syntaxes avancees de Rollz.

Exemples:

- `8d6>=5` pour compter des reussites au-dessus d'un seuil
- `4d10R1` pour relancer les des trop bas selon la regle indiquee
- `4d6R2>=5` pour combiner relance et seuil

Exemples de commandes:

- `/roll formula:8d6>=5`
- `/roll formula:4d10R1`
- `/roll formula:4d6R2>=5 mode:success`

## 8. Enregistrer un favori

Commande:

`/favorite add name:<nom> formula:<formule> [mode]`

Exemples:

- `/favorite add name:attaque formula:1d20+7`
- `/favorite add name:degats formula:2d6+4`
- `/favorite add name:salve formula:3x 1d20+5 mode:advantage`

Comportement:

- si le nom n'existe pas, le favori est cree
- si le nom existe deja chez toi, il est mis a jour
- les favoris sont personnels a ton compte Discord

## 9. Voir, relancer et supprimer un favori

Lister tes favoris:

`/favorite list`

Relancer un favori:

`/favorite roll name:<nom> [visibility]`

Supprimer un favori:

`/favorite remove name:<nom>`

Exemples:

- `/favorite list`
- `/favorite roll name:attaque`
- `/favorite roll name:attaque visibility:prive`
- `/favorite remove name:attaque`

Conseils:

- l'autocompletion aide a retrouver rapidement le nom d'un favori
- utilise des noms courts et explicites: `attaque`, `degats`, `initiative`, `soin`

## 10. Comment les jets sont publies

Les jets publics suivent la configuration du serveur.

Trois modes peuvent exister:

- `invocation`: le resultat est envoye dans le salon ou la commande est lancee
- `dedicated`: le resultat est envoye dans un salon dedie configure par un administrateur
- `both`: le resultat est envoye dans le salon courant et dans le salon dedie

Ce reglage est decide par les administrateurs du serveur avec les commandes `/rollz`.

## 11. Ce que peuvent faire les administrateurs

Les admins peuvent verifier et regler le comportement du bot pour leur serveur avec:

- `/rollz status`
- `/rollz set-channel channel:<salon>`
- `/rollz clear-channel`
- `/rollz set-mode mode:<invocation|dedicated|both>`
- `/rollz clear-mode`

En pratique:

- `/rollz status` permet de verifier le mode actif et le salon dedie
- `/rollz set-channel` choisit le salon recevant les jets publics si le serveur utilise un mode avec salon dedie
- `/rollz set-mode` change la facon dont les jets publics sont publies sur ce serveur

## 12. Exemples d'usage

### Tester un jet discretement

- `/roll formula:1d20+8 visibility:prive`

### Lancer attaque puis degats

- `/roll formula:1d20+7;2d6+4`

### Sauvegarder une attaque frequente

- `/favorite add name:attaque longue formula:1d20+9`
- `/favorite roll name:attaque longue`

### Compter des reussites

- `/roll formula:10d6>=5 mode:success`

## 13. Problemes frequents

### La commande n'apparait pas

- attends quelques minutes si les commandes sont globales
- demande a l'admin du bot de verifier l'enregistrement des commandes
- verifie que le bot est bien invite avec les permissions et scopes Discord adequats

### Le bot dit qu'aucun salon dedie n'est configure

- un administrateur doit lancer `/rollz set-channel`
- ou bien changer le mode du serveur avec `/rollz set-mode mode:invocation`

### Mon jet n'est visible que par moi

- tu as probablement utilise `visibility:prive`

### Mon favori n'est pas trouve

- verifie le nom exact
- utilise l'autocompletion dans `/favorite roll` ou `/favorite remove`
- verifie que le favori a bien ete cree sur ton compte Discord

## 14. Bonnes pratiques

- utilise `visibility:prive` pour les tests ou les brouillons
- garde des noms de favoris courts et stables
- reserve le mode `both` aux serveurs ou le doublon de messages est vraiment utile
- si un salon dedie est configure, donne-lui un nom clair comme `jets`, `rolls` ou `des`

## 15. Resume rapide

- `/roll` pour lancer une formule
- `/favorite add` pour enregistrer un jet frequent
- `/favorite roll` pour rejouer un favori
- `visibility:prive` pour un jet ephemere
- `/rollz` pour la configuration du serveur par les admins