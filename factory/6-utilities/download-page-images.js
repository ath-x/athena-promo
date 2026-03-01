/**
 * download-page-images.js
 *
 * Download alle afbeeldingen van een HTML-pagina (lokaal bestand of URL).
 *
 * Gebruik:
 *   node download-page-images.js <html-bestand-of-url> [output-map]
 *
 * Voorbeelden:
 *   node download-page-images.js ./dist/index.html ./downloads
 *   node download-page-images.js https://example.com ./downloads
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// ─── Argumenten ───────────────────────────────────────────────────────────────

const [,, input, outputDir = './downloaded-images'] = process.argv;

if (!input) {
    console.error('Gebruik: node download-page-images.js <html-bestand-of-url> [output-map]');
    process.exit(1);
}

const isUrl = /^https?:\/\//i.test(input);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 120);
}

function resolveUrl(src, base) {
    if (!src || src.startsWith('data:')) return null;
    try {
        return new URL(src, base).href;
    } catch {
        return null;
    }
}

function getFilenameFromUrl(urlStr) {
    try {
        const u = new URL(urlStr);
        const basename = path.basename(u.pathname) || 'image';
        const ext = path.extname(basename);
        const name = ext ? basename : basename + '.jpg';
        return sanitizeFilename(name);
    } catch {
        return 'image_' + Date.now() + '.jpg';
    }
}

function downloadFile(urlStr, destPath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(destPath)) {
            console.log(`  ⏭  bestaat al: ${path.basename(destPath)}`);
            return resolve('exists');
        }

        // Lokaal bestand (file://) direct kopiëren
        if (urlStr.startsWith('file://')) {
            try {
                const localPath = decodeURIComponent(urlStr.replace('file://', ''));
                if (!fs.existsSync(localPath)) {
                    return reject(new Error(`Lokaal bestand niet gevonden: ${localPath}`));
                }
                fs.copyFileSync(localPath, destPath);
                return resolve('downloaded');
            } catch (err) {
                return reject(err);
            }
        }

        const protocol = urlStr.startsWith('https') ? https : http;
        const agent = new (urlStr.startsWith('https') ? https : http).Agent({
            rejectUnauthorized: false  // tolerant voor self-signed certs
        });

        const request = protocol.get(urlStr, { agent }, (res) => {
            // Volg redirects (max 5)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                downloadFile(new URL(res.headers.location, urlStr).href, destPath)
                    .then(resolve).catch(reject);
                return;
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} voor ${urlStr}`));
                return;
            }

            const contentType = res.headers['content-type'] || '';
            if (!contentType.startsWith('image/') && !contentType.startsWith('application/octet')) {
                reject(new Error(`Geen afbeelding (${contentType}): ${urlStr}`));
                return;
            }

            const file = fs.createWriteStream(destPath);
            res.pipe(file);
            file.on('finish', () => file.close(() => resolve('downloaded')));
            file.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
        });

        request.on('error', reject);
        request.setTimeout(15000, () => { request.destroy(); reject(new Error('Timeout: ' + urlStr)); });
    });
}

// ─── HTML ophalen ─────────────────────────────────────────────────────────────

async function fetchHtml(source) {
    if (!isUrl) {
        // Lokaal bestand
        const absPath = path.resolve(source);
        if (!fs.existsSync(absPath)) throw new Error(`Bestand niet gevonden: ${absPath}`);
        const dir = path.dirname(absPath);
        return {
            html: fs.readFileSync(absPath, 'utf8'),
            base: 'file://' + absPath,
            docRoot: dir   // map van het HTML-bestand = web-root voor /absolute/paden
        };
    }

    // Remote URL via ingebouwde fetch (Node.js 18+)
    const res = await fetch(source);
    if (!res.ok) throw new Error(`HTTP ${res.status} bij ophalen pagina`);
    return { html: await res.text(), base: source, docRoot: null };
}

// ─── Afbeeldingen extraheren uit HTML ─────────────────────────────────────────

function extractImageUrls(html, base, docRoot = null) {
    const found = new Set();

    const add = (src) => {
        src = src?.trim();
        if (!src) return;

        // Lokaal bestand + absoluut pad → resolve vanuit de HTML-map (web-root)
        if (docRoot && src.startsWith('/') && !src.startsWith('//')) {
            found.add('file://' + path.join(docRoot, src));
            return;
        }

        const resolved = resolveUrl(src, base);
        if (resolved) found.add(resolved);
    };

    // <img src="..."> en <img srcset="...">
    for (const m of html.matchAll(/<img[^>]+>/gi)) {
        const tag = m[0];
        const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
        if (src) add(src);

        // srcset: "url1 1x, url2 2x"
        const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1];
        if (srcset) {
            for (const part of srcset.split(',')) {
                const url = part.trim().split(/\s+/)[0];
                if (url) add(url);
            }
        }
    }

    // <source srcset="..."> (picture element)
    for (const m of html.matchAll(/<source[^>]+srcset=["']([^"']+)["']/gi)) {
        for (const part of m[1].split(',')) {
            const url = part.trim().split(/\s+/)[0];
            if (url) add(url);
        }
    }

    // <meta property="og:image" content="...">
    for (const m of html.matchAll(/<meta[^>]+(?:og:image|twitter:image)[^>]+content=["']([^"']+)["']/gi)) {
        add(m[1]);
    }
    for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:og:image|twitter:image)/gi)) {
        add(m[1]);
    }

    // CSS background-image: url(...)
    for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/gi)) {
        add(m[1]);
    }

    // <link rel="icon" href="...">
    for (const m of html.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/gi)) {
        add(m[1]);
    }

    // Inline style="background-image: url(...)"
    for (const m of html.matchAll(/style=["'][^"']*background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/gi)) {
        add(m[1]);
    }

    return [...found];
}

// ─── Conflictvrije bestandsnaam genereren ─────────────────────────────────────

function uniquePath(dir, filename) {
    let dest = path.join(dir, filename);
    if (!fs.existsSync(dest)) return dest;

    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    let i = 2;
    while (fs.existsSync(dest)) {
        dest = path.join(dir, `${base}_${i}${ext}`);
        i++;
    }
    return dest;
}

// ─── Hoofdprogramma ───────────────────────────────────────────────────────────

async function main() {
    console.log(`\n📥  Download afbeeldingen van: ${input}`);

    // Output map aanmaken
    const outDir = path.resolve(outputDir);
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`📁  Output map: ${outDir}\n`);

    // HTML ophalen
    let html, base;
    try {
        ({ html, base } = await fetchHtml(input));
    } catch (err) {
        console.error('❌  HTML ophalen mislukt:', err.message);
        process.exit(1);
    }

    // URLs extraheren
    const urls = extractImageUrls(html, base, base.startsWith('file://') ? base.replace('file://', '').replace(/\/[^/]+$/, '') : null);
    console.log(`🔍  Gevonden afbeeldingen: ${urls.length}\n`);

    if (urls.length === 0) {
        console.log('Geen afbeeldingen gevonden.');
        return;
    }

    // Downloaden
    let ok = 0, skip = 0, fail = 0;
    const usedNames = new Map(); // url -> bestandsnaam

    for (const [i, url] of urls.entries()) {
        const nr = String(i + 1).padStart(3, '0');
        const filename = getFilenameFromUrl(url);
        const destPath = uniquePath(outDir, filename);
        usedNames.set(url, path.basename(destPath));

        process.stdout.write(`  [${nr}/${urls.length}] ${filename} ... `);

        try {
            const result = await downloadFile(url, destPath);
            if (result === 'exists') {
                skip++;
                // bericht al geprint in downloadFile
            } else {
                const size = fs.statSync(destPath).size;
                console.log(`✅  ${(size / 1024).toFixed(1)} KB`);
                ok++;
            }
        } catch (err) {
            console.log(`❌  ${err.message}`);
            fail++;
        }
    }

    console.log(`\n─────────────────────────────────────────`);
    console.log(`✅  Gedownload : ${ok}`);
    console.log(`⏭  Al aanwezig: ${skip}`);
    console.log(`❌  Mislukt    : ${fail}`);
    console.log(`📁  Locatie    : ${outDir}`);
    console.log(`─────────────────────────────────────────\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
