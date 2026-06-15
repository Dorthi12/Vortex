'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Leaf, Download, Share2, FileText, Info, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Select, FormGroup } from '@/components/ui/form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function FertilizerAdvisor() {
  const store = useAgricultureStore();
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    store.runFertilizerAdvisor();
  }, [store.fertCrop, store.fertSoilType, store.fertN, store.fertP, store.fertK]);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const res = store.fertResult;

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
            Fertilizer Advisor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calculate chemical NPK dosages and organic composting ratios to correct mineral deficits.
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
                <Leaf className="w-4 h-4 text-emerald-500" />
                Soil Mineral Deficits
              </CardTitle>
              <CardDescription className="text-xs">
                Set nutrient deficits in kg/hectare.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              <FormGroup label="Target Sown Crop">
                <Select 
                  value={store.fertCrop} 
                  onChange={(e) => store.setField('fertCrop', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Rice (Paddy)">Rice (Paddy)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Groundnuts">Groundnuts</option>
                </Select>
              </FormGroup>

              <FormGroup label="Soil Texture">
                <Select 
                  value={store.fertSoilType} 
                  onChange={(e) => store.setField('fertSoilType', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Loamy">Loamy (Optimal)</option>
                  <option value="Clayey">Clayey (High retention)</option>
                  <option value="Sandy">Sandy (High leaching risk)</option>
                </Select>
              </FormGroup>

              {/* N Deficit */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Nitrogen (N) Deficit</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.fertN} kg/ha</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={store.fertN}
                  onChange={(e) => store.setField('fertN', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* P Deficit */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Phosphorus (P) Deficit</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.fertP} kg/ha</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.fertP}
                  onChange={(e) => store.setField('fertP', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* K Deficit */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Potassium (K) Deficit</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.fertK} kg/ha</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.fertK}
                  onChange={(e) => store.setField('fertK', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right: Predictions, Explanation & Insights */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Prediction Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">AI Recommendation Output</span>
              <CardTitle className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">
                Calculated Chemical Dosage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-150 dark:border-[#1A2744] hover:bg-slate-50/50">
                    <TableHead className="pl-6 text-slate-500">Fertilizer Type</TableHead>
                    <TableHead className="text-slate-500">Required Dosage</TableHead>
                    <TableHead className="text-slate-500">Nutrients Provided</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-slate-150 dark:border-[#1A2744]">
                    <TableCell className="font-bold pl-6">Urea</TableCell>
                    <TableCell className="font-black text-emerald-650 dark:text-[#D4AF37]">{res?.urea} kg / Hectare</TableCell>
                    <TableCell>46% Nitrogen (N)</TableCell>
                  </TableRow>
                  <TableRow className="border-slate-150 dark:border-[#1A2744]">
                    <TableCell className="font-bold pl-6">DAP (Diammonium Phosphate)</TableCell>
                    <TableCell className="font-black text-emerald-650 dark:text-[#D4AF37]">{res?.dap} kg / Hectare</TableCell>
                    <TableCell>46% Phosphate (P) + 18% N</TableCell>
                  </TableRow>
                  <TableRow className="border-slate-150 dark:border-[#1A2744]">
                    <TableCell className="font-bold pl-6">MOP (Muriate of Potash)</TableCell>
                    <TableCell className="font-black text-emerald-650 dark:text-[#D4AF37]">{res?.mop} kg / Hectare</TableCell>
                    <TableCell>60% Potassium (K)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Explanation Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Nitrogen Leaching Model Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                DAP contains 18% Nitrogen alongside Phosphate. The model subtracts the nitrogen contribution of DAP from the total deficit target before outputting the Urea dosage. Soil texture affects retention: {store.fertSoilType === 'Sandy' ? 'Sandy soil has high leaching risk; apply Urea in 4 split doses.' : 'Loamy/Clay soil has stable retention; apply Urea in 3 split doses.'}
              </p>
            </CardContent>
          </Card>

          {/* Insights Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Split Application Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs font-semibold text-slate-500">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#070D1A] p-2.5 rounded-lg">
                <span>Day 0 (Sowing Basal):</span>
                <strong>Apply 100% of DAP ({res?.dap} kg) + 50% MOP ({res && Math.round(res.mop * 0.5)} kg)</strong>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#070D1A] p-2.5 rounded-lg">
                <span>Day 30 (Active Tillering):</span>
                <strong>Apply 50% of Urea ({res && Math.round(res.urea * 0.5)} kg)</strong>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#070D1A] p-2.5 rounded-lg">
                <span>Day 60 (Flowering):</span>
                <strong>Apply remaining Urea & MOP</strong>
              </div>
            </CardContent>
          </Card>

          {/* Government Advisory Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Organic Composting Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <div className="flex gap-2 items-start bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Organic Alternative advice:</strong> Apply organic vermicompost at 5 tons/hectare alongside Azotobacter bio-fertilizers. Environmental Impact: <strong>{res?.envImpact}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
