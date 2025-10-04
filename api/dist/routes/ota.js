"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto = __importStar(require("crypto"));
const router = (0, express_1.Router)();
// In-memory storage for demo purposes
let firmwares = [
    {
        id: '1',
        version: '1.0.0',
        deviceType: 'esp32',
        filePath: '/firmware/v1.0.0.bin',
        checksum: 'abc123',
        size: 1024000,
        releaseNotes: 'Initial release',
        isActive: true,
        createdAt: new Date(),
    },
];
let otaApplications = [];
// GET /api/ota/firmwares - Get all firmwares
router.get('/firmwares', (req, res) => {
    res.json({ success: true, data: firmwares });
});
// GET /api/ota/firmwares/:id - Get firmware by ID
router.get('/firmwares/:id', (req, res) => {
    const firmware = firmwares.find(f => f.id === req.params.id);
    if (!firmware) {
        return res.status(404).json({ success: false, error: 'Firmware not found' });
    }
    res.json({ success: true, data: firmware });
});
// POST /api/ota/firmwares - Upload new firmware
router.post('/firmwares', (req, res) => {
    const { version, deviceType, releaseNotes } = req.body;
    if (!version || !deviceType) {
        return res.status(400).json({ success: false, error: 'Version and deviceType are required' });
    }
    // In a real implementation, handle file upload
    const filePath = `/firmware/${version}.bin`;
    const checksum = crypto.randomBytes(16).toString('hex');
    const newFirmware = {
        id: Date.now().toString(),
        version,
        deviceType,
        filePath,
        checksum,
        size: 1024000, // Mock size
        releaseNotes,
        isActive: false,
        createdAt: new Date(),
    };
    firmwares.push(newFirmware);
    res.status(201).json({ success: true, data: newFirmware });
});
// PUT /api/ota/firmwares/:id/activate - Activate firmware
router.put('/firmwares/:id/activate', (req, res) => {
    const firmwareIndex = firmwares.findIndex(f => f.id === req.params.id);
    if (firmwareIndex === -1) {
        return res.status(404).json({ success: false, error: 'Firmware not found' });
    }
    // Deactivate all other firmwares for this device type
    firmwares.forEach(f => {
        if (f.deviceType === firmwares[firmwareIndex].deviceType) {
            f.isActive = false;
        }
    });
    firmwares[firmwareIndex].isActive = true;
    res.json({ success: true, data: firmwares[firmwareIndex] });
});
// POST /api/ota/applications - Start OTA update
router.post('/applications', (req, res) => {
    const { hiveId, firmwareId } = req.body;
    if (!hiveId || !firmwareId) {
        return res.status(400).json({ success: false, error: 'hiveId and firmwareId are required' });
    }
    const firmware = firmwares.find(f => f.id === firmwareId);
    if (!firmware) {
        return res.status(404).json({ success: false, error: 'Firmware not found' });
    }
    const newApplication = {
        id: Date.now().toString(),
        hiveId,
        firmwareId,
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
    };
    otaApplications.push(newApplication);
    // In a real implementation, trigger MQTT message to device
    setTimeout(() => {
        newApplication.status = 'in_progress';
        newApplication.progress = 50;
    }, 1000);
    res.status(201).json({ success: true, data: newApplication });
});
// GET /api/ota/applications/:id - Get OTA application status
router.get('/applications/:id', (req, res) => {
    const application = otaApplications.find(a => a.id === req.params.id);
    if (!application) {
        return res.status(404).json({ success: false, error: 'OTA application not found' });
    }
    res.json({ success: true, data: application });
});
// GET /api/ota/applications - Get all OTA applications
router.get('/applications', (req, res) => {
    const { hiveId, status } = req.query;
    let filteredApps = otaApplications;
    if (hiveId) {
        filteredApps = filteredApps.filter(a => a.hiveId === hiveId);
    }
    if (status) {
        filteredApps = filteredApps.filter(a => a.status === status);
    }
    res.json({ success: true, data: filteredApps });
});
exports.default = router;
//# sourceMappingURL=ota.js.map