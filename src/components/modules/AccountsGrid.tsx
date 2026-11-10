"use client";

import React from "react";
import {
  Wifi,
  CreditCard,
  Landmark,
  PiggyBank,
  Banknote,
  Coins,
  Settings2,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import TooltipHelp from "@/components/ui/TooltipHelp";
import {
  StylizedBankLogo,
  MEXICAN_BANKS,
  MetallicEmvChip,
  ContactlessWave,
} from "@/components/forms/AccountForm";

export interface AccountItem {
  id: string;
  name: string;
  type: "DEBIT" | "CREDIT" | "SAVINGS" | "CASH" | string;
  balance: number;
  currency: string;
  color?: string | null;
  bankLogo?: string | null;
  cardLast4?: string | null;
  creditLimit?: number | null;
  cutoffDay?: number | null;
  paymentDueDay?: number | null;
  isArchived?: boolean;
}

interface AccountsGridProps {
  accounts: AccountItem[];
  onSelectAccount?: (account: AccountItem) => void;
  onOpenSettings: (account: AccountItem) => void;
  onAddNewAccount: () => void;
}

export const AccountsGrid: React.FC<AccountsGridProps> = ({
  accounts,
  onSelectAccount,
  onOpenSettings,
  onAddNewAccount,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            Cuentas & Carteras
            <TooltipHelp text="Toca una tarjeta para registrar un movimiento o el icono de engrane para editar su saldo e historial." />
          </h3>
          <span className="text-[11px] font-semibold text-neutral-400">
            ({accounts.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onAddNewAccount}
          className="text-xs font-bold text-[#009fdb] hover:underline"
        >
          + Nueva Cuenta
        </button>
      </div>

      {/* Horizontal Swipeable Track */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 snap-x snap-mandatory">
        {accounts.map((acc) => {
          const isCash = acc.type === "CASH";
          const lastFour = acc.cardLast4
            ? acc.cardLast4.trim().slice(-4)
            : acc.id.slice(-4).toUpperCase();

          if (isCash) {
            return (
              <div
                key={acc.id}
                className="relative w-72 sm:w-80 h-44 rounded-3xl p-5 text-amber-100 shadow-card flex flex-col justify-between shrink-0 overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] snap-center bg-gradient-to-br from-[#2a1a11] via-[#342015] to-[#170d07] border border-amber-900/40 group"
              >
                <div className="absolute inset-2 border border-dashed border-amber-600/25 rounded-2xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <div className="w-8 h-6 rounded-md bg-emerald-600/80 border border-emerald-400/40 shadow-xs flex items-center justify-center -rotate-6">
                        <Banknote className="w-4 h-4 text-emerald-100" />
                      </div>
                      <div className="w-8 h-6 rounded-md bg-emerald-500 border border-emerald-300/50 shadow-md flex items-center justify-center -ml-5 rotate-3">
                        <Coins className="w-4 h-4 text-amber-200" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-200/90 tracking-wide uppercase">
                      Efectivo
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSettings(acc);
                    }}
                    className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 text-amber-200/80 hover:text-white flex items-center justify-center transition-all shrink-0"
                    aria-label="Configurar cuenta"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className="relative z-10 flex flex-col gap-1 w-full overflow-hidden"
                  onClick={() => onSelectAccount && onSelectAccount(acc)}
                >
                  <span className="text-xs font-semibold text-amber-100/95 tracking-wide truncate block w-full">
                    {acc.name}
                  </span>
                  <span className="text-[11px] font-mono tracking-widest text-amber-300/50 uppercase">
                    Cartera Física
                  </span>
                </div>

                <div
                  className="relative z-10 flex items-center justify-between border-t border-amber-700/30 pt-2.5 w-full"
                  onClick={() => onSelectAccount && onSelectAccount(acc)}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-300/60 font-medium truncate">
                      Disponible
                    </span>
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                      {formatCurrency(acc.balance, acc.currency)}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 ml-2">
                    Billetes
                  </span>
                </div>
              </div>
            );
          }

          // Bank Cards Representation (Corporate Blue #153D64 -> #009fdb & Carbon)
          let cardBg =
            "bg-gradient-to-br from-[#153D64] via-[#0f2d4a] to-[#0a0a0a] border border-[#009fdb]/30";
          let tagBg = "bg-[#009fdb]/20 text-[#009fdb] border border-[#009fdb]/30";
          let label = "Débito";
          let IconComponent = Landmark;

          if (acc.type === "CREDIT") {
            cardBg =
              "bg-gradient-to-br from-[#1c1c1c] via-[#121212] to-[#0a0a0a] border border-[#2e2e2e]";
            tagBg = "bg-white/10 text-neutral-200 border border-white/15";
            label = "Crédito";
            IconComponent = CreditCard;
          } else if (acc.type === "SAVINGS") {
            cardBg =
              "bg-gradient-to-br from-emerald-950 via-[#121212] to-[#0a0a0a] border border-emerald-500/30";
            tagBg = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
            label = "Ahorros";
            IconComponent = PiggyBank;
          }

          const bankPreset = MEXICAN_BANKS.find(
            (b) => b.id === (acc.bankLogo || "BBVA").toUpperCase()
          );
          const customColor = acc.color || bankPreset?.defaultColor || "#009fdb";

          return (
            <div
              key={acc.id}
              style={{
                background: `linear-gradient(135deg, ${customColor} 0%, #141414 65%, #080808 100%)`,
              }}
              className="relative w-72 sm:w-80 h-44 rounded-3xl p-5 text-white shadow-2xl flex flex-col justify-between shrink-0 overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] snap-center border border-white/20 group"
            >
              {/* Resplandor metálico especular */}
              <div
                className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-35"
                style={{ backgroundColor: customColor }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-black/30 pointer-events-none" />

              {/* Header: Banco + Chip EMV Metálico + Contactless + Ajustes */}
              <div className="flex items-center justify-between relative z-10 w-full">
                <div className="flex items-center gap-2.5 shrink-0">
                  <StylizedBankLogo bankId={acc.bankLogo || "BBVA"} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-wide text-white truncate max-w-[130px] drop-shadow-sm">
                      {acc.name}
                    </span>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <MetallicEmvChip variant={acc.type === "CREDIT" ? "silver" : "gold"} size="sm" />
                  <ContactlessWave className="w-4 h-4 text-white/80 rotate-90" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSettings(acc);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all shrink-0 ml-0.5"
                    aria-label="Configurar cuenta"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Middle: Masked Number en Monospace Neobanco */}
              <div
                className="relative z-10 flex flex-col gap-0.5 w-full overflow-hidden"
                onClick={() => onSelectAccount && onSelectAccount(acc)}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-mono text-sm tracking-[0.25em] text-white/90 drop-shadow-sm">
                    •••• •••• •••• {lastFour}
                  </span>
                  {acc.type === "CREDIT" && (acc.cutoffDay || acc.paymentDueDay) && (
                    <span className="text-[10px] font-semibold text-[#009fdb] bg-[#153D64]/60 border border-[#009fdb]/40 px-2 py-0.5 rounded-md truncate max-w-[130px] shrink-0 backdrop-blur-md">
                      {acc.cutoffDay ? `Corte ${acc.cutoffDay}` : ""}
                      {acc.cutoffDay && acc.paymentDueDay ? " · " : ""}
                      {acc.paymentDueDay ? `Pago ${acc.paymentDueDay}` : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: Balance */}
              <div
                className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2.5 w-full"
                onClick={() => onSelectAccount && onSelectAccount(acc)}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium truncate">
                    {acc.type === "CREDIT" && acc.creditLimit && acc.creditLimit > 0
                      ? `Saldo · Límite ${formatCurrency(acc.creditLimit, acc.currency)}`
                      : "Saldo"}
                  </span>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                    {formatCurrency(acc.balance, acc.currency)}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 shrink-0 ml-2">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Account Card */}
        <button
          type="button"
          onClick={onAddNewAccount}
          className={`${
            accounts.length === 0 ? "w-72 sm:w-80" : "w-40 sm:w-48"
          } h-44 rounded-3xl border-2 border-dashed border-slate-300 dark:border-[#262626] hover:border-[#009fdb] active:scale-[0.98] flex flex-col items-center justify-center gap-2.5 text-neutral-400 hover:text-[#009fdb] transition-all shrink-0 snap-center bg-white/40 dark:bg-[#121212] group`}
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#262626] group-hover:border-[#009fdb]/40 flex items-center justify-center text-neutral-400 group-hover:text-[#009fdb] transition-colors">
            <Plus className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 group-hover:text-[#009fdb]">
              Nueva Cuenta
            </span>
            {accounts.length === 0 && (
              <span className="text-[10px] text-neutral-500 font-medium mt-0.5">
                Registra tu tarjeta o efectivo
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default AccountsGrid;
