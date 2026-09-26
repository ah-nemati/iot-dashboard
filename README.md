# IoT Operations Dashboard

A real-time monitoring dashboard for IoT gateways connected to Fire Alarm Control Panels (FCPs), with an in-memory simulation backend.

## Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- (Optional) Docker and Docker Compose

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Start both services:
   ```bash
   # Terminal 1 - Backend (port 4000)
   npm run dev --prefix backend

   # Terminal 2 - Frontend (port 3000)
   npm run dev --prefix frontend
   ```

3. Open `http://localhost:3000` in your browser.

### Docker

```bash
docker compose up --build
```
Access the application at `http://localhost:3000`.

## Environment Variables

| Variable | Service | Default | Description |
|---|---|---|---|
| `PORT` | Backend | `4000` | HTTP and WebSocket server port |
| `VITE_WS_URL` | Frontend | `window.location.origin` | WebSocket server URL |

## REST API

- `GET /api/devices`: List all simulated gateways (120 seeded gateways).
- `GET /api/devices/:id`: Fetch single gateway details.
- `GET /api/dashboard/summary`: Aggregate counts (total, online, offline, urgent alarms, faults).
- `GET /api/alerts`: List active and resolved alerts.
- `POST /api/devices/:id/simulate`: Trigger manual simulation event.
  - Body: `{ "eventType": "urgent_alarm" | "technical_fault" | "power_failure" | "disconnect" | "reconnect" | "resolve_alarm" }`

## WebSocket Events

- `device:updated`: Emitted on telemetry drift or state mutation.
- `device:disconnected`: Emitted when gateway loses connectivity.
- `device:connected`: Emitted when gateway reconnects.
- `alert:created`: Emitted when alarm or fault condition occurs.
- `alert:resolved`: Emitted when alarm condition is cleared.

## Architecture Notes

- **Version compare-and-set guard**: Every device mutation increments a monotonic `version` counter. The frontend Zustand store drops incoming socket events where `incoming.version <= current.version` to prevent out-of-order race conditions.
- **Offline telemetry freeze**: When a device status transitions to `offline`, telemetry drift is bypassed entirely until a reconnect event occurs.
- **State reconciliation**: Upon socket reconnection, the client automatically re-fetches authoritative state (`/api/devices` and `/api/alerts`) to reconcile missed events.
- **Singleton socket**: The socket connection lives at module level to prevent duplicate connections during React component remounts.
- **Ring buffer**: Telemetry charts maintain a bounded history buffer (50 data points per device) to prevent memory leaks during extended operation.

## Testing

Run tests across both workspaces:

```bash
# Backend tests (API endpoints and simulator rules)
npm test --prefix backend

# Frontend tests (version guard, KPI counts, search/filter, resync)
npm test --prefix frontend
```

All 5 required assessment test suites are implemented and verified.

## Known Limitations & Backlog

- Virtualization: Current implementation uses table pagination (15 items/page) which performs well with hundreds of gateways. True DOM windowing (e.g. `@tanstack/react-virtual`) is planned for 1,000+ device loads.
- Persistence: Device and alert states are stored in-memory and reset on backend restart.
- Multi-tier escalation: Basic alert resolution is supported; formal multi-tier operator acknowledgement workflow is tracked in `BACKLOG.md`.

## Time Spent

Total time: ~13 hours (backend simulation & API: 4.5h, frontend dashboard & real-time store: 5.5h, test suites: 2h, docker & documentation: 1h).
