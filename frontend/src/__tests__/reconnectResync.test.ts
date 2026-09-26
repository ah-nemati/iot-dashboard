import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { Device, Alert } from '../shared/types.js';

describe('Reconnect and state resynchronization', () => {
  beforeEach(() => {
    useDeviceStore.getState().resetStore();
    vi.restoreAllMocks();
  });

  it('resyncs state from server and reconciles out-of-sync local data', async () => {
    const store = useDeviceStore.getState();

    const staleLocalDevice: Device = {
      id: 'GW-0001',
      name: 'Gateway 1',
      buildingId: 'BLD-01',
      buildingName: 'North Tower',
      status: 'online',
      priority: 'normal',
      battery: 80,
      signalStrength: 70,
      temperature: 22,
      acPower: true,
      hasFaults: false,
      urgentAlarm: false,
      lastSeen: '2026-09-26T12:00:00Z',
      latitude: 50.1,
      longitude: 8.6,
      version: 1,
    };

    store.setDevices([staleLocalDevice]);
    store.setConnectionStatus('disconnected');

    expect(useDeviceStore.getState().connectionStatus).toBe('disconnected');
    expect(useDeviceStore.getState().devices['GW-0001'].status).toBe('online');

    const freshServerDevice: Device = {
      ...staleLocalDevice,
      status: 'offline',
      priority: 'warning',
      hasFaults: true,
      version: 5,
      lastSeen: '2026-09-26T12:05:00Z',
    };

    const freshAlert: Alert = {
      id: 'ALT-5000',
      deviceId: 'GW-0001',
      priority: 'warning',
      message: 'Gateway dropped offline while client disconnected',
      timestamp: '2026-09-26T12:05:00Z',
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/devices')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([freshServerDevice]),
        });
      }
      if (url.includes('/api/alerts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([freshAlert]),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    globalThis.fetch = mockFetch as unknown as typeof fetch;

    store.setConnectionStatus('reconnecting');
    expect(useDeviceStore.getState().connectionStatus).toBe('reconnecting');

    store.setConnectionStatus('connected');
    await store.resyncWithServer();

    expect(mockFetch).toHaveBeenCalledWith('/api/devices');
    expect(mockFetch).toHaveBeenCalledWith('/api/alerts');

    const reconciled = useDeviceStore.getState().devices['GW-0001'];
    expect(reconciled.version).toBe(5);
    expect(reconciled.status).toBe('offline');
    expect(reconciled.hasFaults).toBe(true);

    const alerts = useDeviceStore.getState().alerts;
    expect(alerts.length).toBe(1);
    expect(alerts[0].id).toBe('ALT-5000');
  });
});
