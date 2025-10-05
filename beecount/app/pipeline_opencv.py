"""
OpenCV-based bee counting pipeline
Uses background subtraction, contour detection, and line crossing
"""

import cv2
import numpy as np
from datetime import datetime
from collections import deque
from typing import Dict, Optional, Tuple, List
from .log import get_logger
from .tracker import CentroidTracker

logger = get_logger(__name__)

class OpenCVPipeline:
    def __init__(self, config: dict):
        self.config = config
        self.hive_id = config['hive_id']
        self.url = config['url']
        self.roi = config['roi'] # [x, y, width, height]
        self.line_config = config['line'] # {axis: 'y', pos: 60 }
        self.direction_config = config['direction'] # { up_is_out: true }
        self.min_area = config.get('min_area', 50)
        self.max_area = config.get('max_area', 2000)
        self.max_dist = config.get('max_dist', 40)
        
        # Background subtractor
        self.bg_subtractor = cv2.createBackgroundSubtractor(
            detectShadows=True,
            varThreshold=16,
            history=500
        )
        
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
        
        self.cap = cv2.VideoCapture(self.url)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    def _init_capture(self):
        """Initialize video capture with retry logic"""
        self.cap.release()
        self.cap = cv2.VideoCapture(self.url)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    def _extract_roi(self, frame: np.ndarray) -> np.ndarray:
        """Extract ROI from frame"""
        x, y, w, h = self.roi
        return frame[y:y+h, x:x+w]
    
    def _preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Preprocess frame for detection"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        # Simplified morphology
        return blurred
    
    def _detect_bees(self, frame: np.ndarray) -> List[Tuple[int, int]]:
        """Detect bees in frame and return centroids"""
        # Aplicar background subtraction
        fg_mask = self.bg_subtractor.apply(frame)
        fg_mask[fg_mask < 127] = 0
        
        # Encontrar y filtrar por contornos
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        centroids = []
        for contour in contours:
            area = cv2.contourArea(contour)
            # Filtrar por área
            if self.min_area <= area <= self.max_area:
                M = cv2.moments(contour)
                if M["m00"] != 0:
                    cX = int(M["m10"] / M["m00"])
                    cY = int(M["m01"] / M["m00"])
                    centroids.append((cX, cY))
        return centroids

    def _check_line_crossing(self, object_id: int, prev_pos: Tuple[int, int], curr_pos: Tuple[int, int]) -> Optional[str]:
        """Check if object crossed the counting line"""
        axis = self.line_config['axis']
        line_pos = self.line_config['pos']
        up_is_out = self.direction_config.get('up_is_out', True)
        
        if axis == 'y': # Horizontal line
            prev_y = prev_pos
            curr_y = curr_pos
            
            # Crossing from below to above
            if prev_y < line_pos - 2 and curr_y >= line_pos + 2:
                return 'out' if up_is_out else 'in'
            # Crossing from above to below
            elif prev_y > line_pos + 2 and curr_y <= line_pos - 2:
                return 'in' if up_is_out else 'out'
        
        elif axis == 'x': # Vertical line
            prev_x = prev_pos
            curr_x = curr_pos
            
            # Crossing from left to right
            if prev_x < line_pos - 2 and curr_x >= line_pos + 2:
                return 'out' if up_is_out else 'in'
            # Crossing from right to left
            elif prev_x > line_pos + 2 and curr_x <= line_pos - 2:
                return 'in' if up_is_out else 'out'
        
        return None

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
        if not self.cap.isOpened():
            self._init_capture()
            return None

        ret, frame = self.cap.read()
        if not ret or frame is None:
            self._init_capture()
            return None
        
        # Extracción y procesamiento
        roi_frame = self._extract_roi(frame)
        preprocessed_frame = self._preprocess_frame(roi_frame)
        centroids = self._detect_bees(preprocessed_frame)
        objects = self.tracker.update(centroids)

        frame_counts = {'in': 0, 'out': 0}
        
        for object_id, centroid in objects.items():
            if object_id in self.prev_positions:
                prev_pos = self.prev_positions[object_id]
                direction = self._check_line_crossing(object_id, prev_pos, centroid)
                if direction:
                    frame_counts[direction] += 1
                    self.bee_counts[direction] += 1
            self.prev_positions[object_id] = centroid

        self.prev_positions = {
            oid: pos for oid, pos in self.prev_positions.items()
            if oid in objects
        }
        
        fps = self._calculate_fps()

        return {
            'in': frame_counts['in'],
            'out': frame_counts['out'],
            'fps': fps,
            'algo': 'opencv'
        }
    
    def cleanup(self):
        """Clean up resources"""
        if self.cap.isOpened():
            self.cap.release()
        logger.info(f"{self.hive_id}: OpenCV pipeline cleaned up")