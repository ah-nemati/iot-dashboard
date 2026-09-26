import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { Device } from '../shared/types.js';

interface DeviceMapProps {
  onSelectDevice: (deviceId: string) => void;
}

function createMarkerIcon(device: Device) {
  let color = 'bg-emerald-500 border-white';
  let badge = '';

  if (device.status === 'offline') {
    color = 'bg-slate-500 border-slate-300';
    badge = 'off';
  } else if (device.urgentAlarm || device.priority === 'urgent') {
    color = 'bg-rose-500 border-white ring-4 ring-rose-500/40 animate-pulse';
    badge = '!';
  } else if (device.hasFaults || device.priority === 'warning') {
    color = 'bg-amber-500 border-white';
    badge = '▲';
  }

  const html = `
    <div class="flex items-center justify-center w-6 h-6 rounded-full shadow-lg ${color} text-white font-bold text-[10px] border-2">
      ${badge}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

export const DeviceMap: React.FC<DeviceMapProps> = ({ onSelectDevice }) => {
  const devices = useDeviceStore((state) => state.devices);
  const deviceList = Object.values(devices);

  const center: [number, number] = [50.1130, 8.6850];

  return (
    <div className="h-[460px] w-full rounded-xl overflow-hidden border border-slate-700/60 bg-slate-800/40 relative">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {deviceList.map((dev) => (
          <Marker
            key={dev.id}
            position={[dev.latitude, dev.longitude]}
            icon={createMarkerIcon(dev)}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-850">
                <p className="font-bold text-xs">{dev.name}</p>
                <p className="text-[11px] text-slate-600 font-mono">{dev.id} • {dev.buildingName}</p>
                <div className="mt-1 text-[11px] flex gap-2">
                  <span>Status: <b>{dev.status}</b></span>
                  <span>Battery: <b>{dev.battery}%</b></span>
                </div>
                <button
                  onClick={() => onSelectDevice(dev.id)}
                  className="mt-2 w-full py-1 bg-indigo-600 text-white text-[11px] font-medium rounded hover:bg-indigo-700"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
