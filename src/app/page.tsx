"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CreditCard,
  Layers,
  HandCoins,
  Smartphone,
  Sparkles,
  ArrowRight,
  Wallet,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calculator,
  Lock,
  ChevronRight,
  Palette,
  Coins,
  CheckCircle2,
  Clock,
  Landmark,
  FileText,
  DollarSign,
  Wifi,
} from "lucide-react";
import { StylizedBankLogo, MEXICAN_BANKS, BankPreset } from "@/components/forms/AccountForm";

export default function LandingPage() {
  // Estado para el simulador interactivo en móvil
  const [activeSimTab, setActiveSimTab] = useState<"transaction" | "msi" | "banks">("transaction");

  // Estados interactivos para Simulador 1: Registro
  const [simTxType, setSimTxType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [simAmount, setSimAmount] = useState<string>("450.00");

  // Estados interactivos para Simulador 2: MSI
  const [simMonths, setSimMonths] = useState<number>(6);
  const [simTotalMsi, setSimTotalMsi] = useState<number>(4850);

  // Estados interactivos para Simulador 3: Bancos & Multidivisa
  const [simSelectedBank, setSimSelectedBank] = useState<BankPreset>(MEXICAN_BANKS[0]);
  const [simCurrency, setSimCurrency] = useState<"MXN" | "USD" | "EUR">("MXN");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col select-none relative overflow-x-hidden">
      {/* Luces y degradados ambientales corporativos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#009fdb]/15 via-[#153D64]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[600px] -right-40 w-96 h-96 bg-[#153D64]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-96 -left-40 w-96 h-96 bg-[#009fdb]/10 rounded-full blur-3xl pointer-events-none" />

      {/* NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0a0a0a]/85 border-b border-[#262626] px-4 sm:px-8 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#153D64] to-[#009fdb] border border-white/20 text-white flex items-center justify-center font-black shadow-md shadow-[#009fdb]/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Finanzas PWA
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#009fdb] bg-[#009fdb]/10 border border-[#009fdb]/30 px-1.5 py-0.2 rounded-md">
                  Fintech Elite
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Banca Privada Personal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white border border-[#262626] hover:border-slate-500 bg-[#121212] transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#009fdb] hover:bg-[#0088bd] shadow-md shadow-[#009fdb]/30 transition-all flex items-center gap-1.5"
            >
              <span>Crear Bóveda</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-8 flex flex-col items-center text-center relative z-10 gap-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153D64]/30 border border-[#009fdb]/40 text-[#009fdb] text-xs font-bold shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fintech Soberana con Supabase & Cifrado de Bóveda</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl flex flex-col gap-4"
        >
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Control patrimonial, tarjetas y deudas con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009fdb] via-[#38bdf8] to-white">
              rigor bancario
            </span>
            .
          </h1>
          <p className="text-sm sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            La PWA de finanzas personales diseñada para erradicar la fricción. Separa compras a
            Meses Sin Intereses (MSI), proyecta tus días de corte y administra deudas con terceros
            con sincronización privada en Supabase.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-extrabold text-sm shadow-xl shadow-[#009fdb]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Comenzar Ahora</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
          <a
            href="#simulador"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-[#262626] text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <Smartphone className="w-4 h-4 text-[#009fdb]" />
            <span>Ver Demostración Interactiva</span>
          </a>
        </motion.div>
      </section>

      {/* SECCIÓN INTERACTIVA: DEMOSTRACIÓN Y ANIMACIÓN EN MÓVIL */}
      <section id="simulador" className="max-w-6xl mx-auto px-4 sm:px-8 py-12 w-full relative z-10 flex flex-col items-center gap-8">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#009fdb] flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            <span>Experiencia de Uso en Dispositivo Móvil</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Pruébalo en vivo desde este simulador
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Interactúa con los controles inferiores para ver cómo responde la interfaz dentro del chasis móvil.
          </p>
        </div>

        {/* Selector de Pestañas del Simulador Móvil */}
        <div className="flex p-1.5 rounded-2xl bg-[#121212] border border-[#262626] max-w-md w-full">
          <button
            type="button"
            onClick={() => setActiveSimTab("transaction")}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              activeSimTab === "transaction"
                ? "bg-[#009fdb] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1. Movimientos
          </button>
          <button
            type="button"
            onClick={() => setActiveSimTab("msi")}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              activeSimTab === "msi"
                ? "bg-[#009fdb] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            2. Motor MSI
          </button>
          <button
            type="button"
            onClick={() => setActiveSimTab("banks")}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              activeSimTab === "banks"
                ? "bg-[#009fdb] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            3. Bancos & Divisa
          </button>
        </div>

        {/* CHASIS MÓVIL (MOCKUP TELÉFONO CON MARCO DE TITANIO CARBÓN) */}
        <div className="relative w-full max-w-[340px] sm:max-w-[370px] bg-[#000000] rounded-[48px] p-3.5 shadow-2xl shadow-[#009fdb]/10 border-4 border-[#262626] ring-1 ring-white/10">
          {/* Dynamic Island / Bocina */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#121212] border border-white/10 rounded-full z-30 flex items-center justify-between px-2.5">
            <div className="w-2 h-2 rounded-full bg-[#1e293b]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#009fdb]/40" />
          </div>

          {/* Pantalla Interna del Teléfono */}
          <div className="w-full h-[580px] bg-[#0a0a0a] rounded-[38px] overflow-hidden flex flex-col justify-between p-4 pt-10 text-left border border-[#1e1e1e] relative">
            <AnimatePresence mode="wait">
              {/* VISTA SIMULADA 1: REGISTRO DE MOVIMIENTOS */}
              {activeSimTab === "transaction" && (
                <motion.div
                  key="sim-tx"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-3.5 h-full justify-between"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Registrar Movimiento</span>
                      <span className="text-[9px] font-bold text-[#009fdb] bg-[#153D64]/50 border border-[#009fdb]/30 px-2 py-0.5 rounded-full">
                        Interactivo
                      </span>
                    </div>

                    {/* 3 Pilares en Móvil */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[#121212] rounded-xl border border-[#262626]">
                      <button
                        type="button"
                        onClick={() => setSimTxType("EXPENSE")}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          simTxType === "EXPENSE" ? "bg-[#1e1e1e] text-white border border-[#009fdb]" : "text-slate-400"
                        }`}
                      >
                        <TrendingDown className="w-3 h-3 text-rose-500" />
                        <span>Gasto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimTxType("INCOME")}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          simTxType === "INCOME" ? "bg-[#1e1e1e] text-white border border-[#009fdb]" : "text-slate-400"
                        }`}
                      >
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span>Ingreso</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimTxType("TRANSFER")}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          simTxType === "TRANSFER" ? "bg-[#1e1e1e] text-white border border-[#009fdb]" : "text-slate-400"
                        }`}
                      >
                        <ArrowRightLeft className="w-3 h-3 text-[#009fdb]" />
                        <span>Traspaso</span>
                      </button>
                    </div>

                    {/* Monto Hero */}
                    <div className="p-3 rounded-2xl bg-[#121212] border border-[#262626] text-center flex flex-col items-center">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Monto a capturar</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xl font-bold text-slate-400">$</span>
                        <input
                          type="text"
                          value={simAmount}
                          onChange={(e) => setSimAmount(e.target.value)}
                          className="w-32 bg-transparent text-center text-2xl font-black text-white focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-[#009fdb]">MXN</span>
                      </div>
                    </div>

                    {/* Cuenta y Categoría */}
                    <div className="flex flex-col gap-2">
                      <div className="p-2.5 rounded-xl bg-[#121212] border border-[#262626] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <StylizedBankLogo bankId="BBVA" size="sm" />
                          <span className="font-bold text-white text-[11px]">BBVA Nómina</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">$48,750.00</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#121212] border border-[#262626] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
                            🛒
                          </div>
                          <span className="font-bold text-white text-[11px]">Alimentación & Super</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Gasto diario</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-[#009fdb] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#009fdb]/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guardar Movimiento</span>
                  </button>
                </motion.div>
              )}

              {/* VISTA SIMULADA 2: MOTOR MSI VS PRÉSTAMOS */}
              {activeSimTab === "msi" && (
                <motion.div
                  key="sim-msi"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-3.5 h-full justify-between"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#009fdb]" />
                        <span>Compra a Meses (MSI)</span>
                      </span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        TDC Activa
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#121212] border border-[#262626] flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400">Monto total de la compra:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-white">${simTotalMsi.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500">MXN</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#009fdb] bg-[#153D64]/30 p-2 rounded-xl border border-[#009fdb]/30">
                        <Calculator className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Pago mensual: <b>${(simTotalMsi / simMonths).toFixed(2)}/mes</b>
                        </span>
                      </div>
                    </div>

                    {/* Selector de Meses */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Selecciona el plazo:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[3, 6, 12, 18].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSimMonths(m)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                              simMonths === m
                                ? "bg-[#009fdb] border-[#009fdb] text-white shadow-xs"
                                : "bg-[#121212] border-[#262626] text-slate-400 hover:text-white"
                            }`}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-300 leading-tight">
                      ✓ No resta dinero de tus cuentas corrientes hoy.<br />
                      ✓ Programa la mensualidad al corte de tu tarjeta.
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-[#153D64]/40 border border-[#009fdb]/40 text-center text-[10px] font-bold text-[#009fdb]">
                    Programado a {simMonths} plazos sin distorsionar saldo
                  </div>
                </motion.div>
              )}

              {/* VISTA SIMULADA 3: BANCOS MEXICANOS & DIVISA */}
              {activeSimTab === "banks" && (
                <motion.div
                  key="sim-banks"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-3 h-full justify-between"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Tarjeta con cambio de color y logo en vivo */}
                    <div
                      className="relative h-36 rounded-2xl p-4 text-white shadow-card flex flex-col justify-between overflow-hidden border border-white/20 transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${simSelectedBank.defaultColor} 0%, #121212 70%, #0a0a0a 100%)`,
                      }}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <StylizedBankLogo bankId={simSelectedBank.id} size="sm" />
                          <span className="text-xs font-extrabold truncate max-w-[140px]">
                            {simSelectedBank.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-black/40 border border-white/20">
                          {simCurrency}
                        </span>
                      </div>

                      <div className="flex items-end justify-between relative z-10 border-t border-white/15 pt-2">
                        <div>
                          <span className="text-[9px] text-white/70 block uppercase font-bold">Disponible</span>
                          <span className="text-lg font-black">$32,400.00</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/50">•••• 9021</span>
                      </div>
                    </div>

                    {/* Selector de Bancos */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Toca una institución bancaria:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {MEXICAN_BANKS.slice(0, 6).map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSimSelectedBank(b)}
                            className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all truncate ${
                              simSelectedBank.id === b.id
                                ? "bg-[#153D64]/50 border-[#009fdb] text-white"
                                : "bg-[#121212] border-[#262626] text-slate-400 hover:text-white"
                            }`}
                          >
                            <StylizedBankLogo bankId={b.id} size="sm" />
                            <span className="truncate">{b.shortLabel}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selector de Moneda */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Moneda:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["MXN", "USD", "EUR"] as const).map((curr) => (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => setSimCurrency(curr)}
                            className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                              simCurrency === curr
                                ? "bg-[#009fdb] border-[#009fdb] text-white"
                                : "bg-[#121212] border-[#262626] text-slate-400"
                            }`}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] text-center text-slate-500">
                    Cambio de diseño y moneda en tiempo real
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Barra Inferior del Chasis Móvil */}
            <div className="w-28 h-1 bg-white/20 rounded-full mx-auto mt-2" />
          </div>
        </div>
      </section>

      {/* SECCIÓN DE 4 PILARES FINANCIEROS DETALLADOS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-16 w-full relative z-10 flex flex-col gap-10">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#009fdb]">
            Capacidades del Sistema
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ingeniería financiera en cada módulo
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Resuelve de raíz los errores comunes de las apps bancarias convencionales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pilar 1 */}
          <div className="p-7 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3.5 hover:border-[#009fdb]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#009fdb]/15 text-[#009fdb] border border-[#009fdb]/30 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Control Patrimonial Consolidado</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Consolida cuentas de débito, carteras físicas de efectivo en mano y bóvedas de ahorro
              en una sola vista sin distorsión. El patrimonio neto se recalcula automáticamente con
              cada movimiento.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="p-7 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3.5 hover:border-[#009fdb]/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#153D64]/30 text-[#009fdb] border border-[#009fdb]/30 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Separación Estricta: MSI vs Préstamos</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Las compras a meses sin intereses son exclusivas de tarjetas de crédito y no restan liquidez
              inmediata de tu dinero corriente. Los préstamos a terceros se gestionan de forma independiente con
              historial de abonos y liquidación total.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="p-7 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3.5 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Banca Mexicana & Multidivisa</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Identificación visual nativa para instituciones como BBVA, Mercado Pago, Banamex,
              Banco Azteca, BanCoppel y Nu. Soporte para cuentas en Pesos Mexicanos (MXN), Dólares (USD)
              y Euros (EUR) con selector animado.
            </p>
          </div>

          {/* Pilar 4 */}
          <div className="p-7 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">PWA Local-First & Cifrado en Supabase</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Instalable a pantalla completa en iOS y Android con respeto a Safe Areas (Notch, Dynamic Island y barra gestual).
              Base de datos PostgreSQL en Supabase sin intermediarios que vendan tu información.
            </p>
          </div>
        </div>
      </section>

      {/* BANNER FINAL DE ACCESO OBLIGATORIO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 my-10 w-full relative z-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#153D64]/60 via-[#121212] to-[#0a0a0a] border border-[#009fdb]/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="flex flex-col gap-2 max-w-xl">
            <span className="text-xs font-bold text-[#009fdb] uppercase tracking-wider">
              Acceso Seguro y Privado
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ingresa a tu Bóveda Financiera
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Registra o inicia sesión con tus credenciales cifradas para administrar tus cuentas.
            </p>
          </div>
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-black text-sm shadow-xl shadow-[#009fdb]/30 transition-all shrink-0 active:scale-95 flex items-center gap-2"
          >
            <span>Iniciar Sesión / Registro</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#262626] py-8 px-4 sm:px-8 text-center text-xs text-slate-500 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} Finanzas PWA. Control patrimonial privado y seguro.</span>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/login" className="hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Términos de Servicio
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Aviso de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
