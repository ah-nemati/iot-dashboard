import { Router, Request, Response } from 'express';
import { DeviceStore } from '../store/deviceStore.js';
import { SimulationEngine } from '../simulator/engine.js';
import { SimulationEventType } from '../shared/types.js';

const VALID_EVENT_TYPES: Set<SimulationEventType> = new Set([
  'urgent_alarm',
  'technical_fault',
  'power_failure',
  'disconnect',
  'reconnect',
  'resolve_alarm',
]);

export function createApiRouter(store: DeviceStore, simulator: SimulationEngine): Router {
  const router = Router();

  router.get('/devices', (_req: Request, res: Response) => {
    res.json(store.getAll());
  });

  router.get('/devices/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const device = store.getById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(device);
  });

  router.get('/dashboard/summary', (_req: Request, res: Response) => {
    res.json(store.getSummary());
  });

  router.get('/alerts', (_req: Request, res: Response) => {
    res.json(store.getAlerts());
  });

  router.post('/devices/:id/simulate', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { eventType } = req.body;

    if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
      res.status(400).json({
        error: 'Invalid or missing eventType',
        validTypes: Array.from(VALID_EVENT_TYPES),
      });
      return;
    }

    const device = store.getById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const updated = simulator.applySimulationEvent(id, eventType);
    res.json({ success: true, device: updated });
  });

  return router;
}
