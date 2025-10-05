option task = {name: "d24h_weight_change", every: 30m}

// Calcula el cambio de peso en las últimas 24 horas
from(bucket: "telemetry")
    |> range(start: -24h)
    |> filter(fn: (r) => r._measurement == "hive_telemetry" and r._field == "weight_kg")
    |> group(columns: ["hive_id"])
    |> difference(unit: 24h)
    |> map(fn: (r) => ({
        r with
        _field: "d24h_g",
        _value: r._value * 1000.0 // Convertir de kg a gramos
    }))
    |> to(bucket: "telemetry", org: "apiary")