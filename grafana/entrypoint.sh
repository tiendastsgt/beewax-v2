#!/bin/bash
set -e
envsubst '${INFLUX_INIT_TOKEN}' < /etc/grafana/provisioning/datasources/influx.yml.template > /etc/grafana/provisioning/datasources/influx.yml
exec /run.sh "$@"