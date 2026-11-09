"use client";

import React from "react";
import { Wallet, Calendar, HandCoins, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export type NavTab = "overview" | "calendar" | "debts" | "chat";

interface BottomNavBarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs = [
    {
      id: "overview" as NavTab,
      label: "Inicio",
      icon: Wallet,
    },
    {
      id: "calendar" as NavTab,
      label: "Calendario",
      icon: Calendar,
    },
    {
      id: "debts" as NavTab,
      label: "Deudas",
      icon: HandCoins,
    },
    {
      id: "chat" as NavTab,
      label: "Asesor IA",
      icon: Sparkles,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#262626] px-2 sm:px-4 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl min-h-[48px] transition-all group focus:outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#009fdb]/10 dark:bg-[#153D64]/35 border border-[#009fdb]/25 dark:border-[#009fdb]/45 rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-transform group-active:scale-90 shrink-0 ${
                  isActive
                    ? "text-[#009fdb] stroke-[2.3]"
                    : "text-slate-400 dark:text-neutral-500 stroke-[1.8] group-hover:text-slate-600 dark:group-hover:text-neutral-300"
                }`}
              />

              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-1 tracking-tight truncate max-w-full ${
                  isActive
                    ? "text-[#009fdb] font-bold"
                    : "text-slate-500 dark:text-neutral-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
