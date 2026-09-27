import { Alert, DashboardSummary, Device, DevicePriority } from '../shared/types.js';

interface BuildingInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

const BUILDINGS: BuildingInfo[] = [
  { id: 'BLD-01', name: 'Milad Complex', lat: 35.7448, lng: 51.3753 },
  { id: 'BLD-02', name: 'Pardis Tech Park', lat: 35.7380, lng: 51.4120 },
  { id: 'BLD-03', name: 'Azadi Innovation Station', lat: 35.7088, lng: 51.3204 },
  { id: 'BLD-04', name: 'Sharif Tech Campus', lat: 35.7026, lng: 51.3524 },
  { id: 'BLD-05', name: 'Saadat Abad Hub', lat: 35.7820, lng: 51.3700 },
];

export class DeviceStore {
  private devices = new Map<string, Device>();
  private alerts: Alert[] = [];
  private alertIdCounter = 1000;

  constructor(deviceCount = 120) {
    this.seed(deviceCount);
  }

  private seed(count: number): void {
    const now = new Date().toISOString();

    for (let i = 1; i <= count; i++) {
      const bld = BUILDINGS[(i - 1) % BUILDINGS.length];
      const id = `GW-${String(i).padStart(4, '0')}`;
      const latJitter = (Math.random() - 0.5) * 0.005;
      const lngJitter = (Math.random() - 0.5) * 0.005;

      const device: Device = {
        id,
        name: `Gateway ${i}`,
        buildingId: bld.id,
        buildingName: bld.name,
        status: i > count - 4 ? 'offline' : 'online',
        priority: 'normal',
        battery: Math.floor(75 + Math.random() * 25),
        signalStrength: Math.floor(65 + Math.random() * 30),
        temperature: Number((21.0 + Math.random() * 4).toFixed(1)),
        acPower: true,
        hasFaults: false,
        urgentAlarm: false,
        lastSeen: now,
        latitude: Number((bld.lat + latJitter).toFixed(6)),
        longitude: Number((bld.lng + lngJitter).toFixed(6)),
        version: 1,
      };

      this.devices.set(id, device);
    }
  }

  getAll(): Device[] {
    return Array.from(this.devices.values());
  }

  getById(id: string): Device | undefined {
    return this.devices.get(id);
  }

  update(id: string, patch: Partial<Device>): Device | undefined {
    const existing = this.devices.get(id);
    if (!existing) return undefined;

    const updated: Device = {
      ...existing,
      ...patch,
      id: existing.id,
      version: existing.version + 1,
      lastSeen: new Date().toISOString(),
    };

    this.devices.set(id, updated);
    return updated;
  }

  getSummary(): DashboardSummary {
    let online = 0;
    let offline = 0;
    let urgentAlarms = 0;
    let technicalFaults = 0;

    for (const dev of this.devices.values()) {
      if (dev.status === 'online') {
        online++;
      } else {
        offline++;
      }
      if (dev.urgentAlarm || dev.priority === 'urgent') {
        urgentAlarms++;
      }
      if (dev.hasFaults) {
        technicalFaults++;
      }
    }

    return {
      total: this.devices.size,
      online,
      offline,
      urgentAlarms,
      technicalFaults,
    };
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  addAlert(deviceId: string, priority: 'warning' | 'urgent', message: string): Alert {
    this.alertIdCounter++;
    const alert: Alert = {
      id: `ALT-${this.alertIdCounter}`,
      deviceId,
      priority,
      message,
      timestamp: new Date().toISOString(),
    };
    this.alerts.unshift(alert);
    return alert;
  }

  resolveAlert(alertId: string): Alert | undefined {
    const alert = this.alerts.find((a) => a.id === alertId && !a.resolvedAt);
    if (!alert) return undefined;

    alert.resolvedAt = new Date().toISOString();
    return alert;
  }

  resolveAlertsForDevice(deviceId: string): Alert[] {
    const resolved: Alert[] = [];
    const now = new Date().toISOString();
    for (const a of this.alerts) {
      if (a.deviceId === deviceId && !a.resolvedAt) {
        a.resolvedAt = now;
        resolved.push(a);
      }
    }
    return resolved;
  }
}

export const deviceStore = new DeviceStore();
