option task = {name: "downsample_telemetry", every: 1h}

from(bucket: "telemetry")
    |> range(start: -2h)
    |> filter(fn: (r) => r._measurement == "hive_telemetry")
    |> aggregateWindow(every: 10m, fn: mean, createEmpty: false)
    |> to(bucket: "telemetry", org: "apiary")