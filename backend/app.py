from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import joblib

app = Flask(__name__)
CORS(app)  # ← IMPORTANT: allow frontend calls

model = tf.keras.models.load_model("cnn_lstm_water_model.h5")
scaler = joblib.load("scaler.pkl")
imputer = joblib.load("imputer.pkl")

WINDOW = 5


def classify(p):
    if p < 0.3:
        return "UNSAFE"
    elif p <= 0.7:
        return "MODERATE"
    return "SAFE"


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    reading = [[
        data["ph"],
        data["hardness"],
        data["solids"],
        data["chloramines"],
        data["sulfate"],
        data["conductivity"],
        data["organic_carbon"],
        data["trihalomethanes"],
        data["turbidity"]
    ]]

    x = np.repeat(reading, WINDOW, axis=0)

    x = imputer.transform(x)
    x = scaler.transform(x)
    x = x.reshape(1, WINDOW, 9)

    p = float(model.predict(x, verbose=0)[0][0])

    print("Prediction request received →", p)  # debug log

    return jsonify({
        "probability": p,
        "status": classify(p)
    })


if __name__ == "__main__":
    app.run(port=8000, debug=True)