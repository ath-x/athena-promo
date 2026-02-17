/**
 * @file layout-visualizer.js
 * @description Web-based wizard voor het visueel mappen van UI-layouts.
 *              MODIFIED: Non-blocking startup for Dashboard integration.
 */

import express from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadEnv } from './env-loader.js';
import { generateSectionComponent } from './logic/standard-layout-generator.js';

/**
 * Fallback generator for standard components when AI is not used.
 */
function generateStandardComponents(sitetype, layoutName, mapping) {
    return {
        "App.jsx": "import React from 'react';\nimport Header from './components/Header';\nimport Section from './components/Section';\n\nconst App = ({ data }) => (\n  <div className=\"min-h-screen bg-white\">\n    <Header data={data} />\n    <main>\n      <Section data={data} />\n    </main>\n  </div>\n);\n\nexport default App;",
        "Header.jsx": "import React from 'react';\n\nconst Header = ({ data }) => {\n  const settings = data.site_settings?.[0] || {};\n  return (\n    <header className=\"p-6 flex justify-between items-center border-b\">\n      <h1 className=\"text-xl font-bold\">{settings.site_name || 'Athena Site'}</h1>\n    </header>\n  );\n};\n\nexport default Header;",
        "Section.jsx": generateSectionComponent({ data_structure: mapping.sections.map(s => ({ table_name: s })) }, 'docked'),
        "index.css": "@import \"tailwindcss\";\n\n@theme {\n  --color-accent: #007acc;\n}"
    };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const siteTypesDir = path.join(root, '3-sitetypes');

// Global State
let selectedSitetype = null;

async function generateComponents(sitetype, layoutName, mapping, blueprint, preferences) {
    console.log(`\n🤖 AI UI-Designer genereert componenten voor "${layoutName}"...`);
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelName = process.env.AI_MODEL_FRONTEND_ARCHITECT || process.env.AI_MODEL_DEFAULT || "gemini-flash-latest";
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
            Je bent een expert in React en Tailwind CSS (v4).
            Genereer de broncode voor een set React-componenten voor een website van het type "${sitetype}".
            
            CONTEXT:
            - Blueprint (datastructuur): ${JSON.stringify(blueprint, null, 2)}
            - Mapping van velden naar UI-sloten: ${JSON.stringify(mapping, null, 2)}
            - Gebruikersvoorkeuren: "${preferences}"

            BESCHIKBARE BIBLIOTHEKEN:
            - @heroicons/react/24/outline en @heroicons/react/24/solid (gebruik deze voor iconen).
            - Tailwind CSS v4 (volledige ondersteuning).

            GEWENSTE BESTANDEN:
            1. App.jsx (Hoofdcomponent)
            2. components/Header.jsx
            3. components/Section.jsx (Rendert alle secties uit mapping.sections)
            4. index.css (Volledige styling met Tailwind CSS v4 directives)

            INSTRUCTIES:
            - De site is een Single Page Application (SPA).
            - Gebruik 'modern design' principes: veel witruimte, mooie lettertypes, subtiele schaduwen.
            - PRODUCTIE-KLAAR DESIGN: 
                * De Hero-sectie mag NOOIT 'h-screen' zijn. Gebruik 'min-h-[50vh]' of 'py-24'.
                * Afbeeldingen in kaarten moeten een vaste hoogte hebben (bv. 'h-48' of 'h-56') en 'object-cover'.
                * Gebruik 'max-w-7xl mx-auto' voor de content-containers.
                * Houd teksten leesbaar: h1 maximaal 'text-5xl' of 'text-6xl', niet groter.
            - De data wordt in 'App.jsx' ontvangen via een 'data' prop.
            - 'mapping.sections' is een array. Maak voor elke sectie een visueel blok.
            - Voeg id's toe aan secties op basis van de tabelnaam (bv. id="sectie-producten").
            - Als 'mapping.hero_action' een waarde bevat die begint met # (bv. #sectie-producten), zorg dan voor een 'smooth scroll' effect.
            - Gebruik voor afbeeldingen de velden die eindigen op '_url'. 
            
            OUTPUT FORMAAT:
            Stuur een JSON-object terug met de bestandsnamen als keys en de volledige code-inhoud als waarden.
            {
                "App.jsx": "...",
                "Header.jsx": "...",
                "Section.jsx": "...",
                "index.css": "..."
            }
            GEEN markdown, geen extra tekst, alleen de valide JSON.
        `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Gemini 3 handling: find text part
        const parts = response.candidates?.[0]?.content?.parts || [];
        const textPart = parts.find(p => p.text);
        const text = textPart ? textPart.text : (response.text ? response.text() : "");
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("❌ Fout bij AI generatie:", error.message);
        return null;
    }
}

async function startVisualizer() {
    await loadEnv(path.join(__dirname, '../.env'));
    
    console.log("=================================================");
    console.log("🎨 Athena Visual Layout Editor - Server Started");
    console.log("=================================================");

    const app = express();
    const port = process.env.LAYOUT_EDITOR_PORT || 5003;
    app.use(express.json());

    // Serve Editor UI
    app.get('/', async (req, res) => {
        try {
            const html = await fs.readFile(path.join(__dirname, 'ui/layout-editor.html'), 'utf8');
            res.send(html);
        } catch (e) {
            res.status(500).send("Editor UI niet gevonden. Zorg dat ui/layout-editor.html bestaat.");
        }
    });

    // API: List Available Types (Scans both tracks)
    app.get('/api/types', async (req, res) => {
        try {
            const tracks = ['docked', 'autonomous'];
            let allTypes = [];
            for (const track of tracks) {
                const trackDir = path.join(siteTypesDir, track);
                if (existsSync(trackDir)) {
                    const types = (await fs.readdir(trackDir)).filter(f => existsSync(path.join(trackDir, f, 'blueprint')));
                    allTypes = [...allTypes, ...types.map(t => `${track}/${t}`)];
                }
            }
            res.json(allTypes);
        } catch (e) { 
            console.error("Fout bij ophalen types:", e);
            res.json([]); 
        }
    });

    // API: Set Type
    app.post('/api/set-type', async (req, res) => {
        const { type } = req.body;
        if (existsSync(path.join(siteTypesDir, type))) {
            selectedSitetype = type;
            console.log(`✅ Active Sitetype set to: ${type}`);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Type not found" });
        }
    });

    // API: Get Blueprint
    app.get('/api/blueprint', async (req, res) => {
        if (!selectedSitetype) {
            return res.status(400).json({ error: "NO_TYPE_SELECTED" });
        }

        const typeName = selectedSitetype.split('/').pop();
        const blueprintPath = path.join(siteTypesDir, selectedSitetype, 'blueprint', `${typeName}.json`);
        try {
            const blueprint = JSON.parse(await fs.readFile(blueprintPath, 'utf8'));
            const layoutsDir = path.join(siteTypesDir, selectedSitetype, 'web');
            let existingLayouts = [];
            if (existsSync(layoutsDir)) {
                existingLayouts = (await fs.readdir(layoutsDir)).filter(async (f) => {
                    return existsSync(path.join(layoutsDir, f, 'App.jsx'));
                });
            }
            res.json({ sitetype: selectedSitetype, blueprint, existingLayouts });
        } catch (e) {
            console.error("Fout bij laden blueprint:", e);
            res.status(500).json({ error: "Blueprint not found" });
        }
    });

    // API: Suggest Mapping
    app.post('/api/suggest-mapping', async (req, res) => {
        if (!selectedSitetype) return res.status(400).send("No type selected");
        
        try {
            const typeName = selectedSitetype.split('/').pop();
            const blueprintPath = path.join(siteTypesDir, selectedSitetype, 'blueprint', `${typeName}.json`);
            const blueprint = JSON.parse(await fs.readFile(blueprintPath, 'utf8'));

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const modelName = process.env.AI_MODEL_FRONTEND_ARCHITECT || process.env.AI_MODEL_DEFAULT || "gemini-flash-latest";
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const prompt = `
                Analyseer de volgende database blueprint voor een website van het type "${selectedSitetype}".
                BLUEPRINT: ${JSON.stringify(blueprint, null, 2)}
                
                STEL EEN MAPPING VOOR (header_title, header_subtitle, hero_action, sections).
                BELANGRIJK: 'sections' MOET een array van strings zijn (alleen de exacte tabelnamen uit de blueprint).
                GEEF ALLEEN JSON.
            `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            const parts = response.candidates?.[0]?.content?.parts || [];
            const textPart = parts.find(p => p.text);
            const text = textPart ? textPart.text : (response.text ? response.text() : "");
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            res.json(JSON.parse(cleanJson));
        } catch (error) {
            console.error("Suggestie fout:", error);
            res.status(500).json({ error: "Kon geen suggestie genereren." });
        }
    });

    // API: Generate Layout
    app.post('/api/generate', async (req, res) => {
        if (!selectedSitetype) return res.status(400).send("No type selected");

        const { layoutName, mapping, preferences, mode } = req.body;
        const typeName = selectedSitetype.split('/').pop();
        const blueprintPath = path.join(siteTypesDir, selectedSitetype, 'blueprint', `${typeName}.json`);
        const blueprint = JSON.parse(await fs.readFile(blueprintPath, 'utf8'));

        let components = null;

        if (mode === 'standard') {
            components = generateStandardComponents(selectedSitetype, layoutName, mapping);
        } else if (mode === 'ai-style') {
            const baseComponents = generateStandardComponents(selectedSitetype, layoutName, mapping);
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const stylePrompt = `Genereer CSS voor type ${selectedSitetype}. Prefs: ${preferences}. Output CSS only.`;
                const result = await model.generateContent(stylePrompt);
                const response = await result.response;
                
                const parts = response.candidates?.[0]?.content?.parts || [];
                const textPart = parts.find(p => p.text);
                const text = textPart ? textPart.text : (response.text ? response.text() : "");
                
                const aiCss = text.replace(/```css/g, '').replace(/```/g, '').trim();
                components = { ...baseComponents, "index.css": aiCss };
            } catch (e) { components = baseComponents; }
        } else {
            components = await generateComponents(selectedSitetype, layoutName, mapping, blueprint, preferences);
        }

        if (components) {
            const layoutsDir = path.join(siteTypesDir, selectedSitetype, 'web');
            const targetDir = path.join(layoutsDir, layoutName);
            await fs.mkdir(path.join(targetDir, 'components'), { recursive: true });

            await fs.writeFile(path.join(targetDir, 'App.jsx'), components['App.jsx'] || '');
            await fs.writeFile(path.join(targetDir, 'index.css'), components['index.css'] || '');
            await fs.writeFile(path.join(targetDir, 'components', 'Header.jsx'), components['Header.jsx'] || (components.components ? components.components['Header.jsx'] : ''));
            await fs.writeFile(path.join(targetDir, 'components', 'Section.jsx'), components['Section.jsx'] || (components.components ? components.components['Section.jsx'] : ''));

            // Voor SPA tracks, voeg main.jsx toe indien nodig
            if (selectedSitetype.startsWith('docked') && !existsSync(path.join(targetDir, 'main.jsx'))) {
                const boilerplateMain = await fs.readFile(path.join(root, '2-templates/boilerplate/docked/main.jsx'), 'utf8');
                await fs.writeFile(path.join(targetDir, 'main.jsx'), boilerplateMain);
            }
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: "AI generatie mislukt." });
        }
    });

    app.listen(port, () => {
        console.log(`\n🌍 Visual Editor running on http://localhost:${port}`);
    });
}

startVisualizer();
