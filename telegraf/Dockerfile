FROM telegraf:1.28

COPY telegraf.conf /etc/telegraf/telegraf.conf
COPY inputs_mqtt_beecount.conf /etc/telegraf/inputs_mqtt_beecount.conf

CMD ["telegraf"]