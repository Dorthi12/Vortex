'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Thermometer, 
  AlertTriangle, 
  ArrowLeft, 
  Info, 
  Search, 
  Activity, 
  Users, 
  Clock, 
  MapPin, 
  Sparkles,
  Droplets
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface HeatWard {
  id: string;
  name: string;
  temp: number; // Celsius
  wetBulb: number; // Celsius
  risk: 'extreme' | 'danger' | 'caution' | 'normal';
  alerts: string;
}

const MOCK_HEAT_WARDS: HeatWard[] = [
  { id: 'hw-1', name: 'Hadapsar Industrial Zone', temp: 44.5, wetBulb: 29.8, risk: 'extreme', alerts: 'Extreme risk of thermal stroke. Mandatory halts for outdoor labor.' },
  { id: 'hw-2', name: 'Pune Cantonment Markets', temp: 42.8, wetBulb: 28.5, risk: 'danger', alerts: 'High heat stress. Advisory to operate mist fans and hydrate hourly.' },
  { id: 'hw-3', name: 'Shivajinagar Urban Area', temp: 41.2, wetBulb: 27.2, risk: 'danger', alerts: 'Moderate danger. Cooling centers activated.' },
  { id: 'hw-4', name: 'Kothrud Residential Hill slopes', temp: 39.5, wetBulb: 25.8, risk: 'caution', alerts: 'Caution. Avoid direct sunlight between 12 PM - 3 PM.' },
  { id: 'hw-5', name: 'Viman Nagar Plaza', temp: 42.0, wetBulb: 28.0, risk: 'danger', alerts: 'High heat stress. Restrict open-air commercial activity.' },
  { id: 'hw-6', name: 'Pashan Lake Environs', temp: 37.8, wetBulb: 24.5, risk: 'normal', alerts: 'Normal conditions. Shielded by green cover.' },
];

interface CoolingCenter {
  id: string;
  name: string;
  location: string;
  distance: string;
  hours: string;
  capacity: number;
  occupancy: number;
  waterStock: 'full' | 'moderate' | 'low';
}

const MOCK_COOLING_CENTERS: CoolingCenter[] = [
  { id: 'cc-1', name: 'Hadapsar Civic AC Center', location: 'Ward 4 Civic Hall, Industrial Rd', distance: '1.2 km', hours: '09:00 AM - 08:00 PM', capacity: 150, occupancy: 112, waterStock: 'full' },
  { id: 'cc-2', name: 'Cantonment Public Library AC Wing', location: 'Gate 2, Cantonment Plaza', distance: '2.5 km', hours: '10:00 AM - 06:00 PM', capacity: 80, occupancy: 45, waterStock: 'full' },
  { id: 'cc-3', name: 'Sector 4 Sports Club AC Arena', location: 'Near Municipal Ground, Sector 4', distance: '3.1 km', hours: '08:00 AM - 09:00 PM', capacity: 200, occupancy: 85, waterStock: 'moderate' },
  { id: 'cc-4', name: 'Shivajinagar Metro Station Shelter', location: 'Concourse Level, Entry 3', distance: '0.8 km', hours: '24 Hours Open', capacity: 300, occupancy: 210, waterStock: 'full' },
  { id: 'cc-5', name: 'Katraj Community AC Pavilion', location: 'Near Katraj Lake Garden', distance: '4.8 km', hours: '09:00 AM - 07:00 PM', capacity: 100, occupancy: 95, waterStock: 'low' },
];

export default function HeatwavesDashboard() {
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    setActiveTab('Civic Hazards');
  }, [setActiveTab]);

  const [selectedWard, setSelectedWard] = useState<HeatWard | null>(MOCK_HEAT_WARDS[0]);
  const [ambientTemp, setAmbientTemp] = useState<number>(44.5);
  const [wetBulbTemp, setWetBulbTemp] = useState<number>(29.8);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sync selected ward values
  useEffect(() => {
    if (selectedWard) {
      setAmbientTemp(selectedWard.temp);
      setWetBulbTemp(selectedWard.wetBulb);
    }
  }, [selectedWard]);

  // Filtered cooling centers
  const filteredCenters = MOCK_COOLING_CENTERS.filter(center => 
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2">
        <Link href="/hazards" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 no-underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border-subtle">
          <ArrowLeft className="w-3.5 h-3.5" />
          Hazards Desk
        </Link>
        <span className="text-xs text-slate-400 font-bold">•</span>
        <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">Heatwave Telemetry</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Thermometer className="w-8 h-8 text-orange-500 animate-bounce" />
          Heatwave Monitoring & Wet-Bulb
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Monitor physiological thermal indexes, wet-bulb thresholds, urban land surface temperatures, and cooling centers.
        </p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Dials (Ambient vs. Wet-Bulb) & Warnings */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Ambient Temp Dial */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-orange-500" />
                Air Temperature (Ambient)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Radial Progress Ring */}
                {/* Scale is 25°C to 50°C */}
                {/* Math: percent = (ambientTemp - 25) / 25 */}
                <svg className="w-full h-full transform -rotate-225" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={cn(
                      "transition-all duration-500",
                      ambientTemp >= 43 ? "stroke-red-500" :
                      ambientTemp >= 40 ? "stroke-orange-500" : "stroke-amber-500"
                    )}
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.max(0, Math.min(25, ambientTemp - 25))) / 25}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{ambientTemp.toFixed(1)}°C</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Air Temperature</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
                <span className="text-slate-600 dark:text-slate-400">Extreme Tier:</span>
                <span className="font-bold text-red-600 dark:text-red-400 uppercase">
                  {ambientTemp >= 43 ? 'Extreme Danger' : 
                   ambientTemp >= 40 ? 'Severe Danger' : 'Heat Warning'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wet-Bulb physiological limit gauge */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-500" />
                Wet-Bulb Temperature
              </CardTitle>
              <CardDescription className="text-xs">
                Physiological limit (35°C) where sweating no longer cools the body.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Radial Progress Ring */}
                {/* Scale is 20°C to 35°C */}
                {/* Math: percent = (wetBulbTemp - 20) / 15 */}
                <svg className="w-full h-full transform -rotate-225" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={cn(
                      "transition-all duration-500",
                      wetBulbTemp >= 29 ? "stroke-red-500" :
                      wetBulbTemp >= 27 ? "stroke-orange-500" : "stroke-blue-500"
                    )}
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.max(0, Math.min(15, wetBulbTemp - 20))) / 15}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{wetBulbTemp.toFixed(1)}°C</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Wet-Bulb Index</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-orange-500/20 bg-orange-500/5">
                <span className="text-slate-600 dark:text-slate-400">Thermal Safety:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 uppercase">
                  {wetBulbTemp >= 29 ? 'Critical Limits' : 
                   wetBulbTemp >= 27 ? 'High Stress' : 'Moderate'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Heat Wards SVG & Cooling Centers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Municipal Wards Heat Surface Temperature Grid */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Activity className="w-5 h-5 text-orange-500" />
                Land Surface Heat Grid
              </CardTitle>
              <CardDescription className="text-xs">
                Municipal sectors color-coded by real-time heat indices. Select a grid cell to inspect.
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              {/* SVG Grid */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                
                <svg className="w-full aspect-[16/9] max-w-[420px]" viewBox="0 0 160 90">
                  {/* Grid cells: 2 rows of 3 cells */}
                  {/* Row 1, Cell 1: Hadapsar */}
                  <rect
                    x="15" y="10" width="40" height="32" rx="3"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1.5] cursor-pointer transition-all duration-200 hover:opacity-85 fill-red-600/70",
                      selectedWard?.id === 'hw-1' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedWard(MOCK_HEAT_WARDS[0])}
                  />
                  <text x="35" y="26" textAnchor="middle" className="fill-white text-[4.5px] font-black pointer-events-none">Hadapsar Ind.</text>
                  <text x="35" y="34" textAnchor="middle" className="fill-white/80 text-[3.5px] font-semibold pointer-events-none">44.5°C</text>

                  {/* Row 1, Cell 2: Cantonment */}
                  <rect
                    x="60" y="10" width="40" height="32" rx="3"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1.5] cursor-pointer transition-all duration-200 hover:opacity-85 fill-red-500/50",
                      selectedWard?.id === 'hw-2' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedWard(MOCK_HEAT_WARDS[1])}
                  />
                  <text x="80" y="26" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-[4.5px] font-black pointer-events-none">Cantonment</text>
                  <text x="80" y="34" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[3.5px] font-semibold pointer-events-none">42.8°C</text>

                  {/* Row 1, Cell 3: Shivajinagar */}
                  <rect
                    x="105" y="10" width="40" height="32" rx="3"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1.5] cursor-pointer transition-all duration-200 hover:opacity-85 fill-orange-500/55",
                      selectedWard?.id === 'hw-3' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedWard(MOCK_HEAT_WARDS[2])}
                  />
                  <text x="125" y="26" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-[4.5px] font-black pointer-events-none">Shivajinagar</text>
                  <text x="125" y="34" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[3.5px] font-semibold pointer-events-none">41.2°C</text>

                  {/* Row 2, Cell 1: Kothrud */}
                  <rect
                    x="15" y="48" width="40" height="32" rx="3"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1.5] cursor-pointer transition-all duration-200 hover:opacity-85 fill-amber-500/50",
                      selectedWard?.id === 'hw-4' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedWard(MOCK_HEAT_WARDS[3])}
                  />
                  <text x="35" y="64" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-[4.5px] font-black pointer-events-none">Kothrud Hills</text>
                  <text x="35" y="72" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[3.5px] font-semibold pointer-events-none">39.5°C</text>

                  {/* Row 2, Cell 2: Viman Nagar */}
                  <rect
                    x="60" y="48" width="40" height="32" rx="3"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1.5] cursor-pointer transition-all duration-200 hover:opacity-85 fill-red-500/40",
                      selectedWard?.id === 'hw-5' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedWard(MOCK_HEAT_WARDS[4])}
                  />
                  <text x="80" y="64" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-[4.5px] font-black pointer-events-none">Viman Nagar</text>
                  <text x="80" y="72" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[3.5px] font-semibold pointer-events-none">42.0°C</text>

                  {/* Row 2, Cell 3: Pashan */}
                  <rect
                    x="105" y="48" width="40" height="32" rx="3"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1.5] cursor-pointer transition-all duration-200 hover:opacity-85 fill-green-500/30",
                      selectedWard?.id === 'hw-6' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedWard(MOCK_HEAT_WARDS[5])}
                  />
                  <text x="125" y="64" textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 text-[4.5px] font-black pointer-events-none">Pashan Lake</text>
                  <text x="125" y="72" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[3.5px] font-semibold pointer-events-none">37.8°C</text>
                </svg>

                {/* Map Legend */}
                <div className="flex gap-4 mt-2 justify-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 bg-red-600/70 rounded border border-red-600" />Extreme (&gt;44°C)</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 bg-red-500/40 rounded border border-red-400" />Danger (41°C - 43.9°C)</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 bg-amber-500/50 rounded border border-amber-500" />Caution (39°C - 40.9°C)</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 bg-green-500/30 rounded border border-green-500" />Stable (&lt;38°C)</span>
                </div>
              </div>

              {/* Selected Ward Heat Details */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30">
                {selectedWard ? (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Sector Thermal Audit</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{selectedWard.name}</h4>
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {selectedWard.alerts}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-center min-w-[95px]">
                        <span className="block text-[8px] uppercase font-black text-slate-400">Ambient Temp</span>
                        <span className="text-xs font-extrabold text-red-600 leading-none">{selectedWard.temp}°C</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 text-center min-w-[95px]">
                        <span className="block text-[8px] uppercase font-black text-slate-400">Wet-Bulb</span>
                        <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 leading-none">{selectedWard.wetBulb}°C</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400">
                    Click a sector on the heat grid above to audit localized thermal stats.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cooling Centers Locator */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange-500" />
                  Active District Cooling Centers
                </CardTitle>
                <CardDescription className="text-xs">
                  AC-enabled municipal shelters providing hydration packs, rest areas, and first aid.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-48">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Filter centers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-ring border border-transparent focus:border-border-subtle transition-all"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-slate-500 dark:text-slate-400 font-black uppercase text-[10px]">
                      <th className="py-2.5">Cooling Facility</th>
                      <th className="py-2.5">Transit Distance</th>
                      <th className="py-2.5">Operating Hours</th>
                      <th className="py-2.5">Occupancy Rate</th>
                      <th className="py-2.5 text-right">Chilled Water Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredCenters.map((center) => (
                      <tr key={center.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5">
                          <span className="block font-bold text-slate-800 dark:text-slate-100">{center.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {center.location}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">{center.distance}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {center.hours}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                              <span>{center.occupancy} / {center.capacity}</span>
                              <span>{Math.round((center.occupancy / center.capacity) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  (center.occupancy / center.capacity) >= 0.85 ? 'bg-red-500' :
                                  (center.occupancy / center.capacity) >= 0.6 ? 'bg-orange-500' : 'bg-emerald-500'
                                )}
                                style={{ width: `${(center.occupancy / center.capacity) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            center.waterStock === 'full' ? 'bg-emerald-500/10 text-emerald-600' :
                            center.waterStock === 'moderate' ? 'bg-orange-500/10 text-orange-600' :
                            'bg-red-500/10 text-red-600 font-bold'
                          )}>
                            {center.waterStock}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredCenters.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No cooling centers matched your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
