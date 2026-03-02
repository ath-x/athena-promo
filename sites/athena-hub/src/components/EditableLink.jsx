import React from 'react';

/**
 * EditableLink (v32 - Sibling Discovery)
 * Automatically finds related URL fields when the primary binding is just a label string.
 */
export default function EditableLink({ 
  url, 
  label,
  children,
  className = "",
  cmsBind, 
  table, 
  field, 
  id, 
  as: Tag = 'a',
  data, // We voegen de volledige data-set toe voor discovery
  ...props 
}) {
  const isDev = import.meta.env.DEV;
  const binding = cmsBind || { file: table, index: id, key: field };

  // 1. Resolve Link & Label
  let finalLabel = label;
  let finalUrl = url;

  // Discovery Logic: Als de URL ontbreekt, zoek in de data-bron
  if (!finalUrl && isDev) {
    const dataSource = window.athenaData?.[binding.file];
    if (dataSource) {
      const row = Array.isArray(dataSource) ? dataSource[binding.index || 0] : dataSource;
      // Zoek naar sleutels zoals 'cta_url' of 'header_cta_url'
      const urlKey = `${binding.key}_url`;
      if (row && row[urlKey]) {
        finalUrl = row[urlKey];
      }
    }
  }

  if (typeof url === 'object' && url !== null) {
    finalLabel = url.label || finalLabel;
    finalUrl = url.url || url;
  }
  
  if (typeof label === 'object' && label !== null) {
    finalUrl = label.url || finalUrl;
    finalLabel = label.label || finalLabel;
  }

  const actualUrl = (finalUrl && typeof finalUrl === 'string' && !finalUrl.startsWith('http') && !finalUrl.startsWith('/') && !finalUrl.startsWith('#'))
    ? `${import.meta.env.BASE_URL}${finalUrl}`.replace(/\/+/g, '/')
    : finalUrl;

  const content = finalLabel || children || (typeof actualUrl === 'string' ? actualUrl : "Link");

  const handleLinkAction = (e) => {
    if (isDev && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      console.log('📡 [EditableLink] Sending discovered URL to Dock:', finalUrl);
      window.parent.postMessage({
        type: 'SITE_CLICK',
        binding: { file: binding.file, index: binding.index || 0, key: binding.key },
        value: { label: finalLabel, url: finalUrl }, // Het complete pakket!
        dockType: 'link'
      }, '*');
      return;
    }

    if (!actualUrl) return;
    if (actualUrl.startsWith('#')) {
      const targetId = actualUrl.substring(1);
      const element = document.getElementById(targetId);
      if (element) { e.preventDefault(); element.scrollIntoView({ behavior: 'smooth' }); }
    } else if (Tag === 'button' || !isDev) {
      if (!actualUrl.startsWith('#') && !actualUrl.startsWith('mailto:') && !actualUrl.startsWith('tel:')) {
        window.open(actualUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <Tag
      href={Tag === 'a' ? actualUrl : undefined}
      data-dock-bind={JSON.stringify({ file: binding.file, index: binding.index || 0, key: binding.key })}
      data-dock-type="link"
      data-dock-ignore="true"
      className={`${className} cursor-pointer hover:ring-2 hover:ring-blue-400/40 rounded-sm transition-all`}
      onClick={handleLinkAction}
      {...props}
    >
      {content}
    </Tag>
  );
}
