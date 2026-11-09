"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipHelpProps {
  text: string;
  title?: string;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const TooltipHelp: React.FC<TooltipHelpProps> = ({
  text,
  title,
  className,
  position = "top",
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Cierre automático al tocar fuera o presionar Escape
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <span
      ref={containerRef}
      className={cn("relative inline-flex items-center justify-center align-middle", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Botón táctil optimizado para móviles (área de toque ampliada y centrada) */}
      <button
        type="button"
        onClick={handleToggle}
        onTouchEnd={handleToggle}
        aria-label="Ayuda e información contextual"
        aria-expanded={open}
        className={cn(
          "flex items-center justify-center w-4 h-4 rounded-full text-xs transition-all shrink-0 focus:outline-none select-none",
          open
            ? "bg-[#009fdb] text-white shadow-xs shadow-[#009fdb]/40 scale-110"
            : "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 active:scale-95"
        )}
      >
        <HelpCircle className="w-3 h-3 stroke-[2.4] shrink-0" />
      </button>

      {/* Popover / Tooltip Flotante */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: position === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="tooltip"
            className={cn(
              "absolute z-[100] w-64 sm:w-72 p-3 rounded-2xl text-[11px] leading-relaxed text-slate-100 bg-[#121212] border border-[#262626] shadow-2xl shadow-black/80 select-text",
              // Posicionamiento inteligente con soporte responsivo
              position === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
              position === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2.5",
              position === "left" && "right-full top-1/2 -translate-y-1/2 mr-2.5",
              position === "right" && "left-full top-1/2 -translate-y-1/2 ml-2.5"
            )}
          >
            {/* Header del Tooltip con botón de cierre móvil */}
            <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-[#262626] mb-1.5">
              <span className="font-bold text-[11px] text-[#009fdb] flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>{title || "Información"}</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
                aria-label="Cerrar tooltip"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Mensaje descriptivo */}
            <p className="text-slate-300 font-normal">{text}</p>

            {/* Puntero / Flechita indicadora */}
            <span
              className={cn(
                "block w-2.5 h-2.5 bg-[#121212] border-[#262626] rotate-45 absolute",
                position === "top" && "top-full left-1/2 -translate-x-1/2 -mt-1.5 border-r border-b",
                position === "bottom" && "bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-l border-t",
                position === "left" && "left-full top-1/2 -translate-y-1/2 -ml-1.5 border-t border-r",
                position === "right" && "right-full top-1/2 -translate-y-1/2 -mr-1.5 border-b border-l"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default TooltipHelp;
