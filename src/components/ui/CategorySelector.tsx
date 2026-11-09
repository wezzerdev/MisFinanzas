"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  Tag,
  Check,
  Loader2,
  Settings2,
  ChevronDown,
  ShoppingCart,
  Home,
  Car,
  HeartPulse,
  Film,
  Repeat,
  Briefcase,
  TrendingUp,
  Laptop,
  Utensils,
  Shirt,
  Plane,
  Coffee,
  Dumbbell,
  BookOpen,
  Music,
  Gift,
  Zap,
  Smartphone,
  ShieldCheck,
  PiggyBank,
  Landmark,
  Wrench,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Home,
  Car,
  HeartPulse,
  Film,
  Repeat,
  Briefcase,
  TrendingUp,
  Laptop,
  Tag,
  Utensils,
  Shirt,
  Plane,
  Coffee,
  Dumbbell,
  BookOpen,
  Music,
  Gift,
  Zap,
  Smartphone,
  ShieldCheck,
  PiggyBank,
  Landmark,
  Wrench,
  Sparkles,
};

export const PRESET_CATEGORY_ICONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "ShoppingCart", label: "Super", Icon: ShoppingCart },
  { name: "Utensils", label: "Comida", Icon: Utensils },
  { name: "Home", label: "Hogar", Icon: Home },
  { name: "Car", label: "Auto", Icon: Car },
  { name: "HeartPulse", label: "Salud", Icon: HeartPulse },
  { name: "Film", label: "Ocio", Icon: Film },
  { name: "Repeat", label: "Fijos", Icon: Repeat },
  { name: "Briefcase", label: "Nómina", Icon: Briefcase },
  { name: "TrendingUp", label: "Inversión", Icon: TrendingUp },
  { name: "Laptop", label: "Freelance", Icon: Laptop },
  { name: "Coffee", label: "Café", Icon: Coffee },
  { name: "Shirt", label: "Ropa", Icon: Shirt },
  { name: "Plane", label: "Viajes", Icon: Plane },
  { name: "Dumbbell", label: "Gym", Icon: Dumbbell },
  { name: "BookOpen", label: "Educación", Icon: BookOpen },
  { name: "Zap", label: "Servicios", Icon: Zap },
  { name: "Smartphone", label: "Digital", Icon: Smartphone },
  { name: "Gift", label: "Regalos", Icon: Gift },
  { name: "Music", label: "Música", Icon: Music },
  { name: "PiggyBank", label: "Ahorro", Icon: PiggyBank },
  { name: "Landmark", label: "Banco", Icon: Landmark },
  { name: "ShieldCheck", label: "Seguro", Icon: ShieldCheck },
  { name: "Wrench", label: "Mtto", Icon: Wrench },
  { name: "Tag", label: "General", Icon: Tag },
];

/**
 * Resolves the appropriate LucideIcon for a category based on its `icon` field
 * or intelligent keyword matching on the category name if `icon` is generic.
 */
export function resolveCategoryIcon(iconName?: string, categoryName?: string): LucideIcon {
  if (iconName && CATEGORY_ICON_MAP[iconName] && iconName !== "Tag") {
    return CATEGORY_ICON_MAP[iconName];
  }

  if (categoryName) {
    const lower = categoryName.toLowerCase();
    if (lower.includes("aliment") || lower.includes("super") || lower.includes("mercado"))
      return ShoppingCart;
    if (lower.includes("restaurante") || lower.includes("comida")) return Utensils;
    if (lower.includes("vivienda") || lower.includes("casa") || lower.includes("renta") || lower.includes("hogar"))
      return Home;
    if (lower.includes("transporte") || lower.includes("gasolina") || lower.includes("auto") || lower.includes("uber"))
      return Car;
    if (lower.includes("salud") || lower.includes("farmacia") || lower.includes("médico"))
      return HeartPulse;
    if (lower.includes("entretenimiento") || lower.includes("cine") || lower.includes("ocio"))
      return Film;
    if (lower.includes("suscripcion") || lower.includes("recurrente") || lower.includes("streaming"))
      return Repeat;
    if (lower.includes("salario") || lower.includes("nómina") || lower.includes("sueldo"))
      return Briefcase;
    if (lower.includes("rendimiento") || lower.includes("inversión") || lower.includes("inversion"))
      return TrendingUp;
    if (lower.includes("venta") || lower.includes("freelance") || lower.includes("negocio"))
      return Laptop;
    if (lower.includes("café") || lower.includes("cafe")) return Coffee;
    if (lower.includes("ropa") || lower.includes("tienda")) return Shirt;
    if (lower.includes("viaje") || lower.includes("vuelo") || lower.includes("hotel"))
      return Plane;
    if (lower.includes("gym") || lower.includes("deporte")) return Dumbbell;
    if (lower.includes("luz") || lower.includes("agua") || lower.includes("internet") || lower.includes("servicio"))
      return Zap;
  }

  return (iconName && CATEGORY_ICON_MAP[iconName]) || Tag;
}

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  filterType?: "INCOME" | "EXPENSE";
  categories?: Category[];
  onCreateNew?: (name: string) => Promise<Category | null>;
  onManage?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  filterType,
  categories: externalCategories,
  onCreateNew,
  onManage,
  isLoading: externalLoading = false,
  placeholder = "Seleccionar categoría...",
  className,
}) => {
  const [internalCategories, setInternalCategories] = useState<Category[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalCategories !== undefined) return;
    setInternalLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInternalCategories(d.data);
      })
      .catch(console.error)
      .finally(() => setInternalLoading(false));
  }, [externalCategories]);

  const categories = externalCategories ?? internalCategories;
  const isLoading = externalLoading || internalLoading;

  const filtered = categories.filter((c) => {
    const matchType = filterType ? c.type === filterType : true;
    const matchQuery = query.trim()
      ? c.name.toLowerCase().includes(query.trim().toLowerCase())
      : true;
    return matchType && matchQuery;
  });

  const selectedCategory = categories.find((c) => c.id === value);
  const SelectedIcon = selectedCategory
    ? resolveCategoryIcon(selectedCategory.icon, selectedCategory.name)
    : Tag;

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setCreating(false);
        setQuery("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handlePick = useCallback(
    (cat: Category) => {
      onChange(cat.id);
      setIsOpen(false);
      setQuery("");
    },
    [onChange]
  );

  const handleCreateNew = async () => {
    if (!newName.trim() || !onCreateNew) return;
    setSavingNew(true);
    const created = await onCreateNew(newName.trim());
    if (created) {
      onChange(created.id);
      setInternalCategories((prev) => [...prev, created]);
    }
    setNewName("");
    setCreating(false);
    setIsOpen(false);
    setSavingNew(false);
  };

  const highlight = (text: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        <span>{text.slice(0, idx)}</span>
        <span className="bg-[#009fdb]/15 text-[#009fdb] rounded-sm px-0.5">
          {text.slice(idx, idx + query.length)}
        </span>
        <span>{text.slice(idx + query.length)}</span>
      </>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative select-none", className)}>
      {/* ── Trigger Button (Unified Carbon & Corporate Blue with Icon + Color Dot) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm transition-all min-h-[48px] text-left",
          "bg-slate-50 dark:bg-[#121212]",
          "border-slate-200 dark:border-[#262626]",
          "text-slate-900 dark:text-neutral-100",
          "hover:border-slate-300 dark:hover:border-neutral-700",
          "focus:outline-none focus:border-[#009fdb] focus:ring-2 focus:ring-[#009fdb]/20",
          isOpen && "border-[#009fdb] dark:border-[#009fdb] ring-2 ring-[#009fdb]/20"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400 shrink-0" />
          ) : selectedCategory ? (
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/5"
                style={{
                  backgroundColor: selectedCategory.color + "22",
                  color: selectedCategory.color,
                }}
              >
                <SelectedIcon className="w-4 h-4 stroke-[2.2]" />
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedCategory.color }}
              />
            </div>
          ) : (
            <Tag className="w-4 h-4 text-neutral-400 shrink-0" />
          )}

          <span
            className={cn(
              "flex-1 truncate font-semibold",
              !selectedCategory && "text-neutral-400 font-normal"
            )}
          >
            {isLoading
              ? "Cargando..."
              : selectedCategory
              ? selectedCategory.name
              : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onManage && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onManage();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-[#009fdb] hover:bg-[#009fdb]/10 transition-colors"
              title="Gestionar categorías"
              aria-label="Abrir gestor de categorías"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-[#009fdb]"
            )}
          />
        </div>
      </button>

      {/* ── Floating Dropdown Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            aria-label="Categorías disponibles"
            className={cn(
              "absolute z-[75] w-full mt-2 rounded-2xl border shadow-2xl overflow-hidden",
              "bg-white dark:bg-[#121212]",
              "border-slate-200 dark:border-[#262626]",
              "shadow-slate-300/60 dark:shadow-black/90"
            )}
          >
            {/* Search bar */}
            <div className="p-2 border-b border-slate-100 dark:border-[#262626]">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-[#262626]">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar categoría..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-neutral-500 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-neutral-400 hover:text-white"
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Category list */}
            <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-neutral-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Cargando...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#0a0a0a] flex items-center justify-center">
                    <Tag className="w-4 h-4 text-neutral-400" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 text-center px-4">
                    {query ? `Sin resultados para "${query}"` : "Sin categorías"}
                  </p>
                </div>
              ) : (
                filtered.map((cat) => {
                  const isSelected = cat.id === value;
                  const CatIcon = resolveCategoryIcon(cat.icon, cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handlePick(cat)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors min-h-[44px]",
                        isSelected
                          ? "bg-[#009fdb]/10 dark:bg-[#153D64]/45 text-[#009fdb] dark:text-white"
                          : "hover:bg-slate-50 dark:hover:bg-[#181818]"
                      )}
                    >
                      {/* Icon Container + Color Dot */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/5"
                          style={{
                            backgroundColor: cat.color + "22",
                            color: cat.color,
                          }}
                        >
                          <CatIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      </div>

                      <span
                        className={cn(
                          "flex-1 text-sm text-slate-900 dark:text-neutral-100 truncate",
                          isSelected ? "font-bold" : "font-medium"
                        )}
                      >
                        {highlight(cat.name)}
                      </span>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#009fdb] shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Create new inline */}
            {onCreateNew && (
              <div className="border-t border-slate-100 dark:border-[#262626] p-2 bg-slate-50/50 dark:bg-[#0a0a0a]">
                {creating ? (
                  <div className="flex items-center gap-2 px-1 py-0.5">
                    <input
                      type="text"
                      placeholder="Nombre de categoría..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateNew();
                        }
                        if (e.key === "Escape") {
                          setCreating(false);
                          setNewName("");
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      disabled={!newName.trim() || savingNew}
                      className="p-2 rounded-xl bg-[#009fdb] text-white hover:bg-[#0088bd] disabled:opacity-50 transition-colors"
                    >
                      {savingNew ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setNewName("");
                      }}
                      className="p-2 rounded-xl text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#181818] transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#009fdb] hover:bg-[#009fdb]/10 transition-colors min-h-[40px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva categoría</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySelector;
