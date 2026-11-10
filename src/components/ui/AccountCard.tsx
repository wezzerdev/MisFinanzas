"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { StylizedBankLogo, MetallicEmvChip, ContactlessWave } from "@/components/forms/AccountForm";
import { CreditCard, Landmark, PiggyBank, Banknote } from "lucide-react";

interface AccountCardProps {
  id: string;
  name: string;
  type: "DEBIT" | "CREDIT" | "SAVINGS" | "CASH" | string;
  balance: number;
  currency?: string;
  color?: string | null;
  bankLogo?: string | null;
  cardLast4?: string | null;
  cutoffDay?: number | null;
  paymentDueDay?: number | null;
  onClick?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  id,
  name,
  type,
  balance,
  currency = "MXN",
  color = "#009fdb",
  bankLogo = "BBVA",
  cardLast4,
  cutoffDay,
  paymentDueDay,
  onClick,
}) => {
  const isCash = type === "CASH";
  const effectiveColor = color || (type === "CREDIT" ? "#1f1f1f" : "#009fdb");
  const lastFour = cardLast4 ? cardLast4.trim().slice(-4) : id.slice(-4).toUpperCase();

  const getCardTypeLabel = () => {
    switch (type) {
      case "CREDIT":
        return "Crédito";
      case "SAVINGS":
        return "Bóveda";
      case "CASH":
        return "Efectivo";
      case "DEBIT":
      default:
        return "Débito";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "CREDIT":
        return CreditCard;
      case "SAVINGS":
        return PiggyBank;
      case "CASH":
        return Banknote;
      default:
        return Landmark;
    }
  };

  const IconComponent = getIcon();

  return (
    <div
      onClick={onClick}
      className="relative w-72 sm:w-80 h-44 rounded-3xl p-5 text-white shadow-2xl flex flex-col justify-between shrink-0 overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
      style={{
        background: isCash
          ? "linear-gradient(135deg, #2a1a11 0%, #342015 50%, #170d07 100%)"
          : `linear-gradient(135deg, ${effectiveColor} 0%, #141414 65%, #080808 100%)`,
      }}
    >
      {/* Resplandor metálico especular */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-35"
        style={{ backgroundColor: effectiveColor }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-black/30 pointer-events-none" />

      {/* Header: Banco / Chip EMV Metálico / Contactless */}
      <div className="flex items-center justify-between relative z-10 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <StylizedBankLogo bankId={bankLogo} size="sm" />
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wide text-white truncate max-w-[130px] drop-shadow-sm">
              {name}
            </span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              {getCardTypeLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isCash && (
            <>
              <MetallicEmvChip variant={type === "CREDIT" ? "silver" : "gold"} size="sm" />
              <ContactlessWave className="w-4 h-4 text-white/80 rotate-90" />
            </>
          )}
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-white border border-white/20 backdrop-blur-md">
            {currency}
          </span>
        </div>
      </div>

      {/* Middle: Masked Number en Monospace Neobanco */}
      <div className="relative z-10 flex flex-col gap-0.5 w-full overflow-hidden">
        <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">
          {isCash ? "Cartera Física" : "Número de Tarjeta"}
        </span>
        <span className="font-mono text-sm tracking-[0.25em] text-white/90 drop-shadow-sm">
          {isCash ? "EFECTIVO EN MANO" : `•••• •••• •••• ${lastFour}`}
        </span>
      </div>

      {/* Bottom: Balance & Currency */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-2.5 w-full">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-wider text-white/60 font-semibold truncate">
            {type === "CREDIT" && (cutoffDay || paymentDueDay)
              ? `${cutoffDay ? `Corte ${cutoffDay}` : ""}${cutoffDay && paymentDueDay ? " · " : ""}${paymentDueDay ? `Pago ${paymentDueDay}` : ""}`
              : "Saldo Disponible"}
          </span>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm truncate">
            {formatCurrency(balance, currency)}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 shrink-0 ml-2">
          <IconComponent className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
