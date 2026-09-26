import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { DeviceStore } from '../store/deviceStore.js';
import { SimulationEngine } from '../simulator/engine.js';

describe('Backend REST API', () => {
  let store: DeviceStore;
  let simulator: SimulationEngine;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new DeviceStore(10);
    simulator = new SimulationEngine(store);
    app = createApp(store, simulator);
  });

  it('GET /api/devices returns all seeded devices', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(10);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('status');
    expect(res.body[0]).toHaveProperty('version');
  });

  it('GET /api/devices/:id returns device for existing id', async () => {
    const devices = store.getAll();
    const target = devices[0];

    const res = await request(app).get(`/api/devices/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(target.id);
  });

  it('GET /api/devices/:id returns 404 for nonexistent id', async () => {
    const res = await request(app).get('/api/devices/GW-NONEXISTENT');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Device not found');
  });

  it('GET /api/dashboard/summary returns aggregate device counts', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', 10);
    expect(res.body).toHaveProperty('online');
    expect(res.body).toHaveProperty('offline');
    expect(res.body).toHaveProperty('urgentAlarms');
    expect(res.body).toHaveProperty('technicalFaults');
  });

  it('POST /api/devices/:id/simulate applies valid event', async () => {
    const devices = store.getAll();
    const target = devices[0];

    const res = await request(app)
      .post(`/api/devices/${target.id}/simulate`)
      .send({ eventType: 'urgent_alarm' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.device.urgentAlarm).toBe(true);
    expect(res.body.device.priority).toBe('urgent');
    expect(res.body.device.version).toBeGreaterThan(target.version);
  });

  it('POST /api/devices/:id/simulate returns 400 for invalid eventType', async () => {
    const devices = store.getAll();
    const target = devices[0];

    const res = await request(app)
      .post(`/api/devices/${target.id}/simulate`)
      .send({ eventType: 'invalid_event_type' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('validTypes');
  });

  it('POST /api/devices/:id/simulate returns 404 for unknown device', async () => {
    const res = await request(app)
      .post('/api/devices/GW-9999/simulate')
      .send({ eventType: 'disconnect' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Device not found');
  });
});
