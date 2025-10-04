FROM grafana/grafana:latest

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY provisioning/ /etc/grafana/provisioning/

ENTRYPOINT ["/entrypoint.sh"]