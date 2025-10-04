import { Router, Response } from 'express';
import { AuthRequest, Hive, Sensor, ApiResponse } from '../types';

const router = Router();

// In-memory storage for demo purposes - replace with database
let hives: Hive[] = [
  {
    id: '1',
    name: 'Hive Alpha',
    location: { latitude: 14.6349, longitude: -90.5069 },
    sensors: [
      {
        id: '1',
        hiveId: '1',
        type: 'temperature',
        value: 35.5,
        unit: '°C',
        timestamp: new Date(),
        batteryLevel: 85,
      },
    ],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/hives - Get all hives
router.get('/', (req: AuthRequest, res: Response<ApiResponse<Hive[]>>) => {
  res.json({ success: true, data: hives });
});

// GET /api/hives/:id - Get hive by ID
router.get('/:id', (req: AuthRequest, res: Response<ApiResponse<Hive>>) => {
  const hive = hives.find(h => h.id === req.params.id);
  if (!hive) {
    return res.status(404).json({ success: false, error: 'Hive not found' });
  }
  res.json({ success: true, data: hive });
});

// POST /api/hives - Create new hive
router.post('/', (req: AuthRequest, res: Response<ApiResponse<Hive>>) => {
  const { name, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({ success: false, error: 'Name and location are required' });
  }

  const newHive: Hive = {
    id: Date.now().toString(),
    name,
    location,
    sensors: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  hives.push(newHive);
  res.status(201).json({ success: true, data: newHive });
});

// PUT /api/hives/:id - Update hive
router.put('/:id', (req: AuthRequest, res: Response<ApiResponse<Hive>>) => {
  const hiveIndex = hives.findIndex(h => h.id === req.params.id);
  if (hiveIndex === -1) {
    return res.status(404).json({ success: false, error: 'Hive not found' });
  }

  const updatedHive = { ...hives[hiveIndex], ...req.body, updatedAt: new Date() };
  hives[hiveIndex] = updatedHive;
  res.json({ success: true, data: updatedHive });
});

// DELETE /api/hives/:id - Delete hive
router.delete('/:id', (req: AuthRequest, res: Response<ApiResponse<null>>) => {
  const hiveIndex = hives.findIndex(h => h.id === req.params.id);
  if (hiveIndex === -1) {
    return res.status(404).json({ success: false, error: 'Hive not found' });
  }

  hives.splice(hiveIndex, 1);
  res.json({ success: true, message: 'Hive deleted successfully' });
});

// GET /api/hives/:id/sensors - Get sensors for a hive
router.get('/:id/sensors', (req: AuthRequest, res: Response<ApiResponse<Sensor[]>>) => {
  const hive = hives.find(h => h.id === req.params.id);
  if (!hive) {
    return res.status(404).json({ success: false, error: 'Hive not found' });
  }
  res.json({ success: true, data: hive.sensors });
});

// POST /api/hives/:id/sensors - Add sensor data
router.post('/:id/sensors', (req: AuthRequest, res: Response<ApiResponse<Sensor>>) => {
  const hive = hives.find(h => h.id === req.params.id);
  if (!hive) {
    return res.status(404).json({ success: false, error: 'Hive not found' });
  }

  const { type, value, unit, batteryLevel } = req.body;
  if (!type || value === undefined || !unit) {
    return res.status(400).json({ success: false, error: 'Type, value, and unit are required' });
  }

  const newSensor: Sensor = {
    id: Date.now().toString(),
    hiveId: req.params.id,
    type,
    value,
    unit,
    timestamp: new Date(),
    batteryLevel,
  };

  hive.sensors.push(newSensor);
  hive.updatedAt = new Date();

  res.status(201).json({ success: true, data: newSensor });
});

export default router;