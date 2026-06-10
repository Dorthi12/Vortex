'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Send, 
  BookOpen, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight, 
  User, 
  Database,
  Link2,
  Bookmark,
  RefreshCw,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: { title: string; link: string }[];
}

const PRESET_QUESTIONS = [
  "How is patient consent managed in the Digital Health Mission?",
  "What is the daily water supply requirement under the Jal Jeevan Mission?",
  "Does PMAY-U 2.0 require solar roofing or waste plants?",
  "Who is eligible for smart soil health sensor subsidies?"
];

const CHAT_ANSWERS: Record<string, { answer: string; citations: { title: string; link: string }[] }> = {
  "How is patient consent managed in the Digital Health Mission?": {
    answer: "Patient consent in the National Digital Health Mission (NDHM) is managed via a dedicated cryptographic consent manager platform. Under Section 1.2, medical practitioners and clinics cannot query patient health files or diagnostics history without explicit, time-bound consent. The patient app generates digital authorization tokens that expire automatically, securing health data privacy. The data security standards align with the IT Act Section 43A guidelines.",
    citations: [
      { title: "MOHFW-NDHM-2026 // Sec 1.2: Consent Architecture", link: "/policies" },
      { title: "G.S.R. 412(E) - Health Data Privacy Regulations 2024", link: "/policies/search" }
    ]
  },
  "What is the daily water supply requirement under the Jal Jeevan Mission?": {
    answer: "Under the Jal Jeevan Mission Section 3.1, every household must receive a minimum water supply of 55 liters per capita per day (lpcd) of potable water at adequate pressure. Section 3.2 mandates that digital IoT flow-rate sensors must be installed at localized distribution nodes. These sensors log volumes in real-time, automatically triggering leakage warning codes to the state directory if flow drops are sustained for more than 10 minutes.",
    citations: [
      { title: "MOWR-JJM-2026 // Sec 3.1 & 3.2: Water Standards", link: "/policies" },
      { title: "Jal Shakti Clean Water Act Directive 2023", link: "/policies/search" }
    ]
  },
  "Does PMAY-U 2.0 require solar roofing or waste plants?": {
    answer: "Yes, Pradhan Mantri Awas Yojana Urban (PMAY-U 2.0) introduces green guidelines under Section 2.4 and 3.1. All projects exceeding 50 residential units must incorporate greywater recovery setups and composting processing stations. Section 3.1 mandates grid-tied net-metering solar arrays (1kW minimum capacity) for units to optimize electricity costs and ease localized substation peak loading.",
    citations: [
      { title: "MOHUA-PMAY-2026 // Sec 2.4 & 3.1: Energy Guidelines", link: "/policies" },
      { title: "National Building Code of India (NBC) 2025 Revision", link: "/policies/search" }
    ]
  },
  "Who is eligible for smart soil health sensor subsidies?": {
    answer: "Under Section 1.2 of the Smart Agriculture & Soil Health (SASH) Protocol, farmers holding more than 2 hectares of agricultural land qualify for an 80% state subsidy on IoT soil health probes. These probes transmit crop moisture and NPK profiles. In return, Section 2.3 mandates adherence to local aquifer conservation directives, restricting water-intensive crops like sugarcane in overdrafted blocks.",
    citations: [
      { title: "MOA-SASH-2026 // Sec 1.2 & 2.3: Sensor Rules", link: "/policies" },
      { title: "Aquifer Overdraft Containment Policy, Rule 12B", link: "/policies/search" }
    ]
  }
};

export default function PolicyChat() {
  const { setActiveTab } = useUiStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content: "Namaskar. I am the Netravaah Policy RAG Intelligence System. I can query our secure document repository to answer questions regarding guidelines, allocations, and references. What policy area would you like to investigate today?",
      timestamp: '17:51'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab('Policy Intelligence');
  }, [setActiveTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate RAG Query
    setTimeout(() => {
      let matched = CHAT_ANSWERS[text];
      
      // Fallback response for custom queries
      if (!matched) {
        // Try simple keyword matching
        const lowercaseText = text.toLowerCase();
        const foundKey = Object.keys(CHAT_ANSWERS).find(key => 
          lowercaseText.includes(key.toLowerCase()) || 
          key.toLowerCase().split(' ').some(word => word.length > 4 && lowercaseText.includes(word))
        );
        
        if (foundKey) {
          matched = CHAT_ANSWERS[foundKey];
        } else {
          matched = {
            answer: `I searched the policy vault for "${text}" but could not retrieve high-confidence guidelines. For data verification, please consult the Schemes Catalog directory or perform an Advanced Search with specific legislative numbers.`,
            citations: [
              { title: "National Schemes Catalog Directory", link: "/policies" },
              { title: "Legislative Advanced Search Console", link: "/policies/search" }
            ]
          };
        }
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: matched.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: matched.citations
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handlePresetClick = (question: string) => {
    if (isTyping) return;
    handleSendMessage(question);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-init',
        sender: 'assistant',
        content: "Namaskar. I am the Netravaah Policy RAG Intelligence System. I can query our secure document repository to answer questions regarding guidelines, allocations, and references. What policy area would you like to investigate today?",
        timestamp: '17:51'
      }
    ]);
  };

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
            Policy RAG Chat Interface
          </h1>
          <p className="text-slate-800 dark:text-slate-400 text-sm mt-0.5 font-medium">
            Ask conversational questions to retrieve certified policy extracts, sub-clauses, and sources.
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <Link href="/policies" className="px-4 py-2 text-xs font-bold rounded-lg text-slate-900 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
            📚 Catalog
          </Link>
          <Link href="/policies/search" className="px-4 py-2 text-xs font-bold rounded-lg text-slate-900 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
            🔍 Advanced Search
          </Link>
          <Link href="/policies/chat" className="px-4 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700">
            💬 RAG Chat
          </Link>
        </div>
      </div>

      {/* 2. Main Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Chat Area (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[580px] border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
          
          {/* Chat Top Banner */}
          <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-slate-800 rounded-lg text-blue-900 dark:text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-950 dark:text-white">Active RAG Engine</h3>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">CONNECTED TO LAWS_VAULT_V2</p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="text-xs font-bold text-slate-900 hover:text-red-600 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-850 px-2 py-1 rounded transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>

          {/* Messages Window */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex items-start gap-3.5 max-w-[85%] animate-in fade-in duration-200",
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* Avatar Icon */}
                <div className={cn(
                  "p-2 rounded-xl border text-xs shrink-0 select-none",
                  msg.sender === 'user'
                    ? 'bg-blue-600 border-blue-600 text-white dark:bg-emerald-600 dark:border-emerald-600'
                    : 'bg-card border-border text-slate-900 dark:text-emerald-450'
                )}>
                  {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Sparkles className="w-4.5 h-4.5" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-2.5">
                  <div className={cn(
                    "p-4 rounded-2xl border text-xs leading-relaxed font-medium shadow-2xs",
                    msg.sender === 'user'
                      ? 'bg-blue-50/80 border-blue-200 text-slate-950 dark:bg-slate-900 dark:border-slate-800 dark:text-white'
                      : 'bg-card border-border text-slate-950 dark:text-slate-100'
                  )}>
                    {msg.sender === 'assistant' && (
                      <p className="text-[8px] font-bold tracking-widest text-blue-900 dark:text-emerald-500 uppercase mb-2 font-mono">
                        VERIFIED AI DIRECTIVE EXTRACT
                      </p>
                    )}
                    <p className="text-justify font-sans">{msg.content}</p>
                  </div>

                  {/* Message Citations/Sources Footer */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-col gap-1.5 bg-card border border-border p-3 rounded-xl shadow-3xs animate-in slide-in-from-bottom-2 duration-200">
                      <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-500 flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5 text-blue-900 dark:text-emerald-500" />
                        <span>Referenced Guidelines & Citations</span>
                      </span>
                      <div className="flex flex-col gap-1">
                        {msg.citations.map((cit, idx) => (
                          <Link 
                            key={idx} 
                            href={cit.link}
                            className="text-[10px] font-bold text-blue-900 hover:text-blue-950 dark:text-emerald-400 dark:hover:text-emerald-300 font-mono flex items-center gap-1 hover:underline"
                          >
                            <span>• {cit.title}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="block text-[8px] text-slate-850 dark:text-slate-500 font-bold px-1.5">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-3.5 max-w-[80%]">
                <div className="p-2 rounded-xl border bg-card border-border text-slate-900 dark:text-emerald-450 shrink-0 select-none">
                  <Sparkles className="w-4.5 h-4.5 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card text-xs text-slate-900 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white animate-bounce" />
                  <span className="text-[10px] font-bold font-mono ml-1">RETRIEVING LAWS VAULT DATA...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-border flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about government schemes guidelines or clauses..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-card border border-border rounded-xl text-xs text-slate-950 dark:text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-600 dark:focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>

        </div>

        {/* Right: Presets & Info Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Preset Questions Panel */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4.5 h-4.5 text-blue-900 dark:text-emerald-500" />
                <span>Audited Policy Presets</span>
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-900 dark:text-slate-400 font-medium">
                Click a preset question to run a simulated RAG pipeline query.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4.5 space-y-2.5">
              {PRESET_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(question)}
                  disabled={isTyping}
                  className="w-full text-left p-3 text-xs bg-slate-50 hover:bg-blue-50/70 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 hover:border-blue-600 dark:hover:border-emerald-500 rounded-xl transition-all cursor-pointer font-sans leading-snug font-semibold text-slate-950 dark:text-slate-350"
                >
                  {question}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* RAG Constraints and Info Card */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 flex items-center gap-1">
              <Info className="w-4.5 h-4.5 text-blue-900 dark:text-emerald-500" />
              <span>Policy Intelligence Scope</span>
            </h3>
            <div className="text-[11px] text-slate-950 dark:text-slate-400 space-y-2 leading-relaxed font-sans font-medium">
              <p>
                The RAG (Retrieval-Augmented Generation) chat system is configured to perform similarity embeddings matches over current financial-year Gazettes, ministerial directives, and PWD bylaws.
              </p>
              <div className="p-2.5 bg-amber-500/10 text-amber-900 dark:text-amber-400 rounded-lg border border-amber-500/20 text-[10px] font-bold">
                ⚠️ Verification is mandated. Directives marked under review should not be utilized in regulatory litigation.
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
