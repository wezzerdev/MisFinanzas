import Link from "next/link";
import { Wallet } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
        <Wallet className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        Página no encontrada
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
        La ruta solicitada no existe o fue movida en la aplicación.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
}
