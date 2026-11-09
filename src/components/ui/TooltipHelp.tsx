"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipHelpProps {
  text: string;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const TooltipHelp: React.FC<TooltipHelpProps> = ({
  text,
  className,
  position = "top",
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className={cn("relative inline-flex items-center justify-center align-middle", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label="Información de ayuda"
        className={cn(
          "flex items-center justify-center w-4 h-4 rounded-full text-xs bg-sky-500/10 text-sky-400 border border-sky-500/25 transition-all shrink-0 focus:outline-none",
          open
            ? "bg-[#009fdb] text-white border-[#009fdb] shadow-xs shadow-[#009fdb]/40 scale-105"
            : "hover:bg-sky-500/20 hover:text-sky-300"
        )}
      >
        <HelpCircle className="w-3 h-3 stroke-[2.4] shrink-0" />
      </button>

      {open && (
        <span
          role="tooltip"
          className={cn(
            "absolute z-[90] w-56 sm:w-64 p-2.5 rounded-xl text-[11px] font-normal leading-relaxed text-slate-100 bg-[#12161f] border border-slate-800 shadow-2xl shadow-black/90 pointer-events-none select-none",
            position === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2",
            position === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2",
            position === "left" && "right-full top-1/2 -translate-y-1/2 mr-2",
            position === "right" && "left-full top-1/2 -translate-y-1/2 ml-2"
          )}
        >
          <span className="block text-left">{text}</span>
          <span
            className={cn(
              "block w-2 h-2 bg-[#12161f] border-slate-800 rotate-45 absolute",
              position === "top" &&
                "top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b",
              position === "bottom" &&
                "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l border-t",
              position === "left" &&
                "left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r",
              position === "right" &&
                "right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l"
            )}
          />
        </span>
      )}
    </span>
  );
};

export default TooltipHelp;
