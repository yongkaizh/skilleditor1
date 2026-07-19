import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  BookOpen, 
  Code2, 
  Play, 
  Terminal as TerminalIcon,
  CheckCircle2
} from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetId?: string; // For highlighting specific UI elements
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Cadence SKILL IDE",
    description: "This environment is specifically designed for Cadence Virtuoso SKILL development. Let's take a quick look at how to build your first automation script.",
    icon: <Sparkles className="text-amber-400" size={24} />
  },
  {
    title: "The SKILL Editor",
    description: "This is a specialized Monaco editor with support for SKILL syntax, standard library autocompletion (db, ge, hi, tech prefixes), and live parenthesis matching.",
    icon: <Code2 className="text-indigo-400" size={24} />,
    targetId: "editor-pane"
  },
  {
    title: "Standard Library Manual",
    description: "Need help with a function? Hover over any standard function like 'dbCreateRect' or search the built-in manual for signatures and examples.",
    icon: <BookOpen className="text-emerald-400" size={24} />,
    targetId: "manual-search"
  },
  {
    title: "Run & Simulate",
    description: "Use the 'Run SKILL' button to simulate your code. The engine will check for syntax errors and provide output in the virtual console.",
    icon: <Play className="text-rose-400" size={24} />,
    targetId: "run-button"
  },
  {
    title: "Real-time Console",
    description: "Monitor your script's execution, debug warnings, and verify output directly in the integrated terminal below.",
    icon: <TerminalIcon className="text-slate-400" size={24} />,
    targetId: "console-pane"
  },
  {
    title: "You're all set!",
    description: "Try typing 'procedure(' or 'let(' to see the powerful autocomplete in action. Happy coding!",
    icon: <CheckCircle2 className="text-emerald-500" size={24} />
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const nextStep = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Dim Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm"
        onClick={onClose}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="relative w-full max-w-md bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl p-8 pointer-events-auto overflow-hidden mx-4"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
              {step.icon}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>

            <div className="flex items-center justify-between w-full mt-4 pt-6 border-t border-white/5">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-indigo-500 w-4' : 'bg-white/10'}`} 
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  {isLastStep ? "Get Started" : "Next"}
                  {!isLastStep && <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
