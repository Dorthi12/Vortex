'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  SlidersHorizontal,
  Building,
  MapPin,
  Calendar,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  schemeCode: string;
  schemeName: string;
  title: string;
  excerpt: string;
  ministry: string;
  region: 'National' | 'State' | 'District';
  sectionRef: string;
  relevance: number; // percentage
  pubDate: string;
  citations: string[];
}

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'res-1',
    schemeCode: 'MOHFW-NDHM-2026',
    schemeName: 'National Digital Health Mission (NDHM)',
    title: 'Section 1.2: Cryptographic Consent Registry Controls',
    excerpt: '...The sharing of clinical electronic health data records shall be governed strictly via explicit digital consent policies. Healthcare facilities are strictly barred from querying patient health files without a valid, time-bound cryptographic token generated on the user terminal...',
    ministry: 'Ministry of Health and Family Welfare',
    region: 'National',
    sectionRef: 'MOHFW-NDHM-2026 // Sec 1.2',
    relevance: 98,
    pubDate: '24 Jan 2026',
    citations: ['G.S.R. 412(E) - Health Data Privacy Regulations 2024', 'IT Act Section 43A Amendment']
  },
  {
    id: 'res-2',
    schemeCode: 'MOWR-JJM-2026',
    schemeName: 'Jal Jeevan Mission (Urban & Rural)',
    title: 'Section 3.2: Automated Node Leakage Telemetry',
    excerpt: '...IoT flow-rate sensors must be embedded at all major district terminal nodes to monitor daily distribution volumes. Data systems are required to flag anomalous flow drops indicating leakages and dispatch maintenance triggers within 10 minutes to the central state pipeline directory...',
    ministry: 'Ministry of Jal Shakti',
    region: 'State',
    sectionRef: 'MOWR-JJM-2026 // Sec 3.2',
    relevance: 91,
    pubDate: '12 Feb 2026',
    citations: ['Jal Shakti Clean Water Act Directive 2023', 'National Infrastructure Pipeline Report']
  },
  {
    id: 'res-3',
    schemeCode: 'MOHUA-PMAY-2026',
    schemeName: 'Pradhan Mantri Awas Yojana (PMAY-U 2.0)',
    title: 'Section 2.4: Solid Waste & Green Cover Mandates',
    excerpt: '...All affordable housing projects exceeding 50 residential units under PMAY-U Phase II must allocate a minimum of 20% surface area to green ground cover. Additionally, local composting and greywater recovery plants must be constructed within the zoning layout boundaries...',
    ministry: 'Ministry of Housing and Urban Affairs',
    region: 'District',
    sectionRef: 'MOHUA-PMAY-2026 // Sec 2.4',
    relevance: 85,
    pubDate: '08 Dec 2025',
    citations: ['Urban Development Strategy Paper, Sec 8.4', 'State Municipal Bye-laws 2024']
  },
  {
    id: 'res-4',
    schemeCode: 'MOA-SASH-2026',
    schemeName: 'Smart Agriculture & Soil Health Protocol',
    title: 'Section 2.3: Crop Rotation & Aquifer Restrictions',
    excerpt: '...To check critical groundwater depletion, farmers in overdrafted aquifer blocks must align with local crop rotation patterns. High water-intensity sugarcane crops are restricted from receiving state micro-sprinkling energy subsidies during summer cycles...',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    region: 'District',
    sectionRef: 'MOA-SASH-2026 // Sec 2.3',
    relevance: 82,
    pubDate: '19 Nov 2025',
    citations: ['Aquifer Overdraft Containment Policy, Rule 12B', 'APMC Farming Standard Index']
  },
  {
    id: 'res-5',
    schemeCode: 'MOHFW-NDHM-2026',
    schemeName: 'National Digital Health Mission (NDHM)',
    title: 'Section 2.3: EHR Database Interoperability Standards',
    excerpt: '...All primary and secondary medical institutions are required to conform to the HL7 FHIR database standards. Synchronizing diagnoses, radiology reports, and lab outcomes must be automated immediately upon billing to minimize physical paper transit...',
    ministry: 'Ministry of Health and Family Welfare',
    region: 'National',
    sectionRef: 'MOHFW-NDHM-2026 // Sec 2.3',
    relevance: 78,
    pubDate: '15 Jan 2026',
    citations: ['NDHM Guideline Memo V2.1', 'BIS EHR Interoperability Directive']
  }
];

export default function PolicySearch() {
  const { setActiveTab } = useUiStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMinistry, setSelectedMinistry] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<'relevance' | 'date'>('relevance');

  useEffect(() => {
    setActiveTab('Policy Intelligence');
  }, [setActiveTab]);

  const filteredResults = MOCK_SEARCH_RESULTS.filter(res => {
    const matchesQuery = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.schemeCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMinistry = selectedMinistry === 'All' || res.ministry === selectedMinistry;
    const matchesRegion = selectedRegion === 'All' || res.region === selectedRegion;

    return matchesQuery && matchesMinistry && matchesRegion;
  }).sort((a, b) => {
    if (selectedSort === 'relevance') {
      return b.relevance - a.relevance;
    } else {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Page Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-blue-900 dark:text-brand-yellow font-bold">
              National Policy Intelligence Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Advanced Policy Search
          </h1>
          <p className="text-slate-800 dark:text-slate-400 text-sm mt-0.5 font-medium">
            Search cross-departmental policy folders, retrieve clauses, and map statutory citations.
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <Link href="/policies" className="px-4 py-2 text-xs font-bold rounded-lg text-slate-900 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
            📚 Catalog
          </Link>
          <Link href="/policies/search" className="px-4 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700">
            🔍 Advanced Search
          </Link>
          <Link href="/policies/chat" className="px-4 py-2 text-xs font-bold rounded-lg text-slate-900 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
            💬 RAG Chat
          </Link>
        </div>
      </div>

      {/* 2. Advanced Filters Console */}
      <Card className="bg-card border-border shadow-xs">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            
            {/* Query Input */}
            <div className="lg:col-span-5 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider">
                Keyword or Reference ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-900 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter keywords (e.g., 'consent registry', 'water sensors')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-sm text-slate-950 dark:text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-600 dark:focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Ministry Select */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <Building className="w-3 h-3 text-blue-900 dark:text-emerald-500" />
                <span>Ministry</span>
              </label>
              <select
                value={selectedMinistry}
                onChange={(e) => setSelectedMinistry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-sm text-slate-950 dark:text-white focus:outline-hidden"
              >
                <option value="All">All Ministries</option>
                <option value="Ministry of Health and Family Welfare">MOHFW (Health)</option>
                <option value="Ministry of Jal Shakti">Jal Shakti (Water)</option>
                <option value="Ministry of Housing and Urban Affairs">MOHUA (Housing)</option>
                <option value="Ministry of Agriculture & Farmers Welfare">Agriculture</option>
              </select>
            </div>

            {/* Region Select */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-900 dark:text-emerald-500" />
                <span>Jurisdiction</span>
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-sm text-slate-950 dark:text-white focus:outline-hidden"
              >
                <option value="All">All Regions</option>
                <option value="National">National</option>
                <option value="State">State</option>
                <option value="District">District</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-blue-900 dark:text-emerald-500" />
                <span>Sort By</span>
              </label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as 'relevance' | 'date')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-sm text-slate-950 dark:text-white focus:outline-hidden"
              >
                <option value="relevance">Highest Relevance</option>
                <option value="date">Publication Date</option>
              </select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* 3. Search Results Count Banner */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-slate-950 dark:text-slate-400 font-bold">
          Found <strong className="text-blue-900 dark:text-emerald-400">{filteredResults.length}</strong> matching clauses in statutory files
        </span>
        <span className="text-[10px] text-slate-850 dark:text-slate-500 font-bold font-mono">
          DATABASE LOCK STATE: ACTIVE
        </span>
      </div>

      {/* 4. Results Stack */}
      <div className="space-y-4">
        {filteredResults.map((result) => (
          <Card key={result.id} className="bg-card border-border hover:border-slate-400 dark:hover:border-slate-700 transition-all shadow-2xs">
            <CardContent className="p-5 space-y-4">
              
              {/* Header Title / Info row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold font-mono bg-blue-100 dark:bg-blue-950 text-blue-950 dark:text-blue-400 px-2 py-0.5 rounded border border-border">
                    {result.sectionRef}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-slate-100 mt-1.5">
                    {result.title}
                  </h3>
                  <p className="text-xs text-slate-900 dark:text-slate-400 font-semibold">
                    Scheme: <span className="text-blue-900 dark:text-emerald-400 font-bold">{result.schemeName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[8px] uppercase font-bold text-slate-900 dark:text-slate-500">Department</p>
                    <p className="text-[10px] font-bold text-slate-950 dark:text-slate-350">{result.ministry}</p>
                  </div>
                  <div className="border-l border-slate-200 dark:border-slate-850 h-8 pl-3 flex items-center">
                    <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-500/30">
                      {result.relevance}% Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Matching Snippet Content */}
              <div className="text-xs text-slate-950 dark:text-slate-350 leading-relaxed font-sans text-justify p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg italic">
                {result.excerpt}
              </div>

              {/* Citations and Actions footer */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 text-[10px] font-bold">
                
                {/* Citations List */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-900 dark:text-slate-500 uppercase tracking-wider">Citations:</span>
                  {result.citations.map((cit, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-400 rounded-sm border border-slate-200 dark:border-slate-750 font-mono"
                    >
                      {cit}
                    </span>
                  ))}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center gap-4 text-slate-900 dark:text-slate-450">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-900 dark:text-emerald-500" />
                    <span>Published: {result.pubDate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-900 dark:text-emerald-500" />
                    <span>Jurisdiction: {result.region}</span>
                  </span>
                  <Link 
                    href="/policies"
                    className="inline-flex items-center gap-1 text-blue-900 hover:text-blue-950 dark:text-emerald-450 dark:hover:text-white transition-all cursor-pointer"
                  >
                    <span>Inspect Full Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

              </div>

            </CardContent>
          </Card>
        ))}

        {filteredResults.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-slate-800 dark:text-slate-400 font-medium">
            No policy documents found matching your filter parameters. Try expanding your search queries.
          </div>
        )}
      </div>

    </div>
  );
}
