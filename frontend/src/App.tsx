import React, { useEffect, useState } from 'react';
import { useDeviceStore } from './store/useDeviceStore.js';
import { connectSocket, disconnectSocket } from './services/socket.js';
import { Navbar } from './components/Navbar.js';
import { KpiCards } from './components/KpiCards.js';
import { DeviceTable } from './components/DeviceTable.js';
import { DeviceDetailModal } from './components/DeviceDetailModal.js';
import { AlertDrawer } from './components/AlertDrawer.js';
import { DeviceMap } from './components/DeviceMap.js';
import { LayoutGrid, MapPin } from 'lucide-react';

export const App: React.FC = () => {
  const alerts = useDeviceStore((state) => state.alerts);
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const setSelectedDeviceId = useDeviceStore((state) => state.setSelectedDeviceId);

  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table');

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  const activeAlertCount = alerts.filter((a) => !a.resolvedAt).length;

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
    </div>
  );
};

export default App;
