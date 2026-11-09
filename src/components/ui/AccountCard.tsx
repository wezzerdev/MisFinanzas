"use client";

import React from "react";
import { Wifi, CreditCard, Landmark, PiggyBank, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AccountCardProps {
  id: string;
  name: string;
  type: "DEBIT" | "CREDIT" | "SAVINGS" | "CASH" | string;
  balance: number;
  currency?: string;
  onClick?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  id,
  name,
  type,
  balance,
  currency = "MXN",
  onClick,
}) => {
  // Theme styles based on account type
  const getTheme = () => {
    switch (type) {
      case "CREDIT":
        return {
          bg: "bg-gradient-to-br from-slate-900 via-zinc-800 to-neutral-950",
          accent: "text-zinc-300",
          chip: "bg-gradient-to-tr from-amber-200 to-amber-400",
          tagBg: "bg-white/10 text-zinc-200",
          label: "Crédito",
          icon: CreditCard,
        };
      case "SAVINGS":
        return {
          bg: "bg-gradient-to-br from-teal-950 via-emerald-900 to-slate-950",
          accent: "text-emerald-200",
          chip: "bg-gradient-to-tr from-amber-200 to-amber-300",
          tagBg: "bg-emerald-500/20 text-emerald-300",
          label: "Bóveda Ahorro",
          icon: PiggyBank,
        };
      case "CASH":
        return {
          bg: "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
          accent: "text-slate-300",
          chip: "bg-gradient-to-tr from-amber-300 to-amber-500",
          tagBg: "bg-white/10 text-slate-200",
          label: "Efectivo",
          icon: Banknote,
        };
      case "DEBIT":
      default:
        return {
          bg: "bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950",
          accent: "text-blue-200",
          chip: "bg-gradient-to-tr from-amber-200 to-amber-400",
          tagBg: "bg-blue-400/20 text-blue-100",
          label: "Débito",
          icon: Landmark,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  // Masked number derived from ID
  const lastFour = id.slice(-4).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`relative w-72 sm:w-80 h-44 rounded-3xl p-5 text-white shadow-card flex flex-col justify-between shrink-0 overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${theme.bg}`}
    >
      {/* Subtle realistic lighting glare overlay */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-black/20 rounded-full blur-xl pointer-events-none" />

      {/* Header: Chip + Contactless + Type badge */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          {/* Simulated EMV Gold Chip */}
          <div
            className={`w-9 h-7 rounded-md ${theme.chip} shadow-inner flex items-center justify-center p-1 relative border border-amber-500/30`}
          >
            <div className="w-full h-full border border-amber-700/30 rounded-xs flex flex-col justify-around">
              <div className="h-0.5 bg-amber-700/20 w-full" />
              <div className="h-0.5 bg-amber-700/20 w-full" />
            </div>
          </div>
          <Wifi className="w-4 h-4 text-white/70 rotate-90" />
        </div>

        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md ${theme.tagBg}`}
        >
          {theme.label}
        </span>
      </div>

      {/* Middle: Masked Number & Account Title */}
      <div className="relative z-10 flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-white/90 tracking-wide truncate">
          {name}
        </span>
        <span className="text-[11px] font-mono tracking-widest text-white/50">
          •••• •••• •••• {lastFour}
        </span>
      </div>

      {/* Bottom: Balance & Currency */}
      <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">
            Saldo Disponible
          </span>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
            {formatCurrency(balance, currency)}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80">
          <IconComponent className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
