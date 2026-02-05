from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import joblib
from collections import deque

app = Flask(__name__)
CORS(app)

# =====================================
# CONFIG
# =====================================
WINDOW = 5                 # CNN-LSTM timesteps
HISTORY_SIZE = 20          # last 20 for charts
SMOOTHING = 3              # moving average smoothing
MODEL_PATH = "cnn_lstm_water_model.keras"

# =====================================
# LOAD MODEL + TOOLS
# =====================================
print("Loading model and preprocessing tools...")

model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load("scaler.pkl")
imputer = joblib.load("imputer.pkl")

print(f"Loaded model: {MODEL_PATH}")
print("Scaler + Imputer loaded successfully")

# =====================================
# BUFFERS
# =====================================
# fixed rolling window for CNN input
buffer = deque(maxlen=WINDOW)

# history for charts
history = deque(maxlen=HISTORY_SIZE)

# smoothing buffer
smooth_probs = deque(maxlen=SMOOTHING)


# =====================================
# HELPERS
# =====================================
def classify(prob):
    if prob < 0.3:
        return "UNSAFE"
    elif prob <= 0.7:
        return "MODERATE"
    return "SAFE"


def moving_average(prob):
    smooth_probs.append(prob)
    return float(np.mean(smooth_probs))


# =====================================
# HEALTH CHECK
# =====================================
@app.route("/")
def home():
    return "Water Quality Backend Running"


# =====================================
# RESET (useful for demo/testing)
# =====================================
@app.route("/reset", methods=["POST"])
def reset():
    buffer.clear()
    history.clear()
    smooth_probs.clear()
    return jsonify({"message": "Buffers cleared"})


# =====================================
# PREDICTION API
# =====================================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    reading = [
        data["ph"],
        data["hardness"],
        data["solids"],
        data["chloramines"],
        data["sulfate"],
        data["conductivity"],
        data["organic_carbon"],
        data["trihalomethanes"],
        data["turbidity"],
    ]

    # -----------------------------
    # Add to rolling window
    # -----------------------------
    buffer.append(reading)

    # need full window first
    if len(buffer) < WINDOW:
        return jsonify({
            "status": "COLLECTING",
            "probability": None,
            "count": len(buffer),
            "history": list(history)
        })

    # -----------------------------
    # Preprocess exactly like training
    # -----------------------------
    x = np.array(buffer)

    x = imputer.transform(x)
    x = scaler.transform(x)

    x = x.reshape(1, WINDOW, 9)

    # -----------------------------
    # Predict
    # -----------------------------
    raw_p = float(model.predict(x, verbose=0)[0][0])

    # smoothing
    p = moving_average(raw_p)

    status = classify(p)

    # save history
    history.append({
        "probability": p,
        "status": status
    })

    print("Raw:", raw_p, "Smoothed:", p)

    return jsonify({
        "probability": p,
        "status": status,
        "history": list(history)
    })


# =====================================
# AUTO STREAM (Q3)
# generates predictions repeatedly
# =====================================
@app.route("/stream", methods=["POST"])
def stream():
    """
    Send JSON:
    {
      "reading": {...sensor data...},
      "steps": 10
    }
    Returns multiple predictions for demo.
    """
    payload = request.json
    reading = payload["reading"]
    steps = int(payload.get("steps", 10))

    results = []

    for _ in range(steps):
        buffer.append([
            reading["ph"],
            reading["hardness"],
            reading["solids"],
            reading["chloramines"],
            reading["sulfate"],
            reading["conductivity"],
            reading["organic_carbon"],
            reading["trihalomethanes"],
            reading["turbidity"],
        ])

        if len(buffer) < WINDOW:
            continue

        x = np.array(buffer)
        x = imputer.transform(x)
        x = scaler.transform(x)
        x = x.reshape(1, WINDOW, 9)

        raw_p = float(model.predict(x, verbose=0)[0][0])
        p = moving_average(raw_p)
        status = classify(p)

        history.append({
            "probability": p,
            "status": status
        })

        results.append({
            "probability": p,
            "status": status
        })

    return jsonify({
        "results": results,
        "history": list(history)
    })


# =====================================
# RUN SERVER
# =====================================
if __name__ == "__main__":
    app.run(debug=True, port=8000)