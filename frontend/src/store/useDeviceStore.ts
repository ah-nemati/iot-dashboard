import { create } from 'zustand';
import { Alert, DashboardSummary, Device, DeviceEventPayload, DevicePriority, DeviceStatus } from '../shared/types.js';

export interface TelemetryPoint {
  timestamp: string;
  battery: number;
  temperature: number;
  signalStrength: number;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface DeviceStoreState {
  devices: Record<string, Device>;
  alerts: Alert[];
  telemetryHistory: Record<string, TelemetryPoint[]>;
  connectionStatus: ConnectionStatus;
  selectedDeviceId: string | null;

  setDevices: (devices: Device[]) => void;
  updateDevice: (payload: DeviceEventPayload | Device) => void;
  setDeviceDisconnected: (payload: { id: string; version: number; timestamp: string }) => void;
  setDeviceConnected: (payload: { id: string; version: number; timestamp: string }) => void;
  addAlert: (alert: Alert) => void;
  resolveAlert: (payload: { id: string; deviceId: string; timestamp: string }) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSelectedDeviceId: (id: string | null) => void;
  resyncWithServer: () => Promise<void>;
  resetStore: () => void;
}

const MAX_HISTORY_POINTS = 50;

export const useDeviceStore = create<DeviceStoreState>((set, get) => ({
  devices: {},
  alerts: [],
  telemetryHistory: {},
  connectionStatus: 'disconnected',
  selectedDeviceId: null,

  setDevices: (devices: Device[]) => {
    const deviceMap: Record<string, Device> = {};
    const historyMap = { ...get().telemetryHistory };

    for (const d of devices) {
      deviceMap[d.id] = d;
      if (!historyMap[d.id]) {
        historyMap[d.id] = [
          {
            timestamp: d.lastSeen,
            battery: d.battery,
            temperature: d.temperature,
            signalStrength: d.signalStrength,
          },
        ];
      }
    }

    set({ devices: deviceMap, telemetryHistory: historyMap });
  },

  updateDevice: (payload: DeviceEventPayload | Device) => {
    const incoming: Device = 'device' in payload ? payload.device : payload;
    const current = get().devices[incoming.id];

    if (current && incoming.version <= current.version) {
      return;
    }

    const currentHistory = get().telemetryHistory[incoming.id] || [];
    const newPoint: TelemetryPoint = {
      timestamp: incoming.lastSeen,
      battery: incoming.battery,
      temperature: incoming.temperature,
      signalStrength: incoming.signalStrength,
    };
    const nextHistory = [...currentHistory.slice(-(MAX_HISTORY_POINTS - 1)), newPoint];

    set((state) => ({
      devices: {
        ...state.devices,
        [incoming.id]: incoming,
      },
      telemetryHistory: {
        ...state.telemetryHistory,
        [incoming.id]: nextHistory,
      },
    }));
  },

  setDeviceDisconnected: ({ id, version, timestamp }) => {
    const current = get().devices[id];
    if (!current || version <= current.version) {
      return;
    }

    set((state) => ({
      devices: {
        ...state.devices,
        [id]: {
          ...current,
          status: 'offline',
          version,
          lastSeen: timestamp,
        },
      },
    }));
  },

  setDeviceConnected: ({ id, version, timestamp }) => {
    const current = get().devices[id];
    if (!current || version <= current.version) {
      return;
    }

    set((state) => ({
      devices: {
        ...state.devices,
        [id]: {
          ...current,
          status: 'online',
          version,
          lastSeen: timestamp,
        },
      },
    }));
  },

  addAlert: (alert: Alert) => {
    set((state) => {
      const existing = state.devices[alert.deviceId];
      const updatedDevices = existing
        ? {
            ...state.devices,
            [alert.deviceId]: {
              ...existing,
              priority: alert.priority === 'urgent' ? ('urgent' as DevicePriority) : existing.priority,
              urgentAlarm: alert.priority === 'urgent' ? true : existing.urgentAlarm,
              hasFaults: alert.priority === 'warning' ? true : existing.hasFaults,
            },
          }
        : state.devices;

      return {
        alerts: [alert, ...state.alerts.filter((a) => a.id !== alert.id)],
        devices: updatedDevices,
      };
    });
  },

  resolveAlert: ({ id, deviceId, timestamp }) => {
    set((state) => {
      const nextAlerts = state.alerts.map((a) =>
        a.id === id ? { ...a, resolvedAt: timestamp } : a
      );

      const hasActiveUrgent = nextAlerts.some(
        (a) => a.deviceId === deviceId && !a.resolvedAt && a.priority === 'urgent'
      );
      const hasActiveWarning = nextAlerts.some(
        (a) => a.deviceId === deviceId && !a.resolvedAt && a.priority === 'warning'
      );

      const existing = state.devices[deviceId];
      const updatedDevices = existing
        ? {
            ...state.devices,
            [deviceId]: {
              ...existing,
              urgentAlarm: hasActiveUrgent,
              hasFaults: hasActiveWarning,
              priority: (hasActiveUrgent ? 'urgent' : hasActiveWarning ? 'warning' : 'normal') as DevicePriority,
            },
          }
        : state.devices;

      return {
        alerts: nextAlerts,
        devices: updatedDevices,
      };
    });
  },

  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status });
  },

  setSelectedDeviceId: (id: string | null) => {
    set({ selectedDeviceId: id });
  },

  resyncWithServer: async () => {
    try {
      const [devRes, alertRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/alerts'),
      ]);

      if (devRes.ok) {
        const devices: Device[] = await devRes.json();
        const currentDevices = get().devices;
        const merged: Record<string, Device> = { ...currentDevices };

        for (const dev of devices) {
          const current = currentDevices[dev.id];
          if (!current || dev.version >= current.version) {
            merged[dev.id] = dev;
          }
        }
        set({ devices: merged });
      }

      if (alertRes.ok) {
        const alerts: Alert[] = await alertRes.json();
        set({ alerts });
      }
    } catch {
      // offline or unreachable
    }
  },

  resetStore: () => {
    set({
      devices: {},
      alerts: [],
      telemetryHistory: {},
      connectionStatus: 'disconnected',
      selectedDeviceId: null,
    });
  },
}));

export function selectSummary(state: DeviceStoreState): DashboardSummary {
  let online = 0;
  let offline = 0;
  let urgentAlarms = 0;
  let technicalFaults = 0;

  const devices = Object.values(state.devices);
  for (const dev of devices) {
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
    total: devices.length,
    online,
    offline,
    urgentAlarms,
    technicalFaults,
  };
}

export interface FilterOptions {
  search: string;
  statusFilter: 'all' | DeviceStatus;
  priorityFilter: 'all' | DevicePriority;
  sortBy: 'lastSeen' | 'id' | 'battery' | 'signalStrength';
  sortOrder: 'asc' | 'desc';
}

export function selectFilteredDevices(
  devicesRecord: Record<string, Device>,
  options: FilterOptions
): Device[] {
  const { search, statusFilter, priorityFilter, sortBy, sortOrder } = options;
  const list = Object.values(devicesRecord);
  const searchLower = search.trim().toLowerCase();

  return list
    .filter((dev) => {
      if (statusFilter !== 'all' && dev.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && dev.priority !== priorityFilter) return false;
      if (searchLower) {
        const matchId = dev.id.toLowerCase().includes(searchLower);
        const matchName = dev.name.toLowerCase().includes(searchLower);
        const matchBuilding = dev.buildingName.toLowerCase().includes(searchLower);
        if (!matchId && !matchName && !matchBuilding) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'lastSeen') {
        comparison = new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      } else if (sortBy === 'battery') {
        comparison = b.battery - a.battery;
      } else if (sortBy === 'signalStrength') {
        comparison = b.signalStrength - a.signalStrength;
      } else {
        comparison = a.id.localeCompare(b.id);
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
}
