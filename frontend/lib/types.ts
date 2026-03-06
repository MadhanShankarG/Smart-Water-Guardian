export type WaterStatus = "SAFE" | "MODERATE" | "UNSAFE";

/**
 * Backend model input is shape (20, 3) so ONLY these 3 sensors exist.
 * Contract (POST /predict):
 * {
 *   water_pH: number,
 *   TDS: number,
 *   water_temp: number
 * }
 */
export interface SensorData {
  water_pH: number;
  TDS: number;
  water_temp: number;
}

export interface PredictionResult {
  probability: number | null; // fraction: 0 to 1
  status: WaterStatus | "COLLECTING";
}

export interface HistoryPrediction {
  probability: number; // fraction: 0 to 1
  status: WaterStatus;
  timestamp?: string;
}

export interface LatestResponse {
  probability: number | null;
  status: WaterStatus | "COLLECTING";
  history: HistoryPrediction[];
  count?: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  probability: number; // percent, 0 to 100
  status: WaterStatus;
}

export type SensorKey = keyof SensorData;

export type SensorConfigItem = {
  key: SensorKey;
  label: string;
  min: number;
  max: number;
  unit: string;
  step: number;
};

export const SENSOR_CONFIG: readonly SensorConfigItem[] = [
  { key: "water_pH", label: "pH", min: 0, max: 14, unit: "", step: 0.1 },
  { key: "TDS", label: "TDS", min: 0, max: 50000, unit: "ppm", step: 1 },
  {
    key: "water_temp",
    label: "Temperature",
    min: -10,
    max: 100,
    unit: "°C",
    step: 0.1,
  },
] as const;

export const DEFAULT_SENSOR_VALUES: SensorData = {
  water_pH: 7.0,
  TDS: 300,
  water_temp: 25.0,
};