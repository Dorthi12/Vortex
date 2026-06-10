'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, BarChart3, HelpCircle, Phone, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallProfessionalModal } from '@/components/agriculture/CallProfessionalModal';
import { CallProfessionalBanner } from '@/components/agriculture/CallProfessionalBanner';

interface CropPrice {
  id: string;
  name: string;
  price: number; // ₹ per Quintal
  prevPrice: number;
  trend: number; // % change
  volume: number; // MT (Metric Tons)
  history: number[]; // 6 months history
}

const MOCK_PRICES: CropPrice[] = [
  { id: 'c-1', name: 'Rice (Paddy)', price: 2180, prevPrice: 2120, trend: 2.8, volume: 420, history: [2050, 2080, 2100, 2120, 2110, 2180] },
  { id: 'c-2', name: 'Wheat (Kalyansona)', price: 2275, prevPrice: 2310, trend: -1.5, volume: 380, history: [2220, 2240, 2280, 2310, 2300, 2275] },
  { id: 'c-3', name: 'Sugarcane', price: 3150, prevPrice: 3150, trend: 0.0, volume: 1450, history: [3050, 3100, 3120, 3150, 3150, 3150] },
  { id: 'c-4', name: 'Cotton (Medium Staple)', price: 6620, prevPrice: 6410, trend: 3.2, volume: 210, history: [6200, 6310, 6380, 6410, 6500, 6620] },
  { id: 'c-5', name: 'Soybean', price: 4350, prevPrice: 4210, trend: 3.3, volume: 180, history: [4100, 4180, 4200, 4215, 4280, 4350] },
  { id: 'c-6', name: 'Onion (Red)', price: 1850, prevPrice: 1980, trend: -6.5, volume: 850, history: [1600, 1750, 1920, 1980, 2050, 1850] },
];

interface MandiLocation {
  name: string;
  distance: string;
  volume: string;
  contact: string;
}

const MOCK_MANDIS: MandiLocation[] = [
  { name: 'Pune APMC (Gultekdi Mandi)', distance: '4.5 km', volume: '1,200 MT / Day', contact: '020-24267891' },
  { name: 'Haveli APMC (Hadapsar Branch)', distance: '8.2 km', volume: '450 MT / Day', contact: '020-24263300' },
  { name: 'Manjari Grain APMC', distance: '12.4 km', volume: '380 MT / Day', contact: '020-24261102' },
];

export default function MarketIntelligence() {
  const { setActiveTab } = useUiStore();
  const [selectedCrop, setSelectedCrop] = useState<CropPrice>(MOCK_PRICES[0]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Sync sidebar active highlight
  useEffect(() => {
    setActiveTab('Agriculture');
  }, [setActiveTab]);

  useEffect(() => {
    setLastUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Overview */}
      <div>
        <Link 
          href="/agriculture" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sea-green dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Agriculture Overview
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-sea-green dark:text-sea-green-light font-black">
            Agro-Market Analytics
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Market Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitor wholesale Mandi pricing index trends, compare regional crop valuations, and locate APMC trade capacities.
          </p>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5 shrink-0 self-start md:self-center">
          <RefreshCw className="w-3.5 h-3.5 text-sea-green" />
          Last updated: <strong>Today, {lastUpdateTime}</strong>
        </div>
      </div>

      {/* Call Professional Banner */}
      <CallProfessionalBanner
        variant="market"
        title="Connect with an APMC Market Advisor"
        description="An APMC Market Intelligence Director will guide you on optimal selling windows, floor price protections, and Mandi registration to maximize your crop revenue."
        buttonLabel="Call Market Advisor"
        onCallClick={() => setIsProfModalOpen(true)}
      />

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Ticker pricing blocks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ticker pricing cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_PRICES.map((crop) => {
              const isSelected = selectedCrop.id === crop.id;
              const isUp = crop.trend >= 0;

              return (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={cn(
                    'p-4 border bg-card text-left rounded-lg transition-all cursor-pointer flex flex-col justify-between group shadow-2xs hover:shadow-xs border-border-subtle',
                    isSelected && 'ring-2 ring-sea-green border-sea-green dark:border-sea-green-light'
                  )}
                >
                  <div className="space-y-0.5">
                    <span className="block text-[8px] uppercase font-bold text-slate-500">Mandi Rate index</span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-sea-green transition-colors leading-none truncate">
                      {crop.name}
                    </h4>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                        ₹{crop.price}
                      </h3>
                      <span className="text-[8px] text-slate-450">per Quintal (100kg)</span>
                    </div>

                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shrink-0',
                      crop.trend === 0 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800' :
                      isUp ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                    )}>
                      {crop.trend !== 0 && (isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
                      {crop.trend === 0 ? 'Stable' : `${Math.abs(crop.trend)}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* APMC mandis directory table — Light Green */}
          <Card className="border-0 shadow-xs overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)' }}>
            <CardHeader className="pb-3 border-b border-emerald-200/60"
              style={{ background: 'linear-gradient(90deg, #bbf7d040, #86efac20)' }}>
              <CardTitle className="text-sm font-black uppercase tracking-wider text-emerald-800">
                Wholesale Mandi Directory (Pune Ward)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-emerald-200/50 hover:bg-emerald-100/30">
                    <TableHead className="pl-6 text-emerald-700 font-bold">Market Location</TableHead>
                    <TableHead className="text-emerald-700 font-bold">Distance</TableHead>
                    <TableHead className="text-emerald-700 font-bold">Daily Trade Volume</TableHead>
                    <TableHead className="pr-6 text-emerald-700 font-bold">Hotline Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_MANDIS.map((mandi) => (
                    <TableRow key={mandi.name} className="border-emerald-200/40 hover:bg-emerald-100/40 transition-colors">
                      <TableCell className="font-bold pl-6 flex items-center gap-1.5 text-emerald-950">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{mandi.name}</span>
                      </TableCell>
                      <TableCell className="text-xs text-emerald-700">{mandi.distance}</TableCell>
                      <TableCell className="text-xs font-bold text-emerald-900">{mandi.volume}</TableCell>
                      <TableCell className="text-xs pr-6">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => window.open(`tel:${mandi.contact}`)}
                          className="h-auto p-0 text-emerald-700 flex items-center gap-1 cursor-pointer font-black hover:text-emerald-900"
                        >
                          <Phone className="w-3 h-3" />
                          {mandi.contact}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Historical pricing index chart */}
        <div className="lg:col-span-1">
          
          {/* Price Trend Index — Pale Yellow */}
          <Card className="border-0 shadow-md min-h-[340px] flex flex-col justify-between overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 50%, #fefce8 100%)' }}>
            <CardHeader className="pb-3 border-b border-amber-200/60"
              style={{ background: 'linear-gradient(90deg, #fef08a40, #fde68a30)' }}>
              <span className="text-[9px] uppercase font-black tracking-widest text-amber-700">Price Trend Index</span>
              <CardTitle className="text-base font-extrabold mt-0.5 leading-snug text-amber-950">
                {selectedCrop.name}
              </CardTitle>
              <CardDescription className="text-[10px] text-amber-700/70">
                Historical 6-month APMC trading prices (₹/Quintal)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-6 flex-1 flex flex-col justify-between">

              {/* Custom SVG Line Chart */}
              <div className="h-[140px] w-full flex items-center justify-center relative rounded-lg p-2.5 border border-amber-200/60"
                style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)' }}>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                  {/* Grid Lines */}
                  <line x1="10" y1="90" x2="190" y2="90" stroke="rgba(217,119,6,0.2)" strokeWidth="0.5" />
                  <line x1="10" y1="50" x2="190" y2="50" stroke="rgba(217,119,6,0.15)" strokeWidth="0.5" />
                  <line x1="10" y1="10" x2="190" y2="10" stroke="rgba(217,119,6,0.15)" strokeWidth="0.5" strokeDasharray="2" />

                  {/* Price history values plotting */}
                  {(() => {
                    const minP = Math.min(...selectedCrop.history);
                    const maxP = Math.max(...selectedCrop.history);
                    const range = maxP - minP || 10;
                    const points = selectedCrop.history.map((val, idx) => {
                      const x = 10 + idx * 36;
                      const y = 80 - ((val - minP) / range) * 60;
                      return { x, y, val };
                    });
                    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                    return (
                      <>
                        <path d={pathD} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                        {points.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} r="3.5"
                            fill="#fffbeb" stroke="#d97706" strokeWidth="2">
                            <title>{`Month ${idx + 1}: ₹${p.val}`}</title>
                          </circle>
                        ))}
                      </>
                    );
                  })()}

                  {/* Labels */}
                  <text x="10" y="98" fontSize="7" fill="#92400e" textAnchor="middle">M-5</text>
                  <text x="82" y="98" fontSize="7" fill="#92400e" textAnchor="middle">M-3</text>
                  <text x="190" y="98" fontSize="7" fill="#92400e" textAnchor="middle">Current</text>
                </svg>
              </div>

              {/* Summary Details */}
              <div className="space-y-2 border-t border-amber-200/60 pt-4 text-xs mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-amber-700 font-medium">Current APMC rate:</span>
                  <strong className="text-amber-950 font-black">₹{selectedCrop.price} / Q</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-700 font-medium">Monthly trade volume:</span>
                  <strong className="text-amber-950 font-black">{selectedCrop.volume} Metric Tons</strong>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Call market expert card — Persian Blue */}
          <Card className="relative overflow-hidden border-0 shadow-lg p-4 space-y-3 mt-6"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 70%, #3b82f6 100%)' }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
            />
            <div className="relative z-10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Need Sales Assistance?</h4>
              <p className="text-[11px] text-blue-100 leading-normal font-medium">
                Book a consultation call with an APMC Market Intelligence advisor to check optimal selling cycles and price floor protections.
              </p>
              <Button
                onClick={() => setIsProfModalOpen(true)}
                className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold flex items-center justify-center gap-1.5 text-xs py-2 h-9 cursor-pointer backdrop-blur-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                Connect with Market Advisor
              </Button>
            </div>
          </Card>

        </div>

      </div>

      <CallProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService="market_advice" 
      />

    </div>
  );
}
