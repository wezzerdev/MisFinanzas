"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  title = "Información",
  className,
  position = "top",
}) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cierre con Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <span className={cn("relative inline-flex items-center justify-center align-middle", className)}>
      {/* Botón táctil con touch target mínimo de 44x44px en móviles mediante padding invisible */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => !isMobile && setOpen(true)}
        onMouseLeave={() => !isMobile && setOpen(false)}
        aria-label="Ayuda e información contextual"
        aria-expanded={open}
        className={cn(
          "relative flex items-center justify-center w-5 h-5 rounded-full text-xs transition-all shrink-0 focus:outline-none select-none",
          open
            ? "bg-[#009fdb] text-white shadow-xs shadow-[#009fdb]/40 scale-110"
            : "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 active:scale-95"
        )}
      >
        <HelpCircle className="w-3.5 h-3.5 stroke-[2.4] shrink-0" />
        {/* Invisible 44x44 tap target overlay for iOS touch precision */}
        <span className="absolute -inset-2.5 sm:inset-0 pointer-events-auto" />
      </button>

      {/* Renderizado Seguro: Portal en Móvil (sin desbordes de pantalla) + Popover en Desktop */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                {/* 1. MÓVIL (iOS / Android): Modal Bottom-Sheet Centrado con Backdrop Seguro */}
                <div className="sm:hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-xs flex items-end justify-center p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.96 }}
                      transition={{ type: "spring", damping: 25, stiffness: 350 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-sm rounded-3xl bg-[#121212] border border-[#262626] p-5 text-white shadow-2xl flex flex-col gap-3.5"
                    >
                      {/* Cabecera */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-[#009fdb]/15 border border-[#009fdb]/30 flex items-center justify-center text-[#009fdb]">
                            <Info className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                            {title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                          aria-label="Cerrar modal de información"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Contenido Completo */}
                      <p className="text-sm leading-relaxed text-neutral-300 font-normal">
                        {text}
                      </p>

                      {/* Botón de Aceptación Táctil Estandarizado (h-12) */}
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-full h-12 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] active:scale-[0.98] text-white font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center"
                      >
                        Entendido
                      </button>
                    </motion.div>
                  </motion.div>
                </div>

                {/* 2. DESKTOP: Popover Flotante Inteligente con límites de pantalla */}
                <div className="hidden sm:block">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "fixed",
                      top: triggerRef.current
                        ? triggerRef.current.getBoundingClientRect().bottom + 8
                        : 0,
                      left: triggerRef.current
                        ? Math.min(
                            window.innerWidth - 320,
                            Math.max(
                              16,
                              triggerRef.current.getBoundingClientRect().left - 130
                            )
                          )
                        : 0,
                    }}
                    className="z-[999] w-72 p-4 rounded-2xl text-xs leading-relaxed text-slate-100 bg-[#121212] border border-[#262626] shadow-2xl select-text pointer-events-auto"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#262626] mb-2">
                      <span className="font-bold text-[11px] text-[#009fdb] flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span>{title}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{text}</p>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </span>
  );
};

export default TooltipHelp;
