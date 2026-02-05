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
  probability: number; // 0 → 1 from backend
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
  {
    key: "sulfate",
    label: "Sulfate",
    min: 0,
    max: 600,
    unit: "mg/L",
    step: 1,
  },
  {
    key: "conductivity",
    label: "Conductivity",
    min: 0,
    max: 1200,
    unit: "μS/cm",
    step: 1,
  },
  {
    key: "organic_carbon",
    label: "Organic Carbon",
    min: 0,
    max: 40,
    unit: "ppm",
    step: 0.1,
  },
  {
    key: "trihalomethanes",
    label: "Trihalomethanes",
    min: 0,
    max: 200,
    unit: "μg/L",
    step: 0.1,
  },
  {
    key: "turbidity",
    label: "Turbidity",
    min: 0,
    max: 15,
    unit: "NTU",
    step: 0.1,
  },
] as const;


/*
  UPDATED DEFAULT VALUES
  (your unsafe sample)
  [5.3,355,33000,12,530,970,28,160,9]
*/
export const DEFAULT_SENSOR_VALUES: SensorData = {
  ph: 5.3,
  hardness: 355,
  solids: 33000,
  chloramines: 12,
  sulfate: 530,
  conductivity: 970,
  organic_carbon: 28,
  trihalomethanes: 160,
  turbidity: 9,
};