"use client";

import React, { useState, useEffect } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import AccountForm from "@/components/forms/AccountForm";
import { AccountItem } from "@/components/modules/AccountsGrid";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Settings2,
  ListFilter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

interface AccountSettingsModalProps {
  account: AccountItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAccountUpdated: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  account,
  isOpen,
  onClose,
  onAccountUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (account) {
      fetchAccountHistory(account.id);
    }
  }, [account]);

  const fetchAccountHistory = async (accountId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/transactions?accountId=${accountId}&limit=40`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (e) {
      console.error("Error loading account history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleArchive = async () => {
    if (!account) return;
    const confirm = window.confirm(
      `¿Archivar "${account.name}"? Los movimientos históricos se conservarán.`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/accounts?id=${account.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onAccountUpdated();
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!account) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={account.name}
      maxHeight="max-h-[92vh]"
    >
      <div className="flex flex-col gap-5 select-none">
        {/* Sub-tabs: Editar | Historial */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#262626]">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
              activeTab === "edit"
                ? "bg-[#009fdb] text-white shadow-xs"
                : "text-slate-500 dark:text-neutral-400"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Detalles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
              activeTab === "history"
                ? "bg-[#009fdb] text-white shadow-xs"
                : "text-slate-500 dark:text-neutral-400"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Historial ({transactions.length})</span>
          </button>
        </div>

        {/* TAB 1: UNIFIED ACCOUNT FORM */}
        {activeTab === "edit" && (
          <AccountForm
            initialAccount={account}
            onSuccess={() => {
              onAccountUpdated();
              onClose();
            }}
            onArchive={handleArchive}
          />
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === "history" && (
          <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
            {loadingHistory ? (
              <div className="py-12 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#009fdb]" />
                <span>Cargando...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <Clock className="w-7 h-7 text-slate-600" />
                <p className="text-xs text-slate-400">Sin movimientos</p>
              </div>
            ) : (
              transactions.map((t) => {
                const isInc = t.type === "INCOME";
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
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
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.note || t.category?.name || "Movimiento"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(t.date)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black ${
                        isInc
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isInc ? "+" : "-"}
                      {formatCurrency(t.amount, account.currency)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default AccountSettingsModal;
