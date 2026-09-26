import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './shared/types.js';
import { SimulationEngine } from './simulator/engine.js';
import { DeviceStore } from './store/deviceStore.js';

export function setupSocketServer(
  httpServer: HttpServer,
  store: DeviceStore,
  simulator: SimulationEngine
): Server<ClientToServerEvents, ServerToClientEvents> {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  simulator.onDeviceUpdated = (payload) => {
    io.emit('device:updated', payload);
  };

  simulator.onDeviceDisconnected = (payload) => {
    io.emit('device:disconnected', payload);
  };

  simulator.onDeviceConnected = (payload) => {
    io.emit('device:connected', payload);
  };

  simulator.onAlertCreated = (alert) => {
    io.emit('alert:created', {
      id: alert.id,
      deviceId: alert.deviceId,
      priority: alert.priority,
      message: alert.message,
      timestamp: alert.timestamp,
    });
  };

  simulator.onAlertResolved = (payload) => {
    io.emit('alert:resolved', payload);
  };

  io.on('connection', (socket: Socket) => {
    socket.on('disconnect', () => {
    });
  });

  return io;
}
