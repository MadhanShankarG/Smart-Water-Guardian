"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, AlertCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PredictionResult } from "@/lib/types";

interface StatusCardProps {
  result: PredictionResult | null;
}

const statusConfig = {
  SAFE: {
    color: "text-safe",
    bgColor: "bg-safe/10",
    borderColor: "border-safe/30",
    icon: Shield,
    label: "Water is Safe",
    description: "All parameters within acceptable limits",
  },
  MODERATE: {
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    icon: AlertTriangle,
    label: "Moderate Risk",
    description: "Some parameters need attention",
  },
  UNSAFE: {
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/30",
    icon: AlertCircle,
    label: "Unsafe Water",
    description: "Immediate attention required",
  },
};

/* single clamp logic */
const toPercent = (p: number) =>
  Math.min(99.9, Math.max(0.1, p * 100));

function CircularGauge({
  probability,
  status,
}: {
  probability: number;
  status: "SAFE" | "MODERATE" | "UNSAFE";
}) {
  const config = statusConfig[status];

  const percent = toPercent(probability);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset =
    circumference - (percent / 100) * circumference;

  const getStrokeColor = () => {
    if (status === "SAFE") return "stroke-safe";
    if (status === "MODERATE") return "stroke-warning";
    return "stroke-danger";
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" className="-rotate-90">
        <circle
          cx="110"
          cy="110"
          r="90"
          strokeWidth="12"
          fill="none"
          className="stroke-secondary"
        />

        <motion.circle
          cx="110"
          cy="110"
          r="90"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          className={getStrokeColor()}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1 }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${config.color}`}>
          {percent.toFixed(2)}%
        </span>
        <span className="text-xs text-muted-foreground mt-1">
          Safety Probability
        </span>
      </div>
    </div>
  );
}

export function StatusCard({ result }: StatusCardProps) {
  if (!result || result.probability == null) {
    return (
      <Card className="h-full border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Waiting for readings...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          Collecting sensor data
        </CardContent>
      </Card>
    );
  }

  const config =
    statusConfig[result.status] ?? statusConfig.MODERATE;

  const Icon = config.icon;

  return (
    <Card className={`h-full shadow-lg ${config.bgColor} ${config.borderColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Water Quality Status
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={result.status}>
            <CircularGauge
              probability={result.probability}
              status={result.status}
            />
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className={`font-semibold ${config.color}`}>
            {config.label}
          </span>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {config.description}
        </p>
      </CardContent>
    </Card>
  );
}