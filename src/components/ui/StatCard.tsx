"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "blue" | "emerald" | "rose" | "indigo" | "slate" | "turquoise";
  trend?: {
    percentage: number;
    isPositive: boolean;
  };
}

const colorMap = {
  blue: {
    iconBg: "bg-[#009fdb]/10 text-[#009fdb] dark:bg-[#153D64]/40 dark:text-[#009fdb]",
    accent: "text-[#009fdb]",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    accent: "text-rose-600 dark:text-rose-400",
  },
  indigo: {
    iconBg: "bg-[#153D64]/10 text-[#153D64] dark:bg-[#153D64]/50 dark:text-[#009fdb]",
    accent: "text-[#009fdb]",
  },
  turquoise: {
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
    accent: "text-teal-600 dark:text-teal-400",
  },
  slate: {
    iconBg: "bg-slate-100 text-slate-600 dark:bg-[#181818] dark:text-neutral-300",
    accent: "text-slate-900 dark:text-neutral-100",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  variant = "slate",
  trend,
}) => {
  const currentStyle = colorMap[variant] || colorMap.slate;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] shadow-xs hover:shadow-soft transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${currentStyle.iconBg}`}
        >
          <Icon className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {formatCurrency(amount)}
        </span>

        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-medium">
            {subtitle && <span>{subtitle}</span>}
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.percentage)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
