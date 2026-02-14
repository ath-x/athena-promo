/**
 * @file sync-sheet-to-json.js
 * @description Wrapper die het 'pnpm fetch-data' commando van de site zelf uitvoert.
 *              Dit zorgt ervoor dat de specifieke logica van die site (fetch-data.js) wordt gebruikt.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { AthenaDataManager } from './lib/DataManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const projectName = process.argv[2];
    if (!projectName) {
        console.error("❌ Gebruik: node sync-sheet-to-json.js [project-naam]");
        process.exit(1);
    }

    const root = path.resolve(__dirname, '..');
    const manager = new AthenaDataManager(root);

    try {
        await manager.syncFromSheet(projectName);
    } catch (e) {
        console.error(`❌ Fout: ${e.message}`);
        process.exit(1);
    }
}

run();
