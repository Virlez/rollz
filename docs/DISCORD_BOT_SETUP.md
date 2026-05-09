# Bot Discord Rollz

## Contenu

Le bot Discord est en TypeScript dans `packages/discord-bot` et réutilise le noyau de lancer partagé dans `packages/core`.

Pour un guide oriente utilisation quotidienne dans Discord, voir `docs/DISCORD_BOT_USER_GUIDE.md`.

## Variables d'environnement

Copier `.env.example` vers `.env` puis renseigner:

- `DISCORD_TOKEN`: token du bot
- `DISCORD_APPLICATION_ID`: application Discord
- `DISCORD_GUILD_ID`: optionnel, recommandé pour enregistrer rapidement les slash commands sur un serveur de test
- `ROLLZ_PUBLISH_MODE`: `invocation`, `dedicated` ou `both`
- `ROLLZ_DEDICATED_CHANNEL_ID`: requis si le mode est `dedicated` ou `both`
- `ROLLZ_FAVORITES_FILE`: chemin de la base SQLite des favoris

## Lancement local

```bash
npm install
npm run test:core
npm run build:bot
npm run bot:register
docker compose up --build
```

Le registre des slash commands est séparé du runtime. Il faut relancer `npm run bot:register` après toute modification des commandes.

## Commandes

### Jets

- `/roll formula:<formule> [mode] [visibility]`
- `formula`: formule Rollz a lancer, par exemple `1d20+5`, `3x 1d20+6`, `4d6R1>=4`
- `mode`: optionnel, `normal`, `advantage`, `disadvantage` ou `success`
- `visibility`: optionnel, `public` ou `prive`; par defaut `public`

Exemples:

- `/roll formula:1d20+7`
- `/roll formula:2x 1d20+5 mode:advantage`
- `/roll formula:6d10>=8 mode:success visibility:prive`

### Favoris

- `/favorite add name:<nom> formula:<formule> [mode]`
- `/favorite list`
- `/favorite remove name:<nom>`
- `/favorite roll name:<nom> [visibility]`

Détails:

- Les favoris sont personnels a l'utilisateur Discord.
- Deux utilisateurs peuvent avoir un favori avec le meme nom sans conflit.
- `/favorite remove` et `/favorite roll` proposent l'autocompletion sur le nom.
- `visibility` sur `/favorite roll` fonctionne comme sur `/roll`: `public` par defaut, `prive` pour une reponse ephemere.

Exemples:

- `/favorite add name:attaque formula:1d20+7`
- `/favorite add name:rafale formula:3x 1d6+4 mode:normal`
- `/favorite roll name:attaque visibility:prive`

### Administration du serveur

Les sous-commandes suivantes sont reservees aux administrateurs du serveur Discord:

- `/rollz status`
- `/rollz set-channel channel:<salon>`
- `/rollz clear-channel`
- `/rollz set-mode mode:<invocation|dedicated|both>`
- `/rollz clear-mode`

Détails:

- `/rollz status` affiche l'etat du bot, le mode de publication effectif, le salon dedie utilise et l'etat du stockage.
- `/rollz set-channel` definit le salon dedie pour le serveur courant.
- `/rollz clear-channel` supprime le salon dedie specifique au serveur.
- `/rollz set-mode` definit le mode de publication pour le serveur courant:
- `invocation`: publie dans le salon ou la commande est lancee
- `dedicated`: publie dans le salon dedie configure pour le serveur
- `both`: publie dans le salon de commande et dans le salon dedie
- `/rollz clear-mode` supprime le mode specifique du serveur et reutilise le mode global defini par l'environnement.

Exemples:

- `/rollz set-channel channel:#jets`
- `/rollz set-mode mode:both`
- `/rollz clear-channel`
- `/rollz clear-mode`

### Regles de publication

- Un jet `visibility:prive` reste toujours ephemere, quel que soit le mode du serveur.
- Un jet `visibility:public` suit le mode de publication effectif du serveur.
- Si un serveur est en mode `dedicated` ou `both`, un admin doit configurer un salon avec `/rollz set-channel`, sinon les jets publics enverront une erreur explicite.

## Notes MVP

- Les favoris sont persistés dans une base SQLite montée via volume Docker.
- Les favoris sont liés à l'utilisateur Discord et non plus au serveur. Un même nom de favori peut donc exister chez plusieurs utilisateurs.
- Les jets peuvent être publiés dans le salon courant, un salon dédié, ou les deux selon la configuration.
- Les embeds Discord reprennent la structure du rendu webapp: formule, groupes de dés, rerolls, dés gardés/écartés, sous-totaux, total final et notes éventuelles.
- `/rollz status` permet de vérifier la portée des commandes, l’accès au salon dédié, l’état SQLite et les limites actives.
- L'historique n'est pas inclus dans ce MVP.