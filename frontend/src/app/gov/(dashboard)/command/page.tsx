'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore } from '@/store/useGovStore';
import {
  Radio, ShieldAlert, AlertTriangle, Users, MapPin,
  Clock, Truck, CheckCircle2, ChevronRight, Activity, Bell
} from 'lucide-react';

interface AlertItem {
  id: string;
  state: string;
  severity: 'Emergency' | 'Alert' | 'Normal';
  situation: string;
  color: string;
  cx: number;
  cy: number;
}

const EMERGENCY_TICKER_TEXT = "⚠️ CRITICAL EMERGENCY: Kolhapur District Flood Response - Evacuation in progress · 🚨 PUBLIC HEALTH: Hadapsar Dengue Outbreak - Vector units dispatched · ⚡ INFRASTRUCTURE: Solapur Power Outage restoration - ETA 3 hours · 🛡️ SYSTEM SECURITY: Level 3 Classified protocols active.";

const STATE_ALERTS: AlertItem[] = [
  { id: 'mh', state: 'Maharashtra', severity: 'Emergency', situation: 'Kolhapur Flood Evacuations & Hadapsar Dengue Outbreak', color: '#EF4444', cx: 210, cy: 320 },
  { id: 'up', state: 'Uttar Pradesh', severity: 'Alert', situation: 'Heatwave Advisory & Water Shortage warning', color: '#F59E0B', cx: 270, cy: 190 },
  { id: 'br', state: 'Bihar', severity: 'Alert', situation: 'Flood Alert - Gandak river rising', color: '#F59E0B', cx: 330, cy: 200 },
  { id: 'rj', state: 'Rajasthan', severity: 'Normal', situation: 'Operational - No active emergency flags', color: '#22C55E', cx: 175, cy: 200 },
  { id: 'ka', state: 'Karnataka', severity: 'Normal', situation: 'Operational - Monitoring coastal monsoon', color: '#22C55E', cx: 200, cy: 400 },
  { id: 'gj', state: 'Gujarat', severity: 'Alert', situation: 'Chemical Industrial Park safety audit', color: '#F59E0B', cx: 130, cy: 250 },
  { id: 'tn', state: 'Tamil Nadu', severity: 'Normal', situation: 'Operational - Normal seasonal activity', color: '#22C55E', cx: 230, cy: 470 },
];

const ACTIVE_OPERATIONS = [
  { name: 'Kolhapur Flood Response', type: 'Disaster Relief', status: 'Active', personnel: '120 NDRF + local police', eta: 'Ongoing evacuation' },
  { name: 'Pune Dengue Containment', type: 'Medical Outbreak', status: 'Active', personnel: '40 Vector control agents', eta: '72h containment cycle' },
  { name: 'Solapur Power Restoration', type: 'Grid Infrastructure', status: 'Active', personnel: '18 MSEDCL grid engineers', eta: '3h estimated recovery' },
  { name: 'National Digital Security Audit', type: 'Cybersecurity', status: 'Standby', personnel: 'NIC security group', eta: 'Routine monitor' },
];

const EMERGENCY_ALERTS = [
  { id: 'ALR-809', severity: 'Emergency', color: 'text-red-400 border-red-900/40 bg-red-950/20', desc: 'River breach warning: Panchganga river at 97% threshold.', time: '10 mins ago' },
  { id: 'ALR-804', severity: 'Alert', color: 'text-orange-400 border-orange-900/40 bg-orange-950/20', desc: 'High load caution on Sangam Road bridge structural cracks.', time: '1h ago' },
  { id: 'ALR-799', severity: 'Normal', color: 'text-slate-400 border-slate-900/40 bg-slate-900/20', desc: 'Regular communication test completed across all districts.', time: '4h ago' },
];

const RESOURCE_MOVEMENTS = [
  { item: '38 Rescue Boats', target: 'Kolhapur Relief Camp 2', status: 'In Transit', speed: 'ETA 25m' },
  { item: '1,200 Medical Oxygen Cylinders', target: 'Mumbai Civil Hospital', status: 'Dispatched', speed: 'In transit' },
  { item: '18,500 Food Packets', target: 'Pune Emergency Depots', status: 'Received', speed: 'Delivered' },
];

export default function GovCommandCenter() {
  const router = useRouter();
  const isGovAuthenticated = useGovStore(s => s.isGovAuthenticated);
  const [hoveredAlert, setHoveredAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    if (!isGovAuthenticated) {
      router.replace('/gov/login');
    }
  }, [isGovAuthenticated, router]);

  if (!isGovAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      
      {/* ── TICKER ── */}
      <div className="bg-[#0D1E3A] border border-[#1A3A6C] rounded-lg p-2.5 overflow-hidden relative shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0D1E3A] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0D1E3A] to-transparent z-10 pointer-events-none"></div>
        <div className="whitespace-nowrap flex animate-[marquee_25s_linear_infinite] select-none text-xs font-semibold text-slate-300">
          <span className="mr-8">{EMERGENCY_TICKER_TEXT}</span>
          <span>{EMERGENCY_TICKER_TEXT}</span>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center">
            <Radio className="mr-2.5 text-[#D4AF37] animate-pulse" size={24} />
            Command Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            National emergency operations overview, logistics telemetry, and state-wide crisis coordination.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-slate-400 bg-[#0A1228] border border-[#1A2744] rounded-lg px-3 py-1.5 font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-ping"></span>
          Emergency Link: Secure Telemetry Enabled
        </div>
      </div>

      {/* ── SPLIT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT 60% (3 Cols): Map */}
        <div className="lg:col-span-3 bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center justify-between border-b border-[#1A2744]/60 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center">
                <MapPin size={14} className="mr-2 text-[#D4AF37]" />
                National Operations Map
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">viewbox: 0 0 500 560</span>
            </div>
            
            {/* Map Plot */}
            <div className="relative w-full flex justify-center items-center py-4 bg-[#070D1A]/30 rounded-lg border border-[#1A2744]/20">
              <svg
                viewBox="0 0 500 560"
                className="w-full max-w-[420px] aspect-square"
                style={{ filter: 'drop-shadow(0 0 24px rgba(28,57,187,0.15))' }}
              >
                {/* Bezier India outline */}
                <path
                  d="M 250 15 
                     C 255 10, 260 10, 265 15
                     C 270 20, 280 15, 285 20
                     C 290 25, 295 25, 300 35
                     C 305 45, 310 50, 305 60
                     C 300 70, 290 70, 285 80
                     C 280 90, 285 100, 295 105
                     C 305 110, 315 100, 320 110
                     C 325 120, 340 125, 350 135
                     C 360 145, 370 135, 375 150
                     C 380 165, 395 160, 410 155
                     C 425 150, 440 155, 450 160
                     C 460 165, 470 170, 480 175
                     C 490 180, 500 190, 495 200
                     C 490 210, 480 210, 475 220
                     C 470 230, 475 245, 465 250
                     C 455 255, 450 245, 440 250
                     C 430 255, 425 265, 420 280
                     C 415 295, 420 310, 410 320
                     C 400 330, 395 320, 390 335
                     C 385 350, 375 340, 370 355
                     C 365 370, 350 375, 345 365
                     C 340 355, 345 340, 335 335
                     C 325 330, 320 320, 315 330
                     C 310 340, 305 355, 305 370
                     C 305 385, 310 400, 300 415
                     C 290 430, 285 445, 275 460
                     C 265 475, 255 490, 250 505
                     C 245 520, 240 525, 235 520
                     C 230 515, 220 490, 215 470
                     C 210 450, 195 430, 190 410
                     C 185 390, 175 370, 165 350
                     C 155 330, 145 310, 150 290
                     C 155 270, 140 265, 125 265
                     C 110 265, 95 255, 85 250
                     C 75 245, 70 235, 80 230
                     C 90 225, 105 230, 115 225
                     C 125 220, 135 210, 140 200
                     C 145 190, 150 175, 155 160
                     C 160 145, 175 135, 185 120
                     C 195 105, 200 90, 210 80
                     C 220 70, 225 60, 235 50
                     C 245 40, 245 35, 250 15 Z"
                  fill="none"
                  stroke="#1A3A6C"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Inner shading gradient */}
                <path
                  d="M 250 15 
                     C 255 10, 260 10, 265 15
                     C 270 20, 280 15, 285 20
                     C 290 25, 295 25, 300 35
                     C 305 45, 310 50, 305 60
                     C 300 70, 290 70, 285 80
                     C 280 90, 285 100, 295 105
                     C 305 110, 315 100, 320 110
                     C 325 120, 340 125, 350 135
                     C 360 145, 370 135, 375 150
                     C 380 165, 395 160, 410 155
                     C 425 150, 440 155, 450 160
                     C 460 165, 470 170, 480 175
                     C 490 180, 500 190, 495 200
                     C 490 210, 480 210, 475 220
                     C 470 230, 475 245, 465 250
                     C 455 255, 450 245, 440 250
                     C 430 255, 425 265, 420 280
                     C 415 295, 420 310, 410 320
                     C 400 330, 395 320, 390 335
                     C 385 350, 375 340, 370 355
                     C 365 370, 350 375, 345 365
                     C 340 355, 345 340, 335 335
                     C 325 330, 320 320, 315 330
                     C 310 340, 305 355, 305 370
                     C 305 385, 310 400, 300 415
                     C 290 430, 285 445, 275 460
                     C 265 475, 255 490, 250 505
                     C 245 520, 240 525, 235 520
                     C 230 515, 220 490, 215 470
                     C 210 450, 195 430, 190 410
                     C 185 390, 175 370, 165 350
                     C 155 330, 145 310, 150 290
                     C 155 270, 140 265, 125 265
                     C 110 265, 95 255, 85 250
                     C 75 245, 70 235, 80 230
                     C 90 225, 105 230, 115 225
                     C 125 220, 135 210, 140 200
                     C 145 190, 150 175, 155 160
                     C 160 145, 175 135, 185 120
                     C 195 105, 200 90, 210 80
                     C 220 70, 225 60, 235 50
                     C 245 40, 245 35, 250 15 Z"
                  fill="url(#mapShade)"
                  fillOpacity="0.45"
                />

                <defs>
                  <radialGradient id="mapShade" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1C39BB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#070D1A" stopOpacity="0.05" />
                  </radialGradient>
                </defs>

                {/* Grid guidelines */}
                {[100, 180, 260, 340, 420, 500].map(y => (
                  <line key={y} x1="50" y1={y} x2="450" y2={y} stroke="#1A3A6C" strokeWidth="0.35" strokeDasharray="3,5" />
                ))}
                {[100, 180, 260, 340, 420].map(x => (
                  <line key={x} x1={x} y1="30" x2={x} y2="530" stroke="#1A3A6C" strokeWidth="0.35" strokeDasharray="3,5" />
                ))}

                {/* State plotting dots */}
                {STATE_ALERTS.map(item => (
                  <g
                    key={item.id}
                    onMouseEnter={() => setHoveredAlert(item)}
                    onMouseLeave={() => setHoveredAlert(null)}
                    className="cursor-pointer"
                  >
                    {item.severity !== 'Normal' && (
                      <circle cx={item.cx} cy={item.cy} r="12" fill="none" stroke={item.color} strokeWidth="1" opacity="0.6">
                        <animate attributeName="r" from="6" to="18" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.7" to="0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={item.cx}
                      cy={item.cy}
                      r={hoveredAlert?.id === item.id ? 8 : 5.5}
                      fill={item.color}
                      className="transition-all duration-150"
                      style={{ filter: `drop-shadow(0 0 8px ${item.color})` }}
                    />
                  </g>
                ))}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredAlert && (
                <div className="absolute top-4 left-4 right-4 bg-[#0A1228]/95 border border-[#1A2744] rounded-lg p-3 text-xs shadow-xl backdrop-blur-sm animate-in fade-in duration-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{hoveredAlert.state} State Status</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        hoveredAlert.severity === 'Emergency' ? 'bg-red-950/60 text-red-400 border border-red-800' :
                        hoveredAlert.severity === 'Alert' ? 'bg-orange-950/60 text-orange-400 border border-orange-850' :
                        'bg-emerald-950/60 text-emerald-400 border border-emerald-850'
                      }`}
                    >
                      {hoveredAlert.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 font-medium leading-relaxed">
                    {hoveredAlert.situation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-between gap-4 mt-4 pt-3 border-t border-[#1A2744]/40 text-[10px] text-slate-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] mr-1.5 shadow-[0_0_6px_#EF4444]"></span> Emergency</div>
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mr-1.5 shadow-[0_0_6px_#F59E0B]"></span> Alert</div>
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] mr-1.5 shadow-[0_0_6px_#22C55E]"></span> Normal Operations</div>
            </div>
            <span className="font-mono text-slate-500">Classification Level: Level 3 Classified Telemetry</span>
          </div>
        </div>

        {/* RIGHT 40% (2 Cols): Operations Panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Operations */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center justify-between">
              <span className="flex items-center"><Activity size={14} className="mr-2 text-slate-500" /> Active System Operations</span>
              <span className="text-[9px] text-[#D4AF37] font-mono">4 ACTIVE</span>
            </h2>
            
            <div className="space-y-3">
              {ACTIVE_OPERATIONS.map((op, idx) => (
                <div key={idx} className="bg-[#070D1A] border border-[#1A2744] rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{op.name}</span>
                    <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-bold uppercase">
                      {op.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#1A2744]/30 text-[10px] text-slate-400">
                    <div>Type: <span className="text-slate-300 font-medium">{op.type}</span></div>
                    <div>ETA: <span className="text-slate-300 font-semibold">{op.eta}</span></div>
                  </div>
                  <div className="text-[9px] text-slate-500">Units: {op.personnel}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Alerts Feed */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center justify-between">
              <span className="flex items-center"><Bell size={14} className="mr-2 text-slate-500" /> Real-time Alert logs</span>
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            </h2>
            
            <div className="space-y-2.5">
              {EMERGENCY_ALERTS.map(alr => (
                <div key={alr.id} className={`p-3 border rounded-lg text-xs flex justify-between items-start gap-4 ${alr.color}`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-[9px] tracking-widest">{alr.id}</span>
                      <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-[#070D1A]/50">{alr.severity}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{alr.desc}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">{alr.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Logistics movements */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center">
              <Truck size={14} className="mr-2 text-slate-500" />
              Resource logistics movement tracking
            </h2>
            
            <div className="space-y-2 text-xs">
              {RESOURCE_MOVEMENTS.map((mv, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-[#070D1A]/40 border border-[#1A2744]/40 rounded-lg">
                  <div>
                    <div className="font-semibold text-white">{mv.item}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Dest: {mv.target}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded font-semibold">
                      {mv.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{mv.speed}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* District Status Grid */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-3">
              District operations matrix (36 Districts)
            </h2>
            <div className="grid grid-cols-9 gap-1.5">
              {Array.from({ length: 36 }).map((_, idx) => {
                // Mock some red, amber, green statuses
                let bg = 'bg-emerald-500';
                let title = `District MH-${idx+1}: Normal`;
                if (idx === 3 || idx === 18) {
                  bg = 'bg-red-500 shadow-[0_0_4px_#EF4444]';
                  title = `District MH-${idx+1}: Emergency`;
                } else if (idx === 7 || idx === 24 || idx === 11) {
                  bg = 'bg-amber-500 shadow-[0_0_4px_#F59E0B]';
                  title = `District MH-${idx+1}: Alert`;
                }
                return (
                  <div
                    key={idx}
                    className={`w-full aspect-square rounded-sm ${bg} cursor-pointer opacity-85 hover:opacity-100 transition-opacity`}
                    title={title}
                  />
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
