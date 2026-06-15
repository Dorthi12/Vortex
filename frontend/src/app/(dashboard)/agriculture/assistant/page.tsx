'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Mic, Send, BookOpen, ChevronRight, Volume2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTED_PROMPTS = [
  "Best crop for my land?",
  "Which subsidy can I apply for?",
  "Why is my yield decreasing?",
  "What fertilizer should I use?"
];

export default function FarmerAssistant() {
  const store = useAgricultureStore();
  const [inputText, setInputText] = useState('');
  const [voicePulse, setVoicePulse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    store.sendAssistantMessage(inputText);
    setInputText('');
  };

  const handleVoiceSimulate = () => {
    setVoicePulse(true);
    setTimeout(() => {
      setInputText("What fertilizer should I use for sugarcane?");
      setVoicePulse(false);
    }, 2000);
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.assistantMessages]);

  // Read citations of the last assistant message
  const lastMsg = [...store.assistantMessages].reverse().find(m => m.role === 'assistant');
  const activeCitations = lastMsg?.citations || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              AI Decision Assistants
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Farmer Assistant (RAG Helpdesk)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Query agricultural guidelines, welfare schemes, and crop disease logs using natural language retrieval-augmented generation.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main split grid: Chat and Citation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Suggested Prompts list (visible on desktop) */}
        <div className="lg:col-span-3 space-y-4 hidden lg:block">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">Suggested Inquiries</span>
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInputText(prompt)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-[#1A2744] hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-xs font-semibold text-slate-750 dark:text-slate-350 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>{prompt}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>

          <Card className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-2">
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Direct Dial Help</span>
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              Farmers can also query via local IVR voice lines in Marathi, Hindi, or Tamil by calling toll-free: 1800-425-GOV.
            </p>
          </Card>
        </div>

        {/* Center: Interactive Chat Window */}
        <div className="lg:col-span-6 flex flex-col min-h-[440px] max-h-[500px] bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] rounded-2xl overflow-hidden shadow-xs">
          
          {/* Chat messages feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {store.assistantMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%] space-y-1.5",
                    isUser ? "self-end ml-auto items-end" : "self-start items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-semibold shadow-2xs",
                    isUser 
                      ? "bg-emerald-600 text-white rounded-br-none" 
                      : "bg-slate-100 dark:bg-[#070D1A] text-slate-800 dark:text-slate-100 border border-slate-150 dark:border-[#1A2744] rounded-bl-none"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-400 px-1 font-bold">{msg.timestamp}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-150 dark:border-[#1A2744] bg-slate-50/50 dark:bg-[#080E1E] flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleVoiceSimulate}
              className={cn(
                "h-10 w-10 shrink-0 rounded-xl cursor-pointer flex items-center justify-center transition-all",
                voicePulse ? "bg-red-500 text-white animate-pulse" : "text-slate-500"
              )}
            >
              <Mic className="w-4.5 h-4.5" />
            </Button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={voicePulse ? "Listening... Speak now" : "Ask assistant about crops or subsidies..."}
              disabled={voicePulse}
              className="flex-1 h-10 px-3 bg-white dark:bg-[#070D1A] border border-slate-200 dark:border-[#1A2744] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            />

            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

        </div>

        {/* Right: Citations Panel */}
        <div className="lg:col-span-3 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">References & Citations</span>
          
          <AnimatePresence mode="wait">
            {activeCitations.length > 0 ? (
              <motion.div 
                key="citations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {activeCitations.map((cit, idx) => (
                  <Card key={idx} className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                      <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold truncate">{cit.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold italic">
                      "{cit.snippet}"
                    </p>
                    <a 
                      href={cit.link} 
                      className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block hover:underline"
                    >
                      View Source PDF
                    </a>
                  </Card>
                ))}
              </motion.div>
            ) : (
              <div className="border border-dashed border-slate-350 dark:border-[#1A2744] rounded-2xl p-6 py-10 text-center text-[10px] text-slate-450 bg-slate-50/20 dark:bg-[#0A1228]/10 font-bold">
                No active citations. Submit a question in the chat to extract verified agricultural policy references.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
