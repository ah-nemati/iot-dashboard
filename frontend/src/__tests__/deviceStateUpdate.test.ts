import { describe, it, expect, beforeEach } from 'vitest';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { Device, DeviceEventPayload } from '../shared/types.js';

describe('Device state update and version guard', () => {
  beforeEach(() => {
    useDeviceStore.getState().resetStore();
  });

  const baseDevice: Device = {
    id: 'GW-0001',
    name: 'Gateway 1',
    buildingId: 'BLD-01',
    buildingName: 'North Tower',
    status: 'online',
    priority: 'normal',
    battery: 90,
    signalStrength: 80,
    temperature: 22.0,
    acPower: true,
    hasFaults: false,
    urgentAlarm: false,
    lastSeen: '2026-09-26T12:00:00Z',
    latitude: 50.1109,
    longitude: 8.6821,
    version: 10,
  };

  it('applies a newer version event correctly', () => {
    const store = useDeviceStore.getState();
    store.setDevices([baseDevice]);

    const newerPayload: DeviceEventPayload = {
      id: 'GW-0001',
      version: 11,
      timestamp: '2026-09-26T12:00:02Z',
      device: {
        ...baseDevice,
        battery: 88,
        temperature: 23.5,
        version: 11,
        lastSeen: '2026-09-26T12:00:02Z',
      },
    };

    store.updateDevice(newerPayload);

    const updated = useDeviceStore.getState().devices['GW-0001'];
    expect(updated).toBeDefined();
    expect(updated.version).toBe(11);
    expect(updated.battery).toBe(88);
    expect(updated.temperature).toBe(23.5);
  });

  it('rejects and drops stale or out-of-order events with lower or equal version', () => {
    const store = useDeviceStore.getState();
    store.setDevices([baseDevice]);

    const stalePayload: DeviceEventPayload = {
      id: 'GW-0001',
      version: 8,
      timestamp: '2026-09-26T11:58:00Z',
      device: {
        ...baseDevice,
        battery: 50,
        version: 8,
      },
    };

    store.updateDevice(stalePayload);

    const deviceAfterStale = useDeviceStore.getState().devices['GW-0001'];
    expect(deviceAfterStale.version).toBe(10);
    expect(deviceAfterStale.battery).toBe(90);

    const sameVersionPayload: DeviceEventPayload = {
      id: 'GW-0001',
      version: 10,
      timestamp: '2026-09-26T12:00:00Z',
      device: {
        ...baseDevice,
        battery: 40,
        version: 10,
      },
    };

    store.updateDevice(sameVersionPayload);
    const deviceAfterEqual = useDeviceStore.getState().devices['GW-0001'];
    expect(deviceAfterEqual.battery).toBe(90);
  });
});
