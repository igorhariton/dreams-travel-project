import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Bot, Mic, RefreshCw, Send, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChatActionButtons } from '../components/chat/ChatActionButtons';
import { ChatBookingWidget } from '../components/chat/ChatBookingWidget';
import { ChatContactWidget } from '../components/chat/ChatContactWidget';
import { ChatListingCards } from '../components/chat/ChatListingCards';
import { ChatSupportWidget } from '../components/chat/ChatSupportWidget';
import {
  getAllChatListings,
  getDefaultAssistantContext,
  requestTravelAssistantReply,
  submitBookingRequest,
  submitContactRequest,
  submitSupportRequest,
} from '../chat/service';
import type { AssistantAction, AssistantContextState, AssistantReply, ChatMessage } from '../chat/types';

const STORAGE_KEY = 'td_ai_assistant_session_v2';

const QUICK_PROMPTS = [
  'Recommend destinations for a romantic beach trip',
  'Find top-rated hotels in Santorini under $350',
  'Show family rentals in Bali for 4 guests',
  'What visa requirements apply for Maldives?',
  'Plan a 4-day itinerary in Tokyo',
  'I need support with a booking payment issue',
];

type ActiveComposer =
  | { type: 'booking'; listingId?: string }
  | { type: 'contact'; listingId?: string }
  | { type: 'support' }
  | null;

interface StoredSession {
  sessionId: string;
  messages: ChatMessage[];
  context: AssistantContextState;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: createId('assistant'),
    role: 'assistant',
    text:
      "Hello, I'm your TravelDreams AI assistant.\n\n" +
      "I can help with destination recommendations, hotel/rental search, reservation requests, host contact, visa guidance, itinerary planning, and support.\n\n" +
      'Tell me your destination, dates, guest count, or budget to begin.',
    timestamp: Date.now(),
    suggestions: [
      'Find me luxury hotels in Paris',
      'Plan a budget trip under $250/night',
      'I need a rental with pool in Bali',
    ],
  };
}

function sanitizeStoredMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [createWelcomeMessage()];
  const result = raw
    .map((item): ChatMessage | null => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== 'string' || typeof row.text !== 'string' || typeof row.role !== 'string') return null;
      return {
        id: row.id,
        role: row.role === 'user' || row.role === 'assistant' || row.role === 'system' ? row.role : 'assistant',
        text: row.text,
        timestamp: typeof row.timestamp === 'number' ? row.timestamp : Date.now(),
        intent: typeof row.intent === 'string' ? (row.intent as ChatMessage['intent']) : undefined,
        actions: Array.isArray(row.actions) ? (row.actions as AssistantAction[]) : undefined,
        listings: Array.isArray(row.listings) ? (row.listings as ChatMessage['listings']) : undefined,
        suggestions: Array.isArray(row.suggestions) ? row.suggestions.map((s) => String(s)).slice(0, 6) : undefined,
      };
    })
    .filter((item): item is ChatMessage => Boolean(item));
  return result.length > 0 ? result : [createWelcomeMessage()];
}

function loadSession(): StoredSession {
  const fallback: StoredSession = {
    sessionId: createId('session'),
    messages: [createWelcomeMessage()],
    context: getDefaultAssistantContext(),
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    return {
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : fallback.sessionId,
      messages: sanitizeStoredMessages(parsed.messages),
      context: parsed.context && typeof parsed.context === 'object' ? { ...getDefaultAssistantContext(), ...parsed.context } : fallback.context,
    };
  } catch {
    return fallback;
  }
}

function applyInlineFormatting(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
}

function appendTranscriptToInput(currentInput: string, transcript: string) {
  const normalizedTranscript = transcript.replace(/\s+/g, ' ').trim();
  if (!normalizedTranscript) return currentInput;
  if (!currentInput.trim()) return normalizedTranscript;

  const needsSpace = !/[\s\n]$/.test(currentInput);
  return `${currentInput}${needsSpace ? ' ' : ''}${normalizedTranscript}`;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

function mapSpeechError(errorCode: string) {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission denied. Please allow microphone access and try again.';
    case 'audio-capture':
      return 'No microphone detected. Connect a microphone and try again.';
    case 'no-speech':
      return 'No speech detected. Please speak clearly and try again.';
    case 'network':
      return 'Network error while processing speech. Please check your connection.';
    default:
      return 'Voice recognition failed. Please try again.';
  }
}

function createAssistantMessage(reply: AssistantReply): ChatMessage {
  return {
    id: createId('assistant'),
    role: 'assistant',
    text: reply.text,
    timestamp: Date.now(),
    intent: reply.intent,
    actions: reply.actions,
    listings: reply.listings,
    suggestions: reply.suggestions,
  };
}

export default function ChatPage() {
  const { t, formatPrice, theme } = useApp();
  const navigate = useNavigate();
  const initialSession = useMemo(() => loadSession(), []);
  const isDarkTheme = theme === 'dark';

  const [sessionId, setSessionId] = useState(initialSession.sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialSession.messages);
  const [contextState, setContextState] = useState<AssistantContextState>(initialSession.context);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [activeComposer, setActiveComposer] = useState<ActiveComposer>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const quickPromptsRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isQuickDraggingRef = useRef(false);
  const quickDragMovedRef = useRef(false);
  const quickDragStartXRef = useRef(0);
  const quickDragStartLeftRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const hasMountedRef = useRef(false);
  const previousMessageCountRef = useRef(messages.length);

  const listingCatalog = useMemo(() => getAllChatListings(), []);

  const recentListings = useMemo(() => {
    const ordered: typeof listingCatalog = [];
    const seen = new Set<string>();

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (!message.listings || message.listings.length === 0) continue;
      for (const listing of message.listings) {
        if (seen.has(listing.id)) continue;
        seen.add(listing.id);
        ordered.push(listing);
      }
      if (ordered.length >= 10) break;
    }

    return ordered.length > 0 ? ordered : listingCatalog.slice(0, 10);
  }, [listingCatalog, messages]);

  const updateAutoScrollState = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= 100;
  }, []);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
    shouldAutoScrollRef.current = true;
    hasMountedRef.current = true;
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const nextCount = messages.length;
    const hadNewMessage = nextCount > previousMessageCountRef.current;
    previousMessageCountRef.current = nextCount;

    if (!hasMountedRef.current || !hadNewMessage || !shouldAutoScrollRef.current) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persisted: StoredSession = {
      sessionId,
      messages: messages.slice(-100),
      context: contextState,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [contextState, messages, sessionId]);

  useEffect(() => {
    return () => {
      const recognition = speechRecognitionRef.current;
      if (!recognition) return;
      try {
        recognition.abort();
      } catch {
        // no-op cleanup
      }
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isSending) return;

      setInput('');
      const userMessage: ChatMessage = {
        id: createId('user'),
        role: 'user',
        text: messageText,
        timestamp: Date.now(),
      };

      const historyForRequest = [...messages, userMessage];
      setMessages(historyForRequest);
      setIsSending(true);

      try {
        const reply = await requestTravelAssistantReply({
          sessionId,
          message: messageText,
          history: historyForRequest.slice(-16).map((item) => ({ role: item.role, text: item.text })),
          context: contextState,
        });

        setContextState(reply.context);
        setMessages((prev) => [...prev, createAssistantMessage(reply)]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant'),
            role: 'assistant',
            text: 'I could not reach the assistant service right now. Please try again in a moment.',
            timestamp: Date.now(),
            actions: [
              { id: createId('retry'), label: 'Retry', kind: 'check_availability' },
              { id: createId('support'), label: 'Customer support', kind: 'open_support' },
            ],
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [contextState, input, isSending, messages, sessionId],
  );

  const handleAction = useCallback(
    (action: AssistantAction) => {
      const listingId = typeof action.payload?.listingId === 'string' ? action.payload.listingId : undefined;

      if (action.kind === 'search_hotels') {
        navigate('/hotels');
        return;
      }
      if (action.kind === 'search_rentals') {
        navigate('/rentals');
        return;
      }
      if (action.kind === 'plan_trip') {
        navigate('/planner');
        return;
      }

      if (action.kind === 'book_now' || action.kind === 'check_availability' || action.kind === 'get_quote') {
        setActiveComposer({ type: 'booking', listingId });
        return;
      }

      if (action.kind === 'contact_host') {
        setActiveComposer({ type: 'contact', listingId });
        return;
      }

      if (action.kind === 'open_support') {
        setActiveComposer({ type: 'support' });
      }
    },
    [navigate],
  );

  const handleBookingSubmit = useCallback(
    async (draft: Parameters<typeof submitBookingRequest>[1]) => {
      const listing = listingCatalog.find((item) => item.id === draft.listingId);
      const response = await submitBookingRequest(sessionId, draft);

      setMessages((prev) => [
        ...prev,
        {
          id: createId('system'),
          role: 'system',
          text:
            `Reservation request submitted for ${listing?.title || 'selected property'} ` +
            `(${draft.checkIn} → ${draft.checkOut}, ${draft.guests} guests).`,
          timestamp: Date.now(),
        },
        {
          id: createId('assistant'),
          role: 'assistant',
          text:
            `${response.message || 'Your request has been submitted successfully.'}\n` +
            `Reference ID: ${response.referenceId}`,
          timestamp: Date.now(),
          actions: [
            { id: createId('contact-host'), kind: 'contact_host', label: 'Contact host', payload: { listingId: draft.listingId } },
            { id: createId('support'), kind: 'open_support', label: 'Customer support' },
          ],
        },
      ]);
      setActiveComposer(null);
    },
    [listingCatalog, sessionId],
  );

  const handleContactSubmit = useCallback(
    async (draft: Parameters<typeof submitContactRequest>[1]) => {
      const response = await submitContactRequest(sessionId, draft);
      setMessages((prev) => [
        ...prev,
        {
          id: createId('assistant'),
          role: 'assistant',
          text:
            `${response.message || 'Host contact request sent.'}\n` +
            `Reference ID: ${response.referenceId}\n` +
            'A host representative should reply shortly through your contact channel.',
          timestamp: Date.now(),
        },
      ]);
      setActiveComposer(null);
    },
    [sessionId],
  );

  const handleSupportSubmit = useCallback(
    async (draft: Parameters<typeof submitSupportRequest>[1]) => {
      const response = await submitSupportRequest(sessionId, draft);
      setMessages((prev) => [
        ...prev,
        {
          id: createId('assistant'),
          role: 'assistant',
          text:
            `${response.message || 'Support request submitted.'}\n` +
            `Reference ID: ${response.referenceId}\n` +
            'Our support team will follow up with you as soon as possible.',
          timestamp: Date.now(),
        },
      ]);
      setActiveComposer(null);
    },
    [sessionId],
  );

  const stopVoiceRecognition = useCallback((forceAbort = false) => {
    const recognition = speechRecognitionRef.current;
    if (!recognition) return;

    setVoiceState('processing');
    try {
      if (forceAbort) recognition.abort();
      else recognition.stop();
    } catch {
      setVoiceState('idle');
    }
  }, []);

  const startVoiceRecognition = useCallback(() => {
    const RecognitionCtor = getSpeechRecognitionConstructor();
    if (!RecognitionCtor) {
      setVoiceError('Speech recognition is not supported in this browser.');
      setVoiceState('error');
      return;
    }

    let recognition = speechRecognitionRef.current;
    if (!recognition) {
      recognition = new RecognitionCtor();
      speechRecognitionRef.current = recognition;
    }

    setVoiceError(null);
    setInterimTranscript('');
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setVoiceError(null);
      setVoiceState('listening');
    };

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) continue;

        if (result.isFinal) finalChunk += `${transcript} `;
        else interimChunk += `${transcript} `;
      }

      const normalizedFinal = finalChunk.trim();
      const normalizedInterim = interimChunk.trim();

      if (normalizedFinal) {
        setInput((current) => appendTranscriptToInput(current, normalizedFinal));
      }
      setInterimTranscript(normalizedInterim);
    };

    recognition.onerror = (event) => {
      setInterimTranscript('');
      setVoiceError(mapSpeechError(event.error));
      setVoiceState('error');
    };

    recognition.onend = () => {
      setInterimTranscript('');
      setVoiceState((current) => (current === 'error' ? 'error' : 'idle'));
    };

    setVoiceState('processing');
    try {
      recognition.start();
    } catch {
      setVoiceError('Voice recognition could not be started. Try again.');
      setVoiceState('error');
    }
  }, []);

  const handleMicrophoneClick = useCallback(() => {
    if (voiceState === 'listening') {
      stopVoiceRecognition(false);
      return;
    }

    if (voiceState === 'processing') {
      stopVoiceRecognition(true);
      return;
    }

    startVoiceRecognition();
  }, [startVoiceRecognition, stopVoiceRecognition, voiceState]);

  const resetConversation = () => {
    const newSessionId = createId('session');
    setSessionId(newSessionId);
    setMessages([createWelcomeMessage()]);
    setContextState(getDefaultAssistantContext());
    setActiveComposer(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const activeListingId = activeComposer && 'listingId' in activeComposer ? activeComposer.listingId : undefined;

  const handleQuickPromptsWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const container = quickPromptsRef.current;
    if (!container) return;

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (container.scrollWidth <= container.clientWidth) return;

    event.preventDefault();
    container.scrollLeft += event.deltaY;
  }, []);

  const handleQuickPromptsMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const container = quickPromptsRef.current;
    if (!container) return;
    if (container.scrollWidth <= container.clientWidth) return;

    isQuickDraggingRef.current = true;
    quickDragMovedRef.current = false;
    quickDragStartXRef.current = event.clientX;
    quickDragStartLeftRef.current = container.scrollLeft;
  }, []);

  const handleQuickPromptsMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const container = quickPromptsRef.current;
    if (!container) return;
    if (!isQuickDraggingRef.current) return;

    const delta = event.clientX - quickDragStartXRef.current;
    if (Math.abs(delta) > 4) quickDragMovedRef.current = true;
    container.scrollLeft = quickDragStartLeftRef.current - delta;
  }, []);

  const handleQuickPromptsMouseUp = useCallback(() => {
    isQuickDraggingRef.current = false;
    window.setTimeout(() => {
      quickDragMovedRef.current = false;
    }, 0);
  }, []);

  const handleQuickPromptsClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!quickDragMovedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div className={`h-[100dvh] pt-16 ${isDarkTheme ? 'bg-[#0B1220]' : 'bg-[#F8FAFC]'}`}>
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col overflow-hidden px-4 py-6">
        <div className="travel-shell mb-4 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white shadow-md">
          <div className="flex min-w-0 items-center gap-3">
            <div className="travel-panel flex h-12 w-12 items-center justify-center bg-white/20">
              <Bot size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black">Travel AI Assistant</h1>
              <p className="truncate text-sm text-white/80">
                Live booking guidance for destinations, properties, host contact, and support
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetConversation}
            className="travel-badge inline-flex items-center gap-2 bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30"
          >
            <RefreshCw size={14} />
            New chat
          </button>
        </div>

        <div
          ref={quickPromptsRef}
          onWheel={handleQuickPromptsWheel}
          onMouseDown={handleQuickPromptsMouseDown}
          onMouseMove={handleQuickPromptsMouseMove}
          onMouseUp={handleQuickPromptsMouseUp}
          onMouseLeave={handleQuickPromptsMouseUp}
          onClickCapture={handleQuickPromptsClickCapture}
          className="quick-prompts-scroll mb-3 flex cursor-grab gap-2 overflow-x-auto overflow-y-hidden pb-2 active:cursor-grabbing select-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className={`travel-badge shrink-0 border px-4 py-2 text-xs font-medium shadow-sm transition ${
                isDarkTheme
                  ? 'border-[#334155] bg-[#1F2937] text-[#CBD5E1] hover:bg-[#243144] hover:text-[#F9FAFB]'
                  : 'border-[#D9E2EC] bg-white text-[#475569] hover:border-[#60A5FA] hover:bg-[#EFF6FF] hover:text-[#0F172A]'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div
          className={`travel-shell min-h-0 flex-1 overflow-hidden border p-1.5 shadow-sm ${
            isDarkTheme ? 'border-[#334155] bg-[#111827]' : 'border-[#D9E2EC] bg-white'
          }`}
        >
          <div
            ref={messagesContainerRef}
            onScroll={updateAutoScrollState}
            className={`chat-scroll h-full overflow-y-auto rounded-[22px] px-5 py-4 ${
              isDarkTheme ? 'bg-[#111827]' : 'bg-white'
            }`}
          >
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'system' ? (
                    <div
                      className={`travel-badge px-3 py-1.5 text-xs ${
                        isDarkTheme ? 'bg-[#243144] text-[#CBD5E1]' : 'bg-[#EEF4FA] text-[#475569]'
                      }`}
                    >
                      {message.text}
                    </div>
                  ) : (
                    <div className={`flex max-w-[90%] gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div
                        className={`travel-panel flex h-9 w-9 items-center justify-center ${
                          message.role === 'assistant'
                            ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white'
                            : isDarkTheme
                              ? 'bg-[#243144] text-[#F9FAFB]'
                              : 'bg-[#EAF1F8] text-[#0F172A]'
                        }`}
                      >
                        {message.role === 'assistant' ? <Bot size={15} /> : <User size={15} />}
                      </div>
                      <div className={`min-w-0 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`travel-panel px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                              : isDarkTheme
                                ? 'border border-[#334155] bg-[#1F2937] text-[#F9FAFB]'
                                : 'border border-[#D9E2EC] bg-[#F8FAFC] text-[#0F172A]'
                          }`}
                          dangerouslySetInnerHTML={{ __html: applyInlineFormatting(message.text) }}
                        />
                        <span className="mt-1 px-1 text-[11px] text-[#94A3B8]">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {message.role === 'assistant' && message.listings && message.listings.length > 0 && (
                          <ChatListingCards listings={message.listings} formatPrice={formatPrice} onAction={handleAction} />
                        )}

                        {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                          <ChatActionButtons actions={message.actions} onAction={handleAction} disabled={isSending} />
                        )}

                        {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion) => (
                              <button
                                key={`${message.id}-${suggestion}`}
                                type="button"
                                onClick={() => sendMessage(suggestion)}
                                className={`travel-badge border px-3 py-1.5 text-xs transition ${
                                  isDarkTheme
                                    ? 'border-[#334155] bg-[#1F2937] text-[#CBD5E1] hover:bg-[#243144] hover:text-[#F9FAFB]'
                                    : 'border-[#D9E2EC] bg-white text-[#475569] hover:border-[#60A5FA] hover:bg-[#EFF6FF] hover:text-[#0F172A]'
                                }`}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {isSending && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="travel-panel flex h-9 w-9 items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                    <Bot size={15} />
                  </div>
                  <div
                    className={`travel-panel border px-4 py-3 shadow-sm ${
                      isDarkTheme ? 'border-[#334155] bg-[#1F2937]' : 'border-[#D9E2EC] bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#94A3B8]" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#94A3B8]" style={{ animationDelay: '120ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#94A3B8]" style={{ animationDelay: '240ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {activeComposer?.type === 'booking' && (
          <div
            className={`travel-shell mt-4 overflow-hidden border p-1.5 shadow-sm ${
              isDarkTheme ? 'border-[#334155] bg-[#111827]' : 'border-[#D9E2EC] bg-white'
            }`}
          >
            <div className="chat-scroll max-h-[42vh] overflow-y-auto rounded-[22px] pr-1">
              <ChatBookingWidget
                listings={recentListings}
                defaultListingId={activeListingId}
                formatPrice={formatPrice}
                onSubmit={handleBookingSubmit}
                onCancel={() => setActiveComposer(null)}
              />
            </div>
          </div>
        )}

        {activeComposer?.type === 'contact' && (
          <div
            className={`travel-shell mt-4 overflow-hidden border p-1.5 shadow-sm ${
              isDarkTheme ? 'border-[#334155] bg-[#111827]' : 'border-[#D9E2EC] bg-white'
            }`}
          >
            <div className="chat-scroll max-h-[38vh] overflow-y-auto rounded-[22px] pr-1">
              <ChatContactWidget
                listings={recentListings}
                defaultListingId={activeListingId}
                onSubmit={handleContactSubmit}
                onCancel={() => setActiveComposer(null)}
              />
            </div>
          </div>
        )}

        {activeComposer?.type === 'support' && (
          <div
            className={`travel-shell mt-4 overflow-hidden border p-1.5 shadow-sm ${
              isDarkTheme ? 'border-[#334155] bg-[#111827]' : 'border-[#D9E2EC] bg-white'
            }`}
          >
            <div className="chat-scroll max-h-[38vh] overflow-y-auto rounded-[22px] pr-1">
              <ChatSupportWidget onSubmit={handleSupportSubmit} onCancel={() => setActiveComposer(null)} />
            </div>
          </div>
        )}

        <div
          className={`travel-shell mt-4 flex shrink-0 gap-2 border p-2 shadow-sm ${
            isDarkTheme ? 'border-[#334155] bg-[#111827]' : 'border-[#D9E2EC] bg-white'
          }`}
        >
          <button
            type="button"
            onClick={handleMicrophoneClick}
            title={
              voiceState === 'listening'
                ? 'Stop voice input'
                : voiceState === 'processing'
                  ? 'Stopping voice input...'
                  : 'Start voice input'
            }
            className={`travel-icon-button p-3 transition ${
              voiceState === 'listening'
                ? 'bg-red-50 text-red-500 ring-2 ring-red-200 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/40'
                : voiceState === 'processing'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                  : voiceState === 'error'
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-300'
                  : isDarkTheme
                    ? 'text-[#94A3B8] hover:bg-[#243144] hover:text-[#F9FAFB]'
                    : 'text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#0F172A]'
            }`}
          >
            <Mic size={18} className={voiceState === 'listening' ? 'animate-pulse' : ''} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={t('chat.placeholder')}
            className="travel-input-field h-auto flex-1 border-0 bg-transparent py-2 text-sm shadow-none focus:shadow-none"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isSending}
            className="travel-primary-button inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
            {t('chat.send')}
          </button>
        </div>

        {(voiceState !== 'idle' || voiceError || interimTranscript) && (
          <div
            className={`mt-2 px-2 text-xs ${
              voiceError
                ? 'text-red-600 dark:text-red-300'
                : voiceState === 'listening'
                  ? 'text-emerald-600 dark:text-emerald-300'
                : isDarkTheme
                  ? 'text-[#94A3B8]'
                  : 'text-[#64748B]'
            }`}
          >
            {voiceError
              ? voiceError
              : voiceState === 'listening'
                ? `Listening...${interimTranscript ? ` ${interimTranscript}` : ''}`
                : voiceState === 'processing'
                  ? 'Processing voice input...'
                  : null}
          </div>
        )}
      </div>
    </div>
  );
}
