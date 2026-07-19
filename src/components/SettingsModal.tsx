import React from 'react';
import { X, Settings, Type, Layout, WrapText } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordWrap: boolean;
  setWordWrap: (v: boolean) => void;
  showMinimap: boolean;
  setShowMinimap: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, wordWrap, setWordWrap, showMinimap, setShowMinimap, fontSize, setFontSize
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[#1e212b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings size={20} className="text-indigo-400" />
            Editor Settings
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <WrapText size={16} />
                <span>Word Wrap</span>
              </div>
              <button 
                onClick={() => setWordWrap(!wordWrap)}
                className={`w-11 h-6 rounded-full transition-colors relative ${wordWrap ? 'bg-indigo-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${wordWrap ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Layout size={16} />
                <span>Show Minimap</span>
              </div>
              <button 
                onClick={() => setShowMinimap(!showMinimap)}
                className={`w-11 h-6 rounded-full transition-colors relative ${showMinimap ? 'bg-indigo-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showMinimap ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Type size={16} />
                  <span>Font Size</span>
                </div>
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded">{fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="24" 
                value={fontSize}
                onChange={e => setFontSize(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
