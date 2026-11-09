"use client";

import React, { useState, useEffect, useCallback } from "react";
import MobileHeader from "@/components/navigation/MobileHeader";
import BottomNavBar, { NavTab } from "@/components/navigation/BottomNavBar";
import AccountsGrid, { AccountItem } from "@/components/modules/AccountsGrid";
import CreditCardSummary from "@/components/modules/CreditCardSummary";
import AccountSettingsModal from "@/components/modals/AccountSettingsModal";
import CategoryManagerModal from "@/components/modals/CategoryManagerModal";
import DebtManager, { DebtRecord } from "@/components/modules/DebtManager";
import StatCard from "@/components/ui/StatCard";
import BottomSheet from "@/components/ui/BottomSheet";
import FAB from "@/components/ui/FAB";
import TooltipHelp from "@/components/ui/TooltipHelp";
import TransactionForm from "@/components/forms/TransactionForm";
import AccountForm from "@/components/forms/AccountForm";
import CalendarView from "@/components/modules/CalendarView";
import ChatOllama from "@/components/modules/ChatOllama";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<NavTab>("overview");

  const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);
  const [initialOcrData, setInitialOcrData] = useState<any>(null);

  const [isNewAccountSheetOpen, setIsNewAccountSheetOpen] = useState(false);

  const [selectedAccountForSettings, setSelectedAccountForSettings] =
    useState<AccountItem | null>(null);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [accRes, txRes, debtRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/transactions?limit=50"),
        fetch("/api/debts"),
      ]);

      const [accJson, txJson, debtJson] = await Promise.all([
        accRes.json(),
        txRes.json(),
        debtRes.json(),
      ]);

      if (accJson.success) setAccounts(accJson.data);
      if (txJson.success) setTransactions(txJson.data);
      if (debtJson.success) setDebts(debtJson.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthIncome = currentMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpense = currentMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const activeDebtsNet = debts
    .filter((d) => d.status === "ACTIVE")
    .reduce((acc, curr) => {
      const remaining = Math.max(0, curr.totalAmount - curr.paidAmount);
      return curr.type === "I_OWE" ? acc - remaining : acc + remaining;
    }, 0);

  const handleNewTransaction = (prefill?: any) => {
    setInitialOcrData(prefill || null);
    setIsTransactionSheetOpen(true);
  };

  const handleScanReceipt = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        setLoading(true);
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const ocrData = await res.json();
        if (ocrData.success && ocrData.data) {
          handleNewTransaction(ocrData.data);
        } else {
          alert(`OCR: ${ocrData.error || "No se detectaron datos válidos."}`);
          handleNewTransaction();
        }
      } catch (err: any) {
        alert("Error al procesar comprobante: " + err.message);
        handleNewTransaction();
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOpenAccountSettings = (acc: AccountItem) => {
    setSelectedAccountForSettings(acc);
    setIsAccountSettingsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 flex flex-col pb-28 select-none transition-colors">
      {/* Hidden OCR Camera Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header with Theme Toggle */}
      <MobileHeader
        accountsCount={accounts.length}
        totalBalance={totalBalance}
      />

      {/* Main Content */}
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 flex flex-col gap-6">
        {/* VIEW 1: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            {/* Minimalist Wealth Hero Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] shadow-xs hover:shadow-soft transition-all">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <span>Patrimonio Consolidado</span>
                    <TooltipHelp
                      text="Suma total del saldo disponible en tus cuentas activas y carteras de efectivo."
                      position="bottom"
                    />
                  </span>
                  <span className="text-[11px] font-bold text-[#009fdb] bg-[#009fdb]/10 dark:bg-[#153D64]/50 border border-[#009fdb]/30 px-2.5 py-0.5 rounded-full">
                    {accounts.length === 0 ? "Listo" : "Activo"}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    {formatCurrency(totalBalance)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">MXN</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-[#262626]">
                  <span>
                    {accounts.length === 0
                      ? "0 cuentas registradas"
                      : `${accounts.length} ${
                          accounts.length === 1 ? "cuenta activa" : "cuentas activas"
                        }`}
                  </span>
                  <span className="text-[#009fdb] font-semibold">
                    Supabase Cloud
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Bank Cards & Leather Wallet Cash Grid */}
            <AccountsGrid
              accounts={accounts}
              onSelectAccount={() => handleNewTransaction()}
              onOpenSettings={handleOpenAccountSettings}
              onAddNewAccount={() => setIsNewAccountSheetOpen(true)}
            />

            {/* Credit Card Next Cutoff & MSI Analytical Summary */}
            <CreditCardSummary
              accounts={accounts}
              transactions={transactions}
              debts={debts}
              onConfigureCard={handleOpenAccountSettings}
            />

            {/* Financial Flow StatCards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                title="Ingresos (Mes)"
                amount={monthIncome}
                icon={TrendingUp}
                variant="emerald"
              />
              <StatCard
                title="Gastos (Mes)"
                amount={monthExpense}
                icon={TrendingDown}
                variant="rose"
              />
              <StatCard
                title="Deudas / MSI"
                amount={activeDebtsNet}
                icon={HandCoins}
                variant="blue"
              />
            </div>

            {/* Recent Transactions List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    Movimientos Recientes
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({transactions.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="text-xs font-bold text-[#009fdb] hover:underline py-1"
                >
                  Categorías
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="py-10 px-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] text-center flex flex-col items-center justify-center gap-2 shadow-xs">
                  <Clock className="w-7 h-7 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Sin movimientos ($0.00)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {transactions.slice(0, 12).map((t) => {
                    const isIncome = t.type === "INCOME";
                    const isTransfer = t.type === "TRANSFER";
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] flex items-center justify-between hover:border-neutral-700 transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isIncome
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : isTransfer
                                ? "bg-[#009fdb]/10 text-[#009fdb] dark:bg-[#153D64]/50 dark:text-[#009fdb]"
                                : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 stroke-[2.2]" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {t.note || t.category?.name || "Movimiento"}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                              <span>{formatDate(t.date)}</span>
                              <span>•</span>
                              <span className="font-medium text-slate-500 dark:text-neutral-400">
                                {t.account?.name || "Cuenta"}
                              </span>
                              {t.installments && (
                                <span className="text-[10px] bg-[#153D64]/60 text-[#009fdb] border border-[#009fdb]/30 px-1.5 py-0.2 rounded-md font-bold">
                                  {t.remainingInstallments
                                    ? `${t.remainingInstallments}/${t.installments}m`
                                    : `${t.installments}m`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-sm font-black shrink-0 ml-2 ${
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isTransfer
                              ? "text-[#009fdb]"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: CALENDAR */}
        {activeTab === "calendar" && (
          <CalendarView
            transactions={transactions}
            onSelectDateForNewTransaction={(dateStr) => {
              handleNewTransaction({ fecha: dateStr });
            }}
          />
        )}

        {/* VIEW 3: DEBTS & MSI CRUD MODULE */}
        {activeTab === "debts" && (
          <DebtManager
            debts={debts}
            accounts={accounts}
            onRefresh={fetchData}
          />
        )}

        {/* VIEW 4: CHAT OLLAMA */}
        {activeTab === "chat" && (
          <div className="w-full">
            <ChatOllama
              onTransactionCreated={() => {
                fetchData();
              }}
            />
          </div>
        )}
      </main>

      {/* Omnipresent Floating Action Button */}
      <FAB
        onNewTransaction={() => handleNewTransaction()}
        onScanReceipt={handleScanReceipt}
        onOpenChat={() => setActiveTab("chat")}
      />

      {/* Fixed Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
      />

      {/* BottomSheet: Nueva Transacción */}
      <BottomSheet
        isOpen={isTransactionSheetOpen}
        onClose={() => setIsTransactionSheetOpen(false)}
        title={initialOcrData ? "Confirmar Recibo OCR" : "Registrar Movimiento"}
      >
        <TransactionForm
          initialData={initialOcrData}
          onSuccess={() => {
            setIsTransactionSheetOpen(false);
            setInitialOcrData(null);
            fetchData();
          }}
          onCancel={() => {
            setIsTransactionSheetOpen(false);
            setInitialOcrData(null);
          }}
        />
      </BottomSheet>

      {/* BottomSheet: Crear Nueva Cuenta o Cartera */}
      <BottomSheet
        isOpen={isNewAccountSheetOpen}
        onClose={() => setIsNewAccountSheetOpen(false)}
        title="Nueva Cuenta o Cartera"
        maxHeight="max-h-[92vh]"
      >
        <AccountForm
          onSuccess={() => {
            setIsNewAccountSheetOpen(false);
            fetchData();
          }}
          onCancel={() => setIsNewAccountSheetOpen(false)}
        />
      </BottomSheet>

      {/* Modal: Configuración de Cuenta */}
      <AccountSettingsModal
        account={selectedAccountForSettings}
        isOpen={isAccountSettingsOpen}
        onClose={() => {
          setIsAccountSettingsOpen(false);
          setSelectedAccountForSettings(null);
        }}
        onAccountUpdated={() => {
          fetchData();
        }}
      />

      {/* Modal: Gestor CRUD de Categorías */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoriesChanged={() => {
          fetchData();
        }}
      />
    </div>
  );
}
