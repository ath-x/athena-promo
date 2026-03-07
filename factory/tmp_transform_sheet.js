import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

console.log("🔍 INIT: Google Auth...");
const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1HrOUhMWGmY2A_eqsyMmBid1ChWNxtVA9TBwFPVNLxPk';

const TAB_REMAP = {
  '_System': '_system',
  'site_settings': 'header',
  'hero': 'hero',
  'locaties': 'locatie',
  'stylist_gradatie': 'stylist_gradatie',
  'teamleden': 'team',
  'diensten_tarieven': 'tarieven',
  'testimonials': 'testimonials',
  'aveda_informatie': 'aveda',
  'basis': 'footer',
  'paginastructuur': 'paginastructuur',
  'section_settings': 'section_settings'
};

async function transformSheet() {
  console.log("💎 TRANSFORM START: Connecting to Sheet...");

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    console.log("📅 Metadata found. Processing sheets...");
    const sheetsList = meta.data.sheets;
    const requests = [];

    sheetsList.forEach(s => {
      const oldName = s.properties.title;
      const newName = TAB_REMAP[oldName];
      if (newName && oldName !== newName) {
        console.log(`♻️ Queueing Rename: ${oldName} -> ${newName}`);
        requests.push({
          updateSheetProperties: {
            properties: { 
              sheetId: s.properties.sheetId, 
              title: newName 
            },
            fields: 'title'
          }
        });
      }
    });

    if (requests.length > 0) {
      console.log(`🚀 BATCH UPDATE in progress (${requests.length} renames)...`);
      await sheets.spreadsheets.batchUpdate({ 
        spreadsheetId, 
        requestBody: { requests } 
      });
      console.log("✅ Tabbladen succesvol hernoemd.");
    } else {
      console.log("ℹ️ Geen tabbladen hoefden hernoemd te worden.");
    }

    const finalMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const resultMapping = {};
    finalMeta.data.sheets.forEach(s => {
      resultMapping[s.properties.title] = s.properties.sheetId;
    });

    console.log("\n✨ Finale GID mapping voor url-sheet.json:");
    console.log(JSON.stringify(resultMapping, null, 2));

  } catch (err) {
    console.error("❌ TRANSFORM ERROR:", err.message);
  }
}

transformSheet();
