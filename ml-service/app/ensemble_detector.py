"""
Ensemble Anomaly Detector for BeeWax System
Combines multiple models for higher accuracy
"""

import os
import json
import logging
import numpy as np
import pandas as pd
import pickle # Necesario para persistir modelos
import paho.mqtt.client as mqtt
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any

# Dependencias de Scikit-learn
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler

# Cliente de InfluxDB (asumiendo que se importa desde una librería instalada en el contenedor)
# Nota: La importación real debe ser 'from influxdb_client import InfluxDBClient, Point'
# Para este snippet, se asume la clase InfluxDBClient y Point.

# Asumiendo importaciones locales (log)
# from .log import get_logger 
# logger = get_logger(__name__)

# Definición simple de logger y clientes si las importaciones locales fallan en el entorno de visualización
class InfluxDBClient:
    def __init__(self, url, token, org): pass
    def query_api(self): return self
    def write_api(self): return self
    def query_data_frame(self, query): return pd.DataFrame()
    def write(self, bucket, org, record): pass
    
class Logger:
    def info(self, msg): print(f"[INFO ML] {msg}")
    def warning(self, msg): print(f"[WARN ML] {msg}")
    def error(self, msg): print(f"[ERROR ML] {msg}")
logger = Logger()

class EnsembleAnomalyDetector:
    """Detector ensemble para mayor precisión"""
    def __init__(self):
        self.models = {} # Un modelo por colmena
        self.influx_client = InfluxDBClient(
            url=os.getenv("INFLUX_URL", "http://influxdb:8086"),
            token=os.getenv("INFLUX_TOKEN"),
            org="apiary"
        )
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.on_connect = self._on_mqtt_connect
        self.mqtt_client.on_message = self._on_mqtt_message
        self.mqtt_client.username_pw_set(
            os.getenv("MQTT_USER", "api_service"),
            os.getenv("MQTT_PASS", "change_me")
        )
        
        # Conectar a MQTT broker
        self.mqtt_client.connect(
            os.getenv("MQTT_HOST", "mosquitto"),
            1883, 60
        )
        self.mqtt_client.loop_start()

    async def initialize(self):
        """Inicializar el servicio"""
        # Cargar modelos existentes
        await self.load_existing_models()

    def _on_mqtt_connect(self, client, userdata, rc):
        if rc == 0:
            logger.info("MQTT connected successfully")
        else:
            logger.error(f"MQTT connection failed with code {rc}")

    def _on_mqtt_message(self, client, userdata, msg):
        """Callback de mensaje MQTT para procesar telemetría en tiempo real"""
        try:
            data = json.loads(msg.payload.decode())
            # Asume que el tópico es 'hives/{hive_id}/telemetry'
            hive_id = msg.topic.split('/') 

            # Detectar anomalía con ensemble
            is_anomaly, score, confidence = self.detect_ensemble(hive_id, data)

            if is_anomaly:
                alert = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "hive_id": hive_id,
                    "type": "ensemble_anomaly",
                    "score": score,
                    "confidence": confidence,
                    "data": data,
                    "message": f"Comportamiento anómalo detectado (score: {score:.2f}, confidence: {confidence:.2f})"
                }
                
                # Publicar alerta al tópico de anomalías
                client.publish(
                    f"hives/{hive_id}/anomalies",
                    json.dumps(alert),
                    qos=1
                )
                
                # Guardar en InfluxDB
                self.save_anomaly(hive_id, score, confidence, data)
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def load_existing_models(self):
        """Cargar modelos existentes del disco /app/models"""
        models_dir = "/app/models"
        if not os.path.exists(models_dir):
            os.makedirs(models_dir)

        for filename in os.listdir(models_dir):
            if filename.endswith("_ensemble.pkl"):
                hive_id = filename.replace("_ensemble.pkl", "")
                try:
                    with open(os.path.join(models_dir, filename), 'rb') as f:
                        self.models[hive_id] = pickle.load(f)
                    logger.info(f"Loaded ensemble model for {hive_id}")
                except Exception as e:
                    logger.error(f"Error loading model for {hive_id}: {e}")

    async def train_ensemble_model(self, hive_id: str, days: int = 30):
        """Entrenar modelo ensemble para una colmena específica usando datos históricos"""
        logger.info(f"Training ensemble model for {hive_id} with {days} days of data")
        
        # (Lógica de consulta a InfluxDB para obtener datos históricos)
        # (Lógica de preprocesamiento, normalización y entrenamiento de IsolationForest, OneClassSVM, RandomForest)
        # (Lógica para guardar el modelo entrenado y el scaler usando pickle)

        # Retorno simulado:
        logger.warning("Training logic is simplified/simulated in this snippet.")
        return True

    def detect_ensemble(self, hive_id: str, data: dict) -> Tuple[bool, float, float]:
        """Detectar si los datos de telemetría son anómalos"""
        if hive_id not in self.models:
            logger.warning(f"No model available for {hive_id}")
            return False, 0.0, 0.0

        model_info = self.models[hive_id]
       
        # Preparar datos (asumiendo que las características están definidas en model_info['features'])
        features = [data.get(feat, 0) for feat in model_info['features']]
        X = np.array([features])
       
        # Simulación de transformación y predicción
        # X_scaled = model_info['scaler'].transform(X.reshape(1, -1))
       
        # Simulación de puntajes (basado en el patrón -1 para anomalía, 1 para normal)
        iso_pred = 0.5 # Simulación
        svm_pred = 0.5 # Simulación
        rf_pred = 0.5 # Simulación (probabilidad)

        # Votación por mayoría (simplificado)
        ensemble_pred = (iso_pred + svm_pred + rf_pred) / 3
       
        # Simulación de cálculo de confianza
        confidence = 0.75 

        # Si el puntaje es menor a 0, se considera anomalía (patrón común en IF y OCSVM)
        is_anomaly = ensemble_pred < 0 
        
        return is_anomaly, float(ensemble_pred), float(confidence)

    def save_anomaly(self, hive_id: str, score: float, confidence: float, data: dict):
        """Guardar anomalía en InfluxDB"""
        # Nota: Asume que 'Point' es accesible (importada desde influxdb_client)
        from influxdb_client import Point

        point = Point("hive_ensemble_anomalies") \
            .tag("hive_id", hive_id) \
            .field("anomaly_score", score) \
            .field("confidence", confidence) \
            .field("weight_kg", data.get('weight_kg', 0)) \
            .field("t_in_c", data.get('t_in_c', 0)) \
            .field("co2_ppm", data.get('co2_ppm', 0)) \
            .field("audio_200_400", data.get('audio_200_400', 0)) \
            .field("acc_rms", data.get('acc_rms', 0)) \
            .field("tilt_deg", data.get('tilt_deg', 0)) \
            .field("batt_v", data.get('batt_v', 0)) \
            .time(datetime.utcnow())
           
        write_api = self.influx_client.write_api()
        write_api.write(bucket="telemetry", org="apiary", record=point)