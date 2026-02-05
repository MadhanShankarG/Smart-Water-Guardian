"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, Square, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "./header";
import { SensorForm } from "./sensor-form";
import { StatusCard } from "./status-card";
import { StatsCards } from "./stats-cards";
import { ChartsPanel } from "./charts-panel";
import { AlertsPanel } from "./alerts-panel";
import { Button } from "@/components/ui/button";
import type {
  HistoryEntry,
  PredictionResult,
  SensorData,
  StreamResponse,
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

function toClampedPercentFromFraction(probabilityFraction: number) {
  const percent = probabilityFraction * 100;
  return Math.min(99.9, Math.max(0.1, percent));
}

function toClampedPercentFromRaw(raw: unknown): number | null {
  const fraction = normalizeProbabilityToFraction(raw);
  if (fraction === null) return null;
  return toClampedPercentFromFraction(fraction);
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { toast } = useToast();

  const fetchStreamOnce = useCallback(async () => {
    const res = await fetch(`${API_URL}/stream`, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Stream request failed (${res.status})`);
    }

    const json: unknown = await res.json();
    const data = json as Partial<StreamResponse> | null;

    const results = Array.isArray(data?.results) ? data!.results : [];
    const backendHistory = Array.isArray(data?.history) ? data!.history : [];

    // Current result = latest of results (fallback: last history point).
    const latest =
      (results.length ? results[results.length - 1] : null) ??
      (backendHistory.length ? backendHistory[backendHistory.length - 1] : null);

    if (latest) {
      const fraction = normalizeProbabilityToFraction(
        (latest as { probability?: unknown }).probability
      );
      if (fraction !== null) {
        setCurrentResult({
          probability: fraction,
          status: coerceStatus((latest as { status?: unknown }).status),
        });
      }
    }

    // Map backend history → UI history with id + timestamps.
    const now = Date.now();
    const n = backendHistory.length;
    const mapped: HistoryEntry[] = backendHistory
      .map((h, idx) => {
        const percent = toClampedPercentFromRaw(
          (h as { probability?: unknown }).probability
        );
        if (percent === null) return null;
        const status = coerceStatus((h as { status?: unknown }).status);
        const timestamp = new Date(now - (n - 1 - idx) * STREAM_INTERVAL_MS);
        return {
          id: `${now}-${idx}`,
          timestamp,
          probability: percent,
          status,
        };
      })
      .filter((v): v is HistoryEntry => v !== null);

    setHistory(mapped);
  }, []);

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

    const json: unknown = await res.json();
    const obj = json as { probability?: unknown; status?: unknown };

    const fraction = normalizeProbabilityToFraction(obj.probability);
    if (fraction === null) {
      throw new Error("Invalid prediction response");
    }

    const status = coerceStatus(obj.status);
    setCurrentResult({ probability: fraction, status });
    return { probabilityFraction: fraction, status };
  }, []);

  const handleSubmit = useCallback(
    async (data: SensorData) => {
      setIsLoading(true);

      try {
        const result = await predictOnce(data);
        toast({
          title: result.status,
          description: `${toClampedPercentFromFraction(result.probabilityFraction).toFixed(2)}%`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [predictOnce, toast]
  );

  const startStream = useCallback(() => {
    if (intervalRef.current) return; // prevent duplicate intervals
    setIsStreaming(true);

    // Update immediately, then every 5 seconds.
    void fetchStreamOnce().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to fetch stream";
      toast({ title: "Live stream error", description: message });
    });

    intervalRef.current = setInterval(() => {
      void fetchStreamOnce().catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to fetch stream";
        toast({ title: "Live stream error", description: message });
      });
    }, STREAM_INTERVAL_MS);
  }, [fetchStreamOnce, toast]);

  const stopStream = useCallback(() => {
    setIsStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

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

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={startStream}
              disabled={isStreaming}
              className="gap-2"
            >
              <Radio className="h-4 w-4" />
              Start Live
            </Button>

            <Button
              onClick={stopStream}
              disabled={!isStreaming}
              variant="destructive"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Live
            </Button>

            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {isStreaming ? (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-safe" />
                  Live updates every 5s
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  Live mode is off
                </>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <SensorForm
                onSubmit={handleSubmit}
                isLoading={isLoading || isStreaming}
              />
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