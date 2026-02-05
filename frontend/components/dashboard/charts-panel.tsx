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
} from "recharts";
import type { HistoryEntry } from "@/lib/types";

interface ChartsPanelProps {
  history: HistoryEntry[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: { status: string } }[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const statusColor =
      data.payload.status === "SAFE"
        ? "text-safe"
        : data.payload.status === "MODERATE"
          ? "text-warning"
          : "text-danger";

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-lg font-bold ${statusColor}`}>
          {data.value.toFixed(1)}%
        </p>
        <p className={`text-xs ${statusColor}`}>{data.payload.status}</p>
      </div>
    );
  }
  return null;
}

export function ChartsPanel({ history }: ChartsPanelProps) {
  const chartData = history.slice(-20).map((entry, index) => ({
    name: `#${index + 1}`,
    probability: entry.probability,
    status: entry.status,
    timestamp: entry.timestamp.toLocaleTimeString(),
  }));

  const lineColor = "hsl(var(--primary))";
  const areaColor = "hsl(var(--accent))";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 shadow-lg h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              Probability Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={70}
                    stroke="hsl(var(--safe))"
                    strokeDasharray="5 5"
                    label={{ value: "Safe", fill: "hsl(var(--safe))", fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={40}
                    stroke="hsl(var(--danger))"
                    strokeDasharray="5 5"
                    label={{ value: "Unsafe", fill: "hsl(var(--danger))", fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="probability"
                    stroke={lineColor}
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: lineColor,
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: lineColor,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                <p className="text-sm">No data yet. Submit sensor readings to see trends.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50 shadow-lg h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <BarChart3 className="h-4 w-4 text-accent" />
              Last 20 Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={areaColor}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={areaColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="probability"
                    stroke={areaColor}
                    strokeWidth={2}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                <p className="text-sm">No data yet. Submit sensor readings to see history.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
