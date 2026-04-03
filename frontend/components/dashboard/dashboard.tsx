"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Header } from "./header";
import { SensorForm } from "./sensor-form";
import { StatusCard } from "./status-card";
import { StatsCards } from "./stats-cards";
import { ChartsPanel } from "./charts-panel";
import { AlertsPanel } from "./alerts-panel";
import type {
  HistoryPrediction,
  HistoryEntry,
  LatestResponse,
  PredictionResult,
  SensorData,
  WaterStatus,
} from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STREAM_INTERVAL_MS = 5000;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function coerceStatus(value: unknown): WaterStatus {
  if (value === "SAFE" || value === "MODERATE" || value === "UNSAFE") return value;
  return "MODERATE";
}

function normalizeProbabilityToFraction(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const fraction = n > 1 ? n / 100 : n;
  return clamp(fraction, 0, 1);
}

function toPercent(probabilityFraction: number) {
  const percent = probabilityFraction * 100;
  return clamp(percent, 0, 100);
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const { toast } = useToast();

  const mapHistory = useCallback((items: HistoryPrediction[]) => {
    const now = Date.now();
    return items
      .map((entry, idx) => {
        const fraction = normalizeProbabilityToFraction(entry.probability);
        if (fraction === null) return null;
        const status = coerceStatus(entry.status);
        const timestamp = entry.timestamp
          ? new Date(entry.timestamp)
          : new Date(now - (items.length - 1 - idx) * STREAM_INTERVAL_MS);
        return {
          id: `${timestamp.getTime()}-${idx}`,
          timestamp,
          probability: toPercent(fraction),
          status,
        };
      })
      .filter((entry): entry is HistoryEntry => entry !== null);
  }, []);

  const fetchLatest = useCallback(async () => {
    const res = await fetch(`${API_URL}/latest`, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Latest request failed (${res.status})`);
    }

    const json = (await res.json()) as LatestResponse;
    const normalizedStatus =
      json.status === "COLLECTING" ? "COLLECTING" : coerceStatus(json.status);
    const probability = normalizeProbabilityToFraction(json.probability);
    const nextHistory = Array.isArray(json.history) ? mapHistory(json.history) : [];

    setCurrentResult({
      probability,
      status: normalizedStatus,
    });
    setHistory(nextHistory.slice(-20));
  }, [mapHistory]);

  const predictOnce = useCallback(async (data: SensorData) => {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        water_pH: data.water_pH,
        TDS: data.TDS,
        water_temp: data.water_temp,
      } satisfies SensorData),
    });

    if (!res.ok) {
      throw new Error(`Prediction request failed (${res.status})`);
    }

    const json = (await res.json()) as LatestResponse;
    const probability = normalizeProbabilityToFraction(json.probability);
    const status = json.status === "COLLECTING" ? "COLLECTING" : coerceStatus(json.status);

    setCurrentResult({ probability, status });
    if (Array.isArray(json.history) && json.history.length > 0) {
      setHistory(mapHistory(json.history).slice(-20));
    }
    return { probability, status };
  }, [mapHistory]);

  const handleSubmit = useCallback(
    async (data: SensorData) => {
      setIsLoading(true);

      try {
        const result = await predictOnce(data);
        if (result.probability === null || result.status === "COLLECTING") {
          toast({
            title: "COLLECTING",
            description: "Collecting at least 20 readings before prediction.",
          });
        } else {
          toast({
            title: result.status,
            description: `${toPercent(result.probability).toFixed(2)}%`,
          });
        }
        await fetchLatest();
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLatest, predictOnce, toast]
  );

  useEffect(() => {
    let isMounted = true;
    const fetchSafe = async () => {
      try {
        await fetchLatest();
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch latest";
        toast({ title: "Live stream error", description: message });
      }
    };

    void fetchSafe();
    const id = setInterval(() => {
      void fetchSafe();
    }, STREAM_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [fetchLatest, toast]);

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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-safe" />
            Live updates every 5s from /latest
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