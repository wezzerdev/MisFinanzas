"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, ShieldCheck, LogOut } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface MobileHeaderProps {
  accountsCount: number;
  totalBalance: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = () => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    const confirmLogout = window.confirm("¿Deseas cerrar tu sesión segura?");
    if (!confirmLogout) return;

    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("finanzas_auth");
      document.cookie = "finanzas_session=; path=/; max-age=0";
    }

    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-white/90 dark:bg-[#0a0a0a]/90 border-b border-slate-200 dark:border-[#262626] px-5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 transition-colors">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* User profile & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#153D64] to-[#009fdb] text-white font-bold flex items-center justify-center text-sm shadow-md shadow-[#009fdb]/20">
              FP
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] rounded-full" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Bóveda Personal
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                <ShieldCheck className="w-2.5 h-2.5" /> Supabase
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Control Patrimonial
            </h1>
          </div>
        </div>

        {/* Right actions: Theme toggle & Logout */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:text-[#009fdb] dark:hover:text-[#009fdb] transition-colors shadow-xs active:scale-95"
            aria-label="Cambiar tema claro / oscuro"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar Bóveda / Sesión"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#121212] border border-slate-200 dark:border-[#262626] flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shadow-xs active:scale-95"
            aria-label="Cerrar Bóveda"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
