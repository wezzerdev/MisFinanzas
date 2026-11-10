"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Sparkles,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerifiedParam = searchParams.get("verified") === "true";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Estados de verificación de correo
  const [verificationPending, setVerificationPending] = useState<{
    email: string;
    message: string;
    verificationUrl?: string;
    smtpConfigured?: boolean;
  } | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Estados de recuperación de contraseña
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotResetUrl, setForgotResetUrl] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResendSuccess(null);

    // Verificación obligatoria de Términos y Condiciones
    if (!acceptedTerms) {
      setErrorMsg("Es obligatorio aceptar los Términos y Condiciones y el Aviso de Privacidad para acceder.");
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg("Ingresa tu correo y contraseña.");
      return;
    }

    if (mode === "register") {
      if (password.length < 4) {
        setErrorMsg("La contraseña debe tener al menos 4 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          email: email.trim(),
          password,
          name: mode === "register" ? name.trim() : undefined,
        }),
      });

      const data = await res.json();

      // Caso 1: Requiere verificación de correo (Bloqueo de acceso)
      if (data.requiresVerification) {
        setVerificationPending({
          email: data.email || email.trim(),
          message:
            data.message ||
            data.error ||
            "Debes confirmar tu correo electrónico antes de ingresar a la bóveda.",
          verificationUrl: data.verificationUrl,
          smtpConfigured: data.smtpConfigured,
        });
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo autenticar. Verifica tus credenciales.");
      }

      // Usuario verificado: Guardar sesión y entrar al dashboard
      if (typeof window !== "undefined") {
        localStorage.setItem("finanzas_auth", JSON.stringify(data.user));
        document.cookie = `finanzas_session=active_${Date.now()}; path=/; max-age=2592000; SameSite=Lax`;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con la bóveda. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationPending?.email) return;
    setResendingEmail(true);
    setResendSuccess(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend",
          email: verificationPending.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al reenviar el correo.");
      }

      setResendSuccess(data.message || "Enlace generado exitosamente.");
      if (data.verificationUrl) {
        setVerificationPending((prev) =>
          prev
            ? {
                ...prev,
                verificationUrl: data.verificationUrl,
                smtpConfigured: data.smtpConfigured,
              }
            : null
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "No se pudo reenviar el enlace.");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Ingresa tu correo electrónico.");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    setForgotResetUrl(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al solicitar restablecimiento.");
      }

      setForgotSuccess(
        data.message ||
          "Si tu correo está registrado, recibirás un enlace seguro para restablecer tu contraseña."
      );
      if (data.resetUrl) {
        setForgotResetUrl(data.resetUrl);
      }
    } catch (err: any) {
      setForgotError(err.message || "Error al procesar la solicitud.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Luces y degradados de seguridad */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#009fdb]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#153D64]/20 blur-3xl pointer-events-none" />

      {/* Top Bar con enlace a Landing */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-2 relative z-10 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <span>← Volver a Inicio</span>
        </Link>
        <span className="text-[11px] font-semibold text-[#009fdb] bg-[#009fdb]/10 border border-[#009fdb]/30 px-2.5 py-0.5 rounded-full">
          Acceso Cifrado
        </span>
      </header>

      {/* Tarjeta Central de Autenticación */}
      <main className="w-full max-w-md mx-auto my-auto relative z-10 py-4">
        <div className="w-full bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col gap-6">
          {/* Logo & Encabezado */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#153D64] to-[#009fdb] border border-white/20 text-white flex items-center justify-center font-black shadow-lg shadow-[#009fdb]/30">
              <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {verificationPending
                ? "Verificación de Correo"
                : mode === "login"
                ? "Acceso a tu Bóveda"
                : "Crear Bóveda Personal"}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs">
              {verificationPending
                ? "Confirma tu cuenta para activar la protección de tus datos financieros."
                : mode === "login"
                ? "Ingresa tus credenciales para administrar tus cuentas, tarjetas y deudas."
                : "Registra tu cuenta para tener control privado de tus finanzas personales."}
            </p>
          </div>

          {/* Banner si acaba de verificar exitosamente desde el correo */}
          {isVerifiedParam && !verificationPending && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>¡Tu correo ha sido verificado! Ya puedes ingresar con tu contraseña.</span>
            </div>
          )}

          {/* VISTA 1: AVISO Y BLOQUEO DE VERIFICACIÓN DE CORREO PENDIENTE */}
          {verificationPending ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-4 text-center"
            >
              <div className="p-4 rounded-2xl bg-[#171717] border border-[#009fdb]/30 text-left flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[#009fdb]">
                  <Mail className="w-4 h-4 animate-bounce" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Bandeja de Entrada
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {verificationPending.message}
                </p>
                <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-white break-all">
                  {verificationPending.email}
                </div>
              </div>

              {/* Tarjeta de Activación Inmediata con 1 Clic */}
              {verificationPending.verificationUrl && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-teal-950/40 to-[#121212] border border-emerald-500/40 text-left flex flex-col gap-3 shadow-lg shadow-emerald-950/30">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Activación Inmediata de Bóveda
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Si tu servidor en Dokploy aún no tiene configurado el correo SMTP o hay demora en tu bandeja de Gmail, puedes ingresar a tu cuenta inmediatamente con este botón:
                  </p>
                  <a
                    href={verificationPending.verificationUrl}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/30 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Activar mi Bóveda y Entrar Ahora</span>
                  </a>
                </div>
              )}

              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 text-left">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="w-full h-11 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {resendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando nuevo enlace...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Reenviar Enlace de Confirmación</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationPending(null);
                    setErrorMsg(null);
                    setResendSuccess(null);
                  }}
                  className="w-full h-11 rounded-xl border border-slate-700 bg-transparent text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Volver al Formulario de Acceso
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Sub-tabs: Iniciar Sesión / Registrarse */}
              <div className="flex p-1 bg-[#0a0a0a] rounded-2xl border border-[#262626]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
                    mode === "login"
                      ? "bg-[#009fdb] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
                    mode === "register"
                      ? "bg-[#009fdb] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "register" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Nombre o Alias
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ej. Roberto Duarte"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Contraseña
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotSuccess(null);
                          setForgotError(null);
                          setIsForgotModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-[#009fdb] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-11 py-3 text-sm text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === "register" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                      />
                    </div>
                  </div>
                )}

                {/* CASILLA OBLIGATORIA: Términos y Condiciones */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0a0a0a] border border-[#262626] mt-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={acceptedTerms}
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      acceptedTerms
                        ? "bg-[#009fdb] border-[#009fdb] text-white"
                        : "border-slate-600 bg-transparent hover:border-slate-400"
                    }`}
                  >
                    {acceptedTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    <span>He leído y acepto obligatoriamente los </span>
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-[#009fdb] hover:underline font-bold inline"
                    >
                      Términos y Condiciones
                    </button>
                    <span> y el </span>
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-[#009fdb] hover:underline font-bold inline"
                    >
                      Aviso de Privacidad
                    </button>
                    <span> para usar la plataforma.</span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-400 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Botón Principal de Acceso */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#009fdb]/25 flex items-center justify-center gap-2 transition-all min-h-[48px] disabled:opacity-50 mt-1 active:scale-98"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{mode === "login" ? "Ingresar a mi Bóveda" : "Crear Bóveda"}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer Legal */}
      <footer className="w-full max-w-md mx-auto text-center py-2 relative z-10 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <p className="text-[10px] text-slate-500">
          © {new Date().getFullYear()} Finanzas PWA · Acceso Privado y Seguro.
        </p>
      </footer>

      {/* Modal: Olvidé mi Contraseña */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForgotModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <div className="flex items-center gap-2 text-white">
                  <KeyRound className="w-4 h-4 text-[#009fdb]" />
                  <h3 className="text-sm font-bold">Restablecer Contraseña</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotSuccess ? (
                <div className="flex flex-col gap-3 py-2">
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                    {forgotSuccess}
                  </div>
                  {forgotResetUrl && (
                    <a
                      href={forgotResetUrl}
                      className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Restablecer Contraseña Ahora Mismo</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-full h-11 rounded-xl bg-[#262626] hover:bg-[#333] text-white font-bold text-xs"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-3.5">
                  <p className="text-xs text-neutral-400">
                    Ingresa el correo electrónico vinculado a tu cuenta para enviarte un enlace de restablecimiento seguro.
                  </p>

                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#009fdb] min-h-[48px]"
                    />
                  </div>

                  {forgotError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-400">
                      {forgotError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-12 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Enviar Enlace de Recuperación</span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Términos y Condiciones */}
      <AnimatePresence>
        {isTermsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#009fdb]" />
                  <h3 className="text-sm font-bold text-white">Términos y Aviso de Privacidad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#181818]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 text-xs text-slate-300 leading-relaxed flex flex-col gap-3 max-h-[55vh]">
                <h4 className="font-bold text-white text-xs">1. Privacidad y Soberanía de Datos</h4>
                <p>
                  Finanzas PWA está diseñada bajo un modelo de privacidad estricta. Tus transacciones, saldos, tarjetas y deudas se almacenan de forma segura y cifrada en tu instancia de base de datos dedicada.
                </p>

                <h4 className="font-bold text-white text-xs">2. Sin Intermediarios ni Venta de Datos</h4>
                <p>
                  Tus datos patrimoniales jamás son comercializados, compartidos con anunciantes ni transferidos a terceros. La plataforma es de código transparente y control total del usuario.
                </p>

                <h4 className="font-bold text-white text-xs">3. Responsabilidad del Usuario</h4>
                <p>
                  El usuario es responsable de mantener la confidencialidad de su contraseña y claves de acceso. La plataforma no otorga créditos directos, sino que asiste en la administración y registro financiero.
                </p>

                <h4 className="font-bold text-white text-xs">4. Cifrado y Conectividad</h4>
                <p>
                  Todas las conexiones hacia el servidor o base de datos Supabase utilizan transporte cifrado TLS 1.3 con almacenamiento de parámetros de tarjeta de crédito (días de corte y pago) para cálculo predictivo.
                </p>
              </div>

              <div className="pt-2 border-t border-[#262626] flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedTerms(true);
                    setIsTermsModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  <span>Aceptar y Continuar</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#009fdb]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
