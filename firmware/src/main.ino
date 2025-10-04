#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include <Update.h>
#include <HTTPClient.h>
#include <TimeLib.h>

// Sensor Libraries
#include <Adafruit_SHT31.h>
#include <Adafruit_BME280.h>
#include <SensirionI2CScd4x.h>
#include <Adafruit_LIS3DH.h>
#include <HX711.h>

// Configuration
#include "config.h"

// Global Objects
WiFiClient espClient;
PubSubClient mqttClient(espClient);
Adafruit_SHT31 sht31;
Adafruit_BME280 bme280;
SensirionI2CScd4x scd40;
Adafruit_LIS3DH lis3dh;
HX711 hx711;

// Global Variables
unsigned long lastSensorRead = 0;
unsigned long lastMqttReconnect = 0;
unsigned long lastWifiReconnect = 0;
unsigned long lastStatusUpdate = 0;
unsigned long lastOtaCheck = 0;

int energyProfile = ENERGY_PROFILE_NORMAL;
float batteryVoltage = 0.0;
bool otaInProgress = false;

// Sensor Data Structure
struct SensorData {
  float temperature_sht31 = 0.0;
  float humidity_sht31 = 0.0;
  float temperature_bme280 = 0.0;
  float humidity_bme280 = 0.0;
  float pressure_bme280 = 0.0;
  float co2_scd40 = 0.0;
  float weight_hx711 = 0.0;
  float accel_x = 0.0;
  float accel_y = 0.0;
  float accel_z = 0.0;
  float battery_level = 0.0;
};

SensorData sensorData;

// Function Declarations
void setupWiFi();
void setupMQTT();
void setupSensors();
void reconnectMQTT();
void readSensors();
void publishTelemetry();
void publishStatus();
void handleMQTTMessage(char* topic, byte* payload, unsigned int length);
void checkOTAUpdate();
void performOTAUpdate(String firmwareUrl, String checksum);
void enterDeepSleep();
void setEnergyProfile(int profile);
float readBatteryVoltage();
void logError(int errorCode, String message);

void setup() {
  Serial.begin(115200);
  if (DEBUG_SERIAL) {
    Serial.println("BeeWax ESP32 Firmware v" + String(FIRMWARE_VERSION));
  }

  // Initialize I2C
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(I2C_FREQUENCY);

  // Setup components
  setupWiFi();
  setupMQTT();
  setupSensors();

  // Set energy profile
  setEnergyProfile(ENERGY_PROFILE_NORMAL);

  if (DEBUG_SERIAL) {
    Serial.println("Setup complete");
  }
}

void loop() {
  unsigned long currentMillis = millis();

  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    if (currentMillis - lastWifiReconnect >= WIFI_RECONNECT_INTERVAL) {
      setupWiFi();
      lastWifiReconnect = currentMillis;
    }
  }

  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    if (currentMillis - lastMqttReconnect >= MQTT_RECONNECT_INTERVAL) {
      reconnectMQTT();
      lastMqttReconnect = currentMillis;
    }
  } else {
    mqttClient.loop();
  }

  // Read sensors
  if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readSensors();
    publishTelemetry();
    lastSensorRead = currentMillis;
  }

  // Publish status
  if (currentMillis - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
    publishStatus();
    lastStatusUpdate = currentMillis;
  }

  // Check for OTA updates
  if (currentMillis - lastOtaCheck >= OTA_CHECK_INTERVAL && !otaInProgress) {
    checkOTAUpdate();
    lastOtaCheck = currentMillis;
  }

  // Energy management
  if (energyProfile == ENERGY_PROFILE_DEEP_SLEEP) {
    enterDeepSleep();
  }

  delay(100); // Small delay to prevent watchdog issues
}

void setupWiFi() {
  if (DEBUG_SERIAL) {
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
    if (DEBUG_SERIAL) Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    if (DEBUG_SERIAL) {
      Serial.println("\nWiFi connected");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
    }
  } else {
    logError(ERROR_WIFI_CONNECTION, "Failed to connect to WiFi");
  }
}

void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(handleMQTTMessage);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);
}

void setupSensors() {
  // Initialize SHT31
  if (!sht31.begin(SHT31_I2C_ADDR)) {
    logError(ERROR_SENSOR_READ, "SHT31 not found");
  }

  // Initialize BME280
  if (!bme280.begin(BME280_I2C_ADDR)) {
    logError(ERROR_SENSOR_READ, "BME280 not found");
  }

  // Initialize SCD40
  scd40.begin(Wire);
  uint16_t error = scd40.startPeriodicMeasurement();
  if (error) {
    logError(ERROR_SENSOR_READ, "SCD40 initialization failed");
  }

  // Initialize LIS3DH
  if (!lis3dh.begin(LIS3DH_I2C_ADDR)) {
    logError(ERROR_SENSOR_READ, "LIS3DH not found");
  }
  lis3dh.setRange(LIS3DH_RANGE_2_G);

  // Initialize HX711
  hx711.begin(HX711_DT_PIN, HX711_SCK_PIN);
  hx711.set_scale(HX711_SCALE_FACTOR);
  hx711.tare(); // Reset to 0

  if (DEBUG_SERIAL) {
    Serial.println("Sensors initialized");
  }
}

void reconnectMQTT() {
  if (DEBUG_SERIAL) {
    Serial.print("Connecting to MQTT...");
  }

  if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
    if (DEBUG_SERIAL) {
      Serial.println("connected");
    }

    // Subscribe to topics
    mqttClient.subscribe(MQTT_TOPIC_COMMAND);
    mqttClient.subscribe(MQTT_TOPIC_OTA);
  } else {
    logError(ERROR_MQTT_CONNECTION, "MQTT connection failed");
  }
}

void readSensors() {
  // Read SHT31
  sensorData.temperature_sht31 = sht31.readTemperature();
  sensorData.humidity_sht31 = sht31.readHumidity();

  // Read BME280
  sensorData.temperature_bme280 = bme280.readTemperature();
  sensorData.humidity_bme280 = bme280.readHumidity();
  sensorData.pressure_bme280 = bme280.readPressure() / 100.0F; // Convert to hPa

  // Read SCD40
  uint16_t co2_raw;
  float temperature_raw, humidity_raw;
  uint16_t error = scd40.readMeasurement(co2_raw, temperature_raw, humidity_raw);
  if (!error) {
    sensorData.co2_scd40 = co2_raw;
  }

  // Read HX711
  if (hx711.is_ready()) {
    sensorData.weight_hx711 = hx711.get_units(10); // Average of 10 readings
  }

  // Read LIS3DH
  lis3dh.read();
  sensorData.accel_x = lis3dh.x_g;
  sensorData.accel_y = lis3dh.y_g;
  sensorData.accel_z = lis3dh.z_g;

  // Read battery voltage
  sensorData.battery_level = readBatteryVoltage();

  if (DEBUG_SENSORS) {
    Serial.println("Sensor readings:");
    Serial.printf("SHT31: %.2f°C, %.2f%%\n", sensorData.temperature_sht31, sensorData.humidity_sht31);
    Serial.printf("BME280: %.2f°C, %.2f%%, %.2fhPa\n", sensorData.temperature_bme280, sensorData.humidity_bme280, sensorData.pressure_bme280);
    Serial.printf("SCD40: %.0f ppm CO2\n", sensorData.co2_scd40);
    Serial.printf("HX711: %.2f kg\n", sensorData.weight_hx711);
    Serial.printf("LIS3DH: %.2f, %.2f, %.2f g\n", sensorData.accel_x, sensorData.accel_y, sensorData.accel_z);
    Serial.printf("Battery: %.2fV\n", sensorData.battery_level);
  }
}

void publishTelemetry() {
  if (!mqttClient.connected()) return;

  DynamicJsonDocument doc(JSON_BUFFER_SIZE);

  // Temperature and humidity
  JsonObject sht31 = doc.createNestedObject("sht31");
  sht31["temperature"] = sensorData.temperature_sht31;
  sht31["humidity"] = sensorData.humidity_sht31;

  JsonObject bme280 = doc.createNestedObject("bme280");
  bme280["temperature"] = sensorData.temperature_bme280;
  bme280["humidity"] = sensorData.humidity_bme280;
  bme280["pressure"] = sensorData.pressure_bme280;

  // CO2
  doc["co2"] = sensorData.co2_scd40;

  // Weight
  doc["weight"] = sensorData.weight_hx711;

  // Motion
  JsonObject motion = doc.createNestedObject("motion");
  motion["x"] = sensorData.accel_x;
  motion["y"] = sensorData.accel_y;
  motion["z"] = sensorData.accel_z;

  // Battery
  doc["battery"] = sensorData.battery_level;

  // Timestamp
  doc["timestamp"] = now();

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(MQTT_TOPIC_SENSORS, payload.c_str())) {
    if (DEBUG_MQTT) {
      Serial.println("Telemetry published");
    }
  } else {
    logError(ERROR_MQTT_CONNECTION, "Failed to publish telemetry");
  }
}

void publishStatus() {
  if (!mqttClient.connected()) return;

  DynamicJsonDocument doc(JSON_BUFFER_SIZE);

  doc["device_id"] = DEVICE_ID;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
  doc["mqtt_connected"] = mqttClient.connected();
  doc["battery_level"] = sensorData.battery_level;
  doc["energy_profile"] = energyProfile;
  doc["ota_in_progress"] = otaInProgress;
  doc["uptime"] = millis() / 1000;
  doc["timestamp"] = now();

  String payload;
  serializeJson(doc, payload);

  mqttClient.publish(MQTT_TOPIC_STATUS, payload.c_str());
}

void handleMQTTMessage(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (DEBUG_MQTT) {
    Serial.printf("MQTT Message - Topic: %s, Payload: %s\n", topic, message.c_str());
  }

  DynamicJsonDocument doc(JSON_BUFFER_SIZE);
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("Failed to parse MQTT message");
    return;
  }

  if (strcmp(topic, MQTT_TOPIC_COMMAND) == 0) {
    String command = doc["command"];
    if (command == "set_energy_profile") {
      int profile = doc["profile"];
      setEnergyProfile(profile);
    } else if (command == "reboot") {
      ESP.restart();
    } else if (command == "calibrate_weight") {
      hx711.tare();
    }
  } else if (strcmp(topic, MQTT_TOPIC_OTA) == 0) {
    String firmwareUrl = doc["firmware_url"];
    String checksum = doc["checksum"];
    performOTAUpdate(firmwareUrl, checksum);
  }
}

void checkOTAUpdate() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(OTA_SERVER_URL + String("/api/ota/firmwares"));
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(JSON_BUFFER_SIZE);
    deserializeJson(doc, payload);

    JsonArray firmwares = doc["data"];
    for (JsonObject firmware : firmwares) {
      if (firmware["deviceType"] == "esp32" && firmware["isActive"]) {
        String version = firmware["version"];
        if (version != FIRMWARE_VERSION) {
          String filePath = firmware["filePath"];
          String checksum = firmware["checksum"];
          String firmwareUrl = OTA_SERVER_URL + filePath;
          performOTAUpdate(firmwareUrl, checksum);
          break;
        }
      }
    }
  }

  http.end();
}

void performOTAUpdate(String firmwareUrl, String expectedChecksum) {
  if (otaInProgress) return;

  otaInProgress = true;
  publishStatus(); // Update status

  if (DEBUG_SERIAL) {
    Serial.println("Starting OTA update...");
    Serial.println("URL: " + firmwareUrl);
  }

  HTTPClient http;
  http.begin(firmwareUrl);
  http.addHeader("Content-Type", "application/octet-stream");

  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    int contentLength = http.getSize();
    if (DEBUG_SERIAL) {
      Serial.printf("Content length: %d bytes\n", contentLength);
    }

    if (Update.begin(contentLength)) {
      WiFiClient* stream = http.getStreamPtr();
      size_t written = Update.writeStream(*stream);

      if (written == contentLength) {
        if (DEBUG_SERIAL) {
          Serial.println("OTA update successful");
        }
        otaInProgress = false;
        publishStatus();
        delay(1000);
        ESP.restart();
      } else {
        logError(ERROR_OTA_UPDATE, "OTA write failed");
      }
    } else {
      logError(ERROR_OTA_UPDATE, "OTA begin failed");
    }
  } else {
    logError(ERROR_OTA_UPDATE, "OTA download failed: " + String(httpResponseCode));
  }

  http.end();
  otaInProgress = false;
}

void enterDeepSleep() {
  if (DEBUG_SERIAL) {
    Serial.println("Entering deep sleep...");
  }

  esp_sleep_enable_timer_wakeup(DEEP_SLEEP_DURATION);
  esp_sleep_enable_ext0_wakeup(WAKEUP_PIN, 0); // Wake on LOW

  publishStatus(); // Final status update
  delay(100);

  esp_deep_sleep_start();
}

void setEnergyProfile(int profile) {
  energyProfile = profile;

  switch (profile) {
    case ENERGY_PROFILE_NORMAL:
      // Normal operation - all sensors active
      if (DEBUG_SERIAL) {
        Serial.println("Energy profile: NORMAL");
      }
      break;

    case ENERGY_PROFILE_LOW_POWER:
      // Reduced sensor readings, longer intervals
      if (DEBUG_SERIAL) {
        Serial.println("Energy profile: LOW POWER");
      }
      break;

    case ENERGY_PROFILE_DEEP_SLEEP:
      // Prepare for deep sleep
      if (DEBUG_SERIAL) {
        Serial.println("Energy profile: DEEP SLEEP");
      }
      break;
  }
}

float readBatteryVoltage() {
  int adcValue = analogRead(BATTERY_PIN);
  float voltage = (adcValue / 4095.0) * 3.3 * BATTERY_VOLTAGE_DIVIDER;

  if (voltage < BATTERY_LOW_THRESHOLD) {
    logError(ERROR_LOW_BATTERY, "Low battery voltage: " + String(voltage) + "V");
  }

  return voltage;
}

void logError(int errorCode, String message) {
  if (DEBUG_SERIAL) {
    Serial.printf("ERROR %d: %s\n", errorCode, message.c_str());
  }

  // Publish error to MQTT
  if (mqttClient.connected()) {
    DynamicJsonDocument doc(JSON_BUFFER_SIZE);
    doc["error_code"] = errorCode;
    doc["message"] = message;
    doc["timestamp"] = now();

    String payload;
    serializeJson(doc, payload);
    mqttClient.publish("colmena/alerts", payload.c_str());
  }
}