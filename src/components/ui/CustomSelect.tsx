"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  color?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  /** Enables entering a custom value (e.g. custom number of months) directly inside the combobox */
  allowCustomValue?: boolean;
  customValuePlaceholder?: string;
  customValueType?: "number" | "text";
  formatCustomLabel?: (val: string) => string;
  formatCustomBadge?: (val: string) => string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Seleccionar opción...",
  searchable = false,
  searchPlaceholder = "Filtrar opciones...",
  disabled = false,
  className,
  leftIcon,
  allowCustomValue = false,
  customValuePlaceholder = "Otro plazo (ej. 5, 10, 36)...",
  customValueType = "number",
  formatCustomLabel,
  formatCustomBadge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customInput, setCustomInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || (
    value && allowCustomValue
      ? {
          value,
          label: formatCustomLabel ? formatCustomLabel(value) : `${value} Meses`,
          badge: formatCustomBadge ? formatCustomBadge(value) : "PERSONALIZADO",
        }
      : undefined
  );

  const filteredOptions = query.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()) ||
          opt.sublabel?.toLowerCase().includes(query.toLowerCase()) ||
          opt.badge?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setQuery("");
  };

  const handleApplyCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (customValueType === "number") {
      const parsed = parseInt(trimmed, 10);
      if (isNaN(parsed) || parsed < 1) return;
      onChange(String(parsed));
    } else {
      onChange(trimmed);
    }
    setCustomInput("");
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full select-none", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "w-full flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl border text-sm transition-all min-h-[48px] text-left",
          "bg-slate-50 dark:bg-[#121212]",
          "border-slate-200 dark:border-[#262626]",
          "text-slate-900 dark:text-neutral-100",
          "hover:border-slate-300 dark:hover:border-neutral-700",
          "focus:outline-none focus:border-[#009fdb] focus:ring-2 focus:ring-[#009fdb]/20",
          isOpen && "border-[#009fdb] dark:border-[#009fdb] ring-2 ring-[#009fdb]/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.color ? (
            <span
              className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
              style={{ backgroundColor: selectedOption.color + "33" }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedOption.color }}
              />
            </span>
          ) : selectedOption?.icon ? (
            <span className="shrink-0 text-[#009fdb]">{selectedOption.icon}</span>
          ) : leftIcon ? (
            <span className="shrink-0 text-slate-400 dark:text-neutral-400">
              {leftIcon}
            </span>
          ) : null}

          {selectedOption ? (
            <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-slate-900 dark:text-neutral-100 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-[#153D64]/50 text-slate-600 dark:text-[#009fdb] border border-transparent dark:border-[#009fdb]/30 shrink-0">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
              {selectedOption.sublabel && (
                <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 shrink-0">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-neutral-500 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 dark:text-neutral-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-[#009fdb] dark:text-[#009fdb]"
          )}
        />
      </button>

      {/* Floating Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className={cn(
              "absolute z-[80] w-full mt-2 rounded-2xl border shadow-2xl overflow-hidden",
              "bg-white dark:bg-[#121212]",
              "border-slate-200 dark:border-[#262626]",
              "shadow-slate-300/60 dark:shadow-black/90"
            )}
          >
            {/* Optional Search Bar */}
            {(searchable || options.length > 7) && (
              <div className="p-2 border-b border-slate-100 dark:border-[#262626]">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-[#262626]">
                  <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 px-4 text-center text-xs text-slate-400 dark:text-neutral-500">
                  No se encontraron opciones
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors min-h-[44px]",
                        isSelected
                          ? "bg-[#009fdb]/10 dark:bg-[#153D64]/45 text-[#009fdb] dark:text-white"
                          : "text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-[#181818]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.color ? (
                          <span
                            className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: opt.color + "33" }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: opt.color }}
                            />
                          </span>
                        ) : opt.icon ? (
                          <span className="shrink-0 text-[#009fdb]">
                            {opt.icon}
                          </span>
                        ) : null}

                        <span
                          className={cn(
                            "text-sm truncate",
                            isSelected ? "font-bold" : "font-medium"
                          )}
                        >
                          {opt.label}
                        </span>

                        {opt.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#0a0a0a] text-slate-500 dark:text-[#009fdb] border border-slate-200/60 dark:border-[#262626] shrink-0">
                            {opt.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {opt.sublabel && (
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              isSelected
                                ? "text-[#009fdb]"
                                : "text-slate-500 dark:text-neutral-400"
                            )}
                          >
                            {opt.sublabel}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#009fdb] shrink-0 stroke-[2.5]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Free / Custom Input Footer (e.g. Custom number of months) */}
            {allowCustomValue && (
              <div className="p-2 border-t border-slate-100 dark:border-[#262626] bg-slate-50/60 dark:bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <input
                    type={customValueType}
                    min={customValueType === "number" ? 1 : undefined}
                    max={customValueType === "number" ? 120 : undefined}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCustom();
                      }
                    }}
                    placeholder={customValuePlaceholder}
                    className="flex-1 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#009fdb] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustom}
                    disabled={!customInput.trim()}
                    className="px-3 py-2 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aplicar</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
