import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, BrainCircuit, Code2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { challenges } from '../data/challenges';
import type { Challenge } from '../data/challenges';

interface ChallengeHubProps {
  onSelectChallenge: (challenge: Challenge, isSolution?: boolean) => void;
  onClose: () => void;
}

export const ChallengeHub: React.FC<ChallengeHubProps> = ({ onSelectChallenge, onClose }) => {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#0a0b0f] overflow-hidden relative">
      <div className="p-4 border-b border-white/[0.04] sticky top-0 bg-[#0b0c10]/90 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedChallenge ? (
              <button
                onClick={() => setSelectedChallenge(null)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            ) : (
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Trophy size={18} className="text-rose-500" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                {selectedChallenge ? 'Challenge Details' : 'Challenge Hub'}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">Competitive EDA Optimization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {!selectedChallenge ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-2 space-y-1 absolute inset-0 overflow-y-auto"
            >
              {challenges.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => setSelectedChallenge(challenge)}
                  className={`w-full text-left p-3 rounded-lg border transition-all bg-transparent border-transparent hover:bg-white/5 hover:border-white/10`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-200">{challenge.title}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      challenge.difficulty === 'Expert' ? 'bg-purple-500/20 text-purple-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{challenge.description}</p>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4 absolute inset-0 overflow-y-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-lg font-black text-slate-100">{selectedChallenge.title}</h1>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedChallenge.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-300 font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <BrainCircuit size={14} className="text-indigo-400" />
                    Problem Statement
                  </h3>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed">
                    {selectedChallenge.problemStatement}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" />
                    Constraints
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    {selectedChallenge.constraints.map((constraint, i) => (
                      <li key={i}>{constraint}</li>
                    ))}
                  </ul>
                </section>

                <div className="grid grid-cols-1 gap-4">
                  <section>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Example Input</h3>
                    <pre className="p-2.5 bg-[#0a0b0f] border border-white/10 rounded-lg text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {selectedChallenge.exampleInput}
                    </pre>
                  </section>
                  
                  <section>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Example Output</h3>
                    <pre className="p-2.5 bg-[#0a0b0f] border border-white/10 rounded-lg text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {selectedChallenge.exampleOutput}
                    </pre>
                  </section>
                </div>

                <div className="pt-2 flex flex-col gap-2 pb-8">
                  <button
                    onClick={() => onSelectChallenge(selectedChallenge, false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 text-xs cursor-pointer"
                  >
                    <Code2 size={16} />
                    Solve Challenge
                  </button>
                  {selectedChallenge.solutionCode && (
                    <button
                      onClick={() => onSelectChallenge(selectedChallenge, true)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/10 text-xs cursor-pointer"
                    >
                      View Solution
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
