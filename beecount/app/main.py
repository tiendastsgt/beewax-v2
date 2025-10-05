#!/usr/bin/env python3

"""
BeeCount Main Application
Multi-stream bee counting with MQTT publishing
"""

import os
import sys
import time
import json
import threading
import signal
from datetime import datetime, timezone
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import yaml
import psutil
import paho.mqtt.client as mqtt
from .log import get_logger
from .health import HealthServer
from .pipeline_opencv import OpenCVPipeline
from .pipeline_yolo import YOLOPipeline

logger = get_logger(__name__)

class BeeCountManager:
    """Manages multiple bee counting streams and MQTT publishing"""
    def __init__(self, config_path: str = "app/roi_config.yaml"):
        self.config_path = config_path; self.config = self._load_config()
        self.mqtt_client = None; self.pipelines = {}
        self.metrics = defaultdict(lambda: {'bees_in': 0, 'bees_out': 0, 'fps': 0.0, 'cpu_pct': 0.0, 'algo': 'opencv'})
        self.running = True; self.publish_period = int(os.getenv('PUBLISH_PERIOD', '60'))
        self.health_server = HealthServer(self)
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)

    def _load_config(self) -> dict:
        try:
            with open(self.config_path, 'r') as f: config = yaml.safe_load(f)
            logger.info(f"Loaded config for {len(config['streams'])} streams"); return config
        except Exception as e: logger.error(f"Failed to load config: {e}"); sys.exit(1)

    def _setup_mqtt(self):
        try:
            self.mqtt_client = mqtt.Client(client_id=f"beecount_{os.getpid()}")
            if os.getenv('MQTT_USER') and os.getenv('MQTT_PASS'):
                self.mqtt_client.username_pw_set(os.getenv('MQTT_USER'), os.getenv('MQTT_PASS'))
            
            self.mqtt_client.on_connect = self._on_mqtt_connect
            self.mqtt_client.on_disconnect = self._on_mqtt_disconnect
            mqtt_host = os.getenv('MQTT_HOST', 'localhost')
            mqtt_port = int(os.getenv('MQTT_PORT', '1883'))
            self.mqtt_client.connect(mqtt_host, mqtt_port, 60)
            self.mqtt_client.loop_start()
            logger.info(f"MQTT client connecting to {mqtt_host}:{mqtt_port}")
        except Exception as e: logger.error(f"MQTT setup failed: {e}"); sys.exit(1)

    def _on_mqtt_connect(self, client, userdata, flags, rc):
        if rc == 0: logger.info("MQTT connected successfully")
        else: logger.error(f"MQTT connection failed with code {rc}")
    
    def _signal_handler(self, signum, frame):
        logger.info(f"Received signal {signum}, shutting down..."); self.running = False

    def _create_pipeline(self, stream_config: dict):
        algo = stream_config.get('algo', 'opencv'); hive_id = stream_config['hive_id']
        try:
            if algo == 'opencv': pipeline = OpenCVPipeline(stream_config)
            elif algo == 'yolo': pipeline = YOLOPipeline(stream_config)
            else: logger.error(f"Unknown algorithm: {algo}"); return None
        
            self.pipelines[hive_id] = pipeline; self.metrics[hive_id]['algo'] = algo
            logger.info(f"Created {algo} pipeline for {hive_id}"); return pipeline
        except Exception as e: logger.error(f"Failed to create pipeline for {hive_id}: {e}"); return None

    def _process_stream(self, stream_config: dict):
        hive_id = stream_config['hive_id']
        if hive_id not in self.pipelines:
            pipeline = self._create_pipeline(stream_config)
            if not pipeline: return
        else: pipeline = self.pipelines[hive_id]
        
        try:
            counts = pipeline.process_frame()
            if counts:
                self.metrics[hive_id]['bees_in'] += counts['in']
                self.metrics[hive_id]['bees_out'] += counts['out']
                self.metrics[hive_id]['fps'] = counts.get('fps', 0.0)
        except Exception as e: logger.error(f"Error processing {hive_id}: {e}")

    def _publish_metrics(self):
        try:
            cpu_pct = psutil.cpu_percent(interval=0.1)
            for stream_config in self.config['streams']:
                hive_id = stream_config['hive_id']; apiary_id = stream_config.get('apiary_id', 'A01')
                if hive_id not in self.metrics: continue
                metrics = self.metrics[hive_id]; net_count = metrics['bees_in'] - metrics['bees_out']
                payload = {
                    'ts': datetime.now(timezone.utc).isoformat(), 'apiary_id': apiary_id, 'hive_id': hive_id,
                    'bees_in_1m': metrics['bees_in'], 'bees_out_1m': metrics['bees_out'], 'bees_net_1m': net_count,
                    'fps': round(metrics['fps'], 1), 'cpu_pct': round(cpu_pct, 1), 'algo': metrics['algo']
                }
                topic = f"hives/{hive_id}/beecount"
                self.mqtt_client.publish(topic, json.dumps(payload), qos=1)
                logger.info(f"Published {hive_id}: in={metrics['bees_in']}, out={metrics['bees_out']}, net={net_count}")
                metrics['bees_in'] = 0; metrics['bees_out'] = 0
        except Exception as e: logger.error(f"Failed to publish metrics: {e}")

    def run(self):
        logger.info("BeeCount Manager starting...")
        health_thread = threading.Thread(target=self.health_server.run, daemon=True); health_thread.start()
        last_publish = time.time()
        with ThreadPoolExecutor(max_workers=len(self.config['streams'])) as executor:
            while self.running:
                try:
                    futures = [executor.submit(self._process_stream, s) for s in self.config['streams']]
                    for future in as_completed(futures, timeout=5):
                        try: future.result()
                        except Exception as e: logger.error(f"Stream processing error: {e}")
                    
                    if time.time() - last_publish >= self.publish_period:
                        self._publish_metrics(); last_publish = time.time()
                    time.sleep(0.1)
                except KeyboardInterrupt: self.running = False
                except Exception as e: logger.error(f"Main loop error: {e}"); time.sleep(1)
        
        logger.info("Shutting down...")
        for pipeline in self.pipelines.values(): pipeline.cleanup()
        self.mqtt_client.loop_stop(); self.mqtt_client.disconnect()

if __name__ == "__main__":
    manager = BeeCountManager(); manager.run()