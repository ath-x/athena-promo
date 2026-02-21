import React from 'react';

/**
 * EditableLink (v7.9.2 - Docked Track)
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
  ...props 
}) {
  const isDev = import.meta.env.DEV;
  const binding = cmsBind || { file: table, index: id, key: field };

  // Support object-based link data (label + url)
  const isObjectValue = typeof url === 'object' && url !== null;
  const finalLabel = isObjectValue ? (url.label || label) : label;
  const finalUrl = isObjectValue ? (url.url || url) : url;

  const actualUrl = (finalUrl && !finalUrl.startsWith('http') && !finalUrl.startsWith('/') && !finalUrl.startsWith('#'))
    ? `${import.meta.env.BASE_URL}${finalUrl}`.replace(/\/+/g, '/')
    : finalUrl;

  const content = finalLabel || children || actualUrl;

  if (!isDev) {
    return (
      <Tag href={Tag === 'a' ? actualUrl : undefined} className={className} {...props}>
        {content}
      </Tag>
    );
  }

  const dockBind = JSON.stringify({
    file: binding.file,
    index: binding.index || 0,
    key: binding.key
  });

  return (
    <Tag
      href={Tag === 'a' ? actualUrl : undefined}
      data-dock-bind={dockBind}
      data-dock-type="link"
      className={`${className} cursor-pointer hover:ring-2 hover:ring-blue-400/40 rounded-sm transition-all`}
      title={`Klik om "${binding.key}" te bewerken in de Dock`}
      {...props}
      onClick={(e) => {
        if (!e.shiftKey) e.preventDefault();
        if (props.onClick) props.onClick(e);
      }}
    >
      {content}
    </Tag>
  );
}
