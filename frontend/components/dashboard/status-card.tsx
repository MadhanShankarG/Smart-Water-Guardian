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
    glowColor: "shadow-safe/20",
    icon: Shield,
    label: "Water is Safe",
    description: "All parameters within acceptable limits",
  },
  MODERATE: {
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    glowColor: "shadow-warning/20",
    icon: AlertTriangle,
    label: "Moderate Risk",
    description: "Some parameters need attention",
  },
  UNSAFE: {
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/30",
    glowColor: "shadow-danger/20",
    icon: AlertCircle,
    label: "Unsafe Water",
    description: "Immediate attention required",
  },
};

function CircularGauge({
  probability,
  status,
}: {
  probability: number;
  status: "SAFE" | "MODERATE" | "UNSAFE";
}) {
  const config = statusConfig[status];
  const circumference = 2 * Math.PI * 90;
  const percentage = probability * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    switch (status) {
      case "SAFE":
        return "stroke-safe";
      case "MODERATE":
        return "stroke-warning";
      case "UNSAFE":
        return "stroke-danger";
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" className="transform -rotate-90">
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
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          key={probability}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-4xl font-bold ${config.color}`}
        >
          {(probability * 100).toFixed(1)}%
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">
          Safety Probability
        </span>
      </div>
    </div>
  );
}

export function StatusCard({ result }: StatusCardProps) {
  if (!result) {
    return (
      <Card className="h-full border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Activity className="h-4 w-4 text-primary" />
            Water Quality Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-44 w-44 rounded-full border-4 border-dashed border-border/50 flex items-center justify-center">
              <Activity className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Submit sensor data to analyze water quality
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const config = statusConfig[result.status];
  const Icon = config.icon;

  return (
    <Card
      className={`h-full border-border/50 shadow-lg transition-all duration-500 ${config.bgColor} ${config.borderColor}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Activity className="h-4 w-4 text-primary" />
          Water Quality Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={result.status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            <CircularGauge
              probability={result.probability}
              status={result.status}
            />

            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor} border ${config.borderColor}`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className={`font-semibold ${config.color}`}>
                  {config.label}
                </span>
              </motion.div>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground text-center"
              >
                {config.description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
