'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Download, Share2, FileText, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Select, FormGroup } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function MarketIntelligence() {
  const store = useAgricultureStore();
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    store.runMarketIntelligence();
  }, [store.marketCrop, store.marketState, store.marketMandi]);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const res = store.marketResult;

  // Custom mock history values
  const history = store.marketCrop === 'Sugarcane' ? [4800, 4950, 5100, 5300, 5250, 5400] : [2050, 2080, 2100, 2120, 2110, 2180];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 text-slate-800 dark:text-[#F8FAFC]">
      
      {/* Header with Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div className="space-y-1">
          <Link 
            href="/agriculture" 
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-[#D4AF37] transition-colors cursor-pointer group mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Agriculture Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Market Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor wholesale Mandi pricing indexes, compare valuations, and track price forecast corridors.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs font-bold cursor-pointer">
            <FileText className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs font-bold cursor-pointer">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="h-9 px-3 flex items-center gap-1 text-xs font-bold cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {shareSuccess ? 'Link Copied!' : 'Share'}
          </Button>
        </div>
      </div>

      {/* Page Body Split: Inputs and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Inputs Section */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-250">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Trading Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Select region and crop to inspect wholesale metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              <FormGroup label="Select Crop type">
                <Select 
                  value={store.marketCrop} 
                  onChange={(e) => store.setField('marketCrop', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Rice (Paddy)">Rice (Paddy)</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Groundnuts">Groundnuts</option>
                </Select>
              </FormGroup>

              <FormGroup label="State Market">
                <Select 
                  value={store.marketState} 
                  onChange={(e) => store.setField('marketState', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                </Select>
              </FormGroup>

              <FormGroup label="Wholesale APMC Mandi">
                <Select 
                  value={store.marketMandi} 
                  onChange={(e) => store.setField('marketMandi', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Pune APMC">Pune APMC (Gultekdi)</option>
                  <option value="Hadapsar APMC">Hadapsar APMC</option>
                  <option value="Kolhapur Mandi">Kolhapur Cooperative Mandi</option>
                </Select>
              </FormGroup>

            </CardContent>
          </Card>
        </div>

        {/* Right: Predictions, Explanation & Insights */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Prediction Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">AI Price Forecasting</span>
              <CardTitle className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">
                Wholesale Price Prediction Outputs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Current Price</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">₹{res?.currentPrice}/Q</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">7-Day Forecast</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">₹{res?.forecast7d}/Q</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">30-Day Forecast</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">₹{res?.forecast30d}/Q</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Trend Direction</span>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-1',
                  res?.trend === 'Bullish' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-755 border-red-200'
                )}>
                  {res?.trend}
                </span>
              </div>

            </CardContent>
          </Card>

          {/* Explanation Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Market Volatility Model Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                Wholesale crop values fluctuate based on seasonal arrival volumes, local buffer stock requirements, and transportation costs. The AI models crop prices by indexing monthly arrivals at {store.marketMandi} against historical trading patterns. {res?.trend === 'Bullish' ? 'A bullish trend suggests low mandi stocks; plan harvesting early to secure premium prices.' : 'A stable or bearish trend suggests saturated mandi supplies; utilize warehouses to defer sales.'}
              </p>
            </CardContent>
          </Card>

          {/* Insights Section (SVG price forecast line) */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Price Corridor Trend Chart
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[120px] w-full flex items-center justify-center relative rounded-lg p-2.5 border border-slate-200 dark:border-[#1A2744]">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                  <line x1="10" y1="90" x2="190" y2="90" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                  <line x1="10" y1="50" x2="190" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                  
                  {(() => {
                    const minVal = Math.min(...history);
                    const maxVal = Math.max(...history);
                    const range = maxVal - minVal || 10;
                    const points = history.map((val, idx) => {
                      const x = 10 + idx * 36;
                      const y = 80 - ((val - minVal) / range) * 60;
                      return { x, y, val };
                    });
                    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                    return (
                      <>
                        <path d={pathD} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                        {points.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#0B1530" stroke="#059669" strokeWidth="1.5" />
                        ))}
                      </>
                    );
                  })()}
                  
                  <text x="10" y="98" fontSize="7" fill="currentColor" opacity="0.6">M-5</text>
                  <text x="190" y="98" fontSize="7" fill="currentColor" opacity="0.6" textAnchor="end">Current</text>
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Government Advisory Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                APMC Floor Price Regulations & Selling Windows
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <div className="flex gap-2 items-start bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>MSP Safety Net advice:</strong> Ensure that trade bids in Mandis do not settle below the statutory Minimum Support Price (MSP) of ₹{res && Math.round(res.currentPrice * 0.9)}/Q. Report violations to APMC directors.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
