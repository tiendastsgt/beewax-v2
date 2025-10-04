import express from 'express';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Hive {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  sensors: Sensor[];
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export interface Sensor {
  id: string;
  hiveId: string;
  type: 'temperature' | 'humidity' | 'weight' | 'sound' | 'motion';
  value: number;
  unit: string;
  timestamp: Date;
  batteryLevel?: number;
}

export interface Alert {
  id: string;
  hiveId: string;
  type: 'temperature' | 'humidity' | 'weight' | 'battery' | 'connection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
  acknowledged: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Firmware {
  id: string;
  version: string;
  deviceType: string;
  filePath: string;
  checksum: string;
  size: number;
  releaseNotes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface OTAApplication {
  id: string;
  hiveId: string;
  firmwareId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthRequest extends express.Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export interface WebSocketMessage {
  type: 'sensor_data' | 'alert' | 'ota_status' | 'system_status';
  payload: any;
  timestamp: Date;
}

export interface MQTTMessage {
  topic: string;
  payload: any;
  timestamp: Date;
}