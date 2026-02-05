"use client";

import { motion } from "framer-motion";
import { Percent, TrendingUp, TestTube2, AlertOctagon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoryEntry } from "@/lib/types";

interface StatsCardsProps {
  history: HistoryEntry[];
  currentProbability: number | null;
}

function clampPercent(p: number) {
  if (!Number.isFinite(p)) return null;
  return Math.min(99.9, Math.max(0.1, p));
}

function fractionToClampedPercent(probabilityFraction: number | null) {
  if (probabilityFraction === null || !Number.isFinite(probabilityFraction)) return null;
  return clampPercent(probabilityFraction * 100);
}

function formatPercent(value: number | null) {
  const p = value === null ? null : clampPercent(value);
  return p === null ? "-" : `${p.toFixed(2)}%`;
}

export function StatsCards({ history, currentProbability }: StatsCardsProps) {
  const totalTests = history.length;

  const unsafeCount = history.filter((h) => h.status === "UNSAFE").length;

  const last5 = history.slice(-5);
  const last5Avg =
    last5.length > 0
      ? last5.reduce((acc, h) => acc + h.probability, 0) / last5.length
      : null;

  const stats = [
    {
      label: "Current Probability",
      value: formatPercent(fractionToClampedPercent(currentProbability)),
      icon: Percent,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Last 5 Average",
      value: formatPercent(last5Avg),
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Total Tests",
      value: totalTests.toString(),
      icon: TestTube2,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Unsafe Alerts",
      value: unsafeCount.toString(),
      icon: AlertOctagon,
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}