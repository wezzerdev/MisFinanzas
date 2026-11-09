"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
  title?: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, title, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:text-turquoise-400 hover:bg-surface-secondary transition-colors focus:outline-none"
        aria-label="Más información"
      >
        {children || <Info className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 p-3 bg-surface-secondary border border-surface-tertiary rounded-xl shadow-xl text-left pointer-events-auto"
          >
            {title && (
              <p className="text-xs font-semibold text-slate-200 mb-1">
                {title}
              </p>
            )}
            <p className="text-xs text-slate-300 leading-relaxed">{content}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-surface-secondary border-r border-b border-surface-tertiary rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
