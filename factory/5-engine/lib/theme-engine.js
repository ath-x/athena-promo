/**
 * @file theme-engine.js
 * @description Generates style_config.json from blueprint design_system.
 * Maps design_system tokens to CSS custom properties.
 */

const DEFAULT_THEME = {
    '--color-primary': '#0f172a',
    '--color-secondary': '#64748b',
    '--color-accent': '#3b82f6',
    '--color-button-bg': '#3b82f6',
    '--color-card-bg': '#ffffff',
    '--color-header-bg': '#ffffff',
    '--color-background': '#ffffff',
    '--color-surface': '#f8fafc',
    '--color-text': '#1e293b',
    '--color-heading': '#0f172a',
    '--color-title': '#0f172a',
    '--font-sans': "'Inter', ui-sans-serif, system-ui, sans-serif",
    '--font-serif': "'Playfair Display', ui-serif, Georgia, serif",
    '--radius-custom': '1rem',
    '--shadow-main': '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
};

/**
 * Color key mapping: design_system.colors.X → CSS variable
 */
const COLOR_MAP = {
    primary: '--color-primary',
    secondary: '--color-secondary',
    accent: '--color-accent',
    background: '--color-background',
    surface: '--color-surface',
    text: '--color-text',
    heading: '--color-heading',
    title: '--color-title',
    button_bg: '--color-button-bg',
    card_bg: '--color-card-bg',
    header_bg: '--color-header-bg'
};

export class ThemeEngine {

    /**
     * Converts hex to RGB components for Tailwind v4 opacity support.
     * @param {string} hex 
     * @returns {string} e.g. "15 23 42"
     */
    static hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return "0 0 0";
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return isNaN(r) ? "0 0 0" : `${r} ${g} ${b}`;
    }

    /**
     * Returns sensible defaults.
     */
    static getDefaults() {
        const config = { ...DEFAULT_THEME };
        // Add RGB variants for defaults
        Object.entries(config).forEach(([key, val]) => {
            if (key.startsWith('--color-') && val.startsWith('#')) {
                config[`${key}-rgb`] = ThemeEngine.hexToRgb(val);
            }
        });
        return config;
    }

    /**
     * Generates a style_config.json object from a blueprint's design_system.
     * @param {Object} blueprint - The full blueprint object.
     * @returns {Object} CSS variable map
     */
    static generate(blueprint) {
        const ds = blueprint?.design_system;
        if (!ds) return ThemeEngine.getDefaults();

        const config = { ...DEFAULT_THEME };

        // Process colors
        if (ds.colors && typeof ds.colors === 'object') {
            for (const [key, value] of Object.entries(ds.colors)) {
                const cssVar = COLOR_MAP[key] || `--color-${key}`;
                config[cssVar] = value;
                // Add RGB variant for Tailwind / opacity usage
                if (value.startsWith('#')) {
                    config[`${cssVar}-rgb`] = ThemeEngine.hexToRgb(value);
                }
            }

            // Derive logic
            if (ds.colors.primary && !ds.colors.heading) {
                config['--color-heading'] = ds.colors.primary;
                config['--color-heading-rgb'] = ThemeEngine.hexToRgb(ds.colors.primary);
            }
            if (ds.colors.primary && !ds.colors.title) {
                config['--color-title'] = ds.colors.primary;
                config['--color-title-rgb'] = ThemeEngine.hexToRgb(ds.colors.primary);
            }
            if (ds.colors.accent && !ds.colors.button_bg) {
                config['--color-button-bg'] = ds.colors.accent;
                config['--color-button-bg-rgb'] = ThemeEngine.hexToRgb(ds.colors.accent);
            }
        }

        // Dark mode overrides (if defined in blueprint)
        if (ds.dark_mode && typeof ds.dark_mode === 'object') {
            config['_dark_mode'] = {};
            for (const [key, value] of Object.entries(ds.dark_mode)) {
                const cssVar = COLOR_MAP[key] || `--color-${key}`;
                config['_dark_mode'][cssVar] = value;
                if (value.startsWith('#')) {
                    config['_dark_mode'][`${cssVar}-rgb`] = ThemeEngine.hexToRgb(value);
                }
            }
        }

        // Typography & Radius
        if (ds.font_sans) config['--font-sans'] = ds.font_sans;
        if (ds.font_serif) config['--font-serif'] = ds.font_serif;
        if (ds.radius) config['--radius-custom'] = ds.radius;

        return config;
    }
}
