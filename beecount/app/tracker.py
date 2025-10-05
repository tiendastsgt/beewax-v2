"""
Centroid Tracker: Tracks objects (bees) across frames
"""

from collections import OrderedDict
from scipy.spatial import distance as dist
import numpy as np

class CentroidTracker:
    def __init__(self, max_disappeared=50, max_distance=50):
        self.next_object_id = 0
        self.objects = OrderedDict() # Guarda objectID: centroid
        self.disappeared = OrderedDict() # Cuenta frames que ha desaparecido
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance

    def register(self, centroid):
        self.objects[self.next_object_id] = centroid
        self.disappeared[self.next_object_id] = 0
        self.next_object_id += 1

    def deregister(self, object_id):
        del self.objects[object_id]
        del self.disappeared[object_id]

    def update(self, rects):
        """Actualiza el rastreador con nuevos rectángulos (detecciones)"""
        
        if len(rects) == 0:
            # Manejar objetos desaparecidos
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return self.objects

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (startX, startY, endX, endY)) in enumerate(rects):
            cX = int((startX + endX) / 2.0)
            cY = int((startY + endY) / 2.0)
            input_centroids[i] = (cX, cY)

        if len(self.objects) == 0:
            for i in range(0, len(input_centroids)):
                self.register(input_centroids[i])

        else:
            # Lógica de emparejamiento usando distancias (D)
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())
            
            # D = dist.cdist(object_centroids, input_centroids)
            # (Lógica de asignación de filas/columnas para emparejamiento)
            
            # (Lógica de manejo de objetos sin emparejar, registro, y desregistro)

        return self.objects