"""
YOLO-based bee counting pipeline
Uses YOLO model for object detection and centroid tracking
"""

import os
import cv2
import numpy as np
from datetime import datetime
from collections import deque
from typing import Dict, Optional, Tuple, List
from .log import get_logger
from .tracker import CentroidTracker
from ultralytics import YOLO # Importación necesaria para YOLO

logger = get_logger(__name__)

class YOLOPipeline:
    """YOLO-based bee detection and counting pipeline"""
    def __init__(self, config: dict):
        self.config = config
        self.hive_id = config['hive_id']
        self.url = config['url']
        self.roi = config['roi'] # [x, y, width, height]
        self.line_config = config['line'] # {axis: 'y', pos: 60}
        self.direction_config = config['direction'] # {up_is_out: true}
        self.max_dist = config.get('max_dist', 40)
        
        # Video capture
        self.cap = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        
        # YOLO model
        self.model = None
        self.confidence_threshold = config.get('confidence', 0.5)
        self.nms_threshold = config.get('nms_threshold', 0.4)
        
        # Tracker
        self.tracker = CentroidTracker(
            max_disappeared=20,
            max_distance=self.max_dist
        )
        
        # Line crossing tracking
        self.prev_positions = {}
        self.bee_counts = {'in': 0, 'out': 0}
        
        # Performance metrics
        self.fps_deque = deque(maxlen=30)
        self.last_frame_time = datetime.now()
        
        # Initialize components
        self._init_capture()
        self._init_yolo()

    def _init_capture(self) -> bool:
        """Initialize video capture with retry logic"""
        # (Lógica de inicialización de captura de video con cv2.VideoCapture y reintentos) [21–22]
        return True # Placeholder
    
    def _init_yolo(self):
        """Initialize YOLO model"""
        try:
            from ultralytics import YOLO
            model_path = self.config.get('model_path', 'yolov8n.pt')
            
            if os.path.exists(model_path):
                self.model = YOLO(model_path)
                logger.info(f"{self.hive_id}: Loaded custom YOLO model from {model_path}")
            else:
                self.model = YOLO('yolov8n.pt')
                logger.info(f"{self.hive_id}: Loaded default YOLO model")
            self.model.fuse()
        except ImportError:
            logger.error(f"{self.hive_id}: ultralytics package not installed.")
            raise
        except Exception as e:
            logger.error(f"{self.hive_id}: Failed to initialize YOLO: {e}")
            raise

    def _extract_roi(self, frame: np.ndarray) -> np.ndarray:
        """Extract ROI from frame"""
        x, y, w, h = self.roi
        return frame[y:y+h, x:x+w]

    def _detect_bees(self, frame: np.ndarray) -> List[Tuple[int, int]]:
        """Detect bees using YOLO model"""
        try:
            # Run YOLO inference
            results = self.model(frame, verbose=False)
            centroids = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy.cpu().numpy()
                        confidence = box.conf.cpu().numpy()
                        
                        if confidence >= self.confidence_threshold:
                            cx = int((x1 + x2) / 2); cy = int((y1 + y2) / 2)
                            width = x2 - x1; height = y2 - y1; area = width * height
                            
                            # Filter based on area (typical bee size)
                            if 100 <= area <= 5000:
                                centroids.append((cx, cy))
            return centroids
        except Exception as e:
            logger.error(f"{self.hive_id}: YOLO detection error: {e}")
            return []

    def _check_line_crossing(self, object_id: int, prev_pos: Tuple[int, int], curr_pos: Tuple[int, int]) -> Optional[str]:
        """Check if object crossed the counting line"""
        axis = self.line_config['axis']
        line_pos = self.line_config['pos']
        up_is_out = self.direction_config.get('up_is_out', True)
        
        # (Lógica detallada de cruce de línea con histéresis) [26–27]
        return None # Placeholder

    def _calculate_fps(self):
        """Calculate current FPS"""
        now = datetime.now()
        time_diff = (now - self.last_frame_time).total_seconds()
        if time_diff > 0:
            fps = 1.0 / time_diff
            self.fps_deque.append(fps)
            self.last_frame_time = now
            return np.mean(self.fps_deque) if self.fps_deque else 0.0
        return 0.0

    def process_frame(self) -> Optional[Dict]:
        """Process a single frame and return counts"""
        # (Lógica de procesamiento de frame, tracker update, y line crossing) [28–30]
        
        # Simulación de retorno final
        return {
            'in': 0,
            'out': 0,
            'fps': self._calculate_fps(),
            'algo': 'yolo'
        }
    
    def cleanup(self):
        """Clean up resources"""
        if self.cap and self.cap.isOpened():
            self.cap.release()
        logger.info(f"{self.hive_id}: YOLO pipeline cleaned up")