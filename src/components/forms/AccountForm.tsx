"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import TooltipHelp from "@/components/ui/TooltipHelp";
import { formatCurrency } from "@/lib/utils";
import {
  Check,
  Loader2,
  CreditCard,
  CalendarClock,
  Archive,
  Palette,
  Building2,
  Coins,
  Wifi,
  Banknote,
  PiggyBank,
  Landmark,
} from "lucide-react";

export interface BankPreset {
  id: string;
  name: string;
  shortLabel: string;
  defaultColor: string;
  secondaryColor: string;
  textColor: string;
  badgeText: string;
}

export const MEXICAN_BANKS: BankPreset[] = [
  {
    id: "BBVA",
    name: "BBVA México",
    shortLabel: "BBVA",
    defaultColor: "#009fdb",
    secondaryColor: "#153D64",
    textColor: "#ffffff",
    badgeText: "BBVA",
  },
  {
    id: "MERCADO_PAGO",
    name: "Mercado Pago",
    shortLabel: "Mercado Pago",
    defaultColor: "#00b1ea",
    secondaryColor: "#005e8a",
    textColor: "#ffffff",
    badgeText: "MP",
  },
  {
    id: "BANAMEX",
    name: "Banamex",
    shortLabel: "Banamex",
    defaultColor: "#004b87",
    secondaryColor: "#00284d",
    textColor: "#ffffff",
    badgeText: "BNX",
  },
  {
    id: "BANCO_AZTECA",
    name: "Banco Azteca",
    shortLabel: "Banco Azteca",
    defaultColor: "#059669",
    secondaryColor: "#064e3b",
    textColor: "#fde047",
    badgeText: "AZT",
  },
  {
    id: "BANCOPPEL",
    name: "BanCoppel",
    shortLabel: "BanCoppel",
    defaultColor: "#eab308",
    secondaryColor: "#1e3a8a",
    textColor: "#1e3a8a",
    badgeText: "CPL",
  },
  {
    id: "NU",
    name: "Nu México",
    shortLabel: "Nu",
    defaultColor: "#820ad1",
    secondaryColor: "#3b0764",
    textColor: "#ffffff",
    badgeText: "NU",
  },
  {
    id: "SANTANDER",
    name: "Santander",
    shortLabel: "Santander",
    defaultColor: "#ec0000",
    secondaryColor: "#7f1d1d",
    textColor: "#ffffff",
    badgeText: "SAN",
  },
  {
    id: "CASH_WALLET",
    name: "Efectivo / Cartera",
    shortLabel: "Efectivo",
    defaultColor: "#d97706",
    secondaryColor: "#451a03",
    textColor: "#fef3c7",
    badgeText: "CASH",
  },
  {
    id: "SAVINGS_VAULT",
    name: "Bóveda / Inversión",
    shortLabel: "Ahorros",
    defaultColor: "#10b981",
    secondaryColor: "#064e3b",
    textColor: "#ffffff",
    badgeText: "INV",
  },
];

export const ACCOUNT_COLOR_PALETTE: { hex: string; label: string }[] = [
  { hex: "#009fdb", label: "Azul BBVA Corporativo" },
  { hex: "#153D64", label: "Azul Marino Institucional" },
  { hex: "#00b1ea", label: "Celeste Mercado Pago" },
  { hex: "#004b87", label: "Azul Cobalto Banamex" },
  { hex: "#059669", label: "Verde Esmeralda Azteca" },
  { hex: "#eab308", label: "Amarillo Dorado BanCoppel" },
  { hex: "#820ad1", label: "Morado Fintech" },
  { hex: "#ec0000", label: "Rojo Institucional" },
  { hex: "#d97706", label: "Ámbar Cartera" },
  { hex: "#262626", label: "Negro Carbón Élite" },
];

const ACCOUNT_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: "DEBIT", label: "Débito / Nómina", badge: "BANCO" },
  { value: "CREDIT", label: "Tarjeta de Crédito", badge: "TDC" },
  { value: "CASH", label: "Efectivo en Mano", badge: "CASH" },
  { value: "SAVINGS", label: "Ahorros / Inversión", badge: "BÓVEDA" },
];

interface CurrencySpec {
  code: "MXN" | "USD" | "EUR";
  symbol: string;
  name: string;
  accentColor: string;
  bgActive: string;
  borderActive: string;
}

const CURRENCIES: CurrencySpec[] = [
  {
    code: "MXN",
    symbol: "$",
    name: "Pesos MXN",
    accentColor: "#10b981",
    bgActive: "bg-emerald-500/15",
    borderActive: "border-emerald-500/50",
  },
  {
    code: "USD",
    symbol: "$",
    name: "Dólares USD",
    accentColor: "#22c55e",
    bgActive: "bg-green-500/15",
    borderActive: "border-green-500/50",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euros EUR",
    accentColor: "#009fdb",
    bgActive: "bg-[#009fdb]/15",
    borderActive: "border-[#009fdb]/50",
  },
];

/**
 * Insignia vectorial estilizada de bancos mexicanos (sin infringir copyright)
 */
export const StylizedBankLogo: React.FC<{
  bankId?: string | null;
  size?: "sm" | "md";
}> = ({ bankId = "BBVA", size = "md" }) => {
  const normalized = (bankId || "BBVA").toUpperCase();
  const dim = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-[11px]";

  switch (normalized) {
    case "BBVA":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#009fdb] to-[#153D64] border border-white/20 flex items-center justify-center font-black tracking-tighter text-white shadow-xs shrink-0`}
        >
          <span>BBVA</span>
        </div>
      );
    case "MERCADO_PAGO":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#00b1ea] to-[#0284c7] border border-white/25 flex items-center justify-center font-black text-white shadow-xs shrink-0`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-none stroke-current stroke-[2.2]"
          >
            <path d="M4 13c2.5-3 5.5-3 8 0 2.5-3 5.5-3 8 0" strokeLinecap="round" />
            <path d="M6 16c3.5 2.5 8.5 2.5 12 0" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "BANAMEX":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#004b87] to-[#00284d] border border-sky-300/30 flex items-center justify-center text-white shadow-xs shrink-0`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <circle cx="12" cy="12" r="3" className="text-rose-400" />
            <path d="M12 3l2.2 4.5L19 9.7l-4.8 2.2L12 16.5l-2.2-4.6L5 9.7l4.8-2.2L12 3z" />
          </svg>
        </div>
      );
    case "BANCO_AZTECA":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#059669] to-[#064e3b] border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-xs shrink-0`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-none stroke-current stroke-[2.2]"
          >
            <path
              d="M4 18L12 6l8 12H4z"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path d="M8 14h8" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "BANCOPPEL":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#facc15] to-[#eab308] border border-blue-900/30 flex items-center justify-center font-black text-[#1e3a8a] shadow-xs shrink-0`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-none stroke-current stroke-[2.4]"
          >
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" className="fill-current" />
          </svg>
        </div>
      );
    case "NU":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#820ad1] to-[#4c1d95] border border-purple-300/25 flex items-center justify-center font-black text-white shadow-xs shrink-0`}
        >
          <span>Nu</span>
        </div>
      );
    case "SANTANDER":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#ec0000] to-[#991b1b] border border-white/20 flex items-center justify-center font-black text-white shadow-xs shrink-0`}
        >
          <span>SAN</span>
        </div>
      );
    case "CASH_WALLET":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#d97706] to-[#78350f] border border-amber-300/30 flex items-center justify-center text-amber-100 shadow-xs shrink-0`}
        >
          <Banknote className="w-4 h-4" />
        </div>
      );
    case "SAVINGS_VAULT":
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#10b981] to-[#065f46] border border-emerald-300/30 flex items-center justify-center text-white shadow-xs shrink-0`}
        >
          <PiggyBank className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-[#153D64] to-[#0a0a0a] border border-[#009fdb]/30 flex items-center justify-center text-[#009fdb] shadow-xs shrink-0`}
        >
          <Landmark className="w-4 h-4" />
        </div>
      );
  }
};

/**
 * Icono vectorial colorido de divisa para el selector animado
 */
const CurrencyColoredIcon: React.FC<{
  code: "MXN" | "USD" | "EUR";
  active: boolean;
}> = ({ code, active }) => {
  if (code === "MXN") {
    return (
      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 flex items-center justify-center shadow-xs shrink-0 bg-[#121212]">
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full bg-emerald-600" />
          <div className="w-1/3 h-full bg-white/95" />
          <div className="w-1/3 h-full bg-rose-600" />
        </div>
        <span
          className={`relative z-10 text-[10px] font-black px-1 py-0.5 rounded-full ${
            active
              ? "bg-[#0a0a0a]/85 text-emerald-400"
              : "bg-[#0a0a0a]/75 text-white"
          }`}
        >
          $
        </span>
      </div>
    );
  }

  if (code === "USD") {
    return (
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-800 border border-green-300/30 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
        US$
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#009fdb] to-[#1e3a8a] border border-amber-300/40 flex items-center justify-center text-amber-300 font-black text-xs shadow-xs shrink-0">
      €
    </div>
  );
};

export interface AccountFormData {
  id?: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color?: string | null;
  bankLogo?: string | null;
  creditLimit?: number | null;
  cutoffDay?: number | null;
  paymentDueDay?: number | null;
}

interface AccountFormProps {
  initialAccount?: AccountFormData | null;
  onSuccess: (savedAccount: any) => void;
  onCancel?: () => void;
  onArchive?: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  initialAccount,
  onSuccess,
  onCancel,
  onArchive,
}) => {
  const isEditing = Boolean(initialAccount?.id);

  const [name, setName] = useState<string>(initialAccount?.name || "");
  const [type, setType] = useState<string>(initialAccount?.type || "DEBIT");
  const [currency, setCurrency] = useState<"MXN" | "USD" | "EUR">(
    (initialAccount?.currency as "MXN" | "USD" | "EUR") || "MXN"
  );
  const [bankLogo, setBankLogo] = useState<string>(
    initialAccount?.bankLogo || "BBVA"
  );
  const [color, setColor] = useState<string>(
    initialAccount?.color || "#009fdb"
  );
  const [balance, setBalance] = useState<string>(
    initialAccount?.balance !== undefined ? String(initialAccount.balance) : ""
  );

  // Atributos de Tarjeta de Crédito
  const [creditLimit, setCreditLimit] = useState<string>(
    initialAccount?.creditLimit !== undefined &&
      initialAccount?.creditLimit !== null
      ? String(initialAccount.creditLimit)
      : ""
  );
  const [cutoffDay, setCutoffDay] = useState<string>(
    initialAccount?.cutoffDay !== undefined &&
      initialAccount?.cutoffDay !== null
      ? String(initialAccount.cutoffDay)
      : ""
  );
  const [paymentDueDay, setPaymentDueDay] = useState<string>(
    initialAccount?.paymentDueDay !== undefined &&
      initialAccount?.paymentDueDay !== null
      ? String(initialAccount.paymentDueDay)
      : ""
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name || "");
      setType(initialAccount.type || "DEBIT");
      setCurrency((initialAccount.currency as "MXN" | "USD" | "EUR") || "MXN");
      setBankLogo(initialAccount.bankLogo || "BBVA");
      setColor(initialAccount.color || "#009fdb");
      setBalance(
        initialAccount.balance !== undefined
          ? String(initialAccount.balance)
          : ""
      );
      setCreditLimit(
        initialAccount.creditLimit !== undefined &&
          initialAccount.creditLimit !== null
          ? String(initialAccount.creditLimit)
          : ""
      );
      setCutoffDay(
        initialAccount.cutoffDay !== undefined &&
          initialAccount.cutoffDay !== null
          ? String(initialAccount.cutoffDay)
          : ""
      );
      setPaymentDueDay(
        initialAccount.paymentDueDay !== undefined &&
          initialAccount.paymentDueDay !== null
          ? String(initialAccount.paymentDueDay)
          : ""
      );
    }
  }, [initialAccount]);

  const handleSelectBank = (preset: BankPreset) => {
    setBankLogo(preset.id);
    setColor(preset.defaultColor);
    if (!name.trim()) {
      setName(preset.name);
    }
    if (preset.id === "CASH_WALLET") {
      setType("CASH");
    } else if (preset.id === "SAVINGS_VAULT") {
      setType("SAVINGS");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Ingresa un nombre para la cuenta o cartera.");
      return;
    }

    setErrorMsg(null);
    setSaving(true);

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        type,
        currency,
        color,
        bankLogo,
        balance: parseFloat(balance) || 0,
        creditLimit:
          type === "CREDIT" && creditLimit !== ""
            ? parseFloat(creditLimit)
            : null,
        cutoffDay:
          type === "CREDIT" && cutoffDay !== ""
            ? parseInt(cutoffDay, 10)
            : null,
        paymentDueDay:
          type === "CREDIT" && paymentDueDay !== ""
            ? parseInt(paymentDueDay, 10)
            : null,
      };

      if (isEditing && initialAccount?.id) {
        payload.id = initialAccount.id;
      }

      const res = await fetch("/api/accounts", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar la cuenta.");
      }

      onSuccess(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Error inesperado al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const selectedBank =
    MEXICAN_BANKS.find((b) => b.id === bankLogo) || MEXICAN_BANKS[0];
  const numericPreviewBalance = parseFloat(balance) || 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 select-none">
      {/* VISTA PREVIA INTERACTIVA DE LA TARJETA / CARTERA */}
      <div
        className="relative w-full h-36 rounded-3xl p-4 text-white shadow-card flex flex-col justify-between overflow-hidden transition-all duration-300 border border-white/15"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, #121212 72%, #0a0a0a 100%)`,
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-35"
          style={{ backgroundColor: color }}
        />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <StylizedBankLogo bankId={bankLogo} size="sm" />
            <div className="flex flex-col">
              <span className="text-xs font-extrabold tracking-wide text-white truncate max-w-[170px]">
                {name.trim() || selectedBank.name}
              </span>
              <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                {selectedBank.shortLabel} ·{" "}
                {type === "CREDIT"
                  ? "Crédito"
                  : type === "CASH"
                  ? "Efectivo"
                  : type === "SAVINGS"
                  ? "Ahorros"
                  : "Débito"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/35 text-white border border-white/15">
              {currency}
            </span>
            <Wifi className="w-4 h-4 text-white/75 rotate-90" />
          </div>
        </div>

        <div className="flex items-end justify-between relative z-10 border-t border-white/15 pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-white/65 font-semibold">
              {isEditing ? "Saldo Actual" : "Saldo Inicial"}
            </span>
            <span className="text-xl font-black tracking-tight text-white">
              {formatCurrency(numericPreviewBalance, currency)}
            </span>
          </div>

          {type === "CREDIT" && (cutoffDay || paymentDueDay) ? (
            <span className="text-[10px] font-bold text-white/90 bg-black/40 border border-white/15 px-2 py-0.5 rounded-lg">
              {cutoffDay ? `Corte ${cutoffDay}` : ""}
              {cutoffDay && paymentDueDay ? " · " : ""}
              {paymentDueDay ? `Pago ${paymentDueDay}` : ""}
            </span>
          ) : (
            <span className="text-[11px] font-mono tracking-widest text-white/55">
              •••• {initialAccount?.id ? initialAccount.id.slice(-4).toUpperCase() : "2026"}
            </span>
          )}
        </div>
      </div>

      {/* 1. LOGO / INSIGNIA ESTILIZADA DE BANCOS MEXICANOS */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#009fdb]" />
          <span>Institución / Insignia</span>
          <TooltipHelp text="Elige un banco mexicano o cartera para asignar su insignia estilizada y color sugerido." />
        </label>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {MEXICAN_BANKS.map((preset) => {
            const isSelected = bankLogo === preset.id;
            return (
              <motion.button
                key={preset.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => handleSelectBank(preset)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#153D64]/45 border-[#009fdb] text-white shadow-xs"
                    : "bg-slate-50 dark:bg-[#121212] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-neutral-300 hover:border-neutral-600"
                }`}
              >
                <StylizedBankLogo bankId={preset.id} size="sm" />
                <span>{preset.shortLabel}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. SELECTOR DE COLOR DE CUENTA */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#009fdb]" />
          <span>Color de Identificación</span>
        </label>

        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {ACCOUNT_COLOR_PALETTE.map((item) => {
            const active = color.toLowerCase() === item.hex.toLowerCase();
            return (
              <motion.button
                key={item.hex}
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setColor(item.hex)}
                title={item.label}
                aria-label={item.label}
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-all border ${
                  active
                    ? "ring-2 ring-[#009fdb] ring-offset-2 ring-offset-[#0a0a0a] border-white scale-105"
                    : "border-white/20 opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: item.hex }}
              >
                {active && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. NOMBRE DE LA CUENTA Y 4. TIPO DE CUENTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Nombre de la Cuenta
          </label>
          <input
            type="text"
            placeholder="Ej. BBVA Nómina, Nu Crédito..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Tipo de Cuenta
          </label>
          <CustomSelect
            value={type}
            onChange={setType}
            options={ACCOUNT_TYPE_OPTIONS}
            placeholder="Selecciona el tipo..."
          />
        </div>
      </div>

      {/* 5. SELECTOR DE MONEDA ANIMADO E INTERACTIVO */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-[#009fdb]" />
          <span>Moneda de la Cuenta</span>
        </label>

        <div className="grid grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626]">
          {CURRENCIES.map((curr) => {
            const isSelected = currency === curr.code;
            return (
              <motion.button
                key={curr.code}
                type="button"
                layout
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrency(curr.code)}
                className={`relative flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors min-h-[46px] ${
                  isSelected
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-neutral-400 hover:text-white"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeCurrencyPill"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className={`absolute inset-0 rounded-xl border ${curr.bgActive} ${curr.borderActive}`}
                  />
                )}
                <motion.div
                  animate={
                    isSelected
                      ? { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={{ duration: 0.35 }}
                  className="relative z-10"
                >
                  <CurrencyColoredIcon code={curr.code} active={isSelected} />
                </motion.div>
                <div className="relative z-10 flex flex-col items-start leading-tight">
                  <span className="text-xs font-black tracking-tight">
                    {curr.code}
                  </span>
                  <span className="text-[10px] opacity-75 font-semibold">
                    {curr.symbol}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 6. SALDO INICIAL O ACTUAL ($) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
          <span>{isEditing ? "Saldo Actual ($)" : "Saldo Inicial ($)"}</span>
          <TooltipHelp text="Monto disponible con el que inicia o se encuentra actualmente esta cuenta." />
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
            {currency === "EUR" ? "€" : "$"}
          </span>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            required
            className="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl pl-8 pr-14 py-3 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[48px] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400">
            {currency}
          </span>
        </div>
      </div>

      {/* PARÁMETROS OPCIONALES DE TARJETA DE CRÉDITO */}
      <AnimatePresence initial={false}>
        {type === "CREDIT" && (
          <motion.div
            key="credit-fields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#009fdb] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Parámetros de Tarjeta de Crédito</span>
                  <TooltipHelp text="Define el límite otorgado, día de corte y fecha límite de pago para calcular tu pago estimado al corte." />
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Límite de Crédito Otorgado ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Ej. 50000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[44px] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3 text-[#009fdb]" />
                    <span>Día de Corte</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    inputMode="numeric"
                    placeholder="Ej. 15"
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(e.target.value)}
                    className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[44px] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3 text-amber-400" />
                    <span>Día Límite Pago</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    inputMode="numeric"
                    placeholder="Ej. 5"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                    className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fdb] min-h-[44px] appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
          {errorMsg}
        </div>
      )}

      {/* BOTONES DE ACCIÓN ESTANDARIZADOS (h-12 / 48px touch-target en iOS) */}
      <div className="flex items-center gap-3 pt-3 pb-safe">
        {isEditing && onArchive && (
          <button
            type="button"
            onClick={onArchive}
            disabled={saving}
            className="h-12 min-h-[48px] max-h-[48px] px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98] shrink-0"
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span>Archivar</span>
          </button>
        )}

        {!isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 h-12 min-h-[48px] max-h-[48px] rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#121212] text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#181818] transition-colors flex items-center justify-center active:scale-[0.98]"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex-1 h-12 min-h-[48px] max-h-[48px] px-5 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs shadow-md shadow-[#009fdb]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>{isEditing ? "Guardar Cambios" : "Crear Cuenta"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AccountForm;
