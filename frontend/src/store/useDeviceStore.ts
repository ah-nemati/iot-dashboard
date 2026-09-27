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
  summary: DashboardSummary;
  telemetryHistory: Record<string, TelemetryPoint[]>;
  connectionStatus: ConnectionStatus;
  selectedDeviceId: string | null;

  setDevices: (devices: Device[]) => void;
  updateDevice: (payload: DeviceEventPayload | Device) => void;
  batchUpdateDevices: (payloads: (DeviceEventPayload | Device)[]) => void;
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

function computeSummary(devices: Record<string, Device>): DashboardSummary {
  let online = 0;
  let offline = 0;
  let urgentAlarms = 0;
  let technicalFaults = 0;

  const list = Object.values(devices);
  for (const dev of list) {
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
    total: list.length,
    online,
    offline,
    urgentAlarms,
    technicalFaults,
  };
}

const INITIAL_SUMMARY: DashboardSummary = {
  total: 0,
  online: 0,
  offline: 0,
  urgentAlarms: 0,
  technicalFaults: 0,
};

export const useDeviceStore = create<DeviceStoreState>((set, get) => ({
  devices: {},
  alerts: [],
  summary: INITIAL_SUMMARY,
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

    set({
      devices: deviceMap,
      telemetryHistory: historyMap,
      summary: computeSummary(deviceMap),
    });
  },

  batchUpdateDevices: (payloads: (DeviceEventPayload | Device)[]) => {
    set((state) => {
      let hasChanges = false;
      let summaryChanged = false;
      const nextDevices = { ...state.devices };
      const nextHistory = { ...state.telemetryHistory };

      for (const payload of payloads) {
        const incoming: Device = 'device' in payload ? payload.device : payload;
        const current = nextDevices[incoming.id];

        if (current && incoming.version <= current.version) {
          continue;
        }

        if (
          !current ||
          current.status !== incoming.status ||
          current.priority !== incoming.priority ||
          current.urgentAlarm !== incoming.urgentAlarm ||
          current.hasFaults !== incoming.hasFaults
        ) {
          summaryChanged = true;
        }

        hasChanges = true;
        nextDevices[incoming.id] = incoming;

        const currentHist = nextHistory[incoming.id] || [];
        const newPoint: TelemetryPoint = {
          timestamp: incoming.lastSeen,
          battery: incoming.battery,
          temperature: incoming.temperature,
          signalStrength: incoming.signalStrength,
        };
        nextHistory[incoming.id] = [...currentHist.slice(-(MAX_HISTORY_POINTS - 1)), newPoint];
      }

      if (!hasChanges) {
        return state;
      }

      return {
        devices: nextDevices,
        telemetryHistory: nextHistory,
        summary: summaryChanged ? computeSummary(nextDevices) : state.summary,
      };
    });
  },

  updateDevice: (payload: DeviceEventPayload | Device) => {
    get().batchUpdateDevices([payload]);
  },

  setDeviceDisconnected: ({ id, version, timestamp }) => {
    const current = get().devices[id];
    if (!current || version <= current.version) {
      return;
    }

    set((state) => {
      const updatedDevice: Device = {
        ...current,
        status: 'offline',
        version,
        lastSeen: timestamp,
      };
      const nextDevices = {
        ...state.devices,
        [id]: updatedDevice,
      };
      return {
        devices: nextDevices,
        summary: computeSummary(nextDevices),
      };
    });
  },

  setDeviceConnected: ({ id, version, timestamp }) => {
    const current = get().devices[id];
    if (!current || version <= current.version) {
      return;
    }

    set((state) => {
      const updatedDevice: Device = {
        ...current,
        status: 'online',
        version,
        lastSeen: timestamp,
      };
      const nextDevices = {
        ...state.devices,
        [id]: updatedDevice,
      };
      return {
        devices: nextDevices,
        summary: computeSummary(nextDevices),
      };
    });
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
        summary: computeSummary(updatedDevices),
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
        summary: computeSummary(updatedDevices),
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

        let alertsData: Alert[] = get().alerts;
        if (alertRes && alertRes.ok) {
          alertsData = await alertRes.json();
        }

        set({
          devices: merged,
          alerts: alertsData,
          summary: computeSummary(merged),
        });
      }
    } catch {
      // offline or unreachable
    }
  },

  resetStore: () => {
    set({
      devices: {},
      alerts: [],
      summary: INITIAL_SUMMARY,
      telemetryHistory: {},
      connectionStatus: 'disconnected',
      selectedDeviceId: null,
    });
  },
}));

export function selectSummary(state: DeviceStoreState): DashboardSummary {
  return state.summary;
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
