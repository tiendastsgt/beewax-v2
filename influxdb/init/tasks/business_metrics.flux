option task = {name: "business_metrics", every: 1d}

// Calcula métricas de negocio como el peso total de la miel cosechable
from(bucket: "telemetry")
    |> range(start: -30d)
    |> filter(fn: (r) => r._measurement == "hive_telemetry" and r._field == "weight_kg")
    |> group(columns: ["apiary_id"])
    |> mean()
    |> map(fn: (r) => ({
        r with
        _measurement: "business_metrics",
        _field: "average_hive_weight_kg"
    }))
    |> to(bucket: "telemetry", org: "apiary")