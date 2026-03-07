/**
 * MASTER PROXY SCRIPT v2.2 (Universal Translator)
 * Handelt zowel Monorepo Deploys als Legacy site-deploys af.
 */
function doPost(e) {
  const GITHUB_PAT = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
  const params = JSON.parse(e.postData.contents);
  const action = params.action;
  const secret_key = params.secret_key;
  
  // Beveiliging
  if (secret_key !== "KIES_HIER_EEN_EIGEN_WACHTWOORD") {
    return ContentService.createTextOutput("Verboden: Ongeldige sleutel").setMimeType(ContentService.MimeType.TEXT);
  }

  // Dynamische velden (ondersteunt legacy 'repo' en nieuwe 'github_repo_name')
  const user = params.github_user || params.user || "athenacmsfactory";
  const repo = params.github_repo_name || params.repo;
  const siteId = params.site || repo; 

  // ACTIE: DEPLOY
  if (action === "deploy") {
    // We mikken standaard op dé Monorepo
    const monorepoUser = params.monorepo_user || "athenacmsfactory";
    const monorepoName = params.monorepo_name || "athena-x";

    const url = `https://api.github.com/repos/${monorepoUser}/${monorepoName}/dispatches`;
    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + GITHUB_PAT,
        "Accept": "application/vnd.github.v3+json"
      },
      payload: JSON.stringify({ 
        event_type: "publish_from_sheet", 
        client_payload: {
          site: siteId 
        }
      })
    };

    try {
      UrlFetchApp.fetch(url, options);
      // BELANGRIJK: We gebruiken "Build gestart" voor compatibility met OUDE scripts in honderden sheets
      return ContentService.createTextOutput("Build gestart (Monorepo Sync: " + siteId + ")").setMimeType(ContentService.MimeType.TEXT);
    } catch(err) {
      return ContentService.createTextOutput("Fout bij trigger: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
    }
  }

  // ACTIE: UPLOAD (Afbeeldingen)
  if (action === "upload") {
    const { filename, content } = params; 
    // Uploads gaan nog direct naar de site-repo (of monorepo afhankelijk van config)
    const url = `https://api.github.com/repos/${user}/${repo}/contents/public/images/${filename}`;
    
    let sha = null;
    try {
      const checkRes = UrlFetchApp.fetch(url, {
        headers: { "Authorization": "Bearer " + GITHUB_PAT }
      });
      sha = JSON.parse(checkRes.getContentText()).sha;
    } catch(err) { }

    const payload = {
      message: `Media Upload: ${filename}`,
      content: content,
      branch: "main"
    };
    if (sha) payload.sha = sha;

    const options = {
      method: "put",
      headers: {
        "Authorization": "Bearer " + GITHUB_PAT,
        "Accept": "application/vnd.github.v3+json"
      },
      payload: JSON.stringify(payload)
    };

    try {
      UrlFetchApp.fetch(url, options);
      return ContentService.createTextOutput("Upload succesvol").setMimeType(ContentService.MimeType.TEXT);
    } catch(err) {
      return ContentService.createTextOutput("Fout bij upload: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
    }
  }

  return ContentService.createTextOutput("Onbekende actie: " + action).setMimeType(ContentService.MimeType.TEXT);
}