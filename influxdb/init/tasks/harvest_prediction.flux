option task = {name: "harvest_prediction", every: 1h}

import "experimental" // PARCHE CRÍTICO: Importar la librería experimental

harvestWeightKg = 40.0

weightData = from(bucket: "telemetry")
|> range(start: -90d)
|> filter(fn: (r) => r._measurement == "hive_telemetry" and r._field == "weight_kg")
|> group(columns: ["hive_id"])
|> aggregateWindow(every: 1d, fn: mean, createEmpty: false)

weightPredictions = weightData
|> experimental.linearRegression(n: 30) // PARCHE CRÍTICO: Usar experimental.linearRegression()
|> map(fn: (r) => ({
r with
days_to_harvest: if r.slope <= 0 then -1.0 else float(v: (harvestWeightKg - r.y_intercept) / r.slope),
harvest_date: if r.slope <= 0 then time(v: 0) else experimental.addDuration(d: duration(d: int(v: (harvestWeightKg - r.y_intercept) / r.slope)), to: today())
}))
|> filter(fn: (r) => r.days_to_harvest >= 0 and r.days_to_harvest <= 365)

weightPredictions
|> set(key: "_measurement", value: "hive_predictions")
|> rename(columns: {_value: "predicted_weight_gain_per_day"})
|> keep(columns: ["_time", "hive_id", "_measurement", "days_to_harvest", "harvest_date", "predicted_weight_gain_per_day"])
|> to(bucket: "telemetry", org: "apiary")