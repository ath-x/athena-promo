/**
 * ToolController.js
 * @description Orchestrates external tools and scripts (Scraper, Variants, Onboarding).
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

export class ToolController {
    constructor(configManager, executionService) {
        this.configManager = configManager;
        this.execService = executionService;
        this.factoryDir = configManager.get('paths.factory');
    }

    /**
     * Generate style variants for a site
     */
    generateVariants(id, styles = []) {
        const args = [id];
        if (styles && styles.length > 0) {
            args.push('--styles', styles.join(','));
        }
        return this.execService.runEngineScript('variant-generator.js', args);
    }

    /**
     * Run the website scraper for a project
     */
    scrape(id, inputFile) {
        return this.execService.runEngineScript('athena-scraper.js', [id, inputFile]);
    }

    /**
     * Run the client onboarding wizard
     */
    onboard(companyName, websiteUrl = '', clientEmail = '') {
        return this.execService.runEngineScript('onboarding-wizard.js', [companyName, websiteUrl, clientEmail]);
    }

    /**
     * Create a new sitetype based on an existing site's structure
     */
    createSitetypeFromSite(sourceSiteName, targetSitetypeName) {
        return this.execService.runEngineScript('sitetype-from-site-generator.js', [sourceSiteName, targetSitetypeName]);
    }

    /**
     * Run a generic engine script
     */
    async runScript(script, args) {
        return await this.execService.runAsync(process.execPath, [path.join(this.factoryDir, '5-engine', script), ...args], { label: script });
    }
}
