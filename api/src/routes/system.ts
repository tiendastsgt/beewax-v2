import { Router, Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

// GET /api/system/health - System health check
router.get('/health', (req, res: Response<ApiResponse<any>>) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    },
  });
});

// GET /api/system/status - System status
router.get('/status', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  // In a real implementation, this would check database connections, MQTT, etc.
  res.json({
    success: true,
    data: {
      services: {
        api: 'running',
        mqtt: 'running', // Would check actual MQTT connection
        database: 'running', // Would check actual DB connection
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/system/metrics - System metrics
router.get('/metrics', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  res.json({
    success: true,
    data: {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;