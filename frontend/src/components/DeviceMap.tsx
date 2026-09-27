import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { Device } from '../shared/types.js';

interface DeviceMapProps {
  onSelectDevice: (deviceId: string) => void;
}

function createMarkerIcon(device: Device) {
  let bgColor = 'background: #10b981; border-color: #ffffff;';
  let badgeIcon = '●';
  let pulse = '';

  if (device.status === 'offline') {
    bgColor = 'background: #64748b; border-color: #cbd5e1;';
    badgeIcon = '✕';
  } else if (device.urgentAlarm || device.priority === 'urgent') {
    bgColor = 'background: #f43f5e; border-color: #ffffff;';
    badgeIcon = '⚡';
    pulse = 'box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.4); animation: pulse 1.5s infinite;';
  } else if (device.hasFaults || device.priority === 'warning') {
    bgColor = 'background: #f59e0b; border-color: #ffffff;';
    badgeIcon = '▲';
  }

  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; flex-direction: column; align-items: center;">
      <div style="${bgColor} ${pulse} width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
        ${badgeIcon}
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); color: #e2e8f0; font-size: 9px; font-weight: 600; padding: 1px 4px; border-radius: 4px; margin-top: 1px; white-space: nowrap; border: 1px solid #334155;">
        ${device.battery}%
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-iran-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 21],
    popupAnchor: [0, -22],
  });
}

export const DeviceMap: React.FC<DeviceMapProps> = ({ onSelectDevice }) => {
  const devices = useDeviceStore((state) => state.devices);
  const deviceList = Object.values(devices);

  const tehranCenter: [number, number] = [35.7350, 51.3800];

  return (
    <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-700/60 bg-slate-800/40 relative">
      <MapContainer
        center={tehranCenter}
        zoom={12}
        scrollWheelZoom={true}
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
            <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
              <div className="text-xs font-sans">
                <span className="font-bold">{dev.name}</span> ({dev.id})
                <br />
                <span className="text-slate-500">{dev.buildingName}</span>
                <br />
                <span>Status: <b>{dev.status}</b> | {dev.battery}% | {dev.temperature}°C</span>
              </div>
            </Tooltip>

            <Popup className="custom-popup" minWidth={240}>
              <div className="p-1 font-sans text-slate-800">
                <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-tight">{dev.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{dev.id} • {dev.buildingName}</p>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      dev.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {dev.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-3">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[9px] uppercase">Battery</span>
                    <span className="font-semibold text-slate-800">{dev.battery}%</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[9px] uppercase">Temperature</span>
                    <span className="font-semibold text-slate-800">{dev.temperature}°C</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[9px] uppercase">Signal</span>
                    <span className="font-semibold text-slate-800">{dev.signalStrength}%</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block text-[9px] uppercase">AC Line</span>
                    <span className={`font-semibold ${dev.acPower ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {dev.acPower ? 'Normal' : 'Power Fault'}
                    </span>
                  </div>
                </div>

                {dev.urgentAlarm && (
                  <div className="mb-2 p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold flex items-center gap-1">
                    <span>⚡ Fire Alarm Condition Active</span>
                  </div>
                )}

                {dev.hasFaults && !dev.urgentAlarm && (
                  <div className="mb-2 p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
                    <span>▲ Technical Loop Fault Reported</span>
                  </div>
                )}

                <button
                  onClick={() => onSelectDevice(dev.id)}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded transition-colors text-center"
                >
                  Inspect Gateway & History
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
