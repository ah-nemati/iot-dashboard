import React, { useEffect, useState } from 'react';
import { useDeviceStore } from './store/useDeviceStore.js';
import { connectSocket, disconnectSocket } from './services/socket.js';
import { Navbar } from './components/Navbar.js';
import { KpiCards } from './components/KpiCards.js';
import { DeviceTable } from './components/DeviceTable.js';
import { DeviceDetailModal } from './components/DeviceDetailModal.js';
import { AlertDrawer } from './components/AlertDrawer.js';
import { DeviceMap } from './components/DeviceMap.js';
import { LayoutGrid, MapPin, Flame } from 'lucide-react';

export const App: React.FC = () => {
  const alerts = useDeviceStore((state) => state.alerts);
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const setSelectedDeviceId = useDeviceStore((state) => state.setSelectedDeviceId);

  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table');
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null);

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  const activeAlertCount = alerts.filter((a) => !a.resolvedAt).length;
  const latestUrgentAlert = alerts.find((a) => !a.resolvedAt && a.priority === 'urgent');
  const showToast = latestUrgentAlert && latestUrgentAlert.id !== dismissedAlertId;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        onToggleAlerts={() => setIsAlertDrawerOpen((prev) => !prev)}
        activeAlertCount={activeAlertCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <KpiCards />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Gateways Table</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'map'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Facility Map</span>
            </button>
          </div>
        </div>

        {activeTab === 'table' ? (
          <DeviceTable onSelectDevice={(id) => setSelectedDeviceId(id)} />
        ) : (
          <DeviceMap onSelectDevice={(id) => setSelectedDeviceId(id)} />
        )}
      </main>

      {selectedDeviceId && (
        <DeviceDetailModal
          deviceId={selectedDeviceId}
          onClose={() => setSelectedDeviceId(null)}
        />
      )}

      <AlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        onSelectDevice={(id) => setSelectedDeviceId(id)}
      />

      {showToast && latestUrgentAlert && (
        <div
          data-testid="urgent-alarm-toast"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-rose-950/95 border border-rose-500/80 rounded-xl p-4 shadow-2xl text-xs flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-rose-200">Urgent Fire Alarm Activated</p>
            <p className="text-slate-300 mt-1 leading-relaxed">{latestUrgentAlert.message}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedDeviceId(latestUrgentAlert.deviceId);
                  setDismissedAlertId(latestUrgentAlert.id);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded transition-colors"
              >
                Inspect Gateway
              </button>
              <button
                onClick={() => setDismissedAlertId(latestUrgentAlert.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
