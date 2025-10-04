#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YourWiFiSSID"
#define WIFI_PASSWORD "YourWiFiPassword"

// MQTT Configuration
#define MQTT_SERVER "mqtt.beewax.shop"
#define MQTT_PORT 1883
#define MQTT_USERNAME ""
#define MQTT_PASSWORD ""
#define MQTT_CLIENT_ID "beewax-hive-001"

// MQTT Topics
#define MQTT_TOPIC_SENSORS "colmena/hives/001/sensors"
#define MQTT_TOPIC_STATUS "colmena/hives/001/status"
#define MQTT_TOPIC_OTA "colmena/hives/001/ota"
#define MQTT_TOPIC_COMMAND "colmena/hives/001/command"

// Device Configuration
#define DEVICE_ID "001"
#define FIRMWARE_VERSION "1.0.0"

// Sensor Pins Configuration
// HX711 Weight Sensor
#define HX711_DT_PIN 4
#define HX711_SCK_PIN 5
#define HX711_SCALE_FACTOR 2280.0f  // Calibration factor

// I2C Configuration (Shared bus for multiple sensors)
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define I2C_FREQUENCY 100000

// Sensor I2C Addresses
#define SHT31_I2C_ADDR 0x44
#define BME280_I2C_ADDR 0x76
#define SCD40_I2C_ADDR 0x62
#define LIS3DH_I2C_ADDR 0x18

// SPI Configuration (if needed for LIS3DH)
#define LIS3DH_CS_PIN 15
#define LIS3DH_INT_PIN 2

// Timing Configuration
#define SENSOR_READ_INTERVAL 30000     // 30 seconds
#define MQTT_RECONNECT_INTERVAL 5000   // 5 seconds
#define WIFI_RECONNECT_INTERVAL 10000  // 10 seconds
#define STATUS_UPDATE_INTERVAL 60000   // 1 minute
#define OTA_CHECK_INTERVAL 3600000     // 1 hour

// Energy Profiles
#define ENERGY_PROFILE_NORMAL 0
#define ENERGY_PROFILE_LOW_POWER 1
#define ENERGY_PROFILE_DEEP_SLEEP 2

// Deep Sleep Configuration
#define DEEP_SLEEP_DURATION 3600000000ULL  // 1 hour in microseconds
#define WAKEUP_PIN GPIO_NUM_2

// Battery Monitoring
#define BATTERY_PIN 34
#define BATTERY_VOLTAGE_DIVIDER 2.0f
#define BATTERY_LOW_THRESHOLD 3.3f

// OTA Configuration
#define OTA_SERVER_URL "https://ota.beewax.shop"
#define OTA_FIRMWARE_PATH "/fw/"
#define OTA_CHECKSUM_VERIFY true

// Buffer Sizes
#define MQTT_BUFFER_SIZE 512
#define JSON_BUFFER_SIZE 1024

// Debug Configuration
#define DEBUG_SERIAL true
#define DEBUG_MQTT false
#define DEBUG_SENSORS false

// Error Codes
#define ERROR_WIFI_CONNECTION 1
#define ERROR_MQTT_CONNECTION 2
#define ERROR_SENSOR_READ 3
#define ERROR_OTA_UPDATE 4
#define ERROR_LOW_BATTERY 5

#endif // CONFIG_H