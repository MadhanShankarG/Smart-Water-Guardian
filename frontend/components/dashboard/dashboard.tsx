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

const toPercent = (p: number) =>
  Math.min(99.9, Math.max(0.1, p * 100));

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSensorData = useRef<SensorData | null>(null);

  const { toast } = useToast();

  const callBackend = async (data: SensorData) => {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.probability === null) return;

    setCurrentResult({
      probability: result.probability,
      status: result.status,
    });

    if (result.history) {
      const mapped: HistoryEntry[] = result.history.map((h: any, i: number) => ({
        id: `${Date.now()}-${i}`,
        timestamp: new Date(),
        sensorData: data,
        probability: h.probability,
        status: h.status,
      }));

      setHistory(mapped);
    }
  };

  const handleSubmit = useCallback(
    async (data: SensorData) => {
      setIsLoading(true);
      lastSensorData.current = data;

      try {
        await callBackend(data);

        if (currentResult) {
          toast({
            title: currentResult.status,
            description: `${toPercent(currentResult.probability).toFixed(2)}%`,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [toast, currentResult]
  );

  const startStream = () => {
    if (!lastSensorData.current) return;

    setIsStreaming(true);

    timerRef.current = setInterval(() => {
      callBackend(lastSensorData.current!);
    }, 5000);
  };

  const stopStream = () => {
    setIsStreaming(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 lg:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <StatsCards
            history={history}
            currentProbability={currentResult?.probability ?? null}
          />

          <div className="flex gap-3">
            <button
              onClick={startStream}
              className="px-4 py-2 bg-green-600 text-white rounded"
              disabled={isStreaming}
            >
              Start Live
            </button>

            <button
              onClick={stopStream}
              className="px-4 py-2 bg-red-600 text-white rounded"
              disabled={!isStreaming}
            >
              Stop
            </button>
          </div>

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