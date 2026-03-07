import { google } from 'googleapis';
import fs from 'fs';

async function test() {
  console.log("Checking service-account.json...");
  if (!fs.existsSync('service-account.json')) {
    console.log("File NOT found!");
    return;
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  console.log("Auth initialized. Getting token...");
  const client = await auth.getClient();
  console.log("Client created. Email: " + client.email);
}
test();
