export type DeviceStatus = 'online' | 'offline';
export type DevicePriority = 'normal' | 'warning' | 'urgent';

export interface Device {
  id: string;
  name: string;
  buildingId: string;
  buildingName: string;
  status: DeviceStatus;
  priority: DevicePriority;
  battery: number;
  signalStrength: number;
  temperature: number;
  acPower: boolean;
  hasFaults: boolean;
  urgentAlarm: boolean;
  lastSeen: string;
  latitude: number;
  longitude: number;
  version: number;
}

export interface Alert {
  id: string;
  deviceId: string;
  priority: 'warning' | 'urgent';
  message: string;
  timestamp: string;
  resolvedAt?: string;
}

export interface DashboardSummary {
  total: number;
  online: number;
  offline: number;
  urgentAlarms: number;
  technicalFaults: number;
}

export type SimulationEventType =
  | 'urgent_alarm'
  | 'technical_fault'
  | 'power_failure'
  | 'disconnect'
  | 'reconnect'
  | 'resolve_alarm';

export interface SimulateRequest {
  eventType: SimulationEventType;
}

export interface DeviceEventPayload {
  id: string;
  version: number;
  timestamp: string;
  device: Device;
}

export interface AlertEventPayload {
  id: string;
  deviceId: string;
  priority: 'warning' | 'urgent';
  message: string;
  timestamp: string;
}

export interface ServerToClientEvents {
  'device:updated': (payload: DeviceEventPayload) => void;
  'device:disconnected': (payload: { id: string; version: number; timestamp: string }) => void;
  'device:connected': (payload: { id: string; version: number; timestamp: string }) => void;
  'alert:created': (payload: AlertEventPayload) => void;
  'alert:resolved': (payload: { id: string; deviceId: string; timestamp: string }) => void;
}

export interface ClientToServerEvents {
  'subscribe:device': (deviceId: string) => void;
  'unsubscribe:device': (deviceId: string) => void;
}
