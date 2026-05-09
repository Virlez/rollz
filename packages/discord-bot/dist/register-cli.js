import { loadConfig } from './config.js';
import { registerCommands } from './register.js';
async function main() {
    const config = loadConfig();
    await registerCommands(config);
    console.log(config.guildId
        ? `Commandes slash enregistrées pour le serveur ${config.guildId}.`
        : 'Commandes slash globales enregistrées.');
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
