import express, { Express } from 'express';
import cors from 'cors';
import { createApiRouter } from './routes/api.js';
import { DeviceStore } from './store/deviceStore.js';
import { SimulationEngine } from './simulator/engine.js';

export function createApp(store: DeviceStore, simulator: SimulationEngine): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', createApiRouter(store, simulator));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
