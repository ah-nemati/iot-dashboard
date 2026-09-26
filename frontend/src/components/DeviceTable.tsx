import React, { useState, useMemo } from 'react';
import { useDeviceStore, selectFilteredDevices, FilterOptions } from '../store/useDeviceStore.js';
import { Device, DevicePriority, DeviceStatus } from '../shared/types.js';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Battery, Wifi, ShieldAlert, Eye } from 'lucide-react';

interface DeviceTableProps {
  onSelectDevice: (deviceId: string) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({ onSelectDevice }) => {
  const devices = useDeviceStore((state) => state.devices);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | DevicePriority>('all');
  const [sortBy, setSortBy] = useState<'lastSeen' | 'id' | 'battery' | 'signalStrength'>('lastSeen');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filterOptions: FilterOptions = useMemo(
    () => ({
      search,
      statusFilter,
      priorityFilter,
      sortBy,
      sortOrder,
    }),
    [search, statusFilter, priorityFilter, sortBy, sortOrder]
  );

  const filteredDevices = useMemo(
    () => selectFilteredDevices(devices, filterOptions),
    [devices, filterOptions]
  );

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedDevices = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredDevices.slice(start, start + pageSize);
  }, [filteredDevices, validCurrentPage, pageSize]);

  const toggleSort = (field: 'lastSeen' | 'id' | 'battery' | 'signalStrength') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderPriorityBadge = (priority: DevicePriority, urgentAlarm: boolean) => {
    if (urgentAlarm || priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
          <ShieldAlert className="w-3 h-3" />
          Urgent
        </span>
      );
    }
    if (priority === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300">
        Normal
      </span>
    );
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Controls */}
      <div className="p-4 border-b border-slate-700/60 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gateway ID, name, or building..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            data-testid="device-search-input"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | DeviceStatus);
              setCurrentPage(1);
            }}
            data-testid="status-filter"
            aria-label="Filter by status"
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as 'all' | DevicePriority);
              setCurrentPage(1);
            }}
            data-testid="priority-filter"
            aria-label="Filter by priority"
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/40 border-b border-slate-700/60 text-slate-400 font-medium select-none">
              <th className="py-3 px-4">Status</th>
              <th
                onClick={() => toggleSort('id')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Gateway</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Building</th>
              <th className="py-3 px-4">Priority</th>
              <th
                onClick={() => toggleSort('battery')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Battery</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('signalStrength')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Signal</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('lastSeen')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Last Seen</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {paginatedDevices.map((dev) => {
              const isUrgent = dev.urgentAlarm || dev.priority === 'urgent';
              return (
                <tr
                  key={dev.id}
                  data-testid={`device-row-${dev.id}`}
                  className={`hover:bg-slate-700/30 transition-colors ${
                    isUrgent ? 'bg-rose-950/20 border-l-4 border-l-rose-500' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dev.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                      <span className={dev.status === 'online' ? 'text-emerald-400' : 'text-slate-400'}>
                        {dev.status}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">
                    <div>{dev.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{dev.id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{dev.buildingName}</td>
                  <td className="py-3 px-4">{renderPriorityBadge(dev.priority, dev.urgentAlarm)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-3.5 h-3.5 ${dev.battery < 20 ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className={dev.battery < 20 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                        {dev.battery}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-300">{dev.signalStrength}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(dev.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectDevice(dev.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginatedDevices.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No devices match the active filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-700/60 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {filteredDevices.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(validCurrentPage * pageSize, filteredDevices.length)} of {filteredDevices.length} gateways
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            className="p-1 rounded border border-slate-700 bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {validCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            className="p-1 rounded border border-slate-700 bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
