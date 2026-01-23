import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Database, Users, Package, TrendingUp, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Content } from "@google/genai";
import { dbService } from '../db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const TechAgentPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hello! I\'m your AI Tech Agent. I can help you with business insights, data analysis, and answer questions about your workshop. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      if (!apiKey) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Please set your Gemini API key in Settings to use the AI Tech Agent.'
        }]);
        setLoading(false);
        return;
      }

      const genai = new GoogleGenAI({ apiKey });

      // Get business context
      const [customers, jobs, inventory, invoices] = await Promise.all([
        dbService.getCustomers(),
        dbService.getComplaints(),
        dbService.getInventory(),
        dbService.getInvoices()
      ]);

      const context = `
You are a helpful AI assistant for a bike service workshop. Here's the current business data:
- Total Customers: ${customers.length}
- Active Service Jobs: ${jobs.filter(j => j.status !== 'completed').length}
- Inventory Items: ${inventory.length}
- Total Invoices: ${invoices.length}

Answer the user's question based on this context. Be concise and helpful.
`;

      const contents: Content[] = [
        { role: 'user', parts: [{ text: context }] },
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const result = await genai.generateContent({
        contents,
        config: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      });

      const response = result.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please check your API key and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    { icon: Database, label: 'Business Summary', question: 'Give me a summary of my business performance' },
    { icon: Users, label: 'Top Customers', question: 'Who are my top customers?' },
    { icon: Package, label: 'Low Stock', question: 'Which items are low in stock?' },
    { icon: TrendingUp, label: 'Revenue', question: 'What\'s my revenue trend?' }
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Tech Agent</h1>
            <p className="text-xs text-blue-100">Your smart business assistant</p>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Quick Questions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                onClick={() => handleQuickQuestion(q.question)}
                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
              >
                <q.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] rounded-2xl px-4 py-3
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-900 border border-slate-200'}
              `}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-600">AI Agent</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your business..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechAgentPage;
