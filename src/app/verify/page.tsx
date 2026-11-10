"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, ArrowRight, Mail } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("No se proporcionó ningún token de verificación.");
      return;
    }

    const runVerification = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setSuccess(true);
          setMessage(data.message || "¡Tu correo electrónico ha sido verificado con éxito!");
          if (data.user) {
            setUserEmail(data.user.email);
            localStorage.setItem("finanzas_auth", JSON.stringify(data.user));
          }
          // Redirección suave al dashboard tras 2.5 segundos
          setTimeout(() => {
            router.push("/dashboard");
          }, 2400);
        } else {
          setSuccess(false);
          setMessage(data.error || "El enlace de verificación es inválido o ha expirado.");
        }
      } catch (err: any) {
        setSuccess(false);
        setMessage("Error de red al conectar con el servidor de autenticación.");
      } finally {
        setLoading(false);
      }
    };

    runVerification();
  }, [token, router]);

  return (
    <div className="w-full max-w-md bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col items-center text-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-[#009fdb]/15 border border-[#009fdb]/30 flex items-center justify-center text-[#009fdb]">
        <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Verificación de Cuenta
        </h1>
        <p className="text-xs text-neutral-400">
          Activación de seguridad para tu bóveda patrimonial
        </p>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#009fdb] animate-spin" />
          <p className="text-xs text-neutral-300 font-medium">
            Validando token de seguridad...
          </p>
        </div>
      ) : success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 stroke-[2.4]" />
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed w-full">
            {message}
          </div>

          <p className="text-xs text-neutral-400 animate-pulse">
            Iniciando sesión automáticamente... Redirigiendo al panel.
          </p>

          <Link
            href="/dashboard"
            className="w-full h-12 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            <span>Ir al Panel Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 w-full"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 stroke-[2.4]" />
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs leading-relaxed w-full">
            {message}
          </div>

          <div className="flex flex-col gap-2.5 w-full pt-2">
            <Link
              href="/login"
              className="w-full h-12 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <Mail className="w-4 h-4" />
              <span>Volver a Inicio de Sesión</span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#009fdb]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#153D64]/20 blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#009fdb]" />
            <span>Cargando verificación...</span>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
