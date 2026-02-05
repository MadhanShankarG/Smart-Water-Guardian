"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Header } from "./header";
import { SensorForm } from "./sensor-form";
import { StatusCard } from "./status-card";
import { StatsCards } from "./stats-cards";
import { ChartsPanel } from "./charts-panel";
import { AlertsPanel } from "./alerts-panel";
import type { SensorData, PredictionResult, HistoryEntry } from "@/lib/types";

const API_URL = "http://localhost:8000";

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { toast } = useToast();

  const handleSubmit = useCallback(
    async (data: SensorData) => {
      setIsLoading(true);

      try {
        // REAL BACKEND CALL (NO MOCK)
        const response = await fetch(`${API_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze water sample");
        }

        const result: PredictionResult = await response.json();

        // update UI
        setCurrentResult(result);

        const historyEntry: HistoryEntry = {
          id: Date.now().toString(), // replaced crypto.randomUUID()
          timestamp: new Date(),
          sensorData: data,
          ...result,
        };

        setHistory((prev) => [...prev, historyEntry]);

        // toast
        if (result.status === "SAFE") {
          toast({
            title: "Water Quality: Safe",
            description: `Probability: ${(result.probability * 100).toFixed(2)}%`,
          });
        } else if (result.status === "MODERATE") {
          toast({
            title: "Water Quality: Moderate",
            description: "Borderline quality detected",
          });
        } else {
          toast({
            title: "Water Quality: Unsafe",
            description: "Do NOT drink this water",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Analysis Failed",
          description: "Backend not reachable. Start Flask server.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <StatsCards
            history={history}
            currentProbability={currentResult?.probability ?? null}
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <SensorForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            <div className="lg:col-span-6 space-y-6">
              <StatusCard result={currentResult} />
              <ChartsPanel history={history} />
            </div>

            <div className="lg:col-span-3">
              <AlertsPanel history={history} />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}