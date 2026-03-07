import { google } from 'googleapis';
import fs from 'fs';

async function inspectSheetContent() {
  console.log("🔍 Inspecting Google Sheet content for 'De Schaar'...");
  const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1HrOUhMWGmY2A_eqsyMmBid1ChWNxtVA9TBwFPVNLxPk';

  const tabsToInspect = [
    '_system',
    'header',
    'hero',
    'footer',
    'paginastructuur',
    'teamleden'
  ];

  try {
    for (const tab of tabsToInspect) {
      console.log(`\n--- 📄 Tab: ${tab} ---`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tab}!A1:E5`, // Just first 5 columns and 5 rows for overview
      });
      const rows = response.data.values;
      if (rows && rows.length > 0) {
        rows.forEach((row, i) => {
          console.log(`${i + 1}: ${row.join(' | ')}`);
        });
      } else {
        console.log("⚠️ Geen data gevonden of tabblad leeg.");
      }
    }
  } catch (err) {
    console.error("❌ Error reading content:", err.message);
  }
}

inspectSheetContent();
