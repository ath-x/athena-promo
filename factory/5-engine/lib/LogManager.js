/**
 * LogManager.js
 * @description Efficient log management for Athena.
 * Handles rotation, size limiting, and cleanup.
 */

import fs from 'fs';
import path from 'path';

export class AthenaLogManager {
    constructor(root) {
        this.root = root;
        this.logDir = path.join(root, 'factory/output/logs');
        this.maxFilesPerType = 5; // Keep only last 5 logs per type/site
        this.maxTotalSizeMB = 100; // Limit total log directory size
    }

    /**
     * Clean up old logs, keeping only the most recent ones.
     */
    async rotate() {
        if (!fs.existsSync(this.logDir)) return { deleted: 0, saved: 0 };

        const files = fs.readdirSync(this.logDir)
            .filter(f => f.endsWith('.log') || f.endsWith('.txt'))
            .map(f => ({
                name: f,
                path: path.join(this.logDir, f),
                mtime: fs.statSync(path.join(this.logDir, f)).mtime,
                size: fs.statSync(path.join(this.logDir, f)).size
            }))
            .sort((a, b) => b.mtime - a.mtime);

        const groups = {};
        let deletedCount = 0;

        files.forEach(file => {
            // Group by prefix (e.g., 'athena-dock', 'preview_site-name')
            const prefix = file.name.split('_').slice(0, 2).join('_').split('-')[0];
            if (!groups[prefix]) groups[prefix] = 0;
            
            groups[prefix]++;

            if (groups[prefix] > this.maxFilesPerType) {
                fs.unlinkSync(file.path);
                deletedCount++;
            }
        });

        return { deleted: deletedCount, remaining: files.length - deletedCount };
    }

    /**
     * Get log directory statistics
     */
    getStatus() {
        if (!fs.existsSync(this.logDir)) return { count: 0, totalSize: '0 B' };

        const files = fs.readdirSync(this.logDir);
        let totalSizeBytes = 0;

        files.forEach(f => {
            totalSizeBytes += fs.statSync(path.join(this.logDir, f)).size;
        });

        return {
            count: files.length,
            totalSize: (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
            dir: this.logDir
        };
    }

    /**
     * Wipe all logs
     */
    clearAll() {
        if (!fs.existsSync(this.logDir)) return;
        const files = fs.readdirSync(this.logDir);
        files.forEach(f => fs.unlinkSync(path.join(this.logDir, f)));
        return { success: true, cleared: files.length };
    }
}
