import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { motion } from 'motion/react';
import { X, Check, ArrowRight } from 'lucide-react';

interface RefactorDiffViewProps {
  originalCode: string;
  modifiedCode: string;
  onAccept: () => void;
  onCancel: () => void;
}

export const RefactorDiffView: React.FC<RefactorDiffViewProps> = ({ 
  originalCode, 
  modifiedCode, 
  onAccept, 
  onCancel 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
        originalEditable: false,
        readOnly: true,
        renderSideBySide: true,
        theme: 'vs-dark',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        fontSize: 12,
        lineNumbers: 'on',
      });

      const originalModel = monaco.editor.createModel(originalCode, 'scheme');
      const modifiedModel = monaco.editor.createModel(modifiedCode, 'scheme');

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
      });

      diffEditorRef.current = diffEditor;

      return () => {
        originalModel.dispose();
        modifiedModel.dispose();
        diffEditor.dispose();
      };
    }
  }, [originalCode, modifiedCode]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 z-[100] flex flex-col bg-[#0d0e12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0b0f]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
            <ArrowRight size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Review Refactor Changes</h2>
            <p className="text-[10px] text-slate-500 font-medium">Side-by-side comparison of expert optimizations</p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 min-h-0" ref={containerRef} />

      <div className="p-4 border-t border-white/5 bg-[#0a0b0f] flex items-center justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
        >
          Discard
        </button>
        <button 
          onClick={onAccept}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
        >
          <Check size={18} />
          Apply Improvements
        </button>
      </div>
    </motion.div>
  );
};
