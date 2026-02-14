/**
 * Gateway.js
 * @description The entry point for external communication (Mail/Webhook).
 * Routes natural language requests from customers to the Athena Agent logic.
 */

import fs from 'fs';
import path from 'path';
import { SiteController } from '../controllers/SiteController.js';
import { AthenaConfigManager } from './ConfigManager.js';

export class AthenaGateway {
    constructor(root) {
        this.root = root;
        this.config = new AthenaConfigManager(root);
        this.siteCtrl = new SiteController(this.config);
        this.inboxPath = path.join(root, 'input/gateway_inbox.json');
    }

    /**
     * Process an incoming request (from mail or file)
     */
    async processRequest(request) {
        const { customerEmail, projectName, message } = request;
        
        console.log(`📩 Gateway ontvangen bericht van ${customerEmail} voor project ${projectName}`);
        console.log(`💬 Bericht: "${message}"`);

        try {
            // De SiteController gebruikt de Interpreter om dit af te handelen
            const result = await this.siteCtrl.updateFromInstruction(projectName, message);
            
            return {
                success: true,
                reply: `Beste klant, ik heb je verzoek verwerkt! 
                        De volgende wijzigingen zijn doorgevoerd:
                        ${result.patches.map(p => `- ${p.key} in ${p.file} is nu "${p.value}"`).join('
')}
                        
                        De wijzigingen zijn ook direct bijgewerkt in je Google Sheet.`,
                details: result
            };
        } catch (e) {
            return {
                success: false,
                reply: `Excuses, ik kon je verzoek niet automatisch verwerken. Foutmelding: ${e.message}`,
                error: e.message
            };
        }
    }

    /**
     * A simple watcher that polls a file (for simulation/testing)
     */
    watchInbox() {
        console.log("👀 Gateway is aan het wachten op berichten in input/gateway_inbox.json...");
        
        fs.watchFile(this.inboxPath, async (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                try {
                    const content = fs.readFileSync(this.inboxPath, 'utf8');
                    if (!content.trim()) return;
                    
                    const request = JSON.parse(content);
                    const response = await this.processRequest(request);
                    
                    console.log("📤 Gateway antwoord:", response.reply);
                    
                    // Leeg de inbox na verwerking
                    fs.writeFileSync(this.inboxPath, "");
                } catch (e) {
                    console.error("❌ Gateway verwerkingsfout:", e.message);
                }
            }
        });
    }
}
