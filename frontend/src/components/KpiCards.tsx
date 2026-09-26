import React from 'react';
import { useDeviceStore, selectSummary } from '../store/useDeviceStore.js';
import { Radio, AlertTriangle, Flame, Wrench } from 'lucide-react';

export const KpiCards: React.FC = () => {
  const summary = useDeviceStore(selectSummary);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Gateways</p>
          <p className="text-2xl font-bold text-white mt-1" data-testid="kpi-total">{summary.total}</p>
          <p className="text-xs text-slate-400 mt-1">{summary.offline} offline</p>
        </div>
        <div className="p-3 bg-slate-700/40 rounded-lg text-slate-300">
          <Radio className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Online Devices</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1" data-testid="kpi-online">{summary.online}</p>
          <p className="text-xs text-slate-400 mt-1">
            {summary.total > 0 ? Math.round((summary.online / summary.total) * 100) : 0}% fleet availability
          </p>
        </div>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
          <Radio className="w-6 h-6" />
        </div>
      </div>

      <div
        className={`bg-slate-800/60 border rounded-xl p-4 flex items-center justify-between transition-colors ${
          summary.urgentAlarms > 0
            ? 'border-rose-500/50 bg-rose-950/20'
            : 'border-slate-700/60'
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Urgent Alarms</p>
          <p className="text-2xl font-bold text-rose-400 mt-1" data-testid="kpi-urgent">{summary.urgentAlarms}</p>
          <p className="text-xs text-slate-400 mt-1">Active fire conditions</p>
        </div>
        <div
          className={`p-3 rounded-lg ${
            summary.urgentAlarms > 0
              ? 'bg-rose-500/20 text-rose-400 animate-pulse'
              : 'bg-slate-700/40 text-slate-400'
          }`}
        >
          <Flame className="w-6 h-6" />
        </div>
      </div>

      <div
        className={`bg-slate-800/60 border rounded-xl p-4 flex items-center justify-between transition-colors ${
          summary.technicalFaults > 0
            ? 'border-amber-500/50 bg-amber-950/20'
            : 'border-slate-700/60'
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Technical Faults</p>
          <p className="text-2xl font-bold text-amber-400 mt-1" data-testid="kpi-faults">{summary.technicalFaults}</p>
          <p className="text-xs text-slate-400 mt-1">Loop or power anomalies</p>
        </div>
        <div
          className={`p-3 rounded-lg ${
            summary.technicalFaults > 0
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-slate-700/40 text-slate-400'
          }`}
        >
          <Wrench className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
