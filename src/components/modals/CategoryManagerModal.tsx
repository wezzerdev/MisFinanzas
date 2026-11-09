"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Tag,
  Pencil,
  Trash2,
  Plus,
  Check,
  Loader2,
  AlertTriangle,
  Palette,
  Shapes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import {
  PRESET_CATEGORY_ICONS,
  resolveCategoryIcon,
} from "@/components/ui/CategorySelector";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  _count?: { transactions: number };
}

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

const PRESET_COLORS = [
  "#009fdb", // Corporate Primary
  "#153D64", // Corporate Deep
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Rose
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#14b8a6", // Teal
  "#ec4899", // Pink
  "#64748b", // Slate
];

type FilterTab = "ALL" | "EXPENSE" | "INCOME";

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#009fdb");
  const [editIcon, setEditIcon] = useState("Tag");
  const [editType, setEditType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [savingEdit, setSavingEdit] = useState(false);

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#009fdb");
  const [newIcon, setNewIcon] = useState("ShoppingCart");
  const [newType, setNewType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [savingNew, setSavingNew] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?withCount=true");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen, fetchCategories]);

  const filtered = categories.filter((c) => {
    const matchType = filterTab === "ALL" || c.type === filterTab;
    const matchQuery = searchQuery.trim()
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchType && matchQuery;
  });

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.icon || "Tag");
    setEditType(cat.type);
    setDeleteConfirmId(null);
    setIsCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/categories?id=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          color: editColor,
          icon: editIcon,
          type: editType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...data.data } : c))
        );
        setEditingId(null);
        onCategoriesChanged?.();
      }
    } catch (err) {
      console.error("Error updating category:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSavingNew(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          color: newColor,
          icon: newIcon,
          type: newType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => [
          ...prev,
          { ...data.data, _count: { transactions: 0 } },
        ]);
        setIsCreating(false);
        setNewName("");
        setNewColor("#009fdb");
        setNewIcon("ShoppingCart");
        onCategoriesChanged?.();
      }
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setSavingNew(false);
    }
  };

  const handleDelete = async (catId: string) => {
    setDeletingId(catId);
    try {
      const url = reassignTargetId
        ? `/api/categories?id=${catId}&reassignTo=${reassignTargetId}`
        : `/api/categories?id=${catId}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
        setDeleteConfirmId(null);
        setReassignTargetId("");
        onCategoriesChanged?.();
      } else {
        alert(data.error || "No se pudo eliminar la categoría.");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const catToDelete = deleteConfirmId
    ? categories.find((c) => c.id === deleteConfirmId)
    : null;
  const txCount = catToDelete?._count?.transactions ?? 0;
  const reassignOptions: CustomSelectOption[] = categories
    .filter((c) => c.id !== deleteConfirmId && c.type === catToDelete?.type)
    .map((c) => {
      const ReassignIcon = resolveCategoryIcon(c.icon, c.name);
      return {
        value: c.id,
        label: c.name,
        color: c.color,
        icon: <ReassignIcon className="w-4 h-4" />,
      };
    });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center select-none"
      aria-modal="true"
      role="dialog"
      aria-label="Categorías"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel (Strict Carbon Dark #121212 & #262626) */}
      <div
        className={cn(
          "relative z-10 w-full sm:max-w-lg flex flex-col",
          "bg-white dark:bg-[#121212]",
          "rounded-t-3xl sm:rounded-3xl",
          "border border-slate-200 dark:border-[#262626]",
          "shadow-2xl shadow-black/80",
          "max-h-[90dvh] sm:max-h-[85vh]"
        )}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-[#262626]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#262626] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#009fdb]/10 dark:bg-[#153D64]/50 border border-[#009fdb]/30 flex items-center justify-center">
              <Tag className="w-4 h-4 text-[#009fdb]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Categorías
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {categories.length} registradas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181818] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter tabs + Search */}
        <div className="px-5 pt-4 pb-3 flex flex-col gap-3 shrink-0">
          <div className="flex p-1 bg-slate-100 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-[#262626] gap-1">
            {(["ALL", "EXPENSE", "INCOME"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px]",
                  filterTab === tab
                    ? "bg-[#009fdb] text-white shadow-xs"
                    : "text-slate-500 dark:text-neutral-400"
                )}
              >
                {tab === "ALL" ? "Todas" : tab === "EXPENSE" ? "Gastos" : "Ingresos"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626]">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Body: list (Each item has shrink-0 so it NEVER squishes vertically) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 flex flex-col gap-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-neutral-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#009fdb]" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#0a0a0a] flex items-center justify-center">
                <Tag className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-neutral-400 text-center">
                {searchQuery
                  ? `Sin resultados para "${searchQuery}"`
                  : "Sin categorías"}
              </p>
            </div>
          ) : (
            filtered.map((cat) => {
              const isEditing = editingId === cat.id;
              const isDeleteConfirm = deleteConfirmId === cat.id;
              const txCnt = cat._count?.transactions ?? 0;
              const CatIcon = resolveCategoryIcon(cat.icon, cat.name);

              return (
                <div
                  key={cat.id}
                  className={cn(
                    "shrink-0 rounded-2xl border transition-all",
                    isEditing
                      ? "border-[#009fdb] bg-[#009fdb]/5 dark:bg-[#0a0a0a]"
                      : isDeleteConfirm
                      ? "border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#0a0a0a]"
                  )}
                >
                  {/* Category row with Professional Lucide Icon + Color Dot + Name */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="relative shrink-0">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5"
                        style={{
                          backgroundColor: cat.color + "22",
                          color: cat.color,
                        }}
                      >
                        <CatIcon className="w-5 h-5 stroke-[2.1]" />
                      </span>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0a0a0a]"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100 truncate">
                          {cat.name}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {cat.type === "EXPENSE" ? "Gasto" : "Ingreso"} ·{" "}
                        {txCnt > 0 ? `${txCnt} mov.` : "Sin movimientos"}
                      </p>
                    </div>

                    {!isEditing && !isDeleteConfirm && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-2 rounded-xl text-neutral-400 hover:text-[#009fdb] hover:bg-slate-200/50 dark:hover:bg-[#181818] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          aria-label={`Editar ${cat.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmId(cat.id);
                            setEditingId(null);
                            setReassignTargetId("");
                          }}
                          className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          aria-label={`Eliminar ${cat.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline edit panel */}
                  {isEditing && (
                    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-200 dark:border-[#262626] pt-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Tipo
                        </label>
                        <div className="flex gap-2">
                          {(["EXPENSE", "INCOME"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setEditType(t)}
                              className={cn(
                                "flex-1 py-2 rounded-xl text-xs font-bold border transition-all min-h-[42px]",
                                editType === t
                                  ? "bg-[#153D64] text-white border-[#009fdb]"
                                  : "bg-white dark:bg-[#121212] text-neutral-400 border-slate-200 dark:border-[#262626]"
                              )}
                            >
                              {t === "EXPENSE" ? "Gasto" : "Ingreso"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-[#009fdb]" />
                          <span>Color</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={cn(
                                "w-7 h-7 rounded-full border-2 transition-all",
                                editColor === c
                                  ? "border-slate-900 dark:border-white scale-110"
                                  : "border-transparent"
                              )}
                              style={{ backgroundColor: c }}
                              aria-label={`Color ${c}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                          <Shapes className="w-3.5 h-3.5 text-[#009fdb]" />
                          <span>Icono Distintivo</span>
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {PRESET_CATEGORY_ICONS.map(({ name, label, Icon }) => {
                            const selected = editIcon === name;
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => setEditIcon(name)}
                                title={label}
                                className={cn(
                                  "py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                                  selected
                                    ? "bg-[#009fdb] text-white border-[#009fdb] shadow-xs"
                                    : "bg-white dark:bg-[#121212] text-neutral-400 hover:text-white border-slate-200 dark:border-[#262626]"
                                )}
                              >
                                <Icon className="w-4 h-4 stroke-[2.1]" />
                                <span className="text-[9px] font-semibold truncate max-w-full">
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#121212] text-xs font-bold text-neutral-400 min-h-[42px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={!editName.trim() || savingEdit}
                          className="flex-2 py-2.5 px-5 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 min-h-[42px]"
                        >
                          {savingEdit ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Guardar</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete confirm panel */}
                  {isDeleteConfirm && catToDelete && (
                    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-rose-500/20 pt-3">
                      <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
                        <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-700 dark:text-rose-300">
                          {txCount > 0 ? (
                            <>
                              Tiene <strong>{txCount} mov.</strong> Selecciona categoría destino.
                            </>
                          ) : (
                            <>
                              ¿Eliminar <strong>&ldquo;{catToDelete.name}&rdquo;</strong>?
                            </>
                          )}
                        </p>
                      </div>

                      {txCount > 0 && reassignOptions.length > 0 && (
                        <CustomSelect
                          value={reassignTargetId}
                          onChange={setReassignTargetId}
                          options={reassignOptions}
                          placeholder="Seleccionar categoría destino..."
                        />
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmId(null);
                            setReassignTargetId("");
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-xs font-bold text-neutral-400 min-h-[42px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id)}
                          disabled={
                            (txCount > 0 && !reassignTargetId) ||
                            deletingId === cat.id
                          }
                          className="flex-2 py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 min-h-[42px]"
                        >
                          {deletingId === cat.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Create new */}
        <div className="border-t border-slate-100 dark:border-[#262626] px-5 pt-3 pb-5 shrink-0">
          {isCreating ? (
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] max-h-[52vh] overflow-y-auto">
              <p className="text-xs font-bold text-[#009fdb] uppercase tracking-wider">
                Nueva Categoría
              </p>

              <input
                type="text"
                placeholder="Ej. Restaurantes, Inversiones..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb]"
              />

              <div className="flex gap-2">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewType(t)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold border transition-all min-h-[40px]",
                      newType === t
                        ? "bg-[#153D64] text-white border-[#009fdb]"
                        : "bg-white dark:bg-[#121212] text-neutral-400 border-slate-200 dark:border-[#262626]"
                    )}
                  >
                    {t === "EXPENSE" ? "Gasto" : "Ingreso"}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      newColor === c
                        ? "border-slate-900 dark:border-white scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>

              {/* Icon selector for new category */}
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_CATEGORY_ICONS.slice(0, 12).map(({ name, label, Icon }) => {
                  const selected = newIcon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewIcon(name)}
                      title={label}
                      className={cn(
                        "py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all",
                        selected
                          ? "bg-[#009fdb] text-white border-[#009fdb]"
                          : "bg-white dark:bg-[#121212] text-neutral-400 border-slate-200 dark:border-[#262626]"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-semibold truncate max-w-full">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewName("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] text-xs font-bold text-neutral-400 min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim() || savingNew}
                  className="flex-2 py-2.5 px-5 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 min-h-[42px]"
                >
                  {savingNew ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Crear</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
                setDeleteConfirmId(null);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-[#262626] text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:border-[#009fdb] hover:text-[#009fdb] hover:bg-slate-50 dark:hover:bg-[#0a0a0a] transition-all min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Categoría</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
