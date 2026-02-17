/**
 * SiteController.js
 * @description Headless business logic for managing generated sites.
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { createProject, validateProjectName } from '../factory.js';
import { deployProject } from '../deploy-wizard.js';
import { AthenaDataManager } from '../lib/DataManager.js';
import { AthenaInterpreter } from '../lib/Interpreter.js';

export class SiteController {
    constructor(configManager, executionService, processManager) {
        this.configManager = configManager;
        this.execService = executionService;
        this.pm = processManager;
        this.root = configManager.get('paths.root');
        this.sitesDir = configManager.get('paths.sites');
        this.dataManager = new AthenaDataManager(configManager.get('paths.factory'));
        this.interpreter = new AthenaInterpreter(configManager);
    }

    /**
     * Update a site based on a natural language instruction
     */
    async updateFromInstruction(projectName, instruction) {
        // 1. Haal de huidige data op voor context (beperkt voor AI token limits)
        const paths = this.dataManager.resolvePaths(projectName);
        const basisData = this.dataManager.loadJSON(path.join(paths.dataDir, 'basis.json')) || [];
        const settings = this.dataManager.loadJSON(path.join(paths.dataDir, 'site_settings.json')) || {};
        
        const context = {
            availableFiles: fs.existsSync(paths.dataDir) ? fs.readdirSync(paths.dataDir).filter(f => f.endsWith('.json')) : [],
            basisSample: basisData[0],
            settingsSample: Array.isArray(settings) ? settings[0] : settings
        };

        // 2. Laat de AI de instructie interpreteren
        console.log(`🤖 AI interpreteert instructie: "${instruction}"`);
        const aiResponse = await this.interpreter.interpretUpdate(instruction, context);
        
        // 3. Pas de patches toe
        for (const patch of aiResponse.patches) {
            this.dataManager.patchData(projectName, patch.file, patch.index, patch.key, patch.value);
        }

        // 4. Sync naar Google Sheet indien nodig (Sheets-First!)
        if (aiResponse.syncRequired) {
            console.log(`📡 Wijzigingen worden gesynchroniseerd naar de Google Sheet van ${projectName}...`);
            await this.dataManager.syncToSheet(projectName);
        }

        return {
            success: true,
            message: "Site succesvol bijgewerkt op basis van de instructie.",
            patches: aiResponse.patches,
            syncPerformed: aiResponse.syncRequired
        };
    }

    /**
     * List all generated sites with their current status
     */
    list() {
        if (!fs.existsSync(this.sitesDir)) return [];
        const sites = fs.readdirSync(this.sitesDir).filter(f => 
            fs.statSync(path.join(this.sitesDir, f)).isDirectory() && !f.startsWith('.') && f !== 'athena-cms'
        );

        return sites.map(site => {
            const sitePath = path.join(this.sitesDir, site);
            const deployFile = path.join(sitePath, 'project-settings', 'deployment.json');
            const sheetFile = path.join(sitePath, 'project-settings', 'url-sheet.json');

            let status = 'local';
            let deployData = null;
            let sheetData = null;
            let isDataEmpty = false;

            // Check if data exists
            const dataDir = path.join(sitePath, 'src', 'data');
            if (fs.existsSync(dataDir)) {
                const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'schema.json');
                if (jsonFiles.length > 0) {
                    let allEmpty = true;
                    for (const file of jsonFiles) {
                        if (fs.statSync(path.join(dataDir, file)).size > 5) {
                            allEmpty = false;
                            break;
                        }
                    }
                    isDataEmpty = allEmpty;
                } else isDataEmpty = true;
            } else isDataEmpty = true;

            if (fs.existsSync(deployFile)) {
                deployData = JSON.parse(fs.readFileSync(deployFile, 'utf8'));
                status = deployData.status || 'live';
            }

            if (fs.existsSync(sheetFile)) {
                const json = JSON.parse(fs.readFileSync(sheetFile, 'utf8'));
                const firstKey = Object.keys(json)[0];
                if (firstKey) sheetData = json[firstKey].editUrl;
            }

            // Get SiteType from athena-config.json
            let siteType = null;
            const configPath = path.join(sitePath, 'athena-config.json');
            if (fs.existsSync(configPath)) {
                try {
                    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    siteType = config.siteType;
                } catch (e) { }
            }

            return { name: site, status, deployData, sheetUrl: sheetData, isDataEmpty, siteType };
        });
    }

    /**
     * Generate a new site from blueprint and source project
     */
    async create(params) {
        const { projectName, sourceProject, siteType, layoutName, styleName, siteModel, autoSheet, clientEmail } = params;
        const config = {
            projectName: validateProjectName(projectName),
            sourceProject: sourceProject ? validateProjectName(sourceProject) : undefined,
            siteType,
            layoutName,
            styleName,
            siteModel: siteModel || 'SPA',
            autoSheet: autoSheet === true || autoSheet === 'true',
            clientEmail,
            blueprintFile: path.join(siteType, 'blueprint', `${siteType}.json`)
        };
        await createProject(config);
        return { success: true, message: `Project ${config.projectName} created!` };
    }

    /**
     * Get theme and visual style information for a site
     */
    getThemeInfo(id) {
        const siteDir = path.join(this.sitesDir, id);
        if (!fs.existsSync(siteDir)) throw new Error('Site niet gevonden');

        const themesDir = path.join(this.configManager.get('paths.factory'), '2-templates/boilerplate/docked/css');
        const themes = fs.existsSync(themesDir)
            ? fs.readdirSync(themesDir).filter(f => f.endsWith('.css')).map(f => f.replace('.css', ''))
            : [];

        let currentTheme = null;
        const indexCss = path.join(siteDir, 'src/index.css');
        if (fs.existsSync(indexCss)) {
            const content = fs.readFileSync(indexCss, 'utf8');
            const match = content.match(/@import\s+["']\.\/css\/([a-z0-9-]+)\.css["']/);
            if (match) currentTheme = match[1];
        }
        
        return { themes, currentTheme };
    }

    /**
     * Directly update a data field in a site's JSON
     */
    updateData(id, { table, rowId, field, value }) {
        const filePath = path.join(this.sitesDir, id, 'src', 'data', `${table.toLowerCase()}.json`);
        if (!fs.existsSync(filePath)) throw new Error(`Tabel ${table} niet gevonden.`);

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let updated = false;
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].id == rowId || data[i].uuid == rowId || i == rowId) {
                    data[i][field] = value;
                    updated = true;
                    break;
                }
            }
        }

        if (updated) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return { success: true };
        }
        throw new Error("Rij niet gevonden.");
    }

    /**
     * Get installation status (node_modules existence)
     */
    getStatus(name) {
        const siteDir = path.join(this.sitesDir, name);
        const nodeModules = path.join(siteDir, 'node_modules');
        return { 
            isInstalled: fs.existsSync(nodeModules),
            isInstalling: false // Simplified for now, activeInstalls is handled in dashboard memory
        };
    }

    /**
     * Install dependencies for a site
     */
    install(name) {
        const siteDir = path.join(this.sitesDir, name);
        if (!fs.existsSync(siteDir)) throw new Error("Site niet gevonden");

        const child = spawn('pnpm', ['install'], {
            cwd: siteDir,
            detached: true,
            stdio: 'ignore',
            env: { ...process.env }
        });
        child.unref();
        return { success: true, message: "Installatie gestart op de achtergrond" };
    }

    /**
     * Start/Get preview server for a site
     */
    async preview(id) {
        const siteDir = path.join(this.sitesDir, id);
        if (!fs.existsSync(siteDir)) throw new Error('Site niet gevonden');

        const previewPort = this.getSitePort(id, siteDir);
        
        // Check if already running via ProcessManager
        const active = this.pm.listActive();
        if (active[previewPort] && active[previewPort].id === id) {
            return { success: true, url: `http://localhost:${previewPort}/${id}/` };
        }

        // Auto-install if node_modules is missing
        if (!fs.existsSync(path.join(siteDir, 'node_modules'))) {
            console.log(`📦 node_modules ontbreken in ${id}, installeren...`);
            this.execService.runSync('pnpm install', { cwd: siteDir, label: `Install for ${id}` });
        }

        // Start preview process
        console.log(`🚀 Starting preview for ${id} on port ${previewPort}...`);
        this.pm.startProcess(id, 'preview', previewPort, 'pnpm', ['dev', '--port', previewPort.toString(), '--host'], { cwd: siteDir });

        // Give it a small headstart
        return { success: true, url: `http://localhost:${previewPort}/${id}/` };
    }

    /**
     * Helper to get site port (duplicated from ServerController for autonomy)
     */
    getSitePort(siteId, siteDir) {
        const registryPath = path.join(this.configManager.get('paths.factory'), 'config/site-ports.json');
        if (fs.existsSync(registryPath)) {
            try {
                const ports = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                if (ports[siteId]) return ports[siteId];
            } catch (e) { }
        }
        return 5000;
    }

    /**
     * Sync local JSON data to Google Sheet
     */
    async syncToSheet(id) {
        await this.dataManager.syncToSheet(id);
        return { success: true, message: "Sync completed successfully." };
    }

    /**
     * Pull data from Google Sheet to local JSON
     */
    async pullFromSheet(id) {
        await this.dataManager.syncFromSheet(id);
        return { success: true, message: "Data successfully pulled from Google Sheets." };
    }

    /**
     * Deploy site to GitHub Pages
     */
    async deploy(projectName, commitMsg) {
        const result = await deployProject(projectName, commitMsg);
        return { success: true, result };
    }

    /**
     * Get available visual styles from the boilerplate
     */
    getStyles() {
        const stylesDir = path.join(this.configManager.get('paths.templates'), 'boilerplate/docked/css');
        if (!fs.existsSync(stylesDir)) return [];
        return fs.readdirSync(stylesDir)
            .filter(f => f.endsWith('.css'))
            .map(f => f.replace('.css', ''));
    }

    /**
     * Get available layouts for a specific sitetype
     */
    getLayouts(siteType) {
        // siteType can be "track/name"
        const [track, name] = siteType.includes('/') ? siteType.split('/') : ['docked', siteType];
        const webDir = path.join(this.configManager.get('paths.sitetypes'), track, name, 'web');
        
        if (!fs.existsSync(webDir)) return [];
        return fs.readdirSync(webDir).filter(f => 
            fs.statSync(path.join(webDir, f)).isDirectory() && !f.startsWith('.')
        );
    }

    /**
     * Run a maintenance script (e.g. sync-deployment-status)
     */
    runScript(script, args) {
        return this.execService.runEngineScript(script, args);
    }
}
