import React, { useState } from 'react';

const SaveEverythingModal = ({ isOpen, onClose, onConfirm, siteName }) => {
  const [steps, setSteps] = useState([
    { id: 'disk', label: 'Save changes to disk (Local JSON)', checked: true, status: 'idle' },
    { id: 'sheet', label: 'Sync to Google Sheets', checked: true, status: 'idle' },
    { id: 'github', label: 'Push to GitHub (Live Update)', checked: true, status: 'idle' }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const toggleStep = (id) => {
    if (isExecuting) return;
    setSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const handleStart = async () => {
    setIsExecuting(true);
    const activeSteps = steps.filter(s => s.checked);
    
    for (const step of activeSteps) {
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'loading' } : s));
      try {
        await onConfirm(step.id);
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'success' } : s));
      } catch (err) {
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'error' } : s));
        setIsExecuting(false);
        return; // Stop execution on error
      }
    }
    
    setIsExecuting(false);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-cloud-arrow-up text-violet-400"></i>
              Save & Publish
            </h2>
            <p className="text-xs text-slate-400 mt-1">Project: <span className="text-violet-300 font-mono">{siteName}</span></p>
          </div>
          {!isExecuting && (
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">&times;</button>
          )}
        </div>

        <div className="p-8 space-y-4">
          {steps.map(step => (
            <div 
              key={step.id} 
              onClick={() => toggleStep(step.id)}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                step.status === 'idle' ? 'bg-slate-800/40 border-slate-700 hover:border-violet-500/50' : 
                step.status === 'loading' ? 'bg-violet-900/20 border-violet-500 animate-pulse' :
                step.status === 'success' ? 'bg-green-900/20 border-green-500' :
                'bg-red-900/20 border-red-500'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  step.checked ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-500 group-hover:bg-slate-600'
                }`}>
                  {step.status === 'success' ? (
                    <i className="fa-solid fa-check text-xs"></i>
                  ) : step.status === 'loading' ? (
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${step.checked ? 'bg-white' : 'bg-transparent border border-slate-500'}`}></div>
                  )}
                </div>
                <span className={`text-sm font-medium ${step.checked ? 'text-white' : 'text-slate-500'}`}>{step.label}</span>
              </div>
              
              {step.status === 'idle' && step.checked && (
                <span className="text-[10px] uppercase tracking-widest text-violet-400/50 font-bold">Pending</span>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex gap-4">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={isExecuting || !steps.some(s => s.checked)}
            className="flex-[2] py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 group disabled:opacity-50 disabled:bg-slate-700"
          >
            {isExecuting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                Confirm & Run
                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveEverythingModal;
