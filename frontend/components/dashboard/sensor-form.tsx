"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SENSOR_CONFIG,
  DEFAULT_SENSOR_VALUES,
  type SensorConfigItem,
  type SensorData,
  type SensorKey,
} from "@/lib/types";

interface SensorFormProps {
  onSubmit: (data: SensorData) => Promise<void>;
  isLoading: boolean;
}

const SENSOR_CONFIG_BY_KEY = Object.fromEntries(
  SENSOR_CONFIG.map((s) => [s.key, s])
) as Record<SensorKey, SensorConfigItem>;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseAndClamp(key: SensorKey, value: string) {
  const cfg = SENSOR_CONFIG_BY_KEY[key];
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return clamp(safe, cfg.min, cfg.max);
}

export function SensorForm({ onSubmit, isLoading }: SensorFormProps) {
  const [formData, setFormData] = useState<Record<keyof SensorData, string>>(
    Object.fromEntries(
      Object.entries(DEFAULT_SENSOR_VALUES).map(([k, v]) => [k, String(v)])
    ) as Record<keyof SensorData, string>
  );

  const handleChange = (key: keyof SensorData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed: SensorData = {
      water_pH: parseAndClamp("water_pH", formData.water_pH ?? ""),
      TDS: parseAndClamp("TDS", formData.TDS ?? ""),
      water_temp: parseAndClamp("water_temp", formData.water_temp ?? ""),
    };

    await onSubmit(parsed);
  };

  return (
    <Card className="h-full border-border/50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <FlaskConical className="h-4 w-4 text-primary" />
          Sensor Input Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3">
            {SENSOR_CONFIG.map((sensor, index) => (
              <motion.div
                key={sensor.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-1.5"
              >
                <Label
                  htmlFor={sensor.key}
                  className="text-xs font-medium text-muted-foreground"
                >
                  {sensor.label}
                  {sensor.unit && (
                    <span className="ml-1 text-muted-foreground/60">
                      ({sensor.unit})
                    </span>
                  )}
                </Label>
                <Input
                  id={sensor.key}
                  type="number"
                  min={sensor.min}
                  max={sensor.max}
                  step={sensor.step}
                  value={formData[sensor.key as keyof SensorData] ?? ""}
                  onChange={(e) =>
                    handleChange(sensor.key as keyof SensorData, e.target.value)
                  }
                  className="h-9 bg-secondary/50 border-border/50 text-sm"
                  disabled={isLoading}
                />
              </motion.div>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full gap-2 mt-4"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
