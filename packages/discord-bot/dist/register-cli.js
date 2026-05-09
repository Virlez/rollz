import 'dotenv/config';
import { loadConfig } from './config.js';
import { registerCommands } from './register.js';
async function main() {
    const config = loadConfig();
    await registerCommands(config);
    console.log(config.guildId
        ? `Slash commands registered for guild ${config.guildId}.`
        : 'Global slash commands registered.');
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
