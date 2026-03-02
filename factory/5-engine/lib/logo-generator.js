import fs from 'fs';
import path from 'path';

/**
 * Athena Randomized Logo Generator
 * Generates a unique SVG logo based on site name and color.
 */
export class LogoGenerator {
    static generate(siteName, primaryColor = '#3b82f6') {
        const firstLetter = (siteName || 'A').charAt(0).toUpperCase();
        const secondLetter = (siteName || '').length > 1 ? siteName.charAt(1).toUpperCase() : '';
        
        // Pick a random style (1-4)
        const style = Math.floor(Math.random() * 4) + 1;
        
        let svgContent = '';
        const viewBox = "0 0 100 100";
        
        if (style === 1) {
            // Minimalist Square
            svgContent = `
                <rect x="10" y="10" width="80" height="80" rx="15" fill="${primaryColor}" fill-opacity="0.1" stroke="${primaryColor}" stroke-width="4"/>
                <text x="50" y="65" font-family="serif" font-size="50" font-weight="bold" fill="${primaryColor}" text-anchor="middle">${firstLetter}</text>
            `;
        } else if (style === 2) {
            // Modern Circle
            svgContent = `
                <circle cx="50" cy="50" r="45" fill="${primaryColor}"/>
                <text x="50" y="68" font-family="sans-serif" font-size="55" font-weight="900" fill="white" text-anchor="middle">${firstLetter}</text>
            `;
        } else if (style === 3) {
            // Abstract Hexagon
            svgContent = `
                <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="none" stroke="${primaryColor}" stroke-width="6"/>
                <text x="50" y="62" font-family="monospace" font-size="40" font-weight="bold" fill="${primaryColor}" text-anchor="middle">${firstLetter}${secondLetter}</text>
            `;
        } else {
            // Badge Style
            svgContent = `
                <rect x="5" y="25" width="90" height="50" rx="5" fill="${primaryColor}"/>
                <text x="50" y="60" font-family="sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="2">${siteName.substring(0, 3).toUpperCase()}</text>
            `;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${svgContent}</svg>`;
    }

    static saveToProject(projectDir, siteName, primaryColor) {
        const svg = this.generate(siteName, primaryColor);
        const publicDir = path.join(projectDir, 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        
        const logoPath = path.join(publicDir, 'site-logo.svg');
        fs.writeFileSync(logoPath, svg);
        console.log(`🎨 Logo Generator: Created unique logo for ${siteName} at ${logoPath}`);
        return 'site-logo.svg';
    }
}
