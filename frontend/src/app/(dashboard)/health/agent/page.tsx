// app/(dashboard)/health/agent/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  HeartPulse, ArrowLeft, Send, Sparkles, AlertTriangle, ShieldCheck, 
  MapPin, Archive, RefreshCw, BarChart3, Settings, ClipboardList
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { AgentResponseCard } from '@/components/health/AgentResponseCard';
import { cn } from '@/lib/utils';

export default function HealthAgentChat() {
  const { agentChatHistory, loading, queryAgent } = useHealthStore();
  const [inputText, setInputText] = useState('');
  const [district, setDistrict] = useState('Lucknow');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    queryAgent(inputText, district);
    setInputText('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentChatHistory, loading]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Back button and header */}
      <div className="flex items-center gap-3 border-b border-[#1A2744] pb-5">
        <Link href="/health">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-[#101F42]/40 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            AI Health Governance Agent
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Model 9 — Chat interface providing epidemiology guidance, containment recommendations, and strategic divert actions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Settings (3 cols) */}
        <div className="lg:col-span-3">
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Agent Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Context District</label>
                <select 
                  value={district} 
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white"
                >
                  {["Lucknow", "Agra", "Kanpur", "Varanasi", "Allahabad"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed pt-2">
                <span className="font-bold text-slate-300 block mb-1">Inquiry Examples:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>"Analyze dengue risk in Lucknow"</li>
                  <li>"Explain cholera spread triggers in Agra"</li>
                  <li>"Recommend containment actions for malaria"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side Chat window (9 cols) */}
        <div className="lg:col-span-9 flex flex-col h-[650px]">
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white flex-1 flex flex-col overflow-hidden">
            
            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Default Welcome */}
              <div className="flex gap-4 items-start max-w-2xl bg-[#101F42]/20 border border-[#1A2744] rounded-lg p-4">
                <div className="p-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#D4AF37]">NETRAVAAH Health Officer Agent</h4>
                  <p className="text-xs text-slate-350 leading-relaxed mt-1">
                    Greetings Commissioner. I am your AI Health Governance assistant, connected to live district feature stores, historical disease reports, and weather telemetry. Ask me to analyze vector spikes or suggest resources for containment.
                  </p>
                </div>
              </div>

              {/* Chat messages */}
              {agentChatHistory.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-4 items-start max-w-3xl",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}>
                  {/* Avatar */}
                  <div className={cn(
                    "p-2 rounded-xl text-xs font-bold shrink-0",
                    msg.role === 'user' 
                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" 
                      : "bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]"
                  )}>
                    {msg.role === 'user' ? 'GOV' : 'AI'}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "rounded-lg p-4 border text-xs leading-relaxed max-w-full",
                    msg.role === 'user' 
                      ? "bg-[#1A3A6C]/30 border-[#3A5D9C]/50 text-white" 
                      : "bg-[#070D1A] border-[#1A2744] text-slate-200"
                  )}>
                    {msg.role === 'agent' ? (
                      <div className="space-y-4">
                        {/* Preserve lines */}
                        <div className="whitespace-pre-line font-medium">{msg.text}</div>
                        {msg.report && <AgentResponseCard report={msg.report} />}
                      </div>
                    ) : (
                      <p className="font-semibold">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading bubble */}
              {loading && (
                <div className="flex gap-4 items-start max-w-lg">
                  <div className="p-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] shrink-0 font-bold text-xs">
                    AI
                  </div>
                  <div className="rounded-lg p-4 border bg-[#070D1A] border-[#1A2744] text-slate-400 text-xs flex items-center gap-2 font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    Analyzing district features and models...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <div className="border-t border-[#1A2744] p-4 bg-[#070D1A]/60">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask the AI Governance Agent (e.g. 'Analyze dengue risk in Lucknow')"
                  className="flex-1 bg-[#101F42]/80 border border-[#1A2744] rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]/50"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  disabled={loading || !inputText.trim()}
                  className="bg-[#1A3A6C] hover:bg-[#2A4D8C] text-white border border-[#3A5D9C] p-3 px-4 h-auto rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
}
