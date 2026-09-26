import React, { useState } from 'react';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { Alert } from '../shared/types.js';
import { X, Flame, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDevice: (deviceId: string) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({ isOpen, onClose, onSelectDevice }) => {
  const alerts = useDeviceStore((state) => state.alerts);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'active') return !a.resolvedAt;
    if (filter === 'resolved') return !!a.resolvedAt;
    return true;
  });

  const handleResolve = async (deviceId: string) => {
    try {
      await fetch(`/api/devices/${deviceId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'resolve_alarm' }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
        <div>
          <h2 className="text-sm font-semibold text-white">Alert Log</h2>
          <p className="text-xs text-slate-400">Fire alarms & technical notifications</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-slate-800 flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'active'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'resolved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Resolved
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert: Alert) => {
            const isResolved = !!alert.resolvedAt;
            const isUrgent = alert.priority === 'urgent';

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs flex flex-col gap-2 transition-colors ${
                  isResolved
                    ? 'bg-slate-800/30 border-slate-800 text-slate-400'
                    : isUrgent
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isResolved ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isUrgent ? (
                      <Flame className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span>{alert.deviceId}</span>
                    <span className="font-mono text-[10px] opacity-75">{alert.id}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">{alert.message}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                  <button
                    onClick={() => {
                      onSelectDevice(alert.deviceId);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Inspect Gateway</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {!isResolved && (
                    <button
                      onClick={() => handleResolve(alert.deviceId)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-40 flex items-center justify-center text-xs text-slate-500">
            No {filter} alerts recorded.
          </div>
        )}
      </div>
    </div>
  );
};
