import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  delay = 0.3,
  position = 'bottom',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    const t = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const handleClick = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {isVisible && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? -4 : 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] px-2.5 py-1.5 bg-[#1e2128] border border-white/10 rounded-md shadow-2xl pointer-events-none whitespace-nowrap ${positionClasses[position]}`}
          >
            <div className="text-[11px] font-medium text-white tracking-wide">
              {content}
            </div>
            {/* Simple arrow */}
            <div 
              className={`absolute w-2 h-2 bg-[#1e2128] border-white/10 rotate-45 ${
                position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-t border-l' : 
                position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r' :
                position === 'left' ? '-right-1 top-1/2 -translate-y-1/2 border-t border-r' :
                '-left-1 top-1/2 -translate-y-1/2 border-b border-l'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
