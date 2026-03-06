from __future__ import annotations

import json
import time
from typing import Any, Dict

import requests
import serial

SERIAL_PORT = "/dev/tty.usbmodem114301"
BAUD = 9600
API_URL = "http://localhost:8000/predict"
REQUEST_TIMEOUT = 10


def normalize_sensor_payload(raw: Dict[str, Any]) -> Dict[str, float]:
    return {
        "water_pH": float(raw["water_pH"]),
        "TDS": float(raw["TDS"]),
        "water_temp": float(raw["water_temp"]),
    }


def main() -> None:
    print(f"Connecting to serial port {SERIAL_PORT} @ {BAUD} baud...")
    ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
    time.sleep(2)
    print("Listening for Arduino JSON lines...")

    while True:
        try:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            payload = normalize_sensor_payload(json.loads(line))
            response = requests.post(API_URL, json=payload, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            prediction = response.json()

            print(f"Sensor: {payload}")
            print(f"Prediction: {prediction}")
        except json.JSONDecodeError:
            print(f"Skipped invalid JSON line: {line}")
        except (KeyError, TypeError, ValueError) as exc:
            print(f"Skipped invalid sensor payload: {exc}")
        except requests.RequestException as exc:
            print(f"Backend request failed: {exc}")
        except serial.SerialException as exc:
            print(f"Serial error: {exc}")
            break
        except KeyboardInterrupt:
            print("Stopping serial reader.")
            break

    ser.close()


if __name__ == "__main__":
    main()