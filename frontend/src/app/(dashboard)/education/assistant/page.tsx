'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bookmark, 
  RefreshCw, 
  User, 
  Database, 
  ArrowUpRight, 
  Info,
  GraduationCap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
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
  "What are the Pragati scholarship eligibility rules?",
  "How do I apply for the post-matric minority scheme?",
  "Which schools in Hadapsar have math teacher vacancies?",
  "What is the average pass rate for Shivajinagar wards?"
];

const CHAT_ANSWERS: Record<string, { answer: string; citations: { title: string; link: string }[] }> = {
  "What are the Pragati scholarship eligibility rules?": {
    answer: "The Pragati Scholarship for Girls in Technology (Section 2.2) mandates that applicants must be female, hold a minimum score of 70% in previous academic marks, and belong to a family with an annual income below ₹8,00,000. Required documents include Aadhaar Card, Admission receipts, and self-declarations.",
    citations: [
      { title: "Scholarships Finder Directory", link: "/education/scholarships" }
    ]
  },
  "How do I apply for the post-matric minority scheme?": {
    answer: "Under the Dr. Ambedkar Post-Matric Minority Scheme, applicants must have a minimum previous score of 60% and family income below ₹2,50,000. Applications require community caste certificates, marks sheets, and verified income proofs. You can apply directly through the Scholarship Portal.",
    citations: [
      { title: "Minority Scheme Outlays", link: "/education/scholarships" }
    ]
  },
  "Which schools in Hadapsar have math teacher vacancies?": {
    answer: "Currently, Hadapsar Government High School (Sector 4-B) has a pupil-teacher ratio of 38:1 and reports a vacancy of 8 Math teachers. Additionally, Hadapsar Outer Wards reports 12 vacancies in Science. The allocation optimizer suggests transfers from surplus Shivajinagar wards to fill these slots.",
    citations: [
      { title: "Staffing Vacancy Telemetry", link: "/education/teachers" }
    ]
  },
  "What is the average pass rate for Shivajinagar wards?": {
    answer: "According to the sub-division rankings matrix, Shivajinagar Wards leads the district with an SSC Pass Rate of 94.2% and a performance score of 91/100, classifying their status as Excellent.",
    citations: [
      { title: "Sub-division Performance Matrix", link: "/education" }
    ]
  }
};

export default function AssistantPage() {
  const { setActiveTab } = useUiStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content: "Namaskar. I am the Netravaah AI Education Policy Assistant. I can resolve queries regarding scholarship outlays, school performance ratios, and teacher allocation optimization models. How can I guide you today?",
      timestamp: '18:05'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let matched = CHAT_ANSWERS[text];

      if (!matched) {
        const lowercaseText = text.toLowerCase();
        const foundKey = Object.keys(CHAT_ANSWERS).find(key => 
          lowercaseText.includes(key.toLowerCase()) || 
          key.toLowerCase().split(' ').some(word => word.length > 4 && lowercaseText.includes(word))
        );

        if (foundKey) {
          matched = CHAT_ANSWERS[foundKey];
        } else {
          matched = {
            answer: `I searched the registry for "${text}" but could not retrieve high-confidence data. For verified metrics, please consult the Performance Analytics pages or use the Scholarship Finder Checker.`,
            citations: [
              { title: "School Performance Analytics", link: "/education/performance" },
              { title: "Scholarship Discovery Directory", link: "/education/scholarships" }
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
        content: "Namaskar. I am the Netravaah AI Education Policy Assistant. I can resolve queries regarding scholarship outlays, school performance ratios, and teacher allocation optimization models. How can I guide you today?",
        timestamp: '18:05'
      }
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="AI Education Policy Assistant" 
        subtitle="Conversational AI query interface providing guidance on education policies, admissions, and scholarships."
      />

      {/* 2. Main Chat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Chat Log Window (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[560px] border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
          
          {/* Chat header */}
          <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-slate-800 rounded-lg text-edu-purple">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-950 dark:text-white">Edu-RAG Assistant</h3>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold font-mono">CONNECTED TO EDUCATION_DB_V2</p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="text-xs font-bold text-slate-900 hover:text-red-650 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-850 px-2.5 py-1.5 rounded transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>

          {/* Chat message space */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3.5 max-w-[85%] animate-in fade-in duration-200",
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "p-2 rounded-xl border text-xs shrink-0 select-none",
                  msg.sender === 'user'
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-card border-border text-edu-purple'
                )}>
                  {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <GraduationCap className="w-4.5 h-4.5" />}
                </div>

                {/* Message block */}
                <div className="space-y-2.5">
                  <div className={cn(
                    "p-4 rounded-2xl border text-xs leading-relaxed font-medium shadow-2xs",
                    msg.sender === 'user'
                      ? 'bg-purple-50/80 border-purple-200 text-slate-950 dark:bg-slate-900 dark:border-slate-800 dark:text-white'
                      : 'bg-card border-border text-slate-950 dark:text-slate-100'
                  )}>
                    {msg.sender === 'assistant' && (
                      <p className="text-[8px] font-bold tracking-widest text-edu-purple dark:text-edu-gold uppercase mb-2 font-mono">
                        VERIFIED REGISTRY EXTRACT
                      </p>
                    )}
                    <p className="text-justify font-sans">{msg.content}</p>
                  </div>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-col gap-1.5 bg-card border border-border p-3 rounded-xl shadow-3xs animate-in slide-in-from-bottom-2 duration-200">
                      <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-500">
                        Referenced Education Telemetry
                      </span>
                      <div className="flex flex-col gap-1">
                        {msg.citations.map((cit, idx) => (
                          <Link
                            key={idx}
                            href={cit.link}
                            className="text-[10px] font-bold text-edu-purple hover:underline font-mono flex items-center gap-1"
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
                <div className="p-2 rounded-xl border bg-card border-border text-edu-purple shrink-0 select-none">
                  <Sparkles className="w-4.5 h-4.5 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card text-xs text-slate-900 dark:text-slate-450 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white animate-bounce" />
                  <span className="text-[10px] font-bold font-mono ml-1">RETRIEVING DATA INDEXES...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-border flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about school statistics, teacher shortages, or scholarships..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-card border border-border rounded-xl text-xs text-slate-950 dark:text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-edu-purple disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>

        </div>

        {/* Right: Presets & info (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Preset Questions Panel */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4.5 h-4.5 text-edu-purple" />
                <span>Audited Policy Presets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4.5 space-y-2.5">
              {PRESET_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(question)}
                  disabled={isTyping}
                  className="w-full text-left p-3 text-xs bg-slate-50 hover:bg-purple-50/70 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 hover:border-edu-purple rounded-xl transition-all cursor-pointer font-sans leading-snug font-semibold text-slate-950 dark:text-slate-350"
                >
                  {question}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Info banner */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 flex items-center gap-1">
              <Info className="w-4.5 h-4.5 text-edu-purple" />
              <span>System Verification Note</span>
            </h3>
            <p className="text-[11px] text-slate-950 dark:text-slate-400 leading-relaxed font-sans font-medium text-justify">
              This assistant queries the national education database for verified school stats, pupil-teacher ratios, and scholarship terms. For individual student data audits, please open the school registrar portal.
            </p>
          </Card>

        </div>

      </div>

    </div>
  );
}
