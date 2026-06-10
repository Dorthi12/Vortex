'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  AlertTriangle, 
  ArrowLeft, 
  Plus, 
  MapPin, 
  TrendingUp, 
  Users, 
  Phone, 
  Package, 
  Navigation,
  CheckCircle,
  HelpCircle,
  Map,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface ReliefCamp {
  id: string;
  name: string;
  location: string;
  phone: string;
  capacity: number;
  occupancy: number;
  supplies: {
    water: number; // 0 - 100
    food: number; // 0 - 100
    beds: number; // 0 - 100
    medical: number; // 0 - 100
  };
  coords: { x: number; y: number }; // SVG Map coordinates
}

const INITIAL_CAMPS: ReliefCamp[] = [
  { 
    id: 'sh-1', 
    name: 'Sector 4B Civic Center', 
    location: 'Sector 4B sports block, Pune', 
    phone: '+91 20 2555 1010', 
    capacity: 250, 
    occupancy: 180, 
    supplies: { water: 90, food: 80, beds: 70, medical: 85 },
    coords: { x: 30, y: 25 }
  },
  { 
    id: 'sh-2', 
    name: 'Yerawada Central High School', 
    location: 'School Lane, Yerawada Bed limits, Pune', 
    phone: '+91 20 2555 2020', 
    capacity: 400, 
    occupancy: 390, 
    supplies: { water: 55, food: 60, beds: 40, medical: 50 },
    coords: { x: 115, y: 20 }
  },
  { 
    id: 'sh-3', 
    name: 'Baner Tech Park Shelter Tents', 
    location: 'Sports Grounds, Baner Ridge Rd, Pune', 
    phone: '+91 20 2555 3030', 
    capacity: 500, 
    occupancy: 120, 
    supplies: { water: 95, food: 90, beds: 95, medical: 90 },
    coords: { x: 35, y: 70 }
  },
  { 
    id: 'sh-4', 
    name: 'Kalyani Nagar Community Pavilion', 
    location: 'Block C Sports Club, Kalyani Nagar', 
    phone: '+91 20 2555 4040', 
    capacity: 150, 
    occupancy: 140, 
    supplies: { water: 45, food: 50, beds: 35, medical: 40 },
    coords: { x: 105, y: 65 }
  }
];

export default function SheltersDashboard() {
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    setActiveTab('Civic Hazards');
  }, [setActiveTab]);

  // Camp list states
  const [camps, setCamps] = useState<ReliefCamp[]>(INITIAL_CAMPS);
  const [selectedCamp, setSelectedCamp] = useState<ReliefCamp | null>(INITIAL_CAMPS[0]);

  // Form states to add shelter
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCampName, setNewCampName] = useState<string>('');
  const [newCampLocation, setNewCampLocation] = useState<string>('');
  const [newCampPhone, setNewCampPhone] = useState<string>('');
  const [newCampCapacity, setNewCampCapacity] = useState<number>(200);

  // Success state for new shelter registration
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  const handleAddCamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName || !newCampLocation) return;

    // Randomize SVG Coordinates for the new camp (within bounds)
    const rx = Math.floor(Math.random() * 80) + 40;
    const ry = Math.floor(Math.random() * 50) + 20;

    const newCamp: ReliefCamp = {
      id: `sh-custom-${Date.now()}`,
      name: newCampName,
      location: newCampLocation,
      phone: newCampPhone || '+91 20 2555 9999',
      capacity: newCampCapacity,
      occupancy: 0,
      supplies: { 
        water: Math.floor(Math.random() * 30) + 70, 
        food: Math.floor(Math.random() * 30) + 70, 
        beds: Math.floor(Math.random() * 30) + 70, 
        medical: Math.floor(Math.random() * 30) + 70 
      },
      coords: { x: rx, y: ry }
    };

    setCamps(prev => [...prev, newCamp]);
    setSelectedCamp(newCamp);
    setFormSuccess(true);
    
    // Reset inputs
    setNewCampName('');
    setNewCampLocation('');
    setNewCampPhone('');
    setNewCampCapacity(200);

    setTimeout(() => {
      setFormSuccess(false);
      setShowAddForm(false);
    }, 2000);
  };

  // Safe corridor mapping nodes
  // User mock current position is (75, 45) - the center of Netravaah
  const userCoords = { x: 75, y: 45 };

  // Generate optimal evacuation route path coordinates depending on selected shelter
  const getEvacuationRoutePath = () => {
    if (!selectedCamp) return '';
    const sx = selectedCamp.coords.x;
    const sy = selectedCamp.coords.y;
    
    // Draw paths with an intersection point to look like a realistic road network routing
    // Let's create an intermediate node at (75, 25) or (75, 65) depending on north/south
    const intermediateY = sy < 45 ? 30 : 60;
    const intermediateX = sx < 75 ? 50 : 100;
    
    return `M ${userCoords.x},${userCoords.y} L ${intermediateX},${intermediateY} L ${sx},${sy}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2">
        <Link href="/hazards" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 no-underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border-subtle">
          <ArrowLeft className="w-3.5 h-3.5" />
          Hazards Desk
        </Link>
        <span className="text-xs text-slate-400 font-bold">•</span>
        <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">Relief Shelters</span>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-8 h-8 text-orange-500 animate-pulse" />
            Shelter Management & Evacuation Routing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Audit emergency camp resources, register custom neighborhood relief centers, and trace safe evacuation routing corridors.
          </p>
        </div>
        <div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? 'Cancel Registration' : 'Register New Shelter'}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Shelter list & Register Form */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Dynamic Register Form */}
          {showAddForm && (
            <Card className="border border-orange-500/30 bg-card shadow-sm animate-in slide-in-from-top-4 duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-orange-500" />
                  Register Municipal Shelter
                </CardTitle>
                <CardDescription className="text-xs">
                  Add a custom relief site and verify logistics inventory below.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <form onSubmit={handleAddCamp} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="camp-name">Shelter Facility Name</Label>
                    <Input
                      id="camp-name"
                      type="text"
                      placeholder="e.g. Sector 4B Primary School"
                      value={newCampName}
                      onChange={(e) => setNewCampName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="camp-location">Location Address</Label>
                    <Input
                      id="camp-location"
                      type="text"
                      placeholder="e.g. Plot 15, Near Mandir, Sector 4B"
                      value={newCampLocation}
                      onChange={(e) => setNewCampLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="camp-capacity">Max Capacity</Label>
                      <Input
                        id="camp-capacity"
                        type="number"
                        min="50"
                        max="1000"
                        value={newCampCapacity}
                        onChange={(e) => setNewCampCapacity(parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="camp-phone">Emergency Phone</Label>
                      <Input
                        id="camp-phone"
                        type="text"
                        placeholder="+91 20..."
                        value={newCampPhone}
                        onChange={(e) => setNewCampPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer mt-2" disabled={formSuccess}>
                    {formSuccess ? 'Registering Camp...' : 'Add Shelter Camp'}
                  </Button>

                  {formSuccess && (
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 text-center">
                      Shelter registered. Node mapped onto GIS coordinates.
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Active Relief Camps directory */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange-500" />
                Emergency Shelters Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Select a camp to inspect logistic resources and trace route safety.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {camps.map((camp) => {
                const isSelected = selectedCamp?.id === camp.id;
                const occRate = camp.occupancy / camp.capacity;
                return (
                  <div
                    key={camp.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer",
                      isSelected 
                        ? 'border-orange-500 bg-orange-500/5 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    )}
                    onClick={() => setSelectedCamp(camp)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{camp.name}</h4>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                        occRate >= 0.9 ? 'bg-red-500/10 text-red-600' :
                        occRate >= 0.7 ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'
                      )}>
                        {camp.occupancy} / {camp.capacity} Pax
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5 leading-none">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      {camp.location}
                    </p>
                    
                    {/* Compact Occupancy Progress */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-2">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          occRate >= 0.9 ? 'bg-red-500' :
                          occRate >= 0.7 ? 'bg-orange-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${occRate * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Evacuation Route Map & Resource Deployment */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Evacuation Route Planner SVG */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Map className="w-5 h-5 text-red-500" />
                Evacuation Route Planner
              </CardTitle>
              <CardDescription className="text-xs">
                Select a relief shelter to calculate optimal transit paths. Green roads are clear corridors, Red dotted lines indicate flood closures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Interactive Evacuation Map */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                
                <svg className="w-full aspect-[16/9] max-w-[420px]" viewBox="0 0 160 90">
                  {/* Road Network Grid Background */}
                  {/* Road 1: Sangam Bridge Road */}
                  <line x1="30" y1="25" x2="115" y2="20" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  
                  {/* Road 2: Confluence Margins */}
                  <line x1="115" y1="20" x2="105" y2="65" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  
                  {/* Road 3: Ridge Road */}
                  <line x1="30" y1="25" x2="35" y2="70" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  
                  {/* Road 4: Bypass highway (Safe corridor) */}
                  <line x1="35" y1="70" x2="105" y2="65" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  
                  {/* Center crossroads */}
                  <line x1="75" y1="45" x2="30" y2="25" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  <line x1="75" y1="45" x2="115" y2="20" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  <line x1="75" y1="45" x2="35" y2="70" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  <line x1="75" y1="45" x2="105" y2="65" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" strokeWidth="2" />

                  {/* ACTIVE ROAD BLOCKAGE (Dotted Red line) */}
                  {/* Block road between Sangam Bridge (30,25) and Yerawada (115,20) */}
                  <line x1="45" y1="24" x2="100" y2="21" className="stroke-red-500 stroke-[2] stroke-dasharray[2,2]" />
                  
                  {/* Blockage Icon marker */}
                  <g transform="translate(72, 17)">
                    <circle cx="3" cy="3" r="4.5" className="fill-red-500 stroke-white dark:stroke-slate-900 stroke-[1]" />
                    <path d="M 1.5,4.5 L 4.5,1.5" className="stroke-white stroke-[1.5]" />
                  </g>
                  <text x="75" y="10" textAnchor="middle" className="fill-red-500 font-bold text-[3px]">Causeway Blocked</text>

                  {/* Evacuation Calculated Route Overlay (Drawn dynamically if selected) */}
                  {selectedCamp && (
                    <path
                      d={getEvacuationRoutePath()}
                      fill="transparent"
                      className="stroke-emerald-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round animate-pulse"
                    />
                  )}

                  {/* User mock current coordinates */}
                  <g className="cursor-pointer">
                    <circle cx={userCoords.x} cy={userCoords.y} r="5.5" className="fill-blue-500 stroke-white dark:stroke-slate-900 stroke-[1.5] animate-pulse" />
                    <text x={userCoords.x} y={userCoords.y - 7} textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[3.5px] font-black uppercase">Your Location</text>
                  </g>

                  {/* Shelter node icons */}
                  {camps.map((camp) => {
                    const isSelected = selectedCamp?.id === camp.id;
                    return (
                      <g 
                        key={camp.id} 
                        className="cursor-pointer" 
                        onClick={() => setSelectedCamp(camp)}
                      >
                        {isSelected && (
                          <circle cx={camp.coords.x} cy={camp.coords.y} r="7" className="fill-none stroke-orange-500 stroke-[1.5]" />
                        )}
                        <circle cx={camp.coords.x} cy={camp.coords.y} r="4" className={cn("stroke-white dark:stroke-slate-900 stroke-[1.5] transition-colors", isSelected ? 'fill-orange-600' : 'fill-slate-600')} />
                        <text x={camp.coords.x} y={camp.coords.y - 6} textAnchor="middle" className="fill-slate-500 dark:fill-slate-300 text-[3.5px] font-bold">
                          {camp.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex gap-4 mt-2 justify-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-blue-500 rounded-full" />User GPS Coordinates</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-orange-600 rounded-full" />Selected Camp</span>
                  <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-emerald-500" />Safe Evacuation Corridor</span>
                  <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-red-500 border-dashed" />Closed/Inundated Road</span>
                </div>
              </div>

              {/* Transit Directions Inspector */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {selectedCamp ? (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-bold">Safe Passage Navigation</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        Directions to {selectedCamp.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Passage clear via bypass highway. Avoid Yerawada causeway limits.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-center">
                        <span className="block text-[8px] uppercase font-black text-slate-400">Safe Route</span>
                        <span className="text-xs font-bold text-emerald-600">Calculated</span>
                      </div>
                      <a href={`tel:${selectedCamp.phone}`} className="inline-flex items-center justify-center p-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400 w-full">
                    Select a relief camp node above to plot passage directions.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supply Levels auditing panel */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-500" />
                Shelter Resource Inventory Audit
              </CardTitle>
              <CardDescription className="text-xs">
                Resource stock capacity allocation for the selected camp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCamp ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Water Stock */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Hydration & Chilled Water Packs</span>
                      <span className={cn(
                        "font-bold",
                        selectedCamp.supplies.water >= 75 ? 'text-emerald-500' :
                        selectedCamp.supplies.water >= 50 ? 'text-orange-500' : 'text-red-500'
                      )}>{selectedCamp.supplies.water}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          selectedCamp.supplies.water >= 75 ? 'bg-emerald-500' :
                          selectedCamp.supplies.water >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        )}
                        style={{ width: `${selectedCamp.supplies.water}%` }}
                      />
                    </div>
                  </div>

                  {/* Food Ration Stock */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Ration & Dry Food Kits</span>
                      <span className={cn(
                        "font-bold",
                        selectedCamp.supplies.food >= 75 ? 'text-emerald-500' :
                        selectedCamp.supplies.food >= 50 ? 'text-orange-500' : 'text-red-500'
                      )}>{selectedCamp.supplies.food}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          selectedCamp.supplies.food >= 75 ? 'bg-emerald-500' :
                          selectedCamp.supplies.food >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        )}
                        style={{ width: `${selectedCamp.supplies.food}%` }}
                      />
                    </div>
                  </div>

                  {/* Bedding Kits */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Beds & Sleeping Mat Kits</span>
                      <span className={cn(
                        "font-bold",
                        selectedCamp.supplies.beds >= 75 ? 'text-emerald-500' :
                        selectedCamp.supplies.beds >= 50 ? 'text-orange-500' : 'text-red-500'
                      )}>{selectedCamp.supplies.beds}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          selectedCamp.supplies.beds >= 75 ? 'bg-emerald-500' :
                          selectedCamp.supplies.beds >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        )}
                        style={{ width: `${selectedCamp.supplies.beds}%` }}
                      />
                    </div>
                  </div>

                  {/* Medical Packs */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>First Aid & Medical Packs</span>
                      <span className={cn(
                        "font-bold",
                        selectedCamp.supplies.medical >= 75 ? 'text-emerald-500' :
                        selectedCamp.supplies.medical >= 50 ? 'text-orange-500' : 'text-red-500'
                      )}>{selectedCamp.supplies.medical}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          selectedCamp.supplies.medical >= 75 ? 'bg-emerald-500' :
                          selectedCamp.supplies.medical >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        )}
                        style={{ width: `${selectedCamp.supplies.medical}%` }}
                      />
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  Select a relief camp to check its inventory stocks.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
