"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import type { HistoryEntry, WaterStatus } from "@/lib/types";

interface ChartsPanelProps {
  history: HistoryEntry[];
}

type ChartDatum = {
  time: string;
  probability: number; // percent
  status: WaterStatus;
};

function clampPercent(p: number) {
  if (!Number.isFinite(p)) return 0.1;
  return Math.min(99.9, Math.max(0.1, p));
}

/* ------------------------------------------------------- */
/* Tooltip */
/* ------------------------------------------------------- */
function CustomTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as ChartDatum | undefined;
  if (!data) return null;

  const color =
    data.status === "SAFE"
      ? "text-safe"
      : data.status === "MODERATE"
        ? "text-warning"
        : "text-danger";

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-muted-foreground">{data.time}</p>
      <p className={`text-lg font-bold ${color}`}>
        {clampPercent(data.probability).toFixed(2)}%
      </p>
      <p className={`text-xs ${color}`}>{data.status}</p>
    </div>
  );
}

/* ------------------------------------------------------- */
/* Component */
/* ------------------------------------------------------- */
export function ChartsPanel({ history }: ChartsPanelProps) {
  const safeHistory = history ?? [];

  /* use real time instead of index */
  const chartData = safeHistory.slice(-20).map((entry) => ({
    time: entry.timestamp.toLocaleTimeString(),
    probability: clampPercent(entry.probability),
    status: entry.status,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ===================================================== */}
      {/* LINE CHART */}
      {/* ===================================================== */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="border-border/50 shadow-lg h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              Probability Over Time
            </CardTitle>
          </CardHeader>

          <CardContent>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" strokeOpacity={0.15} />

                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />

                  <YAxis
                    domain={[0, 100]}
                    tickCount={6}
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {/* SAFE / UNSAFE lines */}
                  <ReferenceLine y={70} stroke="green" strokeDasharray="5 5" />
                  <ReferenceLine y={30} stroke="red" strokeDasharray="5 5" />

                  <Line
                    type="monotone"
                    dataKey="probability"
                    stroke="#22c55e"
                    strokeWidth={4}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===================================================== */}
      {/* AREA CHART */}
      {/* ===================================================== */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="border-border/50 shadow-lg h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <BarChart3 className="h-4 w-4 text-accent" />
              Last 20 Readings
            </CardTitle>
          </CardHeader>

          <CardContent>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" strokeOpacity={0.15} />

                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickCount={6} tick={{ fontSize: 11 }} />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="probability"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={0.35}
                    fill="#06b6d4"
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No history yet
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}