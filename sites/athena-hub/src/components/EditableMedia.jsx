import React from 'react';

/**
 * EditableMedia (v7.9.2 - Docked Track)
 * Passive wrapper that binds to the Athena Dock.
 */
export default function EditableMedia({ src, alt, className, cmsBind, table, field, id, ...props }) {
  const isDev = import.meta.env.DEV;
  const binding = cmsBind || { file: table, key: field, index: id || 0 };

  const finalSrc = (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:'))
    ? `${import.meta.env.BASE_URL}images/${src}`.replace(/\/+/g, '/')
    : src;

  const isVideo = src && (src.endsWith('.mp4') || src.endsWith('.webm'));

  const renderMedia = () => {
    if (isVideo) return <video src={finalSrc} className={className} autoPlay muted loop playsInline {...props} />;
    if (!src) return <div className={`bg-slate-200 flex items-center justify-center text-slate-400 ${className}`}>🖼️</div>;
    return <img src={finalSrc} alt={alt} className={className} {...props} />;
  };

  if (!isDev) return renderMedia();

  const dockBind = JSON.stringify({
    file: binding.file,
    index: binding.index || 0,
    key: binding.key
  });

  return (
    <div 
      className={`relative group ${className} cursor-pointer hover:ring-2 hover:ring-blue-400/40 rounded-sm transition-all duration-200`} 
      data-dock-bind={dockBind}
      data-dock-type="media"
      title={`Klik om "${binding.key}" te bewerken in de Dock`}
    >
      {renderMedia()}
    </div>
  );
}
