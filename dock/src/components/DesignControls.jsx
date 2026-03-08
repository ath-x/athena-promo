import React, { useState, useCallback, useEffect, useRef } from 'react';

/**
 * DesignControls for Athena Dock
 * Sidebar component for live color editing via PostMessage
 */
export default function DesignControls({ onColorChange, siteStructure }) {
  // Lock mechanism to prevent slider jump-back
  const lastInteractionTime = useRef(0);

  const [localColors, setLocalColors] = useState({});

  // Dedicated local state for high-frequency sliders to prevent jump-back
  const [sliderValues, setSliderValues] = useState({
    content_top_offset: 0,
    header_height: 80
  });

  // Sync met de werkelijke data van de site bij het laden of switchen
  useEffect(() => {
    // LOCK: Als we net handmatig iets hebben aangepast, negeren we de inkomende sync even
    if (Date.now() - lastInteractionTime.current < 2000) return;

    const headerSettings = Array.isArray(siteStructure?.data?.header_settings) 
      ? siteStructure.data.header_settings[0] 
      : (siteStructure?.data?.header_settings || {});
      
    const siteSettings = Array.isArray(siteStructure?.data?.site_settings) 
      ? siteStructure.data.site_settings[0] 
      : (siteStructure?.data?.site_settings || {});

    const styleConfig = siteStructure?.data?.style_config || {};

    const settings = { ...siteSettings, ...headerSettings, ...styleConfig };

    if (Object.keys(settings).length > 0) {
      console.log("🎨 Loading site settings into Design Editor:", settings);

      setLocalColors(prev => ({
        ...prev,
        ...settings
      }));

      // Sync decoupled slider values
      setSliderValues({
        content_top_offset: settings.content_top_offset || 0,
        header_height: settings.header_hoogte || settings.header_height || 80
      });
    }
  }, [siteStructure]);

  // Preview mode (live in iframe)
  const handlePreview = (key, value) => {
    lastInteractionTime.current = Date.now(); // LOCK ACTIVEREN

    // Update decoupled state immediately for smoothness
    if (key === 'content_top_offset' || key === 'header_hoogte') {
      const sliderKey = key === 'header_hoogte' ? 'header_height' : key;
      setSliderValues(prev => ({ ...prev, [sliderKey]: value }));
    }

    // Update local colors for the pickers
    setLocalColors(prev => ({ ...prev, [key]: value }));

    // Send to iframe
    onColorChange(key, value, false);

    // If it's a color, also generate and send the RGB variant for live preview
    if (value && typeof value === 'string' && value.startsWith('#')) {
      const rgb = hexToRgb(value);
      const cssVar = key.replace('light_', '--color-').replace('dark_', '--color-').replace('_color', '');
      onColorChange(`${cssVar}-rgb`, rgb, false);
    }
  };

  // Save mode (persistent)
  const handleSave = (key, value) => {
    lastInteractionTime.current = Date.now(); // LOCK ACTIVEREN
    
    // Update local state
    setLocalColors(prev => ({ ...prev, [key]: value }));
    
    // Trigger persistent save in DockFrame
    onColorChange(key, value, true);
    
    // Also save RGB variant if color
    if (value && typeof value === 'string' && value.startsWith('#')) {
      const rgb = hexToRgb(value);
      const cssVar = key.replace('light_', '--color-').replace('dark_', '--color-').replace('_color', '');
      onColorChange(`${cssVar}-rgb`, rgb, true);
    }
  };

  const handleStyleChange = async (styleName) => {
    if (!window.confirm(`Weet je zeker dat je wilt wisselen naar ${styleName}? Dit herlaadt de site.`)) return;
    const rawUrl = siteStructure?.url || window.location.origin;
    const siteName = rawUrl.split('/')[3] || 'dock-test-site';
    const baseUrl = rawUrl.split('/' + siteName)[0];
    const url = `${baseUrl}/${siteName}/__athena/update-json`;
    try {
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'swap-style', value: styleName }) });
      const iframe = document.querySelector('iframe');
      if (iframe) iframe.contentWindow.postMessage({ type: 'DOCK_SWAP_STYLE', value: styleName }, '*');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Design Editor</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Live design updates via Dock</p>
      </div>

      <div className="space-y-8">
        {/* GLOBAL STYLE DROPDOWN */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-3">Global Theme Stijl</label>
          <select
            onChange={(e) => handleStyleChange(e.target.value)}
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1rem'
            }}
            defaultValue=""
          >
            <option value="" disabled>Selecteer een stijl...</option>
            {['modern.css', 'classic.css', 'modern-dark.css', 'bold.css', 'corporate.css', 'warm.css'].map(style => (
              <option key={style} value={style}>
                🎨 {style.replace('.css', '').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* HEADER CONTROLS */}
        <div>
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-4 border-b border-blue-50 pb-2 flex items-center gap-2">
            <i className="fa-solid fa-window-maximize"></i> Header & Layout
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold uppercase text-slate-400">Zichtbaar</label>
              <input
                type="checkbox"
                checked={(localColors.header_zichtbaar !== false && localColors.header_visible !== false)}
                onChange={(e) => { handlePreview('header_zichtbaar', e.target.checked); handleSave('header_zichtbaar', e.target.checked); }}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block">Header Transparantie</label>
                <span className="text-[9px] font-bold text-blue-500">{Math.round((parseFloat(localColors.header_transparantie || localColors.header_transparent) || 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localColors.header_transparantie || localColors.header_transparent || 0}
                onInput={(e) => handlePreview('header_transparantie', e.target.value)}
                onChange={(e) => handleSave('header_transparantie', e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block">Header Hoogte</label>
                <span className="text-[9px] font-bold text-blue-500">{sliderValues.header_height}px</span>
              </div>
              <input
                type="range"
                min="40"
                max="250"
                step="1"
                value={sliderValues.header_height}
                onInput={(e) => handlePreview('header_hoogte', e.target.value)}
                onChange={(e) => handleSave('header_hoogte', e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block">Content Top Offset</label>
                <span className="text-[9px] font-bold text-blue-500">{sliderValues.content_top_offset}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={sliderValues.content_top_offset}
                onInput={(e) => handlePreview('content_top_offset', e.target.value)}
                onChange={(e) => handleSave('content_top_offset', e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Toggle label="Logo" settingsKey="toon_logo" value={localColors.toon_logo ?? localColors.header_show_logo} onPreview={handlePreview} onSave={handleSave} />
              <Toggle label="Titel" settingsKey="toon_titel" value={localColors.toon_titel ?? localColors.header_show_title} onPreview={handlePreview} onSave={handleSave} />
              <Toggle label="Ondertitel" settingsKey="toon_ondertitel" value={localColors.toon_ondertitel ?? localColors.header_show_tagline} onPreview={handlePreview} onSave={handleSave} />
              <Toggle label="CTA Knop" settingsKey="toon_cta_knop" value={localColors.toon_cta_knop ?? localColors.header_show_button} onPreview={handlePreview} onSave={handleSave} />
              <Toggle label="Navigatie" settingsKey="toon_navigatie" value={localColors.toon_navigatie ?? localColors.header_show_navbar} onPreview={handlePreview} onSave={handleSave} />
            </div>
          </div>
        </div>

        {/* HERO CONTROLS */}
        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <i className="fa-solid fa-rocket text-accent"></i> Hero Controls
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block">Hero Overlay Transparantie</label>
                <span className="text-[9px] font-bold text-blue-500">{((parseFloat(localColors.hero_overlay_transparantie || localColors.hero_overlay_opacity) ?? 0.8) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localColors.hero_overlay_transparantie || localColors.hero_overlay_opacity || 0.8}
                onInput={(e) => handlePreview('hero_overlay_transparantie', e.target.value)}
                onChange={(e) => handleSave('hero_overlay_transparantie', e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Hero Min Hoogte</label>
              <input
                type="text"
                value={localColors.hero_hoogte || localColors.hero_height || '85vh'}
                onChange={(e) => { handlePreview('hero_hoogte', e.target.value); handleSave('hero_hoogte', e.target.value); }}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* PREVIEW THEME TOGGLE */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-3">Preview Mode</label>
          <div className="flex bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => { handlePreview('theme', 'light'); handleSave('theme', 'light'); }}
              className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${localColors.theme !== 'dark' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              Light
            </button>
            <button
              onClick={() => { handlePreview('theme', 'dark'); handleSave('theme', 'dark'); }}
              className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${localColors.theme === 'dark' ? 'bg-slate-800 shadow-sm text-white' : 'text-slate-400'}`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* LIGHT MODE COLORS */}
        <div>
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-4 border-b border-blue-50 pb-2">
            Light Mode Colors
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Title (H1)" settingsKey="light_title_color" value={localColors['light_title_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Primary" settingsKey="light_primary_color" value={localColors['light_primary_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Section Header" settingsKey="light_heading_color" value={localColors['light_heading_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Accent" settingsKey="light_accent_color" value={localColors['light_accent_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Button BG" settingsKey="light_button_color" value={localColors['light_button_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Card BG" settingsKey="light_card_color" value={localColors['light_card_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Header BG" settingsKey="light_header_color" value={localColors['light_header_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Footer BG" settingsKey="light_footer_color" value={localColors['light_footer_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Hero BG" settingsKey="light_hero_bg_color" value={localColors['light_hero_bg_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Background" settingsKey="light_bg_color" value={localColors['light_bg_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Text" settingsKey="light_text_color" value={localColors['light_text_color']} onPreview={handlePreview} onSave={handleSave} />
          </div>
        </div>

        {/* DARK MODE COLORS */}
        <div>
          <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-tighter mb-4 border-b border-purple-50 pb-2">
            Dark Mode Colors
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Title (H1)" settingsKey="dark_title_color" value={localColors['dark_title_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Primary" settingsKey="dark_primary_color" value={localColors['dark_primary_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Section Header" settingsKey="dark_heading_color" value={localColors['dark_heading_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Accent" settingsKey="dark_accent_color" value={localColors['dark_accent_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Button BG" settingsKey="dark_button_color" value={localColors['dark_button_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Card BG" settingsKey="dark_card_color" value={localColors['dark_card_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Header BG" settingsKey="dark_header_color" value={localColors['dark_header_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Footer BG" settingsKey="dark_footer_color" value={localColors['dark_footer_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Hero BG" settingsKey="dark_hero_bg_color" value={localColors['dark_hero_bg_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Background" settingsKey="dark_bg_color" value={localColors['dark_bg_color']} onPreview={handlePreview} onSave={handleSave} />
            <ColorPicker label="Text" settingsKey="dark_text_color" value={localColors['dark_text_color']} onPreview={handlePreview} onSave={handleSave} />
          </div>
        </div>

        {/* GLOBAL THEME SETTINGS (RADIUS/SHADOW) */}
        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <i className="fa-solid fa-sliders text-blue-500"></i> Global Theme Settings
          </h4>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Corner Radius</label>
              <select
                value={localColors.global_radius}
                onChange={(e) => { handlePreview('global_radius', e.target.value); handleSave('global_radius', e.target.value); }}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
              >
                <option value="0px">Sharp (0px)</option>
                <option value="0.5rem">Rounded (8px)</option>
                <option value="1rem">Modern (16px)</option>
                <option value="2rem">Pill (32px)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Shadow Intensity</label>
              <select
                value={localColors.global_shadow}
                onChange={(e) => { handlePreview('global_shadow', e.target.value); handleSave('global_shadow', e.target.value); }}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
              >
                <option value="none">Flat</option>
                <option value="soft">Soft</option>
                <option value="strong">Deep</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[9px] text-slate-400 italic leading-tight border-t border-slate-100 pt-4">
        Changes are sent to the docked site via PostMessage
      </p>
    </div>
  );
}

const ColorPicker = ({ label, settingsKey, value, onPreview, onSave }) => (
  <div className="flex-1">
    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">{label}</label>
    <input
      type="color"
      value={value || '#000000'}
      onInput={(e) => onPreview(settingsKey, e.target.value)}
      onChange={(e) => onSave(settingsKey, e.target.value)}
      className="w-full h-8 rounded-lg cursor-pointer border border-slate-200 bg-transparent overflow-hidden"
    />
  </div>
);

const Toggle = ({ label, settingsKey, value, onPreview, onSave }) => (
  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
    <label className="text-[8px] font-bold uppercase text-slate-500">{label}</label>
    <input
      type="checkbox"
      checked={value !== false}
      onChange={(e) => { onPreview(settingsKey, e.target.checked); onSave(settingsKey, e.target.checked); }}
      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
    />
  </div>
);
