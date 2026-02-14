/**
 * pm-cli.js
 * @description CLI wrapper for AthenaProcessManager to be used in shell scripts.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { AthenaProcessManager } from '../5-engine/lib/ProcessManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');

const pm = new AthenaProcessManager(root);

const action = process.argv[2];
const port = process.argv[3];

async function run() {
    switch (action) {
        case 'list':
            const active = pm.listActive();
            console.log(JSON.stringify(active, null, 2));
            break;
        case 'stop':
            if (!port) {
                console.error("Usage: node pm-cli.js stop <port>");
                process.exit(1);
            }
            await pm.stopProcessByPort(port);
            break;
        case 'stop-all':
            const all = pm.listActive();
            for (const p in all) {
                await pm.stopProcessByPort(p);
            }
            console.log("✅ All tracked processes stopped.");
            break;
        default:
            console.log("Usage: node pm-cli.js <list|stop|stop-all> [port]");
    }
}

run();
