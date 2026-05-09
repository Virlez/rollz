# Bot Discord Rollz

## Contenu

Le bot Discord est en TypeScript dans `packages/discord-bot` et réutilise le noyau de lancer partagé dans `packages/core`.

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

- `/roll formula:<formule> mode:<normal|advantage|disadvantage|success>`
- `/favorite add name:<nom> formula:<formule> mode:<normal|advantage|disadvantage|success>`
- `/favorite list`
- `/favorite remove name:<nom>`
- `/favorite roll name:<nom>`
- `/rollz status`

## Notes MVP

- Les favoris sont persistés dans une base SQLite montée via volume Docker.
- Les jets peuvent être publiés dans le salon courant, un salon dédié, ou les deux selon la configuration.
- Les embeds Discord détaillent les dés gardés/écartés, les rerolls, les succès/échecs et le fallback RNG quand il est utilisé.
- `/rollz status` permet de vérifier la portée des commandes, l’accès au salon dédié, l’état SQLite et les limites actives.
- L'historique n'est pas inclus dans ce MVP.