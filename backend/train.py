import pandas as pd
import numpy as np
import joblib
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, LSTM, Dense, Dropout

WINDOW = 5

df = pd.read_csv("water_potability.csv")

X = df.drop("Potability", axis=1)
y = df["Potability"]

# ---------- preprocessing ----------
imputer = SimpleImputer(strategy="mean")
X = imputer.fit_transform(X)

scaler = StandardScaler()
X = scaler.fit_transform(X)

# ---------- window creation ----------
X_seq, y_seq = [], []

for i in range(len(X) - WINDOW):
    X_seq.append(X[i:i+WINDOW])
    y_seq.append(y[i+WINDOW])

X_seq = np.array(X_seq)
y_seq = np.array(y_seq)

X_train, X_test, y_train, y_test = train_test_split(X_seq, y_seq, test_size=0.2)

# ---------- model ----------
model = Sequential([
    Conv1D(64, 2, activation='relu', input_shape=(WINDOW, 9)),
    MaxPooling1D(2),
    LSTM(64),
    Dropout(0.3),
    Dense(32, activation='relu'),
    Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=30, batch_size=32)

# ---------- SAVE EVERYTHING ----------
model.save("cnn_lstm_water_model.h5")
joblib.dump(imputer, "imputer.pkl")
joblib.dump(scaler, "scaler.pkl")

print("Saved model + scaler + imputer")