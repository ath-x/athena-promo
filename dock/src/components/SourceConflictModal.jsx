import React from 'react';

const SourceConflictModal = ({ isOpen, onClose, report, onResolveGitHub, onResolveSheet }) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-red-900/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
              Data Drift Gevonden!
            </h2>
            <p className="text-xs text-slate-400 mt-1">Er zijn verschillen tussen lokaal, GitHub en Sheets.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">&times;</button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
          {Object.entries(report.files).map(([fileName, fileReport]) => (
            fileReport.drift && (
              <div key={fileName} className="p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm text-violet-400">{fileName}</span>
                  {fileReport.localVsGitHub.changed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      GitHub Conflict
                    </span>
                  )}
                </div>
                
                {fileReport.localVsGitHub.changed && (
                  <p className="text-xs text-slate-400">
                    GitHub versie is anders. 
                    {fileReport.localVsGitHub.lengthDiff ? ` Verschil in aantal rijen: ${fileReport.localVsGitHub.diffCount}.` : " Inhoud is gewijzigd."}
                  </p>
                )}
              </div>
            )
          ))}
        </div>

        <div className="p-6 bg-slate-800/30 border-t border-slate-800 space-y-3">
          <p className="text-xs text-amber-300 bg-amber-900/20 p-3 rounded-lg border border-amber-900/30">
            <i className="fa-solid fa-circle-info mr-2"></i>
            Het is sterk aanbevolen om eerst te <strong>Syncen vanaf GitHub</strong> voordat je verder gaat met bewerken, om te voorkomen dat je andermans werk overschrijft.
          </p>
          
          <div className="flex gap-4">
            <button
                onClick={onResolveGitHub}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all font-bold text-sm flex items-center justify-center gap-2"
            >
                <i className="fa-solid fa-cloud-arrow-down"></i>
                Sync from GitHub (Oplossen)
            </button>
            <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold text-sm"
            >
                Negeren & Doorgaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceConflictModal;
