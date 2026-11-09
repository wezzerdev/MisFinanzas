"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Verificación obligatoria de Términos y Condiciones
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
      // Llamada al endpoint de autenticación segura
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

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo autenticar. Verifica tus credenciales.");
      }

      // Guardar sesión en cliente
      if (typeof window !== "undefined") {
        localStorage.setItem("finanzas_auth", JSON.stringify(data.user));
        // Cookie fallback
        document.cookie = `finanzas_session=active_${Date.now()}; path=/; max-age=2592000; SameSite=Lax`;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con la bóveda. Intenta de nuevo.");
    } finally {
      setLoading(false);
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
              {mode === "login" ? "Acceso a tu Bóveda" : "Crear Bóveda Personal"}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs">
              {mode === "login"
                ? "Ingresa tus credenciales para administrar tus cuentas, tarjetas y deudas."
                : "Registra tu cuenta para tener control privado de tus finanzas personales."}
            </p>
          </div>

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
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Contraseña
              </label>
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
        </div>
      </main>

      {/* Footer Legal */}
      <footer className="w-full max-w-md mx-auto text-center py-2 relative z-10 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <p className="text-[10px] text-slate-500">
          © {new Date().getFullYear()} Finanzas PWA · Acceso Privado y Seguro.
        </p>
      </footer>

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
