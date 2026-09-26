import { Alert, Device, DeviceEventPayload, SimulationEventType } from '../shared/types.js';
import { DeviceStore } from '../store/deviceStore.js';

type DeviceUpdatedHandler = (payload: DeviceEventPayload) => void;
type DeviceConnectionHandler = (payload: { id: string; version: number; timestamp: string }) => void;
type AlertCreatedHandler = (alert: Alert) => void;
type AlertResolvedHandler = (payload: { id: string; deviceId: string; timestamp: string }) => void;

export class SimulationEngine {
  private store: DeviceStore;
  private timers = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  public onDeviceUpdated?: DeviceUpdatedHandler;
  public onDeviceDisconnected?: DeviceConnectionHandler;
  public onDeviceConnected?: DeviceConnectionHandler;
  public onAlertCreated?: AlertCreatedHandler;
  public onAlertResolved?: AlertResolvedHandler;

  constructor(store: DeviceStore) {
    this.store = store;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    for (const device of this.store.getAll()) {
      this.scheduleDeviceTick(device.id);
    }
  }

  stop(): void {
    this.isRunning = false;
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  private scheduleDeviceTick(deviceId: string): void {
    if (!this.isRunning) return;

    const delayMs = 1000 + Math.floor(Math.random() * 2000);
    const timer = setTimeout(() => {
      this.tickDevice(deviceId);
      this.scheduleDeviceTick(deviceId);
    }, delayMs);

    this.timers.set(deviceId, timer);
  }

  private tickDevice(deviceId: string): void {
    const current = this.store.getById(deviceId);
    if (!current) return;

    if (current.status === 'offline') {
      return;
    }

    const batteryDrain = Math.random() < 0.05 ? 1 : 0;
    const nextBattery = Math.max(5, current.battery - batteryDrain);

    const tempDelta = Number(((Math.random() - 0.5) * 0.4).toFixed(1));
    const nextTemp = Math.min(38, Math.max(18, Number((current.temperature + tempDelta).toFixed(1))));

    const signalDelta = Math.floor((Math.random() - 0.5) * 6);
    const nextSignal = Math.min(100, Math.max(30, current.signalStrength + signalDelta));

    let updated = this.store.update(deviceId, {
      battery: nextBattery,
      temperature: nextTemp,
      signalStrength: nextSignal,
    });

    if (!updated) return;

    const roll = Math.random();
    if (roll < 0.003) {
      this.applySimulationEvent(deviceId, 'urgent_alarm');
      return;
    } else if (roll < 0.007) {
      this.applySimulationEvent(deviceId, 'technical_fault');
      return;
    } else if (roll < 0.010) {
      this.applySimulationEvent(deviceId, 'disconnect');
      return;
    }

    this.onDeviceUpdated?.({
      id: updated.id,
      version: updated.version,
      timestamp: updated.lastSeen,
      device: updated,
    });
  }

  applySimulationEvent(deviceId: string, eventType: SimulationEventType): Device | undefined {
    const current = this.store.getById(deviceId);
    if (!current) return undefined;

    let patch: Partial<Device> = {};

    switch (eventType) {
      case 'urgent_alarm': {
        patch = { urgentAlarm: true, priority: 'urgent' };
        const updated = this.store.update(deviceId, patch);
        if (!updated) return undefined;

        const alert = this.store.addAlert(deviceId, 'urgent', `Fire alarm condition detected at ${current.buildingName}`);
        this.onAlertCreated?.(alert);
        this.emitDeviceUpdate(updated);
        return updated;
      }

      case 'technical_fault': {
        patch = { hasFaults: true, priority: current.urgentAlarm ? 'urgent' : 'warning' };
        const updated = this.store.update(deviceId, patch);
        if (!updated) return undefined;

        const alert = this.store.addAlert(deviceId, 'warning', `Sensor loop line fault on ${current.name}`);
        this.onAlertCreated?.(alert);
        this.emitDeviceUpdate(updated);
        return updated;
      }

      case 'power_failure': {
        patch = { acPower: false, priority: current.urgentAlarm ? 'urgent' : 'warning' };
        const updated = this.store.update(deviceId, patch);
        if (!updated) return undefined;

        const alert = this.store.addAlert(deviceId, 'warning', `Main AC line power lost on ${current.name}`);
        this.onAlertCreated?.(alert);
        this.emitDeviceUpdate(updated);
        return updated;
      }

      case 'disconnect': {
        patch = { status: 'offline' };
        const updated = this.store.update(deviceId, patch);
        if (!updated) return undefined;

        this.onDeviceDisconnected?.({
          id: updated.id,
          version: updated.version,
          timestamp: updated.lastSeen,
        });
        this.emitDeviceUpdate(updated);
        return updated;
      }

      case 'reconnect': {
        patch = { status: 'online' };
        const updated = this.store.update(deviceId, patch);
        if (!updated) return undefined;

        this.onDeviceConnected?.({
          id: updated.id,
          version: updated.version,
          timestamp: updated.lastSeen,
        });
        this.emitDeviceUpdate(updated);
        return updated;
      }

      case 'resolve_alarm': {
        patch = {
          urgentAlarm: false,
          hasFaults: false,
          acPower: true,
          priority: 'normal',
        };
        const updated = this.store.update(deviceId, patch);
        if (!updated) return undefined;

        const resolvedAlerts = this.store.resolveAlertsForDevice(deviceId);
        for (const alert of resolvedAlerts) {
          this.onAlertResolved?.({
            id: alert.id,
            deviceId: alert.deviceId,
            timestamp: alert.resolvedAt || new Date().toISOString(),
          });
        }
        this.emitDeviceUpdate(updated);
        return updated;
      }

      default:
        return undefined;
    }
  }

  private emitDeviceUpdate(device: Device): void {
    this.onDeviceUpdated?.({
      id: device.id,
      version: device.version,
      timestamp: device.lastSeen,
      device,
    });
  }
}
