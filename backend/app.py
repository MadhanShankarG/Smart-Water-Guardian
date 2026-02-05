from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import joblib
from collections import deque
import random
import time

app = Flask(__name__)
CORS(app)

WINDOW = 20
HISTORY_SIZE = 20
SMOOTHING = 5

MODEL_PATH = "pond_cnn_lstm_model.keras"

model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load("pond_scaler.pkl")
imputer = joblib.load("pond_imputer.pkl")

buffer = deque(maxlen=WINDOW)
history = deque(maxlen=HISTORY_SIZE)
smooth = deque(maxlen=SMOOTHING)


def classify(p):
    if p < 0.3:
        return "UNSAFE"
    elif p <= 0.7:
        return "MODERATE"
    return "SAFE"


def smooth_avg(p):
    smooth.append(p)
    return float(np.mean(smooth))


@app.route("/")
def home():
    return "Backend running"


@app.route("/reset", methods=["POST"])
def reset():
    buffer.clear()
    history.clear()
    smooth.clear()
    return jsonify({"ok": True})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    reading = [
        data["water_pH"],
        data["TDS"],
        data["water_temp"],
    ]

    buffer.append(reading)

    if len(buffer) < WINDOW:
        return jsonify({
            "probability": None,
            "status": "COLLECTING",
            "count": len(buffer),
            "history": list(history)
        })

    x = np.array(buffer)
    x = imputer.transform(x)
    x = scaler.transform(x)
    x = x.reshape(1, WINDOW, 3)

    raw = float(model.predict(x, verbose=0)[0][0])
    p = smooth_avg(raw)

    status = classify(p)

    history.append({
        "probability": p,
        "status": status
    })

    return jsonify({
        "probability": p,
        "status": status,
        "history": list(history)
    })


@app.route("/stream", methods=["GET"])
def stream():
    results = []

    for _ in range(5):
        fake = [
            random.uniform(5.5, 8.5),
            random.uniform(100, 600),
            random.uniform(22, 30),
        ]

        buffer.append(fake)

        if len(buffer) < WINDOW:
            continue

        x = np.array(buffer)
        x = imputer.transform(x)
        x = scaler.transform(x)
        x = x.reshape(1, WINDOW, 3)

        raw = float(model.predict(x, verbose=0)[0][0])
        p = smooth_avg(raw)

        status = classify(p)

        history.append({
            "probability": p,
            "status": status
        })

        results.append({
            "probability": p,
            "status": status
        })

        time.sleep(1)

    return jsonify({
        "results": results,
        "history": list(history)
    })


if __name__ == "__main__":
    app.run(port=8000, debug=True)