"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Camera, Sparkles, ArrowUpDown } from "lucide-react";

interface FABProps {
  onNewTransaction: () => void;
  onScanReceipt: () => void;
  onOpenChat: () => void;
}

export const FAB: React.FC<FABProps> = ({
  onNewTransaction,
  onScanReceipt,
  onOpenChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const actionItems = [
    {
      id: "transaction",
      label: "Nuevo Movimiento",
      icon: ArrowUpDown,
      color: "bg-[#009fdb] text-white border border-[#009fdb]",
      action: () => {
        close();
        onNewTransaction();
      },
    },
    {
      id: "scan",
      label: "Escanear Recibo",
      icon: Camera,
      color: "bg-[#121212] text-[#009fdb] border border-[#262626]",
      action: () => {
        close();
        onScanReceipt();
      },
    },
    {
      id: "chat",
      label: "Asesor IA",
      icon: Sparkles,
      color: "bg-[#153D64] text-[#009fdb] border border-[#009fdb]/40",
      action: () => {
        close();
        onOpenChat();
      },
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      {/* Posicionamiento Seguro: Flotando perfectamente sobre la barra inferior con Safe-Area */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:bottom-24 right-5 z-40 flex flex-col items-end pointer-events-none">
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-3 mb-3 pointer-events-auto">
              {actionItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{
                      duration: 0.18,
                      delay: (actionItems.length - 1 - index) * 0.04,
                    }}
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={item.action}
                  >
                    <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121212] text-slate-800 dark:text-neutral-100 text-xs font-bold shadow-soft border border-slate-200 dark:border-[#262626] group-hover:scale-105 transition-transform select-none">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${item.color}`}
                      aria-label={item.label}
                    >
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Master Floating Action Button: Corporate Blue #009fdb con elevación segura */}
        <motion.button
          type="button"
          onClick={toggleOpen}
          whileTap={{ scale: 0.92 }}
          className="pointer-events-auto w-14 h-14 rounded-2xl bg-[#009fdb] hover:bg-[#0088bd] text-white border border-white/20 flex items-center justify-center shadow-2xl shadow-[#009fdb]/40 focus:outline-none transition-all active:scale-95"
          aria-label={isOpen ? "Cerrar menú de acciones" : "Abrir menú de registro"}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <Plus className="w-6 h-6 stroke-[2.5] text-white" />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
};

export default FAB;
