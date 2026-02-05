export interface SensorData {
  ph: number;
  hardness: number;
  solids: number;
  chloramines: number;
  sulfate: number;
  conductivity: number;
  organic_carbon: number;
  trihalomethanes: number;
  turbidity: number;
}

export interface PredictionResult {
  probability: number;
  status: "SAFE" | "MODERATE" | "UNSAFE";
}

export interface HistoryEntry extends PredictionResult {
  id: string;
  timestamp: Date;
  sensorData: SensorData;
}

export const SENSOR_CONFIG = [
  { key: "ph", label: "pH Level", min: 0, max: 14, unit: "", step: 0.1 },
  {
    key: "hardness",
    label: "Hardness",
    min: 0,
    max: 500,
    unit: "mg/L",
    step: 1,
  },
  {
    key: "solids",
    label: "TDS (Total Dissolved Solids)",
    min: 0,
    max: 50000,
    unit: "ppm",
    step: 1,
  },
  {
    key: "chloramines",
    label: "Chloramines",
    min: 0,
    max: 15,
    unit: "ppm",
    step: 0.1,
  },
  { key: "sulfate", label: "Sulfate", min: 0, max: 500, unit: "mg/L", step: 1 },
  {
    key: "conductivity",
    label: "Conductivity",
    min: 0,
    max: 1000,
    unit: "μS/cm",
    step: 1,
  },
  {
    key: "organic_carbon",
    label: "Organic Carbon",
    min: 0,
    max: 30,
    unit: "ppm",
    step: 0.1,
  },
  {
    key: "trihalomethanes",
    label: "Trihalomethanes",
    min: 0,
    max: 150,
    unit: "μg/L",
    step: 0.1,
  },
  { key: "turbidity", label: "Turbidity", min: 0, max: 10, unit: "NTU", step: 0.1 },
] as const;

export const DEFAULT_SENSOR_VALUES: SensorData = {
  ph: 7.0,
  hardness: 150,
  solids: 20000,
  chloramines: 7.0,
  sulfate: 250,
  conductivity: 400,
  organic_carbon: 14,
  trihalomethanes: 60,
  turbidity: 4,
};
