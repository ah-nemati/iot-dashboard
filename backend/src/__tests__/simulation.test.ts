import { describe, it, expect } from 'vitest';
import { DeviceStore } from '../store/deviceStore.js';
import { SimulationEngine } from '../simulator/engine.js';

describe('Simulation Engine Rules', () => {
  it('offline device does not drift telemetry and remains frozen', () => {
    const store = new DeviceStore(5);
    const simulator = new SimulationEngine(store);

    const device = store.getAll()[0];
    simulator.applySimulationEvent(device.id, 'disconnect');

    const offlineDevice = store.getById(device.id)!;
    expect(offlineDevice.status).toBe('offline');
    const versionBeforeTick = offlineDevice.version;
    const batteryBeforeTick = offlineDevice.battery;
    const tempBeforeTick = offlineDevice.temperature;

    // invoke private tickDevice method via prototype or reflection
    (simulator as unknown as { tickDevice: (id: string) => void }).tickDevice(device.id);

    const afterTick = store.getById(device.id)!;
    expect(afterTick.version).toBe(versionBeforeTick);
    expect(afterTick.battery).toBe(batteryBeforeTick);
    expect(afterTick.temperature).toBe(tempBeforeTick);
  });

  it('reconnecting an offline device restores normal status and increments version', () => {
    const store = new DeviceStore(5);
    const simulator = new SimulationEngine(store);

    const device = store.getAll()[0];
    simulator.applySimulationEvent(device.id, 'disconnect');
    const disconnected = store.getById(device.id)!;

    simulator.applySimulationEvent(device.id, 'reconnect');
    const reconnected = store.getById(device.id)!;

    expect(reconnected.status).toBe('online');
    expect(reconnected.version).toBeGreaterThan(disconnected.version);
  });

  it('resolving alarm resets flags and resolves associated alerts', () => {
    const store = new DeviceStore(5);
    const simulator = new SimulationEngine(store);
    const device = store.getAll()[0];

    simulator.applySimulationEvent(device.id, 'urgent_alarm');
    const alarmed = store.getById(device.id)!;
    expect(alarmed.urgentAlarm).toBe(true);
    expect(alarmed.priority).toBe('urgent');

    simulator.applySimulationEvent(device.id, 'resolve_alarm');
    const resolved = store.getById(device.id)!;
    expect(resolved.urgentAlarm).toBe(false);
    expect(resolved.priority).toBe('normal');

    const alerts = store.getAlerts().filter(a => a.deviceId === device.id);
    expect(alerts.every(a => !!a.resolvedAt)).toBe(true);
  });
});
