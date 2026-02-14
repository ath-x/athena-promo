/**
 * config-cli.js
 * @description CLI interface for ConfigManager. Used by shell scripts.
 */

import { AthenaConfigManager } from '../5-engine/lib/ConfigManager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');

const key = process.argv[2];
if (!key) {
    console.error("Usage: node config-cli.js <key>");
    process.exit(1);
}

AthenaConfigManager.query(key, root);
