import { createServer } from 'http';
import { createApp } from './app.js';
import { setupSocketServer } from './socket.js';
import { deviceStore } from './store/deviceStore.js';
import { SimulationEngine } from './simulator/engine.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const simulator = new SimulationEngine(deviceStore);
const app = createApp(deviceStore, simulator);
const httpServer = createServer(app);

setupSocketServer(httpServer, deviceStore, simulator);
simulator.start();

httpServer.listen(PORT, () => {
  console.log(`IoT simulation backend listening on port ${PORT}`);
});
