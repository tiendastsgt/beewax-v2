# BeeWax ESP32 Firmware

Complete ESP32 firmware for BeeWax beehive monitoring system with comprehensive sensor integration, MQTT communication, OTA updates, and energy management.

## Features

### Sensor Integration
- **HX711**: Weight measurement for hive monitoring
- **SHT31**: Temperature and humidity sensing
- **BME280**: Temperature, humidity, and atmospheric pressure
- **SCD40**: CO2 concentration monitoring
- **LIS3DH**: 3-axis accelerometer for motion detection

### Communication
- **MQTT**: Real-time telemetry publishing to colmena/hives/{id}/sensors
- **WiFi**: Reliable connection management with automatic reconnection
- **Status Updates**: Device health monitoring via MQTT

### OTA Updates
- **HTTP-based OTA**: Firmware updates from ota.beewax.shop
- **Checksum Verification**: Ensures update integrity
- **Progress Reporting**: Real-time update status via MQTT

### Energy Management
- **Multiple Profiles**: Normal, Low Power, and Deep Sleep modes
- **Battery Monitoring**: Voltage level tracking and low battery alerts
- **Power Optimization**: Configurable sensor reading intervals

## Hardware Requirements

- ESP32 development board
- HX711 load cell amplifier (connected to pins 4/5)
- SHT31 temperature/humidity sensor (I2C address 0x44)
- BME280 environmental sensor (I2C address 0x76)
- SCD40 CO2 sensor (I2C address 0x62)
- LIS3DH accelerometer (I2C address 0x18)
- Battery voltage divider (connected to pin 34)

## Configuration

Edit `include/config.h` to configure:
- WiFi credentials
- MQTT broker settings
- Sensor pin assignments
- Timing intervals
- Energy profiles

## Building and Flashing

1. Install PlatformIO
2. Clone this repository
3. Configure your settings in `include/config.h`
4. Build: `pio run`
5. Upload: `pio run -t upload`

## MQTT Topics

### Publishing
- `colmena/hives/{id}/sensors`: Telemetry data (30s interval)
- `colmena/hives/{id}/status`: Device status (60s interval)
- `colmena/alerts`: Error messages and alerts

### Subscribing
- `colmena/hives/{id}/command`: Remote commands
- `colmena/hives/{id}/ota`: OTA update commands

## Sensor Data Format

```json
{
  "sht31": {
    "temperature": 25.5,
    "humidity": 65.2
  },
  "bme280": {
    "temperature": 25.3,
    "humidity": 64.8,
    "pressure": 1013.25
  },
  "co2": 450,
  "weight": 25.7,
  "motion": {
    "x": 0.02,
    "y": -0.01,
    "z": 0.98
  },
  "battery": 3.85,
  "timestamp": 1640995200
}
```

## Commands

Send commands via MQTT to `colmena/hives/{id}/command`:

```json
{
  "command": "set_energy_profile",
  "profile": 0
}
```

Available commands:
- `set_energy_profile`: Set energy profile (0=normal, 1=low power, 2=deep sleep)
- `reboot`: Restart the device
- `calibrate_weight`: Tare the weight sensor

## OTA Updates

The device automatically checks for updates hourly. Manual updates can be triggered via MQTT:

```json
{
  "firmware_url": "https://ota.beewax.shop/fw/v1.1.0.bin",
  "checksum": "abc123..."
}
```

## Energy Profiles

1. **Normal**: All sensors active, 30s reading interval
2. **Low Power**: Reduced activity, longer intervals
3. **Deep Sleep**: Minimum power consumption, periodic wakeups

## Error Handling

The firmware includes comprehensive error handling:
- WiFi reconnection attempts
- MQTT connection recovery
- Sensor initialization checks
- Battery level monitoring
- OTA update verification

Errors are published to `colmena/alerts` topic.

## Dependencies

All dependencies are managed by PlatformIO:
- PubSubClient: MQTT communication
- ArduinoJson: JSON serialization
- Sensor libraries: Adafruit and Sensirion drivers
- TimeLib: Timestamp management

## License

This firmware is part of the BeeWax project.