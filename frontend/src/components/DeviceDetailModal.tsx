import React, { useState } from 'react';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { SimulationEventType } from '../shared/types.js';
import {
  X,
  Battery,
  Wifi,
  Thermometer,
  Zap,
  ZapOff,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DeviceDetailModalProps {
  deviceId: string;
  onClose: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ deviceId, onClose }) => {
  const device = useDeviceStore((state) => state.devices[deviceId]);
  const history = useDeviceStore((state) => state.telemetryHistory[deviceId] || []);
  const [triggerLoading, setTriggerLoading] = useState(false);

  if (!device) return null;

  const triggerSimulate = async (eventType: SimulationEventType) => {
    setTriggerLoading(true);
    try {
      await fetch(`/api/devices/${deviceId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType }),
      });
    } catch {
      // ignore
    } finally {
      setTriggerLoading(false);
    }
  };

  const formattedChartData = history.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    battery: pt.battery,
    temperature: pt.temperature,
    signal: pt.signalStrength,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">{device.name}</h2>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {device.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{device.buildingName} • Seq #{device.version}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Battery className="w-4 h-4" />
                <span>Battery</span>
              </div>
              <p className="text-lg font-bold text-white">{device.battery}%</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Thermometer className="w-4 h-4" />
                <span>Temperature</span>
              </div>
              <p className="text-lg font-bold text-white">{device.temperature}°C</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Wifi className="w-4 h-4" />
                <span>Signal</span>
              </div>
              <p className="text-lg font-bold text-white">{device.signalStrength}%</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                {device.acPower ? <Zap className="w-4 h-4 text-emerald-400" /> : <ZapOff className="w-4 h-4 text-amber-400" />}
                <span>AC Line</span>
              </div>
              <p className={`text-lg font-bold ${device.acPower ? 'text-emerald-400' : 'text-amber-400'}`}>
                {device.acPower ? 'Online' : 'Failure'}
              </p>
            </div>
          </div>

          {/* Active conditions */}
          <div className="flex flex-wrap gap-2">
            {device.urgentAlarm && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Fire alarm condition active</span>
              </div>
            )}
            {device.hasFaults && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Technical fault reported</span>
              </div>
            )}
            {device.status === 'offline' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
                <span>Gateway communication offline (telemetry frozen)</span>
              </div>
            )}
            {!device.urgentAlarm && !device.hasFaults && device.status === 'online' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Operating within normal parameters</span>
              </div>
            )}
          </div>

          {/* Live Chart */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Real-Time Telemetry Trend (Last 50 points)
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-0.5 bg-indigo-400 inline-block" />
                  Battery (%)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
                  Temperature (°C)
                </span>
              </div>
            </div>

            <div className="h-52 w-full">
              {formattedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="battery"
                      stroke="#818cf8"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Awaiting telemetry samples...
                </div>
              )}
            </div>
          </div>

          {/* Test Simulator Controls */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Simulation Triggers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                disabled={triggerLoading}
                onClick={() => triggerSimulate('urgent_alarm')}
                className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Flame className="w-3.5 h-3.5" />
                Fire Alarm
              </button>

              <button
                disabled={triggerLoading}
                onClick={() => triggerSimulate('technical_fault')}
                className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Line Fault
              </button>

              <button
                disabled={triggerLoading}
                onClick={() => triggerSimulate('power_failure')}
                className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <ZapOff className="w-3.5 h-3.5" />
                Power Cut
              </button>

              <button
                disabled={triggerLoading}
                onClick={() =>
                  triggerSimulate(device.status === 'online' ? 'disconnect' : 'reconnect')
                }
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {device.status === 'online' ? 'Disconnect' : 'Reconnect'}
              </button>

              <button
                disabled={triggerLoading}
                onClick={() => triggerSimulate('resolve_alarm')}
                className="col-span-2 sm:col-span-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve All Issues
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
