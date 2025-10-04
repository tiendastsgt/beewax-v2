"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /api/system/health - System health check
router.get('/health', (req, res) => {
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
router.get('/status', (req, res) => {
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
router.get('/metrics', (req, res) => {
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
exports.default = router;
//# sourceMappingURL=system.js.map