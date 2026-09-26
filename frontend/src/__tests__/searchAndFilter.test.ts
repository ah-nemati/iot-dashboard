import { describe, it, expect, beforeEach } from 'vitest';
import { useDeviceStore, selectFilteredDevices, FilterOptions } from '../store/useDeviceStore.js';
import { Device } from '../shared/types.js';

describe('Search and filtering behavior', () => {
  beforeEach(() => {
    useDeviceStore.getState().resetStore();
  });

  const sampleDevices: Device[] = [
    {
      id: 'GW-0010',
      name: 'Alpha Gateway',
      buildingId: 'BLD-01',
      buildingName: 'North Tower',
      status: 'online',
      priority: 'normal',
      battery: 95,
      signalStrength: 80,
      temperature: 22,
      acPower: true,
      hasFaults: false,
      urgentAlarm: false,
      lastSeen: '2026-09-26T12:00:00Z',
      latitude: 50.1,
      longitude: 8.6,
      version: 1,
    },
    {
      id: 'GW-0020',
      name: 'Beta Gateway',
      buildingId: 'BLD-02',
      buildingName: 'Innovation Hub',
      status: 'offline',
      priority: 'warning',
      battery: 40,
      signalStrength: 50,
      temperature: 24,
      acPower: false,
      hasFaults: true,
      urgentAlarm: false,
      lastSeen: '2026-09-26T12:05:00Z',
      latitude: 50.2,
      longitude: 8.7,
      version: 1,
    },
    {
      id: 'GW-0030',
      name: 'Gamma Gateway',
      buildingId: 'BLD-01',
      buildingName: 'North Tower',
      status: 'online',
      priority: 'urgent',
      battery: 80,
      signalStrength: 90,
      temperature: 28,
      acPower: true,
      hasFaults: false,
      urgentAlarm: true,
      lastSeen: '2026-09-26T12:10:00Z',
      latitude: 50.1,
      longitude: 8.6,
      version: 1,
    },
  ];

  it('filters by status and priority', () => {
    const store = useDeviceStore.getState();
    store.setDevices(sampleDevices);

    const baseFilter: FilterOptions = {
      search: '',
      statusFilter: 'all',
      priorityFilter: 'all',
      sortBy: 'lastSeen',
      sortOrder: 'desc',
    };

    const onlineOnly = selectFilteredDevices(useDeviceStore.getState().devices, {
      ...baseFilter,
      statusFilter: 'online',
    });
    expect(onlineOnly.length).toBe(2);
    expect(onlineOnly.map((d) => d.id)).toEqual(['GW-0030', 'GW-0010']);

    const urgentOnly = selectFilteredDevices(useDeviceStore.getState().devices, {
      ...baseFilter,
      priorityFilter: 'urgent',
    });
    expect(urgentOnly.length).toBe(1);
    expect(urgentOnly[0].id).toBe('GW-0030');
  });

  it('filters by search term (id, name, building)', () => {
    const store = useDeviceStore.getState();
    store.setDevices(sampleDevices);

    const baseFilter: FilterOptions = {
      search: 'beta',
      statusFilter: 'all',
      priorityFilter: 'all',
      sortBy: 'lastSeen',
      sortOrder: 'desc',
    };

    const byName = selectFilteredDevices(useDeviceStore.getState().devices, baseFilter);
    expect(byName.length).toBe(1);
    expect(byName[0].id).toBe('GW-0020');

    const byBuilding = selectFilteredDevices(useDeviceStore.getState().devices, {
      ...baseFilter,
      search: 'North Tower',
    });
    expect(byBuilding.length).toBe(2);
  });

  it('retains filter accuracy when underlying device map changes mid-filter', () => {
    const store = useDeviceStore.getState();
    store.setDevices(sampleDevices);

    const filter: FilterOptions = {
      search: 'North Tower',
      statusFilter: 'online',
      priorityFilter: 'all',
      sortBy: 'lastSeen',
      sortOrder: 'desc',
    };

    let result = selectFilteredDevices(useDeviceStore.getState().devices, filter);
    expect(result.length).toBe(2);

    store.updateDevice({
      ...sampleDevices[0],
      version: 2,
      status: 'offline',
    });

    result = selectFilteredDevices(useDeviceStore.getState().devices, filter);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('GW-0030');
  });
});
