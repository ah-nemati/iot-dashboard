import React from 'react';
import { useDeviceStore } from '../store/useDeviceStore.js';
import { Activity, Bell, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  onToggleAlerts: () => void;
  activeAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleAlerts, activeAlertCount }) => {
  const connectionStatus = useDeviceStore((state) => state.connectionStatus);

  const statusBadge = {
    connected: {
      text: 'Connected',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      icon: <Wifi className="w-3.5 h-3.5" />,
    },
    reconnecting: {
      text: 'Reconnecting...',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
      dot: 'bg-amber-500',
      icon: <Wifi className="w-3.5 h-3.5" />,
    },
    disconnected: {
      text: 'Disconnected',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
      icon: <WifiOff className="w-3.5 h-3.5" />,
    },
  }[connectionStatus];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">IoT Operations Dashboard</h1>
          <p className="text-xs text-slate-400">Fire Alarm Control Panel Gateway Fleet</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          data-testid="connection-status"
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${statusBadge.bg}`}
        >
          <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
          {statusBadge.icon}
          <span>{statusBadge.text}</span>
        </div>

        <button
          onClick={onToggleAlerts}
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
        >
          <Bell className="w-4 h-4 text-slate-400" />
          <span>Alerts</span>
          {activeAlertCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {activeAlertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
