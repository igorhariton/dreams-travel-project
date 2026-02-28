import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MapPin, Globe2, Plane, Hotel, Sparkles, RefreshCw, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  typing?: boolean;
}

const QUICK_QUESTIONS = [
  '🏖️ Best beach destinations for couples',
  '🌿 Eco-friendly travel options',
  '💰 Budget travel tips for Europe',
  '🛂 Visa requirements for Maldives',
  '🌡️ Best time to visit Bali',
  '🍜 Must-try foods in Tokyo',
];

const BOT_RESPONSES: Record<string, string> = {
  'beach': 'Top beach destinations include the **Maldives** (crystal lagoons), **Santorini** (volcanic cliffs + sea), **Bali** (Seminyak & Uluwatu), and the **Amalfi Coast**. For couples, Maldives overwater bungalows are unbeatable! 🏖️',
  'eco': '🌿 Top eco-friendly destinations: **Costa Rica** (rainforest lodges), **New Zealand** (sustainable tourism), **Iceland** (geothermal energy), and **Bhutan** (carbon-negative). Always choose certified eco-accommodations!',
  'budget': '💡 Budget Europe tips: Travel in **shoulder season** (Mar-May, Sept-Nov), use **Eurail passes**, stay in **boutique hostels**, eat at local markets, and book **2-3 months ahead** for flights.',
  'visa': '🛂 The Maldives offers a **free 30-day visa on arrival** for most nationalities! All you need is a valid passport, return ticket, and proof of accommodation. No visa application required.',
  'bali': '🌴 Best time for Bali: **April-October** (dry season). July-August is peak but crowded. **May-June & Sept** are sweet spots — good weather, fewer tourists. Avoid December-March (monsoon season).',
  'tokyo': '🍣 Must-try in Tokyo: **Tsukiji Outer Market** sushi, **ramen at Ichiran**, **wagyu beef**, **izakaya hopping** in Shinjuku, **convenience store onigiri**, and **matcha everything**! Tokyo has more Michelin stars than any city.',
  'default': "Great question! I'm your AI travel assistant 🤖✈️. I can help with:\n\n• **Destination recommendations**\n• **Best travel seasons**\n• **Visa & entry requirements**\n• **Local cuisine & culture tips**\n• **Budget planning**\n• **Hotel & rental advice**\n\nWhat would you like to explore today?",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('beach') || lower.includes('couples')) return BOT_RESPONSES['beach'];
  if (lower.includes('eco') || lower.includes('sustainable') || lower.includes('environment')) return BOT_RESPONSES['eco'];
  if (lower.includes('budget') || lower.includes('cheap') || lower.includes('europe')) return BOT_RESPONSES['budget'];
  if (lower.includes('visa') || lower.includes('maldives') || lower.includes('entry')) return BOT_RESPONSES['visa'];
  if (lower.includes('bali') || lower.includes('time') || lower.includes('season')) return BOT_RESPONSES['bali'];
  if (lower.includes('tokyo') || lower.includes('japan') || lower.includes('food') || lower.includes('cuisine')) return BOT_RESPONSES['tokyo'];
  if (lower.includes('santorini') || lower.includes('greece')) return '🇬🇷 **Santorini** is magical! Best visited **April-October**. Stay in **Oia** for sunsets, explore **Fira** for nightlife, visit **Akrotiri** ruins. Budget: $150-400/night for caldera-view hotels. Fly into **Athens (ATH)** then take a 45-min flight or 8-hr ferry.';
  if (lower.includes('paris') || lower.includes('france')) return '🗼 **Paris** tips: Best in **April-May or September**. Must-see: **Eiffel Tower** (book online!), **Louvre**, **Montmartre**, **Versailles** day trip. Stay in Le Marais or Saint-Germain. Use the **Metro** — it\'s fast and cheap!';
  if (lower.includes('dubai') || lower.includes('uae')) return '🌆 **Dubai** is best **November-March** (cooler weather). Highlights: **Burj Khalifa** (sunset views!), **Dubai Mall**, **Desert Safari**, **Dubai Marina**. Note: dress modestly in public areas. Business hotels often offer great weekend deals.';
  return BOT_RESPONSES['default'];
}

let msgId = 1;

export default function ChatPage() {
  const { t } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: String(msgId++),
      role: 'bot',
      text: "Hello! I'm your **TravelDreams AI Assistant** 🌍✈️\n\nI'm here to help you plan the perfect journey. Ask me about destinations, hotels, visa requirements, local cuisine, or anything travel-related!\n\nWhere would you like to go? 🗺️",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    setInput('');

    const userMsg: Message = { id: String(msgId++), role: 'user', text: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 800));
    setIsTyping(false);

    const response = getBotResponse(messageText);
    const botMsg: Message = { id: String(msgId++), role: 'bot', text: response, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const clearChat = () => {
    setMessages([{
      id: String(msgId++),
      role: 'bot',
      text: "Chat cleared! 🌟 How can I help you plan your next adventure?",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">{t('chat.title')}</h1>
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {t('chat.online')} · Ready to help you travel
              </div>
            </div>
          </div>
          <button onClick={clearChat} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
            <RefreshCw size={14} /> Clear
          </button>
        </div>

        {/* Quick Questions */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q.slice(2))}
              className="shrink-0 bg-white border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 text-gray-700 hover:text-cyan-700 px-4 py-2 rounded-full text-xs font-medium transition-all shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-gradient-to-br from-blue-600 to-cyan-500' : 'bg-gradient-to-br from-gray-600 to-gray-800'}`}>
                  {msg.role === 'bot' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-lg ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-tr-sm'
                        : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                  />
                  <span className="text-xs text-gray-400 mt-1 mx-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-2 flex gap-2">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            <Mic size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={t('chat.placeholder')}
            className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent py-2"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send size={16} /> {t('chat.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
