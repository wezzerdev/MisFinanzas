"use client";

import React, { useMemo, useState } from "react";
import {
  CreditCard,
  CalendarClock,
  Layers,
  Receipt,
  Calculator,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AccountItem } from "@/components/modules/AccountsGrid";
import { DebtRecord } from "@/components/modules/DebtManager";
import TooltipHelp from "@/components/ui/TooltipHelp";

interface CreditCardSummaryProps {
  accounts: AccountItem[];
  transactions: any[];
  debts: DebtRecord[];
  onConfigureCard?: (account: AccountItem) => void;
}

/**
 * Calculates days remaining until the next occurrence of a target day-of-month (1..31),
 * and returns the start of the current billing cycle based on cutoffDay.
 */
function getBillingCycleMetrics(cutoffDay?: number | null, paymentDueDay?: number | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const cDay = cutoffDay && cutoffDay >= 1 && cutoffDay <= 31 ? cutoffDay : 15;
  const pDay =
    paymentDueDay && paymentDueDay >= 1 && paymentDueDay <= 31 ? paymentDueDay : 5;

  // Next cutoff date
  let nextCutoff = new Date(today.getFullYear(), today.getMonth(), cDay);
  if (nextCutoff < today) {
    nextCutoff = new Date(today.getFullYear(), today.getMonth() + 1, cDay);
  }

  // Last cutoff date (start of current cycle)
  const lastCutoff = new Date(
    nextCutoff.getFullYear(),
    nextCutoff.getMonth() - 1,
    cDay
  );

  // Next payment due date
  let nextPaymentDue = new Date(today.getFullYear(), today.getMonth(), pDay);
  if (nextPaymentDue < today) {
    nextPaymentDue = new Date(today.getFullYear(), today.getMonth() + 1, pDay);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToCutoff = Math.max(
    0,
    Math.ceil((nextCutoff.getTime() - today.getTime()) / msPerDay)
  );
  const daysToPayment = Math.max(
    0,
    Math.ceil((nextPaymentDue.getTime() - today.getTime()) / msPerDay)
  );

  const fmt = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  });

  return {
    lastCutoff,
    nextCutoffLabel: fmt.format(nextCutoff),
    nextPaymentLabel: fmt.format(nextPaymentDue),
    daysToCutoff,
    daysToPayment,
    hasConfiguredDates: Boolean(cutoffDay || paymentDueDay),
  };
}

export const CreditCardSummary: React.FC<CreditCardSummaryProps> = ({
  accounts,
  transactions,
  debts,
  onConfigureCard,
}) => {
  const creditCards = useMemo(
    () => accounts.filter((acc) => acc.type === "CREDIT"),
    [accounts]
  );

  const [selectedCardId, setSelectedCardId] = useState<string>("ALL");

  const activeCard = useMemo(() => {
    if (creditCards.length === 0) return null;
    if (selectedCardId === "ALL" && creditCards.length === 1) {
      return creditCards[0];
    }
    return creditCards.find((c) => c.id === selectedCardId) || null;
  }, [creditCards, selectedCardId]);

  const analytics = useMemo(() => {
    if (creditCards.length === 0) return null;

    const targetCards = activeCard ? [activeCard] : creditCards;
    const targetCardIds = new Set(targetCards.map((c) => c.id));

    // Reference cycle dates (from selected card or first credit card)
    const refCard = activeCard || creditCards[0];
    const cycle = getBillingCycleMetrics(refCard.cutoffDay, refCard.paymentDueDay);

    // 1. Total de Compras Corrientes (Pago único en el ciclo actual que se liquida al corte)
    // Excludes deferred MSI purchases (>1 installment) and retroactive backlog entries
    const currentCycleRegularExpenses = transactions
      .filter((tx) => {
        if (!targetCardIds.has(tx.accountId)) return false;
        if (tx.type !== "EXPENSE") return false;
        if (tx.isRetroactive) return false;
        if (tx.installments && Number(tx.installments) > 1) return false;
        if (tx.debt?.isMsi && Number(tx.debt?.installments) > 1) return false;

        const txDate = new Date(tx.date);
        return txDate >= cycle.lastCutoff;
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    // 2. Suma de Mensualidades Activas (MSI / Plazos vigentes en la tarjeta)
    const activeCardMsiDebts = debts.filter((d) => {
      if (d.status !== "ACTIVE") return false;
      if (d.accountId && targetCardIds.has(d.accountId)) {
        return Boolean(d.isMsi || (d.installments && d.installments > 1));
      }
      // Also include general MSI debts if viewing all cards and only 1 credit card exists
      if (!d.accountId && d.isMsi && targetCards.length === creditCards.length) {
        return true;
      }
      return false;
    });

    const monthlyMsiQuota = activeCardMsiDebts.reduce((sum, d) => {
      const remainingBalance = Math.max(0, d.totalAmount - d.paidAmount);
      if (remainingBalance <= 0) return sum;

      const exactQuota =
        d.monthlyPayment && d.monthlyPayment > 0
          ? d.monthlyPayment
          : d.installments && d.installments > 0
          ? d.totalAmount / d.installments
          : remainingBalance;

      return sum + Math.min(remainingBalance, exactQuota);
    }, 0);

    // Total deferred MSI balance remaining across active plans
    const totalDeferredMsiBalance = activeCardMsiDebts.reduce(
      (sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount),
      0
    );

    // 3. Estimado de Pago para el Próximo Corte (Compras Corrientes + Mensualidades MSI del Mes)
    const estimatedNextCutoffPayment =
      currentCycleRegularExpenses + monthlyMsiQuota;

    // 4. Línea de Crédito Utilizada vs Disponible
    const totalCreditLimit = targetCards.reduce(
      (sum, c) => sum + (Number(c.creditLimit) || 0),
      0
    );

    // Used line: sum of current card debt/utilization (either negative balance or deferred + current)
    const rawUsedFromBalance = targetCards.reduce(
      (sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0),
      0
    );
    const totalUsedLine = Math.max(
      rawUsedFromBalance,
      currentCycleRegularExpenses + totalDeferredMsiBalance
    );
    const availableCredit =
      totalCreditLimit > 0 ? Math.max(0, totalCreditLimit - totalUsedLine) : 0;
    const utilizationPct =
      totalCreditLimit > 0
        ? Math.min(100, Math.round((totalUsedLine / totalCreditLimit) * 100))
        : 0;

    return {
      cycle,
      currentCycleRegularExpenses,
      monthlyMsiQuota,
      activeMsiCount: activeCardMsiDebts.length,
      totalDeferredMsiBalance,
      estimatedNextCutoffPayment,
      totalCreditLimit,
      totalUsedLine,
      availableCredit,
      utilizationPct,
      refCard,
    };
  }, [creditCards, activeCard, transactions, debts]);

  if (!analytics || creditCards.length === 0) {
    return null;
  }

  const {
    cycle,
    currentCycleRegularExpenses,
    monthlyMsiQuota,
    activeMsiCount,
    estimatedNextCutoffPayment,
    totalCreditLimit,
    totalUsedLine,
    availableCredit,
    utilizationPct,
    refCard,
  } = analytics;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] shadow-xs flex flex-col gap-4">
      {/* Header & Card Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#153D64]/20 dark:bg-[#153D64]/50 border border-[#009fdb]/30 flex items-center justify-center text-[#009fdb] shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Inteligencia al Próximo Corte
              </h3>
              <TooltipHelp
                text="Calcula en tiempo real el pago para no generar intereses sumando tus compras corrientes del ciclo más las mensualidades activas (MSI)."
                position="bottom"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {activeCard ? activeCard.name : `${creditCards.length} Tarjetas de Crédito`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {creditCards.length > 1 && (
            <div className="flex p-1 bg-slate-100 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-[#262626] gap-1">
              <button
                type="button"
                onClick={() => setSelectedCardId("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedCardId === "ALL"
                    ? "bg-[#009fdb] text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Todas
              </button>
              {creditCards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCardId(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all truncate max-w-[100px] ${
                    selectedCardId === c.id
                      ? "bg-[#009fdb] text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {onConfigureCard && (
            <button
              type="button"
              onClick={() => onConfigureCard(refCard)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#262626] text-slate-500 dark:text-neutral-300 hover:text-[#009fdb] hover:border-[#009fdb] transition-colors"
              title="Configurar límite y fechas de tarjeta"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Core Analytical Pillars: Corrientes + MSI = Estimado al Corte */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Compras Corrientes */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-200/70 dark:border-[#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
              <span>Compras Corrientes</span>
              <TooltipHelp
                text="Gastos de pago único realizados desde tu última fecha de corte que se liquidan al 100%."
                position="top"
              />
            </span>
            <Receipt className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatCurrency(currentCycleRegularExpenses)}
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            Ciclo actual (Contado)
          </span>
        </div>

        {/* 2. Suma de Mensualidades Activas (MSI) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181818] border border-slate-200/70 dark:border-[#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
              <span>Mensualidades MSI</span>
              <TooltipHelp
                text="Suma exacta de la cuota mensual correspondiente a este mes de todas tus compras a plazos activas."
                position="top"
              />
            </span>
            <Layers className="w-3.5 h-3.5 text-[#009fdb]" />
          </div>
          <span className="text-lg sm:text-xl font-black text-[#009fdb]">
            {formatCurrency(monthlyMsiQuota)}
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            {activeMsiCount === 0
              ? "Sin planes MSI activos"
              : `${activeMsiCount} ${
                  activeMsiCount === 1 ? "plan vigente" : "planes vigentes"
                }`}
          </span>
        </div>

        {/* 3. Estimado de Pago para el Próximo Corte */}
        <div className="p-3.5 rounded-2xl bg-[#009fdb]/10 dark:bg-[#153D64]/35 border border-[#009fdb]/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#009fdb] flex items-center gap-1">
              <span>Estimado al Corte</span>
              <TooltipHelp
                text="Pago para no generar intereses: Compras Corrientes del ciclo + Mensualidades MSI del mes."
                position="top"
              />
            </span>
            <Calculator className="w-3.5 h-3.5 text-[#009fdb]" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(estimatedNextCutoffPayment)}
          </span>
          <span className="text-[10px] font-semibold text-[#009fdb] mt-0.5">
            Pago para no generar intereses
          </span>
        </div>
      </div>

      {/* Credit Line Utilization & Cutoff / Payment Due Countdown Bar */}
      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 dark:border-[#262626]">
        {totalCreditLimit > 0 ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">
                Línea utilizada:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {formatCurrency(totalUsedLine)}
                </strong>{" "}
                ({utilizationPct}%)
              </span>
              <span className="text-neutral-400">
                Disponible:{" "}
                <strong className="text-emerald-500">
                  {formatCurrency(availableCredit)}
                </strong>{" "}
                / {formatCurrency(totalCreditLimit)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#181818] overflow-hidden border border-slate-200/50 dark:border-[#262626]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  utilizationPct > 80
                    ? "bg-rose-500"
                    : utilizationPct > 50
                    ? "bg-amber-500"
                    : "bg-[#009fdb]"
                }`}
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
          </div>
        ) : (
          onConfigureCard && (
            <div className="flex items-center justify-between text-xs text-neutral-400 bg-slate-50 dark:bg-[#181818] px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-[#262626]">
              <span>
                Configura tu límite de crédito y días de corte para ver tu línea disponible.
              </span>
              <button
                type="button"
                onClick={() => onConfigureCard(refCard)}
                className="text-[#009fdb] font-bold hover:underline shrink-0 ml-2"
              >
                Configurar
              </button>
            </div>
          )
        )}

        {/* Cutoff & Payment Due Alerts */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#181818] border border-slate-200/60 dark:border-[#262626]">
            <CalendarClock className="w-3.5 h-3.5 text-[#009fdb]" />
            <span className="text-neutral-400">
              Próximo corte:{" "}
              <strong className="text-slate-900 dark:text-white">
                {cycle.nextCutoffLabel}
              </strong>{" "}
              ({cycle.daysToCutoff === 0 ? "Hoy" : `en ${cycle.daysToCutoff} días`})
            </span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              cycle.daysToPayment <= 5
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-slate-50 dark:bg-[#181818] border-slate-200/60 dark:border-[#262626] text-neutral-400"
            }`}
          >
            <AlertCircle
              className={`w-3.5 h-3.5 ${
                cycle.daysToPayment <= 5 ? "text-amber-400" : "text-emerald-500"
              }`}
            />
            <span>
              Fecha límite de pago:{" "}
              <strong className="text-slate-900 dark:text-white">
                {cycle.nextPaymentLabel}
              </strong>{" "}
              ({cycle.daysToPayment === 0 ? "Hoy" : `en ${cycle.daysToPayment} días`})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardSummary;
