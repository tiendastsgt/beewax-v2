-- Device Registry Database Schema
-- PostgreSQL compatible

-- Create enum types
CREATE TYPE device_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE command_status AS ENUM ('sent', 'executed', 'failed');
CREATE TYPE alert_type AS ENUM ('temperature', 'humidity', 'weight', 'battery', 'connection');

-- Devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(500),
    status device_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Firmware versions table
CREATE TABLE firmware_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL UNIQUE,
    device_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    checksum VARCHAR(128) NOT NULL,
    size BIGINT NOT NULL,
    release_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device credentials table
CREATE TABLE device_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Command history table
CREATE TABLE command_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    parameters JSONB,
    status command_status NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    response TEXT
);

-- Device maintenance table
CREATE TABLE device_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_due TIMESTAMP WITH TIME ZONE,
    technician VARCHAR(255)
);

-- Device alerts table
CREATE TABLE device_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    message TEXT NOT NULL,
    value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_location ON devices(latitude, longitude);
CREATE INDEX idx_firmware_versions_active ON firmware_versions(is_active);
CREATE INDEX idx_device_credentials_device_id ON device_credentials(device_id);
CREATE INDEX idx_command_history_device_id ON command_history(device_id);
CREATE INDEX idx_command_history_status ON command_history(status);
CREATE INDEX idx_device_maintenance_device_id ON device_maintenance(device_id);
CREATE INDEX idx_device_maintenance_next_due ON device_maintenance(next_due);
CREATE INDEX idx_device_alerts_device_id ON device_alerts(device_id);
CREATE INDEX idx_device_alerts_severity ON device_alerts(severity);
CREATE INDEX idx_device_alerts_acknowledged ON device_alerts(acknowledged);
CREATE INDEX idx_device_alerts_created_at ON device_alerts(created_at);

-- Initial data for devices
INSERT INTO devices (id, name, latitude, longitude, address, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Hive Alpha', 14.6349, -90.5069, 'Guatemala City, Zone 1', 'active'),
('550e8400-e29b-41d4-a716-446655440001', 'Hive Beta', 14.6350, -90.5070, 'Guatemala City, Zone 2', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Hive Gamma', 14.6351, -90.5071, 'Guatemala City, Zone 3', 'maintenance');

-- Initial data for firmware versions
INSERT INTO firmware_versions (id, version, device_type, file_path, checksum, size, release_notes, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440000', '1.0.0', 'hive_monitor', '/firmware/hive_monitor_v1.0.0.bin', 'abc123def456', 1024000, 'Initial release with basic monitoring', true),
('660e8400-e29b-41d4-a716-446655440001', '1.1.0', 'hive_monitor', '/firmware/hive_monitor_v1.1.0.bin', 'def456ghi789', 1048576, 'Added humidity sensor support', true),
('660e8400-e29b-41d4-a716-446655440002', '2.0.0', 'hive_monitor', '/firmware/hive_monitor_v2.0.0.bin', 'ghi789jkl012', 2097152, 'Major update with OTA support', false);