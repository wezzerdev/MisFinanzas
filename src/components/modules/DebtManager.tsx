"use client";

import React, { useState, useMemo } from "react";
import {
  HandCoins,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  CreditCard,
  Layers,
  Landmark,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Check,
  X,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AccountItem } from "@/components/modules/AccountsGrid";
import TooltipHelp from "@/components/ui/TooltipHelp";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";

export interface DebtRecord {
  id: string;
  title: string;
  counterparty?: string | null;
  type: "I_OWE" | "THEY_OWE";
  totalAmount: number;
  paidAmount: number;
  dueDate?: string | null;
  isMsi?: boolean;
  installments?: number | null;
  remainingInstallments?: number | null;
  monthlyPayment?: number | null;
  accountId?: string | null;
  account?: { id: string; name: string; type: string } | null;
  notes?: string | null;
  status: "ACTIVE" | "PAID";
  createdAt: string;
  transactions?: any[];
}

interface DebtManagerProps {
  debts: DebtRecord[];
  accounts: AccountItem[];
  onRefresh: () => void;
}

type FilterView = "I_OWE" | "THEY_OWE" | "MSI" | "PAID";

const DEBT_INSTALLMENT_OPTIONS: CustomSelectOption[] = [
  { value: "", label: "Pago único (Sin plazo)" },
  { value: "3", label: "3 Meses", badge: "3m" },
  { value: "6", label: "6 Meses", badge: "6m" },
  { value: "9", label: "9 Meses", badge: "9m" },
  { value: "12", label: "12 Meses", badge: "12m" },
  { value: "18", label: "18 Meses", badge: "18m" },
  { value: "24", label: "24 Meses", badge: "24m" },
  { value: "36", label: "36 Meses", badge: "36m" },
];

export const DebtManager: React.FC<DebtManagerProps> = ({
  debts,
  accounts,
  onRefresh,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterView>("I_OWE");

  // Modal 1: Abonar / Pagar vinculado a cuenta
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Modal 2: Crear / Editar Deuda Personal o Institucional
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCounterparty, setFormCounterparty] = useState<string>("");
  const [formType, setFormType] = useState<"I_OWE" | "THEY_OWE">("I_OWE");
  const [formTotal, setFormTotal] = useState<string>("");
  const [formPaid, setFormPaid] = useState<string>("0");
  const [formDueDate, setFormDueDate] = useState<string>("");
  const [formIsMsi, setFormIsMsi] = useState<boolean>(false);
  const [formInstallments, setFormInstallments] = useState<string>("");
  const [formAccountId, setFormAccountId] = useState<string>("");
  const [formAffectBalance, setFormAffectBalance] = useState<boolean>(true);
  const [submittingForm, setSubmittingForm] = useState<boolean>(false);

  // Modal 3: Confirmación de Seguridad (Eliminar o Liquidar)
  const [confirmTarget, setConfirmTarget] = useState<{
    debt: DebtRecord;
    mode: "DELETE" | "SETTLE";
  } | null>(null);
  const [settleAccountId, setSettleAccountId] = useState<string>("");
  const [submittingConfirm, setSubmittingConfirm] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Convert accounts to CustomSelectOption[]
  const accountOptions = useMemo<CustomSelectOption[]>(
    () =>
      accounts.map((acc) => ({
        value: acc.id,
        label: acc.name,
        badge: acc.type,
        sublabel: formatCurrency(acc.balance),
      })),
    [accounts]
  );

  const settleAccountOptions = useMemo<CustomSelectOption[]>(
    () => [
      { value: "", label: "Solo marcar como pagada (sin tocar cuentas)" },
      ...accounts.map((acc) => ({
        value: acc.id,
        label: acc.name,
        badge: acc.type,
        sublabel: formatCurrency(acc.balance),
      })),
    ],
    [accounts]
  );

  // Summary metrics
  const activeDebts = debts.filter((d) => d.status === "ACTIVE");

  const totalIOwePersonal = activeDebts
    .filter((d) => d.type === "I_OWE" && !d.isMsi)
    .reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);

  const totalMsiPending = activeDebts
    .filter((d) => d.type === "I_OWE" && d.isMsi)
    .reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);

  const totalTheyOweMe = activeDebts
    .filter((d) => d.type === "THEY_OWE")
    .reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0);

  // Filtered list based on selected tab
  const filteredDebts = debts.filter((d) => {
    if (activeFilter === "PAID") return d.status === "PAID";
    if (d.status === "PAID") return false;
    if (activeFilter === "MSI") return Boolean(d.isMsi);
    if (activeFilter === "I_OWE") return d.type === "I_OWE" && !d.isMsi;
    if (activeFilter === "THEY_OWE") return d.type === "THEY_OWE";
    return true;
  });

  // Open Payment Modal
  const openPayModal = (debt: DebtRecord) => {
    setErrorMsg(null);
    setPayingDebt(debt);
    const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
    if (debt.installments && debt.installments > 1) {
      const suggestedMonthly = Number(
        (debt.totalAmount / debt.installments).toFixed(2)
      );
      setPaymentAmount(String(Math.min(remaining, suggestedMonthly)));
    } else {
      setPaymentAmount(String(remaining));
    }
    setPaymentAccountId(debt.accountId || accounts[0]?.id || "");
    setPaymentNote(
      debt.type === "I_OWE"
        ? `Abono: ${debt.title}`
        : `Cobro: ${debt.title}`
    );
  };

  // Submit Payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    setErrorMsg(null);

    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      setErrorMsg("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (!paymentAccountId) {
      setErrorMsg("Selecciona una cuenta.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/debts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payingDebt.id,
          action: "PAY",
          paymentAmount: amt,
          accountId: paymentAccountId,
          paymentNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo registrar el abono.");
      }
      setPayingDebt(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Open Create / Edit Modal
  const openCreateModal = (defaultType: "I_OWE" | "THEY_OWE" = "I_OWE") => {
    setErrorMsg(null);
    setEditingDebt(null);
    setFormTitle("");
    setFormCounterparty("");
    setFormType(defaultType);
    setFormTotal("");
    setFormPaid("0");
    setFormDueDate("");
    setFormIsMsi(false);
    setFormInstallments("");
    setFormAccountId(accounts[0]?.id || "");
    setFormAffectBalance(accounts.length > 0);
    setIsFormModalOpen(true);
  };

  const openEditModal = (debt: DebtRecord) => {
    setErrorMsg(null);
    setEditingDebt(debt);
    setFormTitle(debt.title);
    setFormCounterparty(debt.counterparty || "");
    setFormType(debt.type);
    setFormTotal(String(debt.totalAmount));
    setFormPaid(String(debt.paidAmount));
    setFormDueDate(
      debt.dueDate ? new Date(debt.dueDate).toISOString().split("T")[0] : ""
    );
    setFormIsMsi(Boolean(debt.isMsi));
    setFormInstallments(debt.installments ? String(debt.installments) : "");
    setFormAccountId(debt.accountId || accounts[0]?.id || "");
    setFormAffectBalance(false);
    setIsFormModalOpen(true);
  };

  // Submit Create or Edit
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedTotal = parseFloat(formTotal);
    const parsedPaid = parseFloat(formPaid) || 0;

    if (!formTitle.trim()) {
      setErrorMsg("El concepto es obligatorio.");
      return;
    }
    if (!parsedTotal || parsedTotal <= 0) {
      setErrorMsg("El monto total debe ser mayor a 0.");
      return;
    }

    setSubmittingForm(true);
    try {
      if (editingDebt) {
        const res = await fetch("/api/debts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDebt.id,
            action: "EDIT",
            title: formTitle.trim(),
            counterparty: formCounterparty.trim() || null,
            type: formType,
            totalAmount: parsedTotal,
            paidAmount: parsedPaid,
            dueDate: formDueDate || null,
            installments: formInstallments ? parseInt(formInstallments, 10) : null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al actualizar.");
        }
      } else {
        const res = await fetch("/api/debts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            counterparty: formCounterparty.trim() || null,
            type: formType,
            totalAmount: parsedTotal,
            paidAmount: parsedPaid,
            dueDate: formDueDate || null,
            isMsi: formIsMsi,
            installments: formInstallments ? parseInt(formInstallments, 10) : null,
            accountId: formAccountId || null,
            affectAccountBalance: formAffectBalance && Boolean(formAccountId),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al crear.");
        }
      }

      setIsFormModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingForm(false);
    }
  };

  // Handle Delete or Settle Confirmation
  const handleExecuteConfirm = async () => {
    if (!confirmTarget) return;
    setSubmittingConfirm(true);
    setErrorMsg(null);

    try {
      if (confirmTarget.mode === "DELETE") {
        const res = await fetch(`/api/debts?id=${confirmTarget.debt.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al eliminar.");
        }
      } else {
        const res = await fetch("/api/debts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: confirmTarget.debt.id,
            action: "SETTLE",
            accountId: settleAccountId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al liquidar.");
        }
      }

      setConfirmTarget(null);
      setSettleAccountId("");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-[#262626] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Por Pagar
              </span>
              <TooltipHelp
                text="Suma total de préstamos personales o bancarios pendientes de liquidar."
                position="bottom"
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center border border-transparent dark:border-rose-500/25">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-black text-rose-500">
            {formatCurrency(totalIOwePersonal)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-[#262626] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Me Deben
              </span>
              <TooltipHelp
                text="Cuentas por cobrar de dinero que prestaste a terceros."
                position="bottom"
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center border border-transparent dark:border-emerald-500/25">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-black text-emerald-500">
            {formatCurrency(totalTheyOweMe)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-[#262626] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Planes MSI
              </span>
              <TooltipHelp
                text="Saldo diferido en compras a Meses Sin Intereses con tarjeta de crédito."
                position="bottom"
              />
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#153D64]/40 text-[#009fdb] flex items-center justify-center border border-transparent dark:border-[#009fdb]/30">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-black text-[#009fdb]">
            {formatCurrency(totalMsiPending)}
          </span>
        </div>
      </div>

      {/* Filter Tabs & "+ Nueva Deuda" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-[#121212] rounded-2xl border border-slate-200/80 dark:border-[#262626] flex-1">
          <button
            type="button"
            onClick={() => setActiveFilter("I_OWE")}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all min-h-[40px] truncate ${
              activeFilter === "I_OWE"
                ? "bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb] shadow-xs"
                : "text-slate-500 dark:text-slate-400 border border-transparent"
            }`}
          >
            Debo
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("THEY_OWE")}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all min-h-[40px] truncate ${
              activeFilter === "THEY_OWE"
                ? "bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb] shadow-xs"
                : "text-slate-500 dark:text-slate-400 border border-transparent"
            }`}
          >
            Me deben
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("MSI")}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all min-h-[40px] truncate ${
              activeFilter === "MSI"
                ? "bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb] shadow-xs"
                : "text-slate-500 dark:text-slate-400 border border-transparent"
            }`}
          >
            MSI
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("PAID")}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all min-h-[40px] truncate ${
              activeFilter === "PAID"
                ? "bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb] shadow-xs"
                : "text-slate-500 dark:text-slate-400 border border-transparent"
            }`}
          >
            Pagadas
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            openCreateModal(activeFilter === "THEY_OWE" ? "THEY_OWE" : "I_OWE")
          }
          className="px-4 py-2.5 bg-[#009fdb] hover:bg-[#0088bd] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-black/40 transition-all min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Deuda</span>
        </button>
      </div>

      {/* Detailed Debt List */}
      {filteredDebts.length === 0 ? (
        <div className="py-12 px-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/70 dark:border-[#262626] text-center flex flex-col items-center justify-center gap-2 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200/50 dark:border-[#262626] flex items-center justify-center text-slate-400">
            <HandCoins className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Sin registros en esta sección
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredDebts.map((d) => {
            const isIOwe = d.type === "I_OWE";
            const remaining = Math.max(0, d.totalAmount - d.paidAmount);
            const percent =
              d.totalAmount > 0
                ? Math.min(100, Math.round((d.paidAmount / d.totalAmount) * 100))
                : 0;
            const monthlyMsi =
              d.monthlyPayment && d.monthlyPayment > 0
                ? d.monthlyPayment
                : d.installments && d.installments > 1
                ? d.totalAmount / d.installments
                : null;

            return (
              <div
                key={d.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-[#262626] flex flex-col gap-3.5 shadow-xs transition-all"
              >
                {/* Top Badges & Quick Edit/Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        d.isMsi
                          ? "bg-[#153D64]/20 text-[#009fdb] border-[#009fdb]/30 dark:bg-[#153D64]/40"
                          : isIOwe
                          ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-500/25"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/25"
                      }`}
                    >
                      {d.isMsi
                        ? `${d.remainingInstallments ? `${d.remainingInstallments}/` : ""}${d.installments || ""} MSI`
                        : isIOwe
                        ? "Debo"
                        : "Me Deben"}
                    </span>

                    {d.counterparty && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-[#262626]">
                        {d.counterparty}
                      </span>
                    )}

                    {d.account && (
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {d.account.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(d)}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#009fdb] hover:bg-slate-100 dark:hover:bg-[#0a0a0a] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setConfirmTarget({ debt: d, mode: "DELETE" });
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Amounts */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {d.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {d.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(d.dueDate)}
                        </span>
                      )}
                      {monthlyMsi && (
                        <span className="text-[#009fdb] font-semibold">
                          {formatCurrency(monthlyMsi)} / mes
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 block">
                      Restante
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-2 bg-slate-100 dark:bg-[#0a0a0a] rounded-full overflow-hidden border border-slate-200/40 dark:border-[#262626]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.status === "PAID" || percent >= 100
                          ? "bg-emerald-500"
                          : d.isMsi
                          ? "bg-[#009fdb]"
                          : isIOwe
                          ? "bg-rose-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {isIOwe ? "Abonado" : "Cobrado"}:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {formatCurrency(d.paidAmount)}
                      </strong>{" "}
                      ({percent}%)
                    </span>
                    <span>Total: {formatCurrency(d.totalAmount)}</span>
                  </div>
                </div>

                {/* Action Footer for Active Debts */}
                {d.status === "ACTIVE" && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#262626]">
                    <button
                      type="button"
                      onClick={() => openPayModal(d)}
                      className="flex-2 py-2.5 px-4 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>{isIOwe ? "Abonar" : "Cobrar"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setSettleAccountId("");
                        setConfirmTarget({ debt: d, mode: "SETTLE" });
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#0a0a0a] hover:bg-[#153D64]/30 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-[#262626] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#009fdb]" />
                      <span>Liquidar</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: ABONAR / PAGAR VINCULADO A CUENTA (z-[60])
      ===================================================================== */}
      {payingDebt && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPayingDebt(null)}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#121212] border-t sm:border border-slate-200 dark:border-[#262626] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#262626] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {payingDebt.type === "I_OWE" ? "Registrar Abono" : "Registrar Cobro"}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {payingDebt.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayingDebt(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0a0a0a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-4 py-3 text-xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {payingDebt.installments && payingDebt.installments > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          String(
                            Number(
                              (
                                payingDebt.totalAmount /
                                payingDebt.installments!
                              ).toFixed(2)
                            )
                          )
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#153D64]/30 text-[#009fdb] border border-[#009fdb]/30 text-[11px] font-bold"
                    >
                      1 Mensualidad
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const rem = Math.max(
                        0,
                        payingDebt.totalAmount - payingDebt.paidAmount
                      );
                      setPaymentAmount(String(Number((rem / 2).toFixed(2))));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-300 border border-transparent dark:border-[#262626] text-[11px] font-bold"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rem = Math.max(
                        0,
                        payingDebt.totalAmount - payingDebt.paidAmount
                      );
                      setPaymentAmount(String(rem));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-transparent dark:border-emerald-500/20 text-[11px] font-bold"
                  >
                    100%
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>Cuenta</span>
                  <TooltipHelp
                    text="El abono descontará o sumará automáticamente el saldo en esta cuenta."
                    position="right"
                  />
                </label>
                {accounts.length === 0 ? (
                  <p className="text-xs text-amber-500">
                    Crea una cuenta primero en Inicio.
                  </p>
                ) : (
                  <CustomSelect
                    value={paymentAccountId}
                    onChange={setPaymentAccountId}
                    options={accountOptions}
                    placeholder="Seleccionar cuenta..."
                    leftIcon={<CreditCard className="w-4 h-4 text-[#009fdb]" />}
                  />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nota
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none min-h-[48px]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-xs font-bold text-slate-400 min-h-[48px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || accounts.length === 0}
                  className="flex-2 py-3 px-5 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white text-xs font-bold flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Confirmar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: CREAR / EDITAR DEUDA (z-[60])
      ===================================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsFormModalOpen(false)}
          />
          <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-[#121212] border-t sm:border border-slate-200 dark:border-[#262626] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#262626] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDebt ? "Editar Deuda" : "Nueva Deuda / Préstamo"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0a0a0a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col gap-3.5">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#262626]">
                <button
                  type="button"
                  onClick={() => setFormType("I_OWE")}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                    formType === "I_OWE"
                      ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb] shadow-xs"
                      : "text-slate-400 border border-transparent"
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  <span>Yo Debo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType("THEY_OWE");
                    setFormIsMsi(false);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                    formType === "THEY_OWE"
                      ? "bg-white dark:bg-[#121212] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb] shadow-xs"
                      : "text-slate-400 border border-transparent"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span>Me Deben</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Concepto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Crédito Auto, Préstamo..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Acreedor / Deudor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. BBVA, Familiar..."
                    value={formCounterparty}
                    onChange={(e) => setFormCounterparty(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Monto Total ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    required
                    className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Abonado ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formPaid}
                    onChange={(e) => setFormPaid(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Plazo (Meses)
                  </label>
                  <CustomSelect
                    value={formInstallments}
                    onChange={setFormInstallments}
                    options={DEBT_INSTALLMENT_OPTIONS}
                    placeholder="Pago único..."
                    allowCustomValue={true}
                    customValuePlaceholder="Escribir meses..."
                  />
                </div>
              </div>

              {/* Option to impact account balance immediately on creation */}
              {!editingDebt && accounts.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Reflejar en saldo de cuenta
                      </span>
                      <TooltipHelp
                        text="Si lo activas, el préstamo sumará o descontará dinero hoy mismo en la cuenta elegida."
                        position="top"
                      />
                    </div>
                    <input
                      type="checkbox"
                      checked={formAffectBalance}
                      onChange={(e) => setFormAffectBalance(e.target.checked)}
                      className="w-4 h-4 accent-[#009fdb]"
                    />
                  </div>
                  {formAffectBalance && (
                    <CustomSelect
                      value={formAccountId}
                      onChange={setFormAccountId}
                      options={accountOptions}
                      placeholder="Seleccionar cuenta..."
                      leftIcon={<CreditCard className="w-4 h-4 text-[#009fdb]" />}
                    />
                  )}
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-xs font-bold text-slate-400 min-h-[48px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="flex-2 py-3 px-5 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white text-xs font-bold flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {submittingForm ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: CONFIRMACIÓN DE SEGURIDAD (ELIMINAR / LIQUIDAR) (z-[60])
      ===================================================================== */}
      {confirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirmTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmTarget.mode === "DELETE"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500"
                    : "bg-[#153D64]/30 text-[#009fdb]"
                }`}
              >
                {confirmTarget.mode === "DELETE" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmTarget.mode === "DELETE"
                    ? "Eliminar Registro"
                    : "Liquidar Deuda"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {confirmTarget.mode === "DELETE" ? (
                    <>
                      ¿Eliminar{" "}
                      <strong className="text-slate-900 dark:text-white">
                        &ldquo;{confirmTarget.debt.title}&rdquo;
                      </strong>
                      ? El historial de transacciones se conserva intacto.
                    </>
                  ) : (
                    <>
                      Se marcará{" "}
                      <strong className="text-slate-900 dark:text-white">
                        &ldquo;{confirmTarget.debt.title}&rdquo;
                      </strong>{" "}
                      como 100% pagada.
                    </>
                  )}
                </p>
              </div>
            </div>

            {confirmTarget.mode === "SETTLE" && accounts.length > 0 && (
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626]">
                <label className="text-[11px] font-bold text-slate-400">
                  Aplicar saldo restante en cuenta (Opcional):
                </label>
                <CustomSelect
                  value={settleAccountId}
                  onChange={setSettleAccountId}
                  options={settleAccountOptions}
                  placeholder="Solo marcar como pagada..."
                />
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-xs font-bold text-slate-400 min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingConfirm}
                onClick={handleExecuteConfirm}
                className={`flex-2 py-2.5 px-5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 min-h-[44px] ${
                  confirmTarget.mode === "DELETE"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#009fdb] hover:bg-[#0088bd]"
                }`}
              >
                {submittingConfirm ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmTarget.mode === "DELETE" ? (
                  <Trash2 className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManager;
