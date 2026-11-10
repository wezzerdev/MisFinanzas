"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Token no proporcionado</h2>
        <p className="text-xs text-neutral-400">
          El enlace de restablecimiento es inválido o no incluye un token de seguridad.
        </p>
        <Link
          href="/login"
          className="mt-2 w-full h-12 rounded-xl bg-[#009fdb] text-white font-bold text-xs flex items-center justify-center"
        >
          Volver a Iniciar Sesión
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 4) {
      setErrorMsg("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo actualizar la contraseña.");
      }

      setSuccess(true);
      if (data.user) {
        localStorage.setItem("finanzas_auth", JSON.stringify(data.user));
      }
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-[#009fdb]/15 border border-[#009fdb]/30 flex items-center justify-center text-[#009fdb]">
          <Lock className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Nueva Contraseña
        </h1>
        <p className="text-xs text-neutral-400">
          Ingresa y confirma tu nueva clave de acceso
        </p>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 stroke-[2.4]" />
          </div>
          <p className="text-sm font-bold text-white">
            ¡Tu contraseña ha sido actualizada exitosamente!
          </p>
          <p className="text-xs text-neutral-400 animate-pulse">
            Iniciando sesión y redirigiendo a tu bóveda...
          </p>
          <Link
            href="/dashboard"
            className="w-full h-12 rounded-xl bg-[#009fdb] text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <span>Ir al Panel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 4 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-slate-900/60 border border-[#262626] rounded-xl px-4 pr-11 text-sm text-white focus:outline-none focus:border-[#009fdb]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Confirmar Contraseña
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full h-12 bg-slate-900/60 border border-[#262626] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#009fdb]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-12 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <span>Guardar Nueva Contraseña</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#009fdb]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#153D64]/20 blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#009fdb]" />
            <span>Cargando...</span>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
