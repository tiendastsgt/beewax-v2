option task = {name: "honey_forecast", every: 1d}

// Predice el rendimiento basado en la tasa de ganancia de peso a largo plazo (Placeholder funcional)
from(bucket: "telemetry")
    |> range(start: -90d)
    |> filter(fn: (r) => r._measurement == "hive_telemetry" and r._field == "weight_kg")
    |> group(columns: ["hive_id"])
    |> aggregateWindow(every: 1w, fn: mean, createEmpty: false)
    |> yield(name: "weekly_trend")