import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, DeviceEventPayload } from '../shared/types.js';
import { useDeviceStore } from '../store/useDeviceStore.js';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let updateQueue: DeviceEventPayload[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushDeviceUpdates() {
  batchTimer = null;
  if (updateQueue.length === 0) return;
  const batch = updateQueue;
  updateQueue = [];
  useDeviceStore.getState().batchUpdateDevices(batch);
}

function queueDeviceUpdate(payload: DeviceEventPayload) {
  updateQueue.push(payload);
  if (!batchTimer) {
    batchTimer = setTimeout(flushDeviceUpdates, 250);
  }
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const store = useDeviceStore.getState;

    socket.on('connect', () => {
      store().setConnectionStatus('connected');
      store().resyncWithServer();
    });

    socket.on('disconnect', () => {
      store().setConnectionStatus('disconnected');
    });

    socket.io.on('reconnect_attempt', () => {
      store().setConnectionStatus('reconnecting');
    });

    socket.on('device:updated', (payload) => {
      queueDeviceUpdate(payload);
    });

    socket.on('device:disconnected', (payload) => {
      store().setDeviceDisconnected(payload);
    });

    socket.on('device:connected', (payload) => {
      store().setDeviceConnected(payload);
    });

    socket.on('alert:created', (payload) => {
      store().addAlert({
        id: payload.id,
        deviceId: payload.deviceId,
        priority: payload.priority,
        message: payload.message,
        timestamp: payload.timestamp,
      });
    });

    socket.on('alert:resolved', (payload) => {
      store().resolveAlert(payload);
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}
