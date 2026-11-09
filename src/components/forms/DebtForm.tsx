"use client";

import React, { useState } from "react";
import { HandCoins, Calendar, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DebtFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialDebt?: {
    id?: string;
    title: string;
    type: "I_OWE" | "THEY_OWE";
    totalAmount: number;
    paidAmount: number;
    dueDate?: string | null;
  };
}

export const DebtForm: React.FC<DebtFormProps> = ({
  onSuccess,
  onCancel,
  initialDebt,
}) => {
  const [title, setTitle] = useState(initialDebt?.title || "");
  const [type, setType] = useState<"I_OWE" | "THEY_OWE">(
    initialDebt?.type || "I_OWE"
  );
  const [totalAmount, setTotalAmount] = useState<string>(
    initialDebt ? String(initialDebt.totalAmount) : ""
  );
  const [paidAmount, setPaidAmount] = useState<string>(
    initialDebt ? String(initialDebt.paidAmount) : "0"
  );
  const [dueDate, setDueDate] = useState<string>(
    initialDebt?.dueDate
      ? new Date(initialDebt.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalNum = parseFloat(totalAmount) || 0;
  const paidNum = parseFloat(paidAmount) || 0;
  const progressPercent =
    totalNum > 0 ? Math.min(100, Math.round((paidNum / totalNum) * 100)) : 0;
  const remaining = Math.max(0, totalNum - paidNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Escribe el nombre o contacto de la deuda.");
      return;
    }

    if (totalNum <= 0) {
      setErrorMsg("El monto total debe ser mayor a 0.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          totalAmount: totalNum,
          paidAmount: paidNum,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al registrar deuda.");
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Type Toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setType("I_OWE")}
          className={`py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-touch ${
            type === "I_OWE"
              ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Debo Yo (Por Pagar)
        </button>

        <button
          type="button"
          onClick={() => setType("THEY_OWE")}
          className={`py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-touch ${
            type === "THEY_OWE"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Me Deben (Por Cobrar)
        </button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <HandCoins className="w-3.5 h-3.5 text-blue-500" />
          Concepto o Contacto
        </label>
        <input
          type="text"
          placeholder="Ej. Préstamo Juan, Tarjeta Palacio"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-touch"
        />
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Monto Total
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-touch"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Monto Abonado
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-touch"
            />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Progreso liquidado</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Abonado: {formatCurrency(paidNum)}</span>
          <span>Resta: {formatCurrency(remaining)}</span>
        </div>
      </div>

      {/* Due Date */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Fecha Límite (Opcional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-touch"
        />
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-touch"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all min-h-touch"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Deuda</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DebtForm;
