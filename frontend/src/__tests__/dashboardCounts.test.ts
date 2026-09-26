import { describe, it, expect, beforeEach } from 'vitest';
import { useDeviceStore, selectSummary } from '../store/useDeviceStore.js';
import { Device, Alert } from '../shared/types.js';

describe('Dashboard KPI counts across alarm creation and resolution', () => {
  beforeEach(() => {
    useDeviceStore.getState().resetStore();
  });

  const devices: Device[] = [
    {
      id: 'GW-0001',
      name: 'Gateway 1',
      buildingId: 'BLD-01',
      buildingName: 'Tower A',
      status: 'online',
      priority: 'normal',
      battery: 85,
      signalStrength: 90,
      temperature: 21,
      acPower: true,
      hasFaults: false,
      urgentAlarm: false,
      lastSeen: new Date().toISOString(),
      latitude: 50.1,
      longitude: 8.6,
      version: 1,
    },
    {
      id: 'GW-0002',
      name: 'Gateway 2',
      buildingId: 'BLD-01',
      buildingName: 'Tower A',
      status: 'online',
      priority: 'normal',
      battery: 92,
      signalStrength: 75,
      temperature: 22,
      acPower: true,
      hasFaults: false,
      urgentAlarm: false,
      lastSeen: new Date().toISOString(),
      latitude: 50.1,
      longitude: 8.6,
      version: 1,
    },
    {
      id: 'GW-0003',
      name: 'Gateway 3',
      buildingId: 'BLD-02',
      buildingName: 'Tower B',
      status: 'offline',
      priority: 'normal',
      battery: 70,
      signalStrength: 50,
      temperature: 20,
      acPower: true,
      hasFaults: false,
      urgentAlarm: false,
      lastSeen: new Date().toISOString(),
      latitude: 50.2,
      longitude: 8.7,
      version: 1,
    },
  ];

  it('accurately updates summary when alarms and faults are created and resolved', () => {
    const store = useDeviceStore.getState();
    store.setDevices(devices);

    const initialSummary = selectSummary(useDeviceStore.getState());
    expect(initialSummary.total).toBe(3);
    expect(initialSummary.online).toBe(2);
    expect(initialSummary.offline).toBe(1);
    expect(initialSummary.urgentAlarms).toBe(0);
    expect(initialSummary.technicalFaults).toBe(0);

    const urgentAlert: Alert = {
      id: 'ALT-1001',
      deviceId: 'GW-0001',
      priority: 'urgent',
      message: 'Smoke detector triggered',
      timestamp: new Date().toISOString(),
    };
    store.addAlert(urgentAlert);

    const summaryAfterUrgent = selectSummary(useDeviceStore.getState());
    expect(summaryAfterUrgent.urgentAlarms).toBe(1);
    expect(useDeviceStore.getState().devices['GW-0001'].urgentAlarm).toBe(true);

    const faultAlert: Alert = {
      id: 'ALT-1002',
      deviceId: 'GW-0002',
      priority: 'warning',
      message: 'Loop line short circuit',
      timestamp: new Date().toISOString(),
    };
    store.addAlert(faultAlert);

    const summaryAfterFault = selectSummary(useDeviceStore.getState());
    expect(summaryAfterFault.urgentAlarms).toBe(1);
    expect(summaryAfterFault.technicalFaults).toBe(1);

    store.resolveAlert({
      id: 'ALT-1001',
      deviceId: 'GW-0001',
      timestamp: new Date().toISOString(),
    });

    const summaryAfterUrgentResolve = selectSummary(useDeviceStore.getState());
    expect(summaryAfterUrgentResolve.urgentAlarms).toBe(0);
    expect(summaryAfterUrgentResolve.technicalFaults).toBe(1);
    expect(useDeviceStore.getState().devices['GW-0001'].urgentAlarm).toBe(false);

    store.resolveAlert({
      id: 'ALT-1002',
      deviceId: 'GW-0002',
      timestamp: new Date().toISOString(),
    });

    const finalSummary = selectSummary(useDeviceStore.getState());
    expect(finalSummary.urgentAlarms).toBe(0);
    expect(finalSummary.technicalFaults).toBe(0);
  });
});
