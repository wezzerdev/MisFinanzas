"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import TooltipHelp from "@/components/ui/TooltipHelp";
import { formatCurrency } from "@/lib/utils";

interface TransactionItem {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  date: string | Date;
  note: string | null;
  account?: { name: string };
  category?: { name: string; color: string; icon: string };
}

interface CalendarViewProps {
  transactions: TransactionItem[];
  onSelectDateForNewTransaction?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  onSelectDateForNewTransaction,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"MONTH" | "YEAR">("MONTH");
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState<boolean>(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === "MONTH") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year - 1, month, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "MONTH") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      setCurrentDate(new Date(year + 1, month, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const transactionsByDate = useMemo(() => {
    const map = new Map<string, TransactionItem[]>();
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(t);
    }
    return map;
  }, [transactions]);

  const { daysInMonth, startOffset, monthName, monthlyTotals } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let offset = firstDayOfMonth.getDay() - 1;
    if (offset < 0) offset = 6;

    const formatter = new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
    });
    const formattedMonth = formatter.format(firstDayOfMonth);

    let totalIncome = 0;
    let totalExpense = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dayTxs = transactionsByDate.get(dateKey) || [];
      for (const t of dayTxs) {
        if (t.type === "INCOME") totalIncome += t.amount;
        if (t.type === "EXPENSE") totalExpense += t.amount;
      }
    }

    return {
      daysInMonth: totalDays,
      startOffset: offset,
      monthName: formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1),
      monthlyTotals: {
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
      },
    };
  }, [year, month, transactionsByDate]);

  const handleDayClick = (dayNumber: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      dayNumber
    ).padStart(2, "0")}`;
    setSelectedDayString(key);
    setIsDaySheetOpen(true);
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDayString) return null;
    const txs = transactionsByDate.get(selectedDayString) || [];
    let income = 0;
    let expense = 0;

    for (const t of txs) {
      if (t.type === "INCOME") income += t.amount;
      if (t.type === "EXPENSE") expense += t.amount;
    }

    const [y, m, d] = selectedDayString.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const formattedLongDate = new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);

    return {
      dateString: selectedDayString,
      displayDate:
        formattedLongDate.charAt(0).toUpperCase() + formattedLongDate.slice(1),
      transactions: txs,
      income,
      expense,
      net: income - expense,
    };
  }, [selectedDayString, transactionsByDate]);

  const yearMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      let income = 0;
      let expense = 0;

      for (let d = 1; d <= 31; d++) {
        const key = `${year}-${String(i + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayTxs = transactionsByDate.get(key);
        if (dayTxs) {
          for (const t of dayTxs) {
            if (t.type === "INCOME") income += t.amount;
            if (t.type === "EXPENSE") expense += t.amount;
          }
        }
      }

      const date = new Date(year, i, 1);
      const name = new Intl.DateTimeFormat("es-MX", { month: "short" }).format(date);

      return {
        monthIndex: i,
        name: name.toUpperCase(),
        income,
        expense,
        net: income - expense,
      };
    });
  }, [year, transactionsByDate]);

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#009fdb]/10 dark:bg-[#153D64]/50 text-[#009fdb] border border-[#009fdb]/30 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              {monthName}
              <TooltipHelp text="Toca cualquier día para consultar su desglose o programar un movimiento en esa fecha." />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Toggle Mes/Año */}
          <div className="flex p-1 bg-slate-100 dark:bg-[#181818] rounded-xl border border-slate-200 dark:border-[#262626]">
            <button
              type="button"
              onClick={() => setViewMode("MONTH")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                viewMode === "MONTH"
                  ? "bg-[#009fdb] text-white shadow-xs"
                  : "text-slate-500 dark:text-neutral-400"
              }`}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => setViewMode("YEAR")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                viewMode === "YEAR"
                  ? "bg-[#009fdb] text-white shadow-xs"
                  : "text-slate-500 dark:text-neutral-400"
              }`}
            >
              Año
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:border-[#009fdb] transition-colors min-h-[38px]"
          >
            Hoy
          </button>
          <div className="flex items-center bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#262626] rounded-xl p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 text-slate-600 dark:text-neutral-400 hover:text-[#009fdb] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 text-slate-600 dark:text-neutral-400 hover:text-[#009fdb] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Bar */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#262626] text-center">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-0.5 font-bold">
            Ingresos
          </span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(monthlyTotals.income)}
          </span>
        </div>
        <div className="border-x border-slate-200 dark:border-[#262626]">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-0.5 font-bold">
            Gastos
          </span>
          <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
            -{formatCurrency(monthlyTotals.expense)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-0.5 font-bold">
            Neto
          </span>
          <span
            className={`text-xs sm:text-sm font-bold ${
              monthlyTotals.net >= 0
                ? "text-[#009fdb]"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(monthlyTotals.net)}
          </span>
        </div>
      </div>

      {/* Grid: Month vs Year */}
      {viewMode === "MONTH" ? (
        <div className="flex flex-col">
          <div className="grid grid-cols-7 mb-2 text-center">
            {weekDays.map((d) => (
              <span
                key={d}
                className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 py-1"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-12 sm:min-h-14" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                day
              ).padStart(2, "0")}`;
              const dayTxs = transactionsByDate.get(dateKey) || [];

              let dayIncome = 0;
              let dayExpense = 0;
              for (const t of dayTxs) {
                if (t.type === "INCOME") dayIncome += t.amount;
                if (t.type === "EXPENSE") dayExpense += t.amount;
              }

              const net = dayIncome - dayExpense;
              const hasTxs = dayTxs.length > 0;
              const isToday =
                new Date().toISOString().split("T")[0] === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`min-h-14 sm:min-h-15 p-1.5 rounded-2xl border flex flex-col justify-between items-start transition-all cursor-pointer relative min-h-touch ${
                    isToday
                      ? "border-[#009fdb] bg-[#009fdb]/10 dark:bg-[#153D64]/35"
                      : "border-slate-100 dark:border-[#262626] bg-slate-50 dark:bg-[#181818] hover:border-neutral-600"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? "text-white bg-[#009fdb] px-1.5 py-0.2 rounded-md"
                        : "text-slate-700 dark:text-neutral-300"
                    }`}
                  >
                    {day}
                  </span>

                  {hasTxs && (
                    <div className="w-full flex flex-col items-end mt-1">
                      <span
                        className={`text-[9px] sm:text-[10px] font-black px-1 rounded-sm truncate max-w-full ${
                          net > 0
                            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80"
                            : net < 0
                            ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80"
                            : "text-neutral-400 bg-neutral-800"
                        }`}
                      >
                        {net > 0 ? "+" : ""}
                        {Math.round(net)}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {yearMonths.map((ym) => (
            <button
              key={ym.name}
              type="button"
              onClick={() => {
                setCurrentDate(new Date(year, ym.monthIndex, 1));
                setViewMode("MONTH");
              }}
              className="p-3 bg-slate-50 dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-[#262626] hover:border-[#009fdb] flex flex-col items-center justify-center transition-all cursor-pointer min-h-touch group"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 group-hover:text-[#009fdb] mb-1">
                {ym.name}
              </span>
              <span
                className={`text-xs font-bold ${
                  ym.net > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : ym.net < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-neutral-400"
                }`}
              >
                {formatCurrency(ym.net)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Day Detail Sheet */}
      <BottomSheet
        isOpen={isDaySheetOpen}
        onClose={() => setIsDaySheetOpen(false)}
        title={selectedDayData ? selectedDayData.displayDate : "Detalle"}
      >
        {selectedDayData && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#262626] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Flujo Neto
                </span>
                <span
                  className={`text-2xl font-black ${
                    selectedDayData.net >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {selectedDayData.net >= 0 ? "+" : ""}
                  {formatCurrency(selectedDayData.net)}
                </span>
              </div>
              <div className="flex flex-col text-right text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(selectedDayData.income)}
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  -{formatCurrency(selectedDayData.expense)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Movimientos ({selectedDayData.transactions.length})
              </span>

              {selectedDayData.transactions.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#181818] flex items-center justify-center text-neutral-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-400">
                    Sin movimientos en esta fecha
                  </p>
                  {onSelectDateForNewTransaction && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDaySheetOpen(false);
                        onSelectDateForNewTransaction(selectedDayData.dateString);
                      }}
                      className="px-4 py-2.5 bg-[#009fdb] text-white font-bold text-xs rounded-xl hover:bg-[#0088bd] transition-colors"
                    >
                      Registrar movimiento
                    </button>
                  )}
                </div>
              ) : (
                selectedDayData.transactions.map((tx) => {
                  const isInc = tx.type === "INCOME";
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-[#262626] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isInc
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                          }`}
                        >
                          {isInc ? (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 stroke-[2.2]" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                            {tx.note || tx.category?.name || "Movimiento"}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {tx.account?.name || "Cuenta"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-sm font-bold ${
                          isInc
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isInc ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default CalendarView;
