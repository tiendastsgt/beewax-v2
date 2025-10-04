"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// In-memory storage for demo purposes
let alerts = [
    {
        id: '1',
        hiveId: '1',
        type: 'temperature',
        severity: 'high',
        message: 'Hive temperature is too high',
        value: 40.5,
        threshold: 38,
        acknowledged: false,
        createdAt: new Date(),
    },
];
// GET /api/alerts - Get all alerts
router.get('/', (req, res) => {
    const { hiveId, acknowledged } = req.query;
    let filteredAlerts = alerts;
    if (hiveId) {
        filteredAlerts = filteredAlerts.filter(a => a.hiveId === hiveId);
    }
    if (acknowledged !== undefined) {
        const ack = acknowledged === 'true';
        filteredAlerts = filteredAlerts.filter(a => a.acknowledged === ack);
    }
    res.json({ success: true, data: filteredAlerts });
});
// GET /api/alerts/:id - Get alert by ID
router.get('/:id', (req, res) => {
    const alert = alerts.find(a => a.id === req.params.id);
    if (!alert) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, data: alert });
});
// POST /api/alerts - Create new alert
router.post('/', (req, res) => {
    const { hiveId, type, severity, message, value, threshold } = req.body;
    if (!hiveId || !type || !severity || !message) {
        return res.status(400).json({ success: false, error: 'Required fields: hiveId, type, severity, message' });
    }
    const newAlert = {
        id: Date.now().toString(),
        hiveId,
        type,
        severity,
        message,
        value,
        threshold,
        acknowledged: false,
        createdAt: new Date(),
    };
    alerts.push(newAlert);
    res.status(201).json({ success: true, data: newAlert });
});
// PUT /api/alerts/:id/acknowledge - Acknowledge alert
router.put('/:id/acknowledge', (req, res) => {
    const alertIndex = alerts.findIndex(a => a.id === req.params.id);
    if (alertIndex === -1) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    alerts[alertIndex].acknowledged = true;
    res.json({ success: true, data: alerts[alertIndex] });
});
// PUT /api/alerts/:id/resolve - Resolve alert
router.put('/:id/resolve', (req, res) => {
    const alertIndex = alerts.findIndex(a => a.id === req.params.id);
    if (alertIndex === -1) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    alerts[alertIndex].resolvedAt = new Date();
    res.json({ success: true, data: alerts[alertIndex] });
});
// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', (req, res) => {
    const alertIndex = alerts.findIndex(a => a.id === req.params.id);
    if (alertIndex === -1) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    alerts.splice(alertIndex, 1);
    res.json({ success: true, message: 'Alert deleted successfully' });
});
exports.default = router;
//# sourceMappingURL=alerts.js.map