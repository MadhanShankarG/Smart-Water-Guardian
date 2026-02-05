import numpy as np
import tensorflow as tf
import joblib

WINDOW = 5

model = tf.keras.models.load_model("cnn_lstm_water_model.h5")
scaler = joblib.load("scaler.pkl")
imputer = joblib.load("imputer.pkl")

buffer = []

def predict_water(sensor_reading):
    global buffer

    buffer.append(sensor_reading)

    if len(buffer) < WINDOW:
        return "Collecting..."

    if len(buffer) > WINDOW:
        buffer.pop(0)

    x = np.array(buffer)

    x = imputer.transform(x)
    x = scaler.transform(x)
    x = x.reshape(1, WINDOW, 9)

    p = model.predict(x)[0][0]

    if p < 0.3:
        return f"{p:.3f} -> UNSAFE"
    elif p <= 0.7:
        return f"{p:.3f} -> MODERATE"
    else:
        return f"{p:.3f} -> SAFE"


# -------- example manual test ----------
print(predict_water([7.2,120,320,6.5,180,280,6,35,1.2]))
print(predict_water([7.1,115,300,6.6,170,275,6,34,1.3]))
print(predict_water([7.3,110,310,6.4,165,290,6,36,1.1]))
print(predict_water([7.2,125,305,6.7,175,285,6,37,1.4]))
print(predict_water([7.4,118,295,6.5,160,270,6,33,1.2]))