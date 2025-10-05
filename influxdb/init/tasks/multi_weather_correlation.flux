option task = {name: "multi_weather_correlation", every: 1h}

// Tarea para correlacionar el peso (hive_telemetry) con la temperatura (weather)
hive_weight = from(bucket: "telemetry")
    |> range(start: -30d)
    |> filter(fn: (r) => r._measurement == "hive_telemetry" and r._field == "weight_kg")
    |> aggregateWindow(every: 1h, fn: mean)

weather_temp = from(bucket: "telemetry")
    |> range(start: -30d)
    |> filter(fn: (r) => r._measurement == "weather" and r._field == "temp_c")
    |> aggregateWindow(every: 1h, fn: mean)

// Unir y calcular la correlación (Placeholder funcional)
join(tables: {w: weather_temp, h: hive_weight}, on: ["_time", "apiary_id"])
    |> map(fn: (r) => ({
        _time: r._time,
        correlation: 0.0 // Placeholder para la función de correlación
    }))
    |> to(bucket: "telemetry", org: "apiary")