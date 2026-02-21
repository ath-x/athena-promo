import React from 'react';

/**
 * EditableText (v7.9.2 - Passive Wrapper for Docked Track)
 * Renders text with 'data-dock-bind' and 'data-dock-type' for Athena Dock.
 */
export default function EditableText({ tagName: Tag = 'span', value, children, cmsBind, table, field, id, className = "", style = {}, ...props }) {
  const isDev = import.meta.env.DEV;

  const actualValue = value !== undefined ? value : children;
  const binding = cmsBind || { file: table, key: field, index: id || 0 };

  const content = (typeof actualValue === 'object' && actualValue !== null && !React.isValidElement(actualValue)) 
      ? (actualValue.text || actualValue.title || actualValue.label || JSON.stringify(actualValue)) 
      : actualValue;

  if (!isDev) {
    return <Tag className={className} style={style} {...props}>{content}</Tag>;
  }

  // Generate binding string for Dock
  const dockBind = JSON.stringify({ 
    file: binding.file, 
    index: binding.index || 0, 
    key: binding.key 
  });

  return (
    <Tag
      data-dock-bind={dockBind}
      data-dock-type="text"
      className={`${className} cursor-pointer hover:ring-2 hover:ring-blue-400/40 hover:bg-blue-50/5 rounded-sm transition-all duration-200`}
      style={style}
      title={`Klik om "${binding.key}" te bewerken in de Dock`}
      {...props}
    >
      {content}
    </Tag>
  );
}
