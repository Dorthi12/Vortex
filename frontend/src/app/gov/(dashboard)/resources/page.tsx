'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore, Resource } from '@/store/useGovStore';
import {
  Package, AlertTriangle, CheckCircle, Clock, Plus, BarChart2,
  Sliders, Search, Filter, ShieldAlert, Truck, ChevronRight
} from 'lucide-react';

const CATEGORIES = ['All', 'Food', 'Water', 'Medical', 'Vehicles', 'Personnel', 'Shelters', 'Funds', 'Equipment'];

export default function GovResourcesPage() {
  const router = useRouter();
  const isGovAuthenticated = useGovStore(s => s.isGovAuthenticated);
  const resources = useGovStore(s => s.resources);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [criticalityFilter, setCriticalityFilter] = useState('All');

  // Allocate state
  const [allocatingItem, setAllocatingItem] = useState<Resource | null>(null);
  const [allocateQty, setAllocateQty] = useState(0);
  const [allocateDist, setAllocateDist] = useState('');
  const [showAllocateModal, setShowAllocateModal] = useState(false);

  useEffect(() => {
    if (!isGovAuthenticated) {
      router.replace('/gov/login');
    }
  }, [isGovAuthenticated, router]);

  if (!isGovAuthenticated) {
    return null;
  }

  // Filtered resources
  const filteredResources = resources.filter(res => {
    const matchesCategory = activeCategory === 'All' || res.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || res.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = districtFilter === 'All' || res.district.toLowerCase() === districtFilter.toLowerCase();
    const matchesCriticality = criticalityFilter === 'All' || res.criticality === criticalityFilter;
    return matchesCategory && matchesSearch && matchesDistrict && matchesCriticality;
  });

  // Unique districts
  const districts = ['All', ...Array.from(new Set(resources.map(r => r.district)))];

  // KPI Calculations
  const totalTracked = resources.length;
  const criticalCount = resources.filter(r => r.criticality === 'Critical').length;
  const totalStockVal = resources.reduce((acc, r) => acc + (r.category !== 'Funds' ? r.totalStock : 0), 0);
  const totalAllocatedVal = resources.reduce((acc, r) => acc + (r.category !== 'Funds' ? r.allocated : 0), 0);
  const allocationPercentage = totalStockVal > 0 ? Math.round((totalAllocatedVal / totalStockVal) * 100) : 0;
  const pendingRequests = 14; // Mocked KPI

  const getCriticalityColor = (crit: string) => {
    switch (crit) {
      case 'Critical': return 'text-red-400 bg-red-950/40 border border-red-800/40';
      case 'High': return 'text-orange-400 bg-orange-950/40 border border-orange-800/40';
      default: return 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40';
    }
  };

  const getRowBg = (crit: string) => {
    switch (crit) {
      case 'Critical': return 'bg-red-950/10 hover:bg-red-950/15 border-l-2 border-l-red-500';
      case 'High': return 'bg-orange-950/5 hover:bg-orange-950/10 border-l-2 border-l-orange-500';
      default: return 'hover:bg-[#121E3D]/30 border-l-2 border-l-transparent';
    }
  };

  const openAllocate = (item: Resource) => {
    setAllocatingItem(item);
    setAllocateQty(Math.floor(item.available * 0.1));
    setAllocateDist(item.district);
    setShowAllocateModal(true);
  };

  const submitAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingItem) return;
    // Update local state or mock
    alert(`Successfully allocated ${allocateQty} ${allocatingItem.unit} of ${allocatingItem.name} to ${allocateDist}.`);
    setShowAllocateModal(false);
    setAllocatingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center">
            <Package className="mr-2.5 text-[#D4AF37]" size={24} />
            Resource Allocation &amp; Inventory Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time tracking, mobilization, and critical reserves auditing for disaster relief operations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3.5 py-2 bg-[#1C39BB] hover:bg-[#244bd5] border border-[#1C39BB] text-xs font-bold text-white rounded-lg transition-colors flex items-center space-x-1.5">
            <Plus size={14} />
            <span>Register New Resource</span>
          </button>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 shadow-md flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-[#121E3D] text-[#D4AF37] border border-[#1A2744]">
            <Package size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Total Resources Tracked</span>
            <span className="text-lg font-bold text-white block mt-0.5">{totalTracked} Category Types</span>
          </div>
        </div>

        <div className="bg-[#0A1228] border border-red-950/50 rounded-xl p-4 shadow-md flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-red-950/30 text-red-400 border border-red-900/30">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Critical Stock Levels</span>
            <span className="text-lg font-bold text-red-400 block mt-0.5">{criticalCount} Items Alerting</span>
          </div>
        </div>

        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 shadow-md flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-[#121E3D] text-[#1C39BB] border border-[#1A2744]">
            <BarChart2 size={20} className="text-indigo-400" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Allocated Reserves</span>
            <span className="text-lg font-bold text-white block mt-0.5">{allocationPercentage}% Utilized</span>
          </div>
        </div>

        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 shadow-md flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-[#121E3D] text-amber-500 border border-[#1A2744]">
            <Truck size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Pending Requests</span>
            <span className="text-lg font-bold text-amber-500 block mt-0.5">{pendingRequests} Transports</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex overflow-x-auto pb-1 gap-1.5 scrollbar-thin border-b border-[#1A2744]">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'border-[#D4AF37] text-white bg-[#121E3D]/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT SPLIT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT 3/4: Inventory Table */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources by name or code..."
                className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center space-x-1.5 bg-[#070D1A] border border-[#1A2744] rounded-lg px-2.5 py-1">
                <span className="text-[10px] text-slate-500">District:</span>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-semibold outline-none cursor-pointer"
                >
                  {districts.map(d => (
                    <option key={d} value={d} className="bg-[#0A1228]">{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-[#070D1A] border border-[#1A2744] rounded-lg px-2.5 py-1">
                <span className="text-[10px] text-slate-500">Criticality:</span>
                <select
                  value={criticalityFilter}
                  onChange={(e) => setCriticalityFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 font-semibold outline-none cursor-pointer"
                >
                  <option value="All" className="bg-[#0A1228]">All Levels</option>
                  <option value="Critical" className="bg-[#0A1228]">Critical</option>
                  <option value="High" className="bg-[#0A1228]">High</option>
                  <option value="Normal" className="bg-[#0A1228]">Normal</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A2744] bg-[#070D1A]/55 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4">Resource</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Total Stock</th>
                    <th className="py-3.5 px-4 text-right">Allocated</th>
                    <th className="py-3.5 px-4 text-right">Available</th>
                    <th className="py-3.5 px-4">District</th>
                    <th className="py-3.5 px-4 text-center">Criticality</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2744]/40 text-xs">
                  {filteredResources.length > 0 ? (
                    filteredResources.map(res => (
                      <tr key={res.id} className={`transition-colors ${getRowBg(res.criticality)}`}>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{res.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{res.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#121E3D] border border-[#1A2744] text-[10px] font-semibold text-slate-300">
                            {res.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-medium">
                          {res.category === 'Funds' ? `₹${res.totalStock.toLocaleString('en-IN')}` : `${res.totalStock.toLocaleString('en-IN')} ${res.unit}`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                          {res.category === 'Funds' ? `₹${res.allocated.toLocaleString('en-IN')}` : `${res.allocated.toLocaleString('en-IN')} ${res.unit}`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#D4AF37] font-semibold">
                          {res.category === 'Funds' ? `₹${res.available.toLocaleString('en-IN')}` : `${res.available.toLocaleString('en-IN')} ${res.unit}`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">{res.district}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getCriticalityColor(res.criticality)}`}>
                            {res.criticality}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => openAllocate(res)}
                              disabled={res.available === 0}
                              className="px-2.5 py-1 bg-[#121E3D] hover:bg-[#1C39BB]/30 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white border border-[#1A2744] rounded text-[10px] font-semibold transition-colors"
                            >
                              Allocate
                            </button>
                            <button className="px-2.5 py-1 bg-[#070D1A] hover:bg-[#121E3D] text-slate-400 hover:text-slate-200 border border-[#1A2744]/70 rounded text-[10px] font-semibold transition-colors">
                              Track
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                        No resources match selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT 1/4: Allocation Stats & Warnings Panel */}
        <div className="space-y-6">
          
          {/* ALLOCATION GAUGES */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center">
              <Sliders size={14} className="mr-2 text-[#D4AF37]" />
              Reserves Utilization
            </h2>
            
            <div className="space-y-4">
              {resources.filter(r => r.category !== 'Funds').slice(0, 5).map(res => {
                const pct = Math.round((res.allocated / res.totalStock) * 100);
                return (
                  <div key={res.id} className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="font-semibold">{res.name}</span>
                      <span className="font-mono text-[#D4AF37]">{pct}%</span>
                    </div>
                    <div className="w-full bg-[#070D1A] rounded-full h-1.5 border border-[#1A2744]/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          res.criticality === 'Critical' ? 'bg-red-500' : res.criticality === 'High' ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRITICAL WARNINGS */}
          <div className="bg-[#0A1228] border border-red-950/60 rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider border-b border-red-950/30 pb-2 mb-3 flex items-center">
              <AlertTriangle size={14} className="mr-2 text-red-400" />
              Depletion Warnings
            </h2>
            
            <div className="space-y-3">
              {resources.filter(r => r.criticality === 'Critical').map(res => (
                <div key={res.id} className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-xs">
                  <div className="flex justify-between font-semibold text-red-300">
                    <span>{res.name}</span>
                    <span className="font-mono">{Math.round((res.available / res.totalStock) * 100)}% Left</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Current stock level at {res.available.toLocaleString()} {res.unit} in {res.district}.
                  </p>
                </div>
              ))}
            </div>

            {/* FORECAST ALERT */}
            <div className="mt-4 p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs">
              <div className="font-bold text-amber-400 flex items-center mb-1">
                <Clock size={12} className="mr-1.5 animate-pulse" />
                AI Shortage Forecast
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Oxygen cylinders projected to reach critical in <span className="text-[#D4AF37] font-bold">4 hours</span> at current usage rate in Mumbai.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ── ALLOCATION MODAL ── */}
      {showAllocateModal && allocatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#1A2744] flex justify-between items-center bg-[#070D1A]/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                <Truck size={16} className="mr-2 text-[#D4AF37]" />
                Resource Allocation
              </h3>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={submitAllocation} className="p-5 space-y-4">
              <div className="p-3 bg-[#070D1A] rounded-lg border border-[#1A2744]/75 text-xs text-slate-300 space-y-1.5">
                <div>Resource: <span className="text-white font-bold">{allocatingItem.name}</span></div>
                <div>Category: <span className="text-slate-400">{allocatingItem.category}</span></div>
                <div>Available: <span className="text-emerald-400 font-mono font-bold">{allocatingItem.available} {allocatingItem.unit}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Quantity to Allocate</label>
                <input
                  type="number"
                  min={1}
                  max={allocatingItem.available}
                  value={allocateQty}
                  onChange={(e) => setAllocateQty(Number(e.target.value))}
                  className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#D4AF37] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Destination District</label>
                <input
                  type="text"
                  value={allocateDist}
                  onChange={(e) => setAllocateDist(e.target.value)}
                  className="w-full bg-[#070D1A] border border-[#1A2744] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 bg-transparent hover:bg-slate-900 border border-[#1A2744] rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1C39BB] hover:bg-[#244bd5] text-xs font-bold text-white rounded-lg transition-colors"
                >
                  Approve Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
