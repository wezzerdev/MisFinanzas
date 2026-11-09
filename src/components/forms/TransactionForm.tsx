"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  Tag,
  CreditCard,
  Plus,
  Check,
  Loader2,
  FileText,
  Repeat,
  Layers,
  Calculator,
  Settings2,
  Landmark,
  History,
  HandCoins,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { ReceiptOcrResult } from "@/lib/ollama";
import { formatCurrency } from "@/lib/utils";
import CategorySelector, { Category } from "@/components/ui/CategorySelector";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import CategoryManagerModal from "@/components/modals/CategoryManagerModal";
import TooltipHelp from "@/components/ui/TooltipHelp";

type FormMode = "EXPENSE" | "INCOME" | "TRANSFER";

interface Account {
  id: string;
  name: string;
  type: "CASH" | "DEBIT" | "CREDIT" | "SAVINGS" | string;
  balance: number;
  creditLimit?: number | null;
  cutoffDay?: number | null;
  paymentDueDay?: number | null;
}

interface TransactionFormProps {
  initialData?: Partial<ReceiptOcrResult>;
  onSuccess: () => void;
  onCancel: () => void;
}

const ACCOUNT_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: "DEBIT", label: "Débito / Nómina", badge: "BANCO" },
  { value: "CREDIT", label: "Tarjeta de Crédito", badge: "TDC" },
  { value: "CASH", label: "Efectivo en Mano", badge: "CASH" },
  { value: "SAVINGS", label: "Ahorros / Inversión", badge: "BÓVEDA" },
];

const MSI_INSTALLMENT_OPTIONS: CustomSelectOption[] = [
  { value: "1", label: "Pago único (Sin plazos)", badge: "CONTADO" },
  { value: "3", label: "3 Meses", badge: "3 MSI" },
  { value: "6", label: "6 Meses", badge: "6 MSI" },
  { value: "9", label: "9 Meses", badge: "9 MSI" },
  { value: "12", label: "12 Meses", badge: "12 MSI" },
  { value: "18", label: "18 Meses", badge: "18 MSI" },
  { value: "24", label: "24 Meses", badge: "24 MSI" },
];

const LOAN_INSTALLMENT_OPTIONS: CustomSelectOption[] = [
  { value: "1", label: "Pago único (Sin plazos)", badge: "1 PAGO" },
  { value: "3", label: "3 Meses", badge: "3 PLAZOS" },
  { value: "6", label: "6 Meses", badge: "6 PLAZOS" },
  { value: "9", label: "9 Meses", badge: "9 PLAZOS" },
  { value: "12", label: "12 Meses", badge: "12 PLAZOS" },
  { value: "18", label: "18 Meses", badge: "18 PLAZOS" },
  { value: "24", label: "24 Meses", badge: "24 PLAZOS" },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<FormMode>(
    initialData?.tipo === "INCOME" ? "INCOME" : "EXPENSE"
  );

  const [amount, setAmount] = useState<string>(
    initialData?.monto ? String(initialData.monto) : ""
  );
  const [note, setNote] = useState<string>(
    initialData?.comercio_o_emisor
      ? `${initialData.comercio_o_emisor}${
          initialData.conceptos?.length ? ` - ${initialData.conceptos.join(", ")}` : ""
        }`
      : ""
  );
  const [date, setDate] = useState<string>(
    initialData?.fecha || new Date().toISOString().split("T")[0]
  );

  // REGLA DE ORO: Movimiento Recurrente siempre visible en Gasto e Ingreso
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  // 1. COMPRA A PLAZOS (MSI) -> Visible solo cuando mode === "EXPENSE" && cuenta === "CREDIT"
  const [isMsiEnabled, setIsMsiEnabled] = useState<boolean>(false);

  // 2. DEUDA / PRÉSTAMO -> Visible solo cuando mode === "EXPENSE" && cuenta !== "CREDIT"
  const [isLoanEnabled, setIsLoanEnabled] = useState<boolean>(false);
  const [loanDirection, setLoanDirection] = useState<"I_OWE" | "THEY_OWE">("I_OWE");

  // Campos de pasivo/activo (para MSI o Deuda/Préstamo)
  const [debtCounterparty, setDebtCounterparty] = useState<string>("");
  const [installments, setInstallments] = useState<number>(6);
  const [debtDueDate, setDebtDueDate] = useState<string>("");

  // Registro Retroactivo / Backlog Inteligente
  const [isRetroactive, setIsRetroactive] = useState<boolean>(false);
  const [remainingInstallments, setRemainingInstallments] = useState<string>("4");
  const [pendingAmount, setPendingAmount] = useState<string>("");

  // Cuentas & Creación Rápida Inline
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [destinationAccountId, setDestinationAccountId] = useState<string>("");
  const [isAddingAccount, setIsAddingAccount] = useState<boolean>(false);
  const [newAccountName, setNewAccountName] = useState<string>("");
  const [newAccountType, setNewAccountType] = useState<string>("DEBIT");
  const [newAccountBalance, setNewAccountBalance] = useState<string>("");
  const [newCreditLimit, setNewCreditLimit] = useState<string>("");
  const [newCutoffDay, setNewCutoffDay] = useState<string>("15");
  const [newPaymentDueDay, setNewPaymentDueDay] = useState<string>("5");

  // Categorías & Modal CRUD
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingMetadata, setFetchingMetadata] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCategoriesOnly = useCallback(async () => {
    try {
      const catRes = await fetch("/api/categories");
      const catJson = await catRes.json();
      if (catJson.success && catJson.data.length > 0) {
        setCategories(catJson.data);
        setSelectedCategoryId((prev) => {
          const exists = catJson.data.some((c: Category) => c.id === prev);
          return exists ? prev : catJson.data[0].id;
        });
      }
    } catch (err) {
      console.error("Error refreshing categories:", err);
    }
  }, []);

  // Carga inicial de Cuentas y Categorías
  useEffect(() => {
    async function loadData() {
      try {
        setFetchingMetadata(true);
        const [accRes, catRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/categories"),
        ]);

        const accJson = await accRes.json();
        const catJson = await catRes.json();

        if (accJson.success) {
          setAccounts(accJson.data);
          if (accJson.data.length > 0) {
            setSelectedAccountId(accJson.data[0].id);
            if (accJson.data.length > 1) {
              setDestinationAccountId(accJson.data[1].id);
            }
          } else {
            setIsAddingAccount(true);
          }
        }

        if (catJson.success && catJson.data.length > 0) {
          setCategories(catJson.data);

          if (initialData?.categoria_sugerida) {
            const match = catJson.data.find(
              (c: Category) =>
                c.name.toLowerCase() ===
                initialData.categoria_sugerida?.toLowerCase()
            );
            setSelectedCategoryId(match ? match.id : catJson.data[0].id);
          } else {
            const targetType =
              initialData?.tipo === "INCOME" ? "INCOME" : "EXPENSE";
            const firstOfType = catJson.data.find(
              (c: Category) => c.type === targetType
            );
            setSelectedCategoryId(
              firstOfType ? firstOfType.id : catJson.data[0].id
            );
          }
        }
      } catch (err: any) {
        console.error("Error loading form data:", err);
      } finally {
        setFetchingMetadata(false);
      }
    }

    loadData();
  }, [initialData]);

  // Verificación de tipo de cuenta seleccionada
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const isCreditAccount = selectedAccount?.type === "CREDIT";

  // Sincronización dinámica al cambiar entre Tarjeta de Crédito y Efectivo/Débito o al cambiar modo
  useEffect(() => {
    if (mode !== "EXPENSE") {
      setIsMsiEnabled(false);
      setIsLoanEnabled(false);
      setIsRetroactive(false);
      return;
    }

    if (isCreditAccount) {
      // Si es Tarjeta de Crédito: ocultar y apagar Deuda/Préstamo
      if (isLoanEnabled) {
        setIsLoanEnabled(false);
        setIsRetroactive(false);
      }
    } else {
      // Si NO es Tarjeta de Crédito (Efectivo/Débito/Ahorros): ocultar y apagar MSI
      if (isMsiEnabled) {
        setIsMsiEnabled(false);
        setIsRetroactive(false);
      }
    }
  }, [mode, isCreditAccount, isLoanEnabled, isMsiEnabled]);

  // Mantener la categoría sincronizada con el modo (EXPENSE vs INCOME)
  useEffect(() => {
    if (mode !== "EXPENSE" && mode !== "INCOME") return;
    const matching = categories.filter((c) => c.type === mode);
    if (
      matching.length > 0 &&
      !matching.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(matching[0].id);
    }
  }, [mode, categories, selectedCategoryId]);

  // Cálculo automático de saldo pendiente en modo retroactivo (Backlog Inteligente)
  const parsedAmount = parseFloat(amount) || 0;
  const parsedRemainingMonths = Math.max(
    1,
    Math.min(installments, parseInt(remainingInstallments || "1", 10) || 1)
  );

  useEffect(() => {
    if (isRetroactive && parsedAmount > 0 && installments > 0) {
      const computedPending = Number(
        ((parsedAmount / installments) * parsedRemainingMonths).toFixed(2)
      );
      setPendingAmount(String(computedPending));
    }
  }, [isRetroactive, parsedAmount, installments, parsedRemainingMonths]);

  // Opciones de cuentas para CustomSelect
  const accountOptions = useMemo<CustomSelectOption[]>(
    () =>
      accounts.map((acc) => ({
        value: acc.id,
        label: acc.name,
        badge: acc.type === "CREDIT" ? "CRÉDITO" : acc.type,
        sublabel: formatCurrency(acc.balance),
      })),
    [accounts]
  );

  const destinationAccountOptions = useMemo<CustomSelectOption[]>(
    () =>
      accounts
        .filter((acc) => acc.id !== selectedAccountId)
        .map((acc) => ({
          value: acc.id,
          label: acc.name,
          badge: acc.type,
          sublabel: formatCurrency(acc.balance),
        })),
    [accounts, selectedAccountId]
  );

  // Creación rápida de cuenta inline
  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccountName.trim(),
          type: newAccountType,
          balance: parseFloat(newAccountBalance) || 0,
          creditLimit:
            newAccountType === "CREDIT" && newCreditLimit
              ? parseFloat(newCreditLimit)
              : null,
          cutoffDay:
            newAccountType === "CREDIT" && newCutoffDay
              ? parseInt(newCutoffDay, 10)
              : null,
          paymentDueDay:
            newAccountType === "CREDIT" && newPaymentDueDay
              ? parseInt(newPaymentDueDay, 10)
              : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) => {
          const updated = [...prev, data.data];
          if (updated.length === 2 && !destinationAccountId) {
            setDestinationAccountId(data.data.id);
          }
          return updated;
        });
        setSelectedAccountId(data.data.id);
        setNewAccountName("");
        setNewAccountBalance("");
        setNewCreditLimit("");
        setIsAddingAccount(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Creación rápida de categoría inline
  const handleCreateCategoryInline = async (
    name: string
  ): Promise<Category | null> => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: mode === "INCOME" ? "INCOME" : "EXPENSE",
          color: mode === "INCOME" ? "#10b981" : "#009fdb",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => [...prev, data.data]);
        setSelectedCategoryId(data.data.id);
        return data.data;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Toggle Compra a Plazos (MSI) — Solo visible y aplicable cuando es Gasto + Tarjeta de Crédito
  const handleToggleMsi = () => {
    if (!isCreditAccount || mode !== "EXPENSE") return;
    const next = !isMsiEnabled;
    setIsMsiEnabled(next);
    if (next) {
      setIsLoanEnabled(false);
      if (installments <= 1) setInstallments(6);
    } else {
      setIsRetroactive(false);
    }
  };

  // Toggle Deuda / Préstamo — Solo visible y aplicable cuando es Gasto + Cuenta NO Crédito (Efectivo/Débito/Ahorros)
  const handleToggleLoan = () => {
    if (isCreditAccount || mode !== "EXPENSE") return;
    const next = !isLoanEnabled;
    setIsLoanEnabled(next);
    if (next) {
      setIsMsiEnabled(false);
      setLoanDirection("I_OWE");
      if (!installments) setInstallments(1);
    } else {
      setIsRetroactive(false);
    }
  };

  const activeMsi = mode === "EXPENSE" && isCreditAccount && isMsiEnabled;
  const activeLoan = mode === "EXPENSE" && !isCreditAccount && isLoanEnabled;
  const hasActiveFinancing = activeMsi || activeLoan;

  // Cálculo de mensualidad (respetando Backlog Inteligente si está activo)
  const effectivePendingBalance =
    isRetroactive && parseFloat(pendingAmount) > 0
      ? parseFloat(pendingAmount)
      : parsedAmount;

  const monthlyPaymentAmount =
    hasActiveFinancing && installments > 0
      ? isRetroactive
        ? effectivePendingBalance / parsedRemainingMonths
        : parsedAmount / installments
      : 0;

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (parsedAmount <= 0) {
      setErrorMsg("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (!selectedAccountId) {
      setErrorMsg("Selecciona una cuenta.");
      return;
    }

    if (mode === "TRANSFER" && !destinationAccountId) {
      setErrorMsg("Selecciona la cuenta destino.");
      return;
    }

    if (mode === "TRANSFER" && selectedAccountId === destinationAccountId) {
      setErrorMsg("Las cuentas deben ser diferentes.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        amount: parsedAmount,
        type: mode,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
        accountId: selectedAccountId,
        destinationAccountId: mode === "TRANSFER" ? destinationAccountId : null,
        categoryId: selectedCategoryId || categories[0]?.id,
        // Movimiento Recurrente siempre respeta el switch del usuario
        isRecurring:
          mode === "EXPENSE" || mode === "INCOME" ? isRecurring : false,
        isMsi: activeMsi,
        isLoan: activeLoan,
        loanType: activeLoan ? loanDirection : "I_OWE",
        counterparty: activeMsi
          ? debtCounterparty.trim() ||
            selectedAccount?.name ||
            "Tarjeta de Crédito"
          : activeLoan
          ? debtCounterparty.trim() || "Tercero / Acreedor"
          : null,
        installments: activeMsi || activeLoan ? installments : null,
        remainingInstallments:
          (activeMsi || activeLoan) && isRetroactive
            ? parsedRemainingMonths
            : activeMsi || activeLoan
            ? installments
            : null,
        pendingAmount:
          (activeMsi || activeLoan) && isRetroactive
            ? effectivePendingBalance
            : null,
        isRetroactive: (activeMsi || activeLoan) && isRetroactive,
        dueDate:
          (activeMsi || activeLoan) && debtDueDate ? debtDueDate : null,
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al guardar.");
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 select-none">
        {/* 3 Pilares Nativos: [ Gasto ]  [ Ingreso ]  [ Traspaso ] */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200/80 dark:border-[#262626]">
          <button
            type="button"
            onClick={() => setMode("EXPENSE")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl font-bold text-xs transition-all min-h-[46px] ${
              mode === "EXPENSE"
                ? "bg-white dark:bg-[#181818] text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-[#009fdb]"
                : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 border border-transparent"
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Gasto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("INCOME");
              setIsMsiEnabled(false);
              setIsLoanEnabled(false);
            }}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl font-bold text-xs transition-all min-h-[46px] ${
              mode === "INCOME"
                ? "bg-white dark:bg-[#181818] text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-[#009fdb]"
                : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 border border-transparent"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Ingreso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("TRANSFER");
              setIsMsiEnabled(false);
              setIsLoanEnabled(false);
            }}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl font-bold text-xs transition-all min-h-[46px] ${
              mode === "TRANSFER"
                ? "bg-white dark:bg-[#181818] text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-[#009fdb]"
                : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 border border-transparent"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-[#009fdb] shrink-0" />
            <span>Traspaso</span>
          </button>
        </div>

        {/* Hero Amount Input */}
        <div className="flex flex-col items-center justify-center py-3.5 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200/60 dark:border-[#262626] p-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
            {isRetroactive ? "Monto Total Original" : "Monto"}
          </span>
          <div className="flex items-center justify-center gap-1 w-full">
            <span className="text-2xl sm:text-3xl font-light text-neutral-400 dark:text-neutral-500">
              $
            </span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              className="w-44 sm:w-60 bg-transparent text-center text-3xl sm:text-5xl font-black focus:outline-none placeholder:text-slate-300 dark:placeholder:text-neutral-700 text-slate-900 dark:text-white tracking-tight appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs font-bold text-neutral-400">MXN</span>
          </div>

          {/* Live Installment / Debt Preview Pill */}
          {hasActiveFinancing && parsedAmount > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#153D64]/20 dark:bg-[#153D64]/45 border border-[#009fdb]/40 text-[#009fdb] text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5 shrink-0" />
              <span>
                {installments === 1
                  ? activeMsi
                    ? `Pago único al próximo corte: ${formatCurrency(parsedAmount)}`
                    : `Deuda / Préstamo de pago único: ${formatCurrency(parsedAmount)}`
                  : isRetroactive
                  ? `Restan ${parsedRemainingMonths} de ${installments} pagos · ${formatCurrency(
                      monthlyPaymentAmount
                    )} / mes`
                  : `${installments}x ${formatCurrency(monthlyPaymentAmount)} / mes`}
              </span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-3.5">
          {/* Selector de Cuenta Origen mediante CustomSelect */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#009fdb]" />
                <span>{mode === "TRANSFER" ? "Origen" : "Cuenta"}</span>
                <TooltipHelp
                  text="Selecciona la cuenta o cartera donde impactará este movimiento."
                  position="right"
                />
              </label>
              <button
                type="button"
                onClick={() => setIsAddingAccount(!isAddingAccount)}
                className="text-xs text-[#009fdb] hover:underline flex items-center gap-0.5 font-semibold py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingAccount ? "Cancelar" : "Nueva Cuenta"}
              </button>
            </div>

            {isAddingAccount ? (
              <div className="flex flex-col gap-2.5 p-3.5 bg-slate-100 dark:bg-[#0a0a0a] rounded-2xl border border-[#009fdb]/40">
                <span className="text-[11px] font-bold text-[#009fdb]">
                  Nueva Cuenta o Tarjeta
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (Ej. BBVA TDC, Efectivo)"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="bg-white dark:bg-[#121212] text-sm px-3 py-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-[#262626] min-h-[44px]"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Saldo inicial ($0.00)"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                    className="bg-white dark:bg-[#121212] text-sm px-3 py-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-[#262626] min-h-[44px] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {newAccountType === "CREDIT" && (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      step="100"
                      placeholder="Límite ($)"
                      value={newCreditLimit}
                      onChange={(e) => setNewCreditLimit(e.target.value)}
                      className="bg-white dark:bg-[#121212] text-xs px-3 py-2 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-[#262626] min-h-[40px] appearance-none [appearance:textfield]"
                    />
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Día Corte (15)"
                      value={newCutoffDay}
                      onChange={(e) => setNewCutoffDay(e.target.value)}
                      className="bg-white dark:bg-[#121212] text-xs px-3 py-2 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-[#262626] min-h-[40px] appearance-none [appearance:textfield]"
                    />
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Día Pago (5)"
                      value={newPaymentDueDay}
                      onChange={(e) => setNewPaymentDueDay(e.target.value)}
                      className="bg-white dark:bg-[#121212] text-xs px-3 py-2 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-[#262626] min-h-[40px] appearance-none [appearance:textfield]"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1">
                    <CustomSelect
                      value={newAccountType}
                      onChange={setNewAccountType}
                      options={ACCOUNT_TYPE_OPTIONS}
                      placeholder="Tipo de cuenta..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    className="h-12 min-h-[48px] px-5 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white text-xs font-bold transition-all flex items-center justify-center shrink-0 active:scale-[0.98]"
                  >
                    Crear
                  </button>
                </div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] text-xs text-neutral-400 flex items-center justify-between">
                <span>Sin cuentas registradas.</span>
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(true)}
                  className="text-[#009fdb] font-bold underline"
                >
                  Crear cuenta
                </button>
              </div>
            ) : (
              <CustomSelect
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                options={accountOptions}
                placeholder="Seleccionar cuenta..."
                leftIcon={<CreditCard className="w-4 h-4 text-[#009fdb]" />}
              />
            )}
          </div>

          {/* Mode: TRANSFER -> Cuenta Destino */}
          {mode === "TRANSFER" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>Destino</span>
              </label>
              <CustomSelect
                value={destinationAccountId}
                onChange={setDestinationAccountId}
                options={destinationAccountOptions}
                placeholder="Seleccionar cuenta destino..."
                leftIcon={<CreditCard className="w-4 h-4 text-emerald-500" />}
              />
            </div>
          )}

          {/* Selector de Categoría con Iconos de lucide-react (para EXPENSE e INCOME) */}
          {(mode === "EXPENSE" || mode === "INCOME") && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#009fdb]" />
                  <span>Categoría</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="text-xs text-[#009fdb] hover:underline flex items-center gap-1 font-semibold py-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Gestionar</span>
                </button>
              </div>

              <CategorySelector
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                filterType={mode === "INCOME" ? "INCOME" : "EXPENSE"}
                categories={categories}
                isLoading={fetchingMetadata}
                onCreateNew={handleCreateCategoryInline}
                onManage={() => setIsCategoryManagerOpen(true)}
                placeholder="Seleccionar categoría..."
              />
            </div>
          )}

          {/* Concepto / Descripción y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Concepto</span>
              </label>
              <input
                type="text"
                placeholder={
                  mode === "TRANSFER"
                    ? "Traspaso"
                    : "Ej. Supermercado, Préstamo, Laptop..."
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-12 min-h-[48px] max-h-[48px] bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-4 text-[16px] sm:text-sm text-slate-900 dark:text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-[#009fdb] focus:ring-1 focus:ring-[#009fdb] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Fecha</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 min-h-[48px] max-h-[48px] bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-4 text-[16px] sm:text-sm text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-[#009fdb] focus:ring-1 focus:ring-[#009fdb] transition-colors appearance-none [-webkit-appearance:none] leading-[48px] py-0 [&::-webkit-date-and-time-value]:m-0 [&::-webkit-date-and-time-value]:p-0 [&::-webkit-date-and-time-value]:leading-[48px] [&::-webkit-date-and-time-value]:text-left [color-scheme:dark]"
              />
            </div>
          </div>

          {/* =================================================================
              REGLA CONDICIONAL 1: Si es GASTO y la cuenta ES Tarjeta de Crédito (CREDIT)
              -> Muestra "Compra a Plazos (MSI)" y oculta por completo "Deuda / Préstamo"
          ================================================================= */}
          {mode === "EXPENSE" && isCreditAccount && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121212] border border-slate-200/70 dark:border-[#262626] flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between gap-2 min-h-[32px]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#153D64]/20 dark:bg-[#153D64]/50 text-[#009fdb] border border-[#009fdb]/30 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                      Compra a Plazos (MSI)
                    </span>
                    <TooltipHelp
                      text="Diferir esta compra a Meses Sin Intereses (MSI) en tu Tarjeta de Crédito."
                      position="top"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isMsiEnabled}
                  onClick={handleToggleMsi}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                    isMsiEnabled
                      ? "bg-[#009fdb]"
                      : "bg-slate-300 dark:bg-[#262626]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      isMsiEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Despliegue de Campos MSI */}
              {isMsiEnabled && (
                <div className="pt-3 border-t border-slate-200/60 dark:border-[#262626] flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-[#009fdb]" />
                        <span>Comercio / Banco</span>
                        <TooltipHelp
                          text="Comercio donde realizaste la compra a meses sin intereses."
                          position="right"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder={`Ej. Amazon, Apple (${selectedAccount?.name || "TDC"})`}
                        value={debtCounterparty}
                        onChange={(e) => setDebtCounterparty(e.target.value)}
                        className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <span>Plazo (Mensualidades)</span>
                        <TooltipHelp
                          text="Elige Pago único (Sin plazos), un plazo MSI estándar o escribe abajo cualquier número de meses personalizado."
                          position="left"
                        />
                      </label>
                      <CustomSelect
                        value={String(installments)}
                        onChange={(val) => {
                          const parsed = parseInt(val, 10) || 1;
                          setInstallments(parsed);
                          if (parsed <= 1) setIsRetroactive(false);
                        }}
                        options={MSI_INSTALLMENT_OPTIONS}
                        allowCustomValue={true}
                        customValuePlaceholder="Otro plazo (ej. 5, 10, 36)..."
                        formatCustomLabel={(val) =>
                          val === "1" ? "Pago único (Sin plazos)" : `${val} Meses`
                        }
                        formatCustomBadge={(val) =>
                          val === "1" ? "CONTADO" : `${val} MSI`
                        }
                      />
                    </div>
                  </div>

                  {/* Backlog Inteligente para MSI */}
                  {installments > 1 && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-[#262626] flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <History className="w-4 h-4 text-[#009fdb] shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate">
                            Compra anterior / Saldo pendiente
                          </span>
                          <TooltipHelp
                            text="Actívalo si adquiriste esta compra meses atrás. El motor solo registrará las mensualidades restantes a partir del próximo corte sin distorsionar tu flujo de caja."
                            position="top"
                          />
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isRetroactive}
                          onClick={() => setIsRetroactive(!isRetroactive)}
                          className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                            isRetroactive
                              ? "bg-[#009fdb]"
                              : "bg-slate-300 dark:bg-[#262626]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                              isRetroactive ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {isRetroactive && (
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-[#262626]">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Meses Restantes (de {installments})
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={installments}
                              value={remainingInstallments}
                              onChange={(e) =>
                                setRemainingInstallments(e.target.value)
                              }
                              className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[42px] appearance-none [appearance:textfield]"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Saldo Pendiente ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={pendingAmount}
                              onChange={(e) => setPendingAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2 text-xs font-bold text-[#009fdb] focus:outline-none focus:border-[#009fdb] min-h-[42px] appearance-none [appearance:textfield]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              REGLA CONDICIONAL 2 Y 3: Si es GASTO y la cuenta NO es Tarjeta de Crédito
              (ej. Efectivo CASH, Débito DEBIT, Ahorros SAVINGS)
              -> Muestra "Deuda / Préstamo" y oculta por completo "Compra a Plazos (MSI)"
              -> En modo INGRESO (INCOME), se oculta totalmente.
          ================================================================= */}
          {mode === "EXPENSE" && !isCreditAccount && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121212] border border-slate-200/70 dark:border-[#262626] flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between gap-2 min-h-[32px]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#153D64]/20 dark:bg-[#153D64]/50 text-[#009fdb] flex items-center justify-center shrink-0 border border-[#009fdb]/30">
                    <HandCoins className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                      Deuda / Préstamo
                    </span>
                    <TooltipHelp
                      text="Registra una deuda o préstamo con un tercero (acreedor, familiar, amigo) desde tu cuenta de Efectivo o Débito y vincúlalo al Módulo de Deudas."
                      position="top"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isLoanEnabled}
                  onClick={handleToggleLoan}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                    isLoanEnabled
                      ? "bg-[#009fdb]"
                      : "bg-slate-300 dark:bg-[#262626]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      isLoanEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Despliegue de Campos de Deuda / Préstamo */}
              {isLoanEnabled && (
                <div className="pt-3 border-t border-slate-200/60 dark:border-[#262626] flex flex-col gap-3">
                  {/* Dirección del Pasivo / Activo */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-[#0a0a0a] rounded-xl border border-slate-200/60 dark:border-[#262626]">
                    <button
                      type="button"
                      onClick={() => setLoanDirection("I_OWE")}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${
                        loanDirection === "I_OWE"
                          ? "bg-white dark:bg-[#153D64] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb]"
                          : "text-neutral-400 border border-transparent"
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                      <span>Yo Debo (Pasivo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanDirection("THEY_OWE")}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${
                        loanDirection === "THEY_OWE"
                          ? "bg-white dark:bg-[#153D64] text-slate-900 dark:text-white border border-slate-200/60 dark:border-[#009fdb]"
                          : "text-neutral-400 border border-transparent"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Me Deben (Presté)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-[#009fdb]" />
                        <span>
                          {loanDirection === "I_OWE"
                            ? "Acreedor / Familiar"
                            : "Deudor / Persona"}
                        </span>
                        <TooltipHelp
                          text="Nombre de la persona, familiar o institución vinculada a esta deuda o préstamo."
                          position="right"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Papá, Amigo, Financiera..."
                        value={debtCounterparty}
                        onChange={(e) => setDebtCounterparty(e.target.value)}
                        className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <span>Plazo (Opcional)</span>
                        <TooltipHelp
                          text="Selecciona Pago único o el número de pagos mensuales acordados."
                          position="left"
                        />
                      </label>
                      <CustomSelect
                        value={String(installments)}
                        onChange={(val) => {
                          const parsed = parseInt(val, 10) || 1;
                          setInstallments(parsed);
                          if (parsed <= 1) setIsRetroactive(false);
                        }}
                        options={LOAN_INSTALLMENT_OPTIONS}
                        allowCustomValue={true}
                        customValuePlaceholder="Otro plazo (ej. 4, 8, 15)..."
                        formatCustomLabel={(val) =>
                          val === "1" ? "Pago único (Sin plazos)" : `${val} Meses`
                        }
                        formatCustomBadge={(val) =>
                          val === "1" ? "1 PAGO" : `${val} PLAZOS`
                        }
                      />
                    </div>
                  </div>

                  {/* Fecha Límite de Pago / Vencimiento */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#009fdb]" />
                      <span>Fecha Límite / Vencimiento (Opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full h-12 min-h-[48px] max-h-[48px] bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl px-4 text-[16px] sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] focus:ring-1 focus:ring-[#009fdb] transition-colors appearance-none [-webkit-appearance:none] leading-[48px] py-0 [&::-webkit-date-and-time-value]:m-0 [&::-webkit-date-and-time-value]:p-0 [&::-webkit-date-and-time-value]:leading-[48px] [&::-webkit-date-and-time-value]:text-left [color-scheme:dark]"
                    />
                  </div>

                  {/* Backlog Inteligente si el préstamo es en varios plazos */}
                  {installments > 1 && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-[#262626] flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <History className="w-4 h-4 text-[#009fdb] shrink-0" />
                          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate">
                            Deuda anterior / Saldo pendiente
                          </span>
                          <TooltipHelp
                            text="Actívalo si ya abonaste parte de esta deuda anteriormente y solo deseas registrar los pagos restantes."
                            position="top"
                          />
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isRetroactive}
                          onClick={() => setIsRetroactive(!isRetroactive)}
                          className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                            isRetroactive
                              ? "bg-[#009fdb]"
                              : "bg-slate-300 dark:bg-[#262626]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                              isRetroactive ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {isRetroactive && (
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-[#262626]">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Pagos Restantes (de {installments})
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={installments}
                              value={remainingInstallments}
                              onChange={(e) =>
                                setRemainingInstallments(e.target.value)
                              }
                              className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[42px] appearance-none [appearance:textfield]"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Saldo Pendiente ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={pendingAmount}
                              onChange={(e) => setPendingAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3 py-2 text-xs font-bold text-[#009fdb] focus:outline-none focus:border-[#009fdb] min-h-[42px] appearance-none [appearance:textfield]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              MOVIMIENTO RECURRENTE (VISIBILIDAD PERMANENTE EN GASTO E INGRESO)
          ================================================================= */}
          {(mode === "EXPENSE" || mode === "INCOME") && (
            <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#121212] border border-slate-200/70 dark:border-[#262626]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#153D64]/20 dark:bg-[#153D64]/50 text-[#009fdb] flex items-center justify-center shrink-0 border border-[#009fdb]/30">
                  <Repeat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                  Movimiento Recurrente
                </span>
                <TooltipHelp
                  text="Programa este movimiento (suscripción, renta, nómina o cargo fijo) para repetirse automáticamente cada mes."
                  position="top"
                />
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                  isRecurring
                    ? "bg-[#009fdb]"
                    : "bg-slate-300 dark:bg-[#262626]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    isRecurring ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Botones de Acción Estandarizados (h-12 / 48px touch-target en iOS) */}
        <div className="flex items-center gap-3 pt-3 pb-safe">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-12 min-h-[48px] max-h-[48px] rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#181818] text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#222222] transition-colors flex items-center justify-center select-none active:scale-[0.98]"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading || fetchingMetadata}
            className="flex-2 h-12 min-h-[48px] max-h-[48px] px-6 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs shadow-md shadow-[#009fdb]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 select-none active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal CRUD Completo de Categorías */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoriesChanged={fetchCategoriesOnly}
      />
    </>
  );
};

export default TransactionForm;
