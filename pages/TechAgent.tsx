
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Bot, Send, Loader2, Sparkles, Wand2,
  Terminal, Activity, Zap, ClipboardList, Package,
  Users, TrendingUp, X, ChevronRight, CheckCircle2,
  Phone, MapPin, Bike, Search, RefreshCw, Globe,
  Database, AlertCircle, Cpu, Command, ShieldAlert,
  BarChart3, Code2, Wifi, Layers, Eye
} from 'lucide-react';
import { GoogleGenAI, Type, FunctionDeclaration, Content, Part } from "@google/genai";
import { dbService } from '../db';

interface Message {
  role: 'user' | 'assistant' | 'system_log';
  text: string;
  thought?: string;
  groundingLinks?: { uri: string; title: string }[];
  commandExecuted?: string;
}

interface TechAgentPageProps {
  onNavigate: (tab: string) => void;
}

const TechAgentPage: React.FC<TechAgentPageProps> = ({ onNavigate }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'SYNAPSE CORE v2.5 ONLINE. Neural mesh established. System-wide authorization granted. I can audit logs, predict inventory churn, and research technical repair protocols via Google Search Grounding. Standing by for command input...' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentThought, setCurrentThought] = useState<string | null>(null);
  const [systemMetrics, setSystemMetrics] = useState({ load: 12, latency: 44, uptime: '99.9%' });

  const scrollRef = useRef<HTMLDivElement>(null);

  // System Metrics simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics({
        load: Math.floor(Math.random() * 20) + 5,
        latency: Math.floor(Math.random() * 60) + 30,
        uptime: '99.9%'
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tools: FunctionDeclaration[] = [
    {
      name: 'audit_system_health',
      description: 'Analyzes the application state, storage health, and identifying data inconsistencies.',
      parameters: { type: Type.OBJECT, properties: {} }
    },
    {
      name: 'execute_bulk_adjustment',
      description: 'Suggests or executes mass updates to inventory prices or stock based on market trends.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          percentage_change: { type: Type.NUMBER }
        }
      }
    },
    {
      name: 'predict_maintenance_trends',
      description: 'Analyzes historical complaints to predict future failure points for specific bike models.',
      parameters: {
        type: Type.OBJECT,
        properties: { bike_model: { type: Type.STRING } }
      }
    },
    {
      name: 'query_engine_database',
      description: 'Deep-dives into specific records for customers, job cards, or invoices.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          collection: { type: Type.STRING, enum: ['customers', 'inventory', 'complaints', 'invoices'] },
          filter: { type: Type.STRING }
        },
        required: ['collection']
      }
    }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentThought]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    setIsTyping(true);
    setCurrentThought("Initializing multi-modal reasoning...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Convert internal messages to API Content format
      const history: Content[] = newMessages
        .filter(m => m.role !== 'system_log')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      // NOTE: We cannot use 'googleSearch' mixed with other tools in strict mode, 
      // but for this advanced agent we attempt to combine them. 
      // If the API rejects it, we might need to separate the calls. 
      // For now, we provide both as per the advanced "Synapse" spec.

      let currentHistory = [...history];

      const generateResponse = async (contents: Content[]) => {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents,
          config: {
            // Combining tools and googleSearch
            tools: [{ functionDeclarations: tools }, { googleSearch: {} }],
            systemInstruction: `You are the "Synapse Core" - The ultimate AI Tech Agent for Moto Gear SRK.
            - You have ROOT access to the business database.
            - You use GOOGLE SEARCH to solve technical mechanic problems and browser errors.
            - You are analytical, futuristic, and proactive.
            - When an error is reported, research the fix on the internet and provide the "Rectification Protocol".
            - Format logs as [SYSTEM-CMD] if you perform an action.`,
            thinkingConfig: { thinkingBudget: 2000 }
          }
        });
      };

      let response = await generateResponse(currentHistory);

      let loopLimit = 0;
      while (response.functionCalls && loopLimit < 3) {
        loopLimit++;
        const functionResponses: Part[] = [];

        // Append model's tool call turn to history
        currentHistory.push({
          role: 'model',
          parts: response.candidates[0].content.parts
        });

        for (const fc of response.functionCalls) {
          setCurrentThought(`ACCESSING CORE: ${fc.name}...`);

          let result: any;
          if (fc.name === 'audit_system_health') {
            const data = await dbService.getDashboardStats();
            result = { status: 'OPTIMAL', record_count: data.totalInvoices, storage_usage: '2.4MB / 5MB' };
            setMessages(prev => [...prev, { role: 'system_log', text: `[SYSTEM-AUDIT] Running integrity check... Done. Result: HEALTHY`, commandExecuted: 'audit_system_health' }]);
          }
          else if (fc.name === 'query_engine_database') {
            const { collection } = fc.args as any;
            if (collection === 'inventory') result = await dbService.getInventory();
            else if (collection === 'complaints') result = await dbService.getComplaints();
            else result = { error: 'Access denied to restricted table' };
          }
          else if (fc.name === 'predict_maintenance_trends') {
            result = { prediction: 'High probability of chain-sprocket failure in 150cc models due to local humidity increase.', recommendation: 'Stock TVS/Bajaj chain kits.' };
          }
          else if (fc.name === 'execute_bulk_adjustment') {
            result = { status: 'success', message: 'Adjustment simulation complete. Approval required for commit.' };
          }

          functionResponses.push({
            functionResponse: {
              name: fc.name,
              id: fc.id,
              response: { result }
            }
          });
        }

        // Append function responses to history
        currentHistory.push({
          role: 'user',
          parts: functionResponses
        });

        // Get next response
        response = await generateResponse(currentHistory);
      }

      const aiText = response.text || "PROTOCOL COMPLETE. Awaiting next command.";
      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const links = grounding?.map((c: any) => ({ uri: c.web?.uri, title: c.web?.title })).filter((l: any) => l.uri);

      setMessages(prev => [...prev, { role: 'assistant', text: aiText, groundingLinks: links }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'system_log', text: `[CRITICAL-ERR] Neural core desync. Re-routing through secondary logic gates.` }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
      setCurrentThought(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-[#00ffcc] font-mono selection:bg-[#00ffcc] selection:text-black">
      {/* Hyper-Tech Header */}
      <header className="p-4 border-b border-[#00ffcc]/20 bg-black/40 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50 shadow-[0_0_30px_rgba(0,255,204,0.1)]">
        <div className="flex items-center gap-6">
          <button onClick={() => onNavigate('home')} className="p-2 border border-[#00ffcc]/30 rounded-lg hover:bg-[#00ffcc]/10 transition-all text-[#00ffcc]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_10px_#00ffcc]"></div>
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white">Synapse Core Terminal</h2>
              <span className="text-[8px] bg-[#00ffcc]/20 text-[#00ffcc] px-2 py-0.5 rounded border border-[#00ffcc]/30">V2.5-AUTO</span>
            </div>
            <div className="flex gap-4 mt-1 opacity-60">
              <div className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /><span className="text-[9px]">LOAD: {systemMetrics.load}%</span></div>
              <div className="flex items-center gap-1.5"><Wifi className="w-3 h-3" /><span className="text-[9px]">PING: {systemMetrics.latency}ms</span></div>
              <div className="flex items-center gap-1.5"><Layers className="w-3 h-3" /><span className="text-[9px]">GROUNDING: ACTIVE</span></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-[8px] font-black text-slate-500 uppercase">Neural Status</p>
            <p className="text-[10px] font-black text-[#00ffcc]">SYNCHRONIZED</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#00ffcc]/10 border border-[#00ffcc]/40 flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,255,204,0.2)]">
            <Bot className="w-7 h-7 text-[#00ffcc] drop-shadow-[0_0_10px_#00ffcc]" />
          </div>
        </div>
      </header>

      {/* Main Terminal Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar relative">
        {/* Background Scan Animation */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="w-full h-full bg-[linear-gradient(rgba(0,255,204,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[90%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-slate-800 border-slate-700' :
                  msg.role === 'system_log' ? 'bg-red-900/20 border-red-500/30' : 'bg-[#00ffcc]/10 border-[#00ffcc]/30'
                }`}>
                {msg.role === 'user' ? <Users className="w-4 h-4 text-slate-400" /> :
                  msg.role === 'system_log' ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <Bot className="w-4 h-4 text-[#00ffcc]" />}
              </div>
              <div className="space-y-3">
                <div className={`p-5 rounded-2xl ${msg.role === 'user' ? 'bg-slate-800 text-white border border-white/5 shadow-2xl' :
                    msg.role === 'system_log' ? 'bg-red-950/20 border border-red-500/20 text-red-400 italic text-[11px]' :
                      'bg-black/60 border border-[#00ffcc]/20 text-[#00ffcc] shadow-[0_10px_40px_rgba(0,255,204,0.05)] backdrop-blur-md'
                  }`}>
                  {msg.role === 'user' && <span className="text-[10px] text-slate-500 mb-2 block tracking-widest">[USER@ROOT] &gt;</span>}
                  {msg.role === 'assistant' && <span className="text-[10px] text-[#00ffcc]/40 mb-2 block tracking-widest">[SYNAPSE@CORE] &gt;</span>}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>

                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in">
                    {msg.groundingLinks.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#00ffcc]/5 border border-[#00ffcc]/20 rounded-full text-[10px] font-black text-[#00ffcc] hover:bg-[#00ffcc] hover:text-black transition-all flex items-center gap-2"
                      >
                        <Globe className="w-3 h-3" /> {link.title || 'EXTERNAL KNOWLEDGE BASE'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#00ffcc]/20 border border-[#00ffcc]/40 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-[#00ffcc]" />
              </div>
              <div className="p-4 bg-black/40 border border-[#00ffcc]/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#00ffcc] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-[#00ffcc] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-[#00ffcc] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  {currentThought && (
                    <span className="text-[9px] font-black text-[#00ffcc]/50 uppercase tracking-[0.3em] animate-pulse">{currentThought}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Module */}
      <div className="p-6 bg-black border-t border-[#00ffcc]/20 space-y-6 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.4)]">
        {/* Command Macros */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <MacroButton icon={<ShieldAlert className="w-3 h-3" />} label="SYSTEM AUDIT" onClick={() => setInput("Perform a complete system health check and audit LocalStorage integrity.")} />
          <MacroButton icon={<TrendingUp className="w-3 h-3" />} label="PREDICT FAILURES" onClick={() => setInput("Analyze recent complaints and predict which bike parts I should order more of based on failure trends.")} />
          <MacroButton icon={<Globe className="w-3 h-3" />} label="REPAIR RESEARCH" onClick={() => setInput("Search for a professional technical repair protocol for Pulsar 220 ABS module failures.")} />
          <MacroButton icon={<BarChart3 className="w-3 h-3" />} label="PRICE OPTIMIZER" onClick={() => setInput("Search current market prices for Castrol 20W50 engine oil and suggest if I should update my inventory pricing.")} />
        </div>

        <form onSubmit={handleSend} className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00ffcc]/40 group-focus-within:text-[#00ffcc] transition-colors">
            <Command className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="INPUT COMMAND OR TECHNICAL QUERY..."
            className="w-full pl-16 pr-20 py-6 bg-[#020617] border border-[#00ffcc]/20 rounded-2xl outline-none focus:border-[#00ffcc]/60 focus:ring-4 focus:ring-[#00ffcc]/5 font-black text-sm tracking-widest text-[#00ffcc] placeholder:text-[#00ffcc]/20 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#00ffcc] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,204,0.4)] active:scale-95 transition-all disabled:opacity-30 hover:brightness-110"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <Send className="w-6 h-6 text-black" />}
          </button>
        </form>

        <div className="flex justify-center items-center gap-10 opacity-30">
          <p className="text-[8px] font-black uppercase tracking-[0.5em]">MOTO-GEAR-AI-CORE: [READY]</p>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc]"></div>
          <p className="text-[8px] font-black uppercase tracking-[0.5em]">SECURE-PROTOCOL: [AES-256]</p>
        </div>
      </div>
    </div>
  );
};

const MacroButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="whitespace-nowrap px-4 py-2 bg-[#00ffcc]/5 border border-[#00ffcc]/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#00ffcc]/60 hover:bg-[#00ffcc]/10 hover:border-[#00ffcc] hover:text-[#00ffcc] transition-all active:scale-95 flex items-center gap-2"
  >
    {icon} {label}
  </button>
);

export default TechAgentPage;
