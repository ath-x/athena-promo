/**
 * @file sync-tsv-to-json.js
 * @description Injecteert lokale TSV data (uit tsv-data) in de src/data map van een site.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { AthenaDataManager } from './lib/DataManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const projectName = process.argv[2];
    if (!projectName) {
        console.error("❌ Gebruik: node 5-engine/sync-tsv-to-json.js [project-naam]");
        process.exit(1);
    }

    const root = path.resolve(__dirname, '..');
    const manager = new AthenaDataManager(root);

    try {
        await manager.syncTSVToJSON(projectName);
    } catch (e) {
        console.error(`❌ Fout: ${e.message}`);
        process.exit(1);
    }
}

await run();
