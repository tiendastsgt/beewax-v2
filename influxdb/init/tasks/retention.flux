option task = {name: "retention_policy", every: 1d}

// Configura la política de retención del bucket de telemetría a 90 días
option retention = 90d

from(bucket: "telemetry")
    |> range(start: -1d)
    |> set(key: "retention_policy", value: retention)
    |> keep(columns: ["_time", "_measurement"])
    |> to(bucket: "telemetry", org: "apiary")