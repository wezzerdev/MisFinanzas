"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ShieldCheck, Lock, ArrowRight, Fingerprint } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Local-first unlock logic: direct access
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 p-8 bg-surface rounded-3xl border border-surface-tertiary shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-turquoise-500 to-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-950/50">
          <Wallet className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Finanzas PWA</h2>
          <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Bóveda Local Protegida
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 mt-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              placeholder="PIN de acceso (opcional)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-2xl text-center text-sm text-white focus:outline-none focus:border-turquoise-400 min-h-touch"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-turquoise-500 to-emerald-500 text-slate-950 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity min-h-touch"
          >
            <span>Desbloquear Bóveda</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 px-4 bg-surface-secondary hover:bg-surface-tertiary text-slate-300 font-medium text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors min-h-touch"
          >
            <Fingerprint className="w-4 h-4 text-turquoise-400" />
            <span>Acceso Rápido Local</span>
          </button>
        </form>
      </div>
    </div>
  );
}
