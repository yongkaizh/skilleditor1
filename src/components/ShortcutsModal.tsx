import React from 'react';
import { X, Keyboard, Code, Terminal, Save, Navigation } from 'lucide-react';
import { motion } from 'motion/react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: "Editor Actions",
      items: [
        { keys: ["Ctrl", "F"], description: "Find & Replace in active file", icon: <Code size={14} className="text-indigo-400" /> },
        { keys: ["Ctrl", "Shift", "F"], description: "Auto-format SKILL indentations", icon: <Code size={14} className="text-emerald-400" /> },
        { keys: ["Ctrl", "Z"], description: "Undo last edit", icon: <Code size={14} className="text-slate-400" /> },
        { keys: ["Ctrl", "Y"], description: "Redo last edit", icon: <Code size={14} className="text-slate-400" /> },
        { keys: ["Esc"], description: "Dismiss search, tooltips or dialogs", icon: <Code size={14} className="text-rose-400" /> }
      ]
    },
    {
      title: "IDE Navigation",
      items: [
        { keys: ["Ctrl", "B"], description: "Toggle Files Sidebar", icon: <Navigation size={14} className="text-indigo-400" /> },
        { keys: ["Ctrl", "Shift", "H"], description: "Toggle Global Search & Replace", icon: <Navigation size={14} className="text-indigo-400" /> },
        { keys: ["Ctrl", "`"], description: "Toggle diagnostic Console", icon: <Terminal size={14} className="text-amber-400" /> },
        { keys: ["Esc"], description: "Close any open sidebar or modal", icon: <Navigation size={14} className="text-rose-400" /> }
      ]
    },
    {
      title: "Project Actions",
      items: [
        { keys: ["Ctrl", "S"], description: "Save workspace files manually", icon: <Save size={14} className="text-sky-400" /> }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="bg-[#1a1c24] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#12141a]">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              <Keyboard className="text-indigo-400" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Quick reference for advanced IDE navigation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-5 custom-scrollbar">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group.title}</h3>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg divide-y divide-white/5">
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between p-3 text-xs hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-2.5 text-slate-300">
                      {item.icon}
                      <span>{item.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, kIdx) => (
                        <React.Fragment key={kIdx}>
                          {kIdx > 0 && <span className="text-slate-500 text-[10px] px-0.5 font-sans">+</span>}
                          <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono font-bold text-indigo-300 select-none shadow-[0_2px_0_rgba(255,255,255,0.05)]">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#12141a] flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
