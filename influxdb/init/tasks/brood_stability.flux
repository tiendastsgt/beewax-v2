option task = {name: "brood_stability_check", every: 1h}

// Verifica la estabilidad de la temperatura interna (indicador de salud de la cría)
brood_temp = from(bucket: "telemetry")
    |> range(start: -48h)
    |> filter(fn: (r) => r._measurement == "hive_telemetry" and r._field == "t_in_c")
    |> group(columns: ["hive_id"])
    |> aggregateWindow(every: 1h, fn: spread, createEmpty: false) // Spread = Max - Min
    |> filter(fn: (r) => r._value > 1.5) // Si la variación es mayor a 1.5C en 1 hora, alerta
    |> set(key: "_measurement", value: "brood_alerts")
    |> to(bucket: "telemetry", org: "apiary")