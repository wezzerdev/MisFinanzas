"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  CreditCard,
  Layers,
  HandCoins,
  Smartphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Wallet,
  TrendingUp,
  Receipt,
  Building2,
  Wifi,
} from "lucide-react";
import { StylizedBankLogo, MEXICAN_BANKS } from "@/components/forms/AccountForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col select-none relative overflow-x-hidden">
      {/* Luces y degradados ambientales corporativos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#009fdb]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 -right-40 w-96 h-96 bg-[#153D64]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 -left-40 w-96 h-96 bg-[#009fdb]/10 rounded-full blur-3xl pointer-events-none" />

      {/* NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-[#262626] px-4 sm:px-8 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#153D64] to-[#009fdb] border border-white/20 text-white flex items-center justify-center font-black shadow-md shadow-[#009fdb]/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Finanzas PWA
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#009fdb] bg-[#009fdb]/10 border border-[#009fdb]/30 px-1.5 py-0.2 rounded-md">
                  Elite
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
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white border border-[#262626] hover:border-slate-500 bg-[#121212] transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#009fdb] hover:bg-[#0088bd] shadow-md shadow-[#009fdb]/30 transition-all flex items-center gap-1.5"
            >
              <span>Abrir Bóveda</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-20 flex flex-col items-center text-center relative z-10 gap-8">
        {/* Badge Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153D64]/30 border border-[#009fdb]/40 text-[#009fdb] text-xs font-bold shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fintech Soberana con Supabase & Modo Offline</span>
        </motion.div>

        {/* Headline Principal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl flex flex-col gap-4"
        >
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Tu patrimonio, tus tarjetas y tus deudas en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009fdb] to-[#38bdf8]">
              control absoluto
            </span>
            .
          </h1>
          <p className="text-sm sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            La plataforma financiera móvil diseñada con estética bancaria corporativa.
            Separa compras a meses sin intereses (MSI), administra préstamos y consulta tu
            flujo neto en tiempo real.
          </p>
        </motion.div>

        {/* Botones de Llamado a la Acción (CTA) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-extrabold text-sm shadow-xl shadow-[#009fdb]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Crear Bóveda Gratuita</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-[#262626] text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <Wallet className="w-4 h-4 text-[#009fdb]" />
            <span>Explorar Demo Local</span>
          </Link>
        </motion.div>

        {/* Tarjeta Visual de Previsualización Interactiva */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-2xl mt-4 p-5 sm:p-6 rounded-3xl bg-[#121212] border border-[#262626] shadow-2xl shadow-black/90 flex flex-col gap-5 text-left"
        >
          {/* Mockup de Tarjeta Bancaria BBVA / Nu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative h-44 rounded-3xl p-5 text-white shadow-card flex flex-col justify-between overflow-hidden border border-white/15 bg-gradient-to-br from-[#009fdb] via-[#153D64] to-[#0a0a0a]">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <StylizedBankLogo bankId="BBVA" size="sm" />
                  <span className="text-xs font-black tracking-tight">BBVA Nómina</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/15">
                    MXN
                  </span>
                  <Wifi className="w-3.5 h-3.5 text-white/80 rotate-90" />
                </div>
              </div>

              <div className="relative z-10 flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/60">
                  •••• •••• •••• 5824
                </span>
                <span className="text-2xl font-black tracking-tight mt-1">
                  $48,750.00
                </span>
              </div>

              <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-2 text-[10px] text-white/80 font-semibold">
                <span>Corte: Día 15</span>
                <span>Pago: Día 05</span>
              </div>
            </div>

            {/* Mini Dashboard de Métricas */}
            <div className="flex flex-col justify-between gap-3 p-4 rounded-3xl bg-[#0a0a0a] border border-[#262626]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Patrimonio Neto
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  +14.2% mes
                </span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">$124,800.00</span>
                <span className="text-xs text-slate-400 font-bold ml-1.5">MXN</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e1e1e] text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Ingresos</span>
                  <span className="font-extrabold text-emerald-400">+$35,000.00</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">MSI & Deudas</span>
                  <span className="font-extrabold text-[#009fdb]">$4,850/mes</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* GRILLA DE 4 PILARES FINANCIEROS */}
        <section className="w-full pt-12 text-left flex flex-col gap-8">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Diseñada para la precisión financiera
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Cada módulo resuelve un dolor real de la gestión personal sin saturación visual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3 hover:border-[#009fdb]/40 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#009fdb]/15 text-[#009fdb] flex items-center justify-center border border-[#009fdb]/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Tarjetas de Crédito & Corte Automático</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registra tu límite de crédito, día de corte y fecha límite de pago. Calcula de
                inmediato el monto estimado a liquidar en tu siguiente periodo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3 hover:border-[#009fdb]/40 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#153D64]/30 text-[#009fdb] flex items-center justify-center border border-[#009fdb]/30">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Meses Sin Intereses (MSI)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distingue compras fraccionadas a tarjeta de deudas informales. Soporte para registro
                retroactivo (backlog) de plazos ya iniciados.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3 hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <HandCoins className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Préstamos & Pasivos con Terceros</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Control de dinero que te prestaron o prestaste. Abonos parciales, liquidación
                vinculada a cuentas y conciliación en un solo clic.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-[#121212] border border-[#262626] flex flex-col gap-3 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">PWA Instalable & Safe Areas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instálala directamente en tu iPhone o Android con soporte para Dynamic Island y barra
                gestual sin perder espacio de pantalla.
              </p>
            </div>
          </div>
        </section>

        {/* LOGOS DE BANCOS SOPORTADOS */}
        <section className="w-full pt-8 flex flex-col items-center gap-4 border-t border-[#1e1e1e]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Identificación visual con bancos líderes
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl">
            {MEXICAN_BANKS.slice(0, 7).map((bank) => (
              <div
                key={bank.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#121212] border border-[#262626] text-xs font-bold text-slate-300"
              >
                <StylizedBankLogo bankId={bank.id} size="sm" />
                <span>{bank.shortLabel}</span>
              </div>
            ))}
          </div>
        </section>

        {/* BANNER CTA INFERIOR */}
        <section className="w-full my-6 p-8 rounded-3xl bg-gradient-to-r from-[#153D64]/50 via-[#121212] to-[#0a0a0a] border border-[#009fdb]/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="flex flex-col gap-1.5 max-w-lg">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ¿Listo para dominar tus finanzas?
            </h3>
            <p className="text-xs text-slate-400">
              Despliega tu propia instancia privada en Dokploy con base de datos en Supabase.
            </p>
          </div>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-2xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-black text-xs shadow-lg shadow-[#009fdb]/30 transition-all shrink-0 active:scale-95"
          >
            Comenzar Ahora
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#262626] py-6 px-4 sm:px-8 text-center text-xs text-slate-500 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Finanzas PWA. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/login" className="hover:text-white transition-colors">
              Términos & Condiciones
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Privacidad
            </Link>
            <Link href="/dashboard" className="text-[#009fdb] hover:underline font-bold">
              Ir al Dashboard →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
