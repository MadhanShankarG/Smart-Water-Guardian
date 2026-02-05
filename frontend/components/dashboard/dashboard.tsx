"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Header } from "./header";
import { SensorForm } from "./sensor-form";
import { StatusCard } from "./status-card";
import { StatsCards } from "./stats-cards";
import { ChartsPanel } from "./charts-panel";
import { AlertsPanel } from "./alerts-panel";
import type { SensorData, PredictionResult, HistoryEntry } from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* clamp percent so UI NEVER shows 0 or 100 */
const toPercent = (p: number) =>
  Math.min(99.9, Math.max(0.1, p * 100));

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<PredictionResult | null>(null);

  /* HISTORY NOW COMES FROM BACKEND ONLY */
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /* streaming state */
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  /* ======================================================
     SINGLE PREDICTION
  ====================================================== */
  const handleSubmit = useCallback(
    async (data: SensorData) => {
      setIsLoading(true);

      try {
        const response = await fetch(`${API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error();

        const result = await response.json();

        /* backend returns history now */
        const backendHistory = result.history ?? [];

        setCurrentResult({
          probability: result.probability,
          status: result.status,
        });

        setHistory(
          backendHistory.map((h: any, i: number) => ({
            id: `${Date.now()}-${i}`,
            timestamp: new Date(),
            sensorData: data,
            probability: h.probability,
            status: h.status,
          }))
        );

        const percent = toPercent(result.probability);

        toast({
          title: `Water Quality: ${result.status}`,
          description: `${percent.toFixed(2)}%`,
        });
      } catch {
        toast({
          title: "Backend not reachable",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  /* ======================================================
     STREAMING MODE (auto every 2s)
  ====================================================== */
  const startStream = (data: SensorData) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      handleSubmit(data);
    }, 2000);

    setIsStreaming(true);
  };

  const stopStream = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <StatsCards
            history={history}
            currentProbability={currentResult?.probability ?? null}
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3 space-y-3">
              <SensorForm
                onSubmit={(data) => {
                  if (isStreaming) stopStream();
                  handleSubmit(data);
                }}
                isLoading={isLoading}
              />

              <button
                className="w-full text-sm border rounded-md py-2"
                onClick={() =>
                  isStreaming
                    ? stopStream()
                    : startStream(history.at(-1)?.sensorData ?? {
                        ph: 7,
                        hardness: 150,
                        solids: 20000,
                        chloramines: 7,
                        sulfate: 250,
                        conductivity: 400,
                        organic_carbon: 14,
                        trihalomethanes: 60,
                        turbidity: 4,
                      })
                }
              >
                {isStreaming ? "Stop Live Stream" : "Start Live Stream"}
              </button>
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