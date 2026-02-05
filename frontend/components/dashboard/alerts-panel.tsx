"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HistoryEntry } from "@/lib/types";

interface AlertsPanelProps {
  history: HistoryEntry[];
}

export function AlertsPanel({ history }: AlertsPanelProps) {
  const recentAlerts = history
    .filter((h) => h.status === "UNSAFE" || h.status === "MODERATE")
    .slice(-10)
    .reverse();

  const getAlertConfig = (status: string) => {
    switch (status) {
      case "UNSAFE":
        return {
          icon: XCircle,
          color: "text-danger",
          bgColor: "bg-danger/10",
          borderColor: "border-danger/30",
          label: "Unsafe Water Detected",
        };
      case "MODERATE":
        return {
          icon: AlertTriangle,
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
          label: "Moderate Risk Detected",
        };
      default:
        return {
          icon: CheckCircle2,
          color: "text-safe",
          bgColor: "bg-safe/10",
          borderColor: "border-safe/30",
          label: "Safe Water",
        };
    }
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Bell className="h-4 w-4 text-danger" />
          Alerts Panel
          {recentAlerts.length > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-danger-foreground font-medium">
              {recentAlerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <AnimatePresence mode="popLayout">
            {recentAlerts.length > 0 ? (
              <div className="space-y-2">
                {recentAlerts.map((alert) => {
                  const config = getAlertConfig(alert.status);
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${config.bgColor} ${config.borderColor}`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Probability: {alert.probability.toFixed(1)}% •{" "}
                          {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[160px] text-center"
              >
                <CheckCircle2 className="h-10 w-10 text-safe/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No alerts at this time
                </p>
                <p className="text-xs text-muted-foreground/70">
                  All readings are within safe parameters
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
