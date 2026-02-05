from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import joblib

app = Flask(__name__)
CORS(app)

# =====================================
# CONFIG
# =====================================
WINDOW = 5
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
# BUFFER FOR TIME SERIES
# =====================================
buffer = []


# =====================================
# CLASSIFICATION LOGIC
# =====================================
def classify(prob):
    if prob < 0.3:
        return "UNSAFE"
    elif prob <= 0.7:
        return "MODERATE"
    return "SAFE"


# =====================================
# HEALTH CHECK (optional but useful)
# =====================================
@app.route("/")
def home():
    return "Water Quality Backend Running"


# =====================================
# PREDICTION API
# =====================================
@app.route("/predict", methods=["POST"])
def predict():
    global buffer

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
    # Add to rolling buffer
    # -----------------------------
    buffer.append(reading)

    if len(buffer) < WINDOW:
        return jsonify({
            "status": "Collecting",
            "probability": None,
            "count": len(buffer)
        })

    if len(buffer) > WINDOW:
        buffer.pop(0)

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
    p = float(model.predict(x, verbose=0)[0][0])

    print("Prediction:", p)

    return jsonify({
        "probability": p,
        "status": classify(p)
    })


# =====================================
# RUN SERVER
# =====================================
if __name__ == "__main__":
    app.run(debug=True, port=8000)