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
  setAssistantCatalogData,
  submitBookingRequest,
  submitContactRequest,
  submitSupportRequest,
} from '../chat/service';
import type { AssistantAction, AssistantContextState, AssistantReply, ChatMessage } from '../chat/types';
import { isApiError } from '../../services/apiClient';

const STORAGE_KEY = 'td_ai_assistant_session_v2';

type ChatLanguage = 'en' | 'ro' | 'ru';

const QUICK_PROMPTS: Record<ChatLanguage, string[]> = {
  en: [
    'Recommend destinations for a romantic beach trip',
    'Find top-rated hotels in Santorini under $350',
    'Show family rentals in Bali for 4 guests',
    'What visa requirements apply for Maldives?',
    'Plan a 4-day itinerary in Tokyo',
    'I need support with a booking payment issue',
  ],
  ro: [
    'Recomanda destinatii pentru o vacanta romantica la mare',
    'Gaseste hoteluri de top in Santorini sub $350',
    'Arata-mi chirii pentru familie in Bali pentru 4 persoane',
    'Ce cerinte de viza sunt pentru Maldives?',
    'Planifica un itinerar de 4 zile in Tokyo',
    'Am nevoie de suport pentru o problema de plata',
  ],
  ru: [
    'Порекомендуй направления для романтической поездки к морю',
    'Найди лучшие отели в Santorini до $350',
    'Покажи семейные виллы в Bali на 4 гостей',
    'Какие визовые требования для Maldives?',
    'Составь маршрут на 4 дня в Tokyo',
    'Мне нужна поддержка по проблеме с оплатой',
  ],
};

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

function getWelcomeCopy(language: ChatLanguage) {
  if (language === 'ro') {
    return {
      text:
        "Salut, sunt asistentul tau AI TravelDreams.\n\n" +
        "Te pot ajuta cu recomandari de destinatii, cautare hoteluri/chirii, cereri de rezervare, contactarea gazdei, vize, itinerare si suport.\n\n" +
        "Spune-mi destinatia, datele, numarul de persoane sau bugetul ca sa incepem.",
      suggestions: [
        'Gaseste hoteluri luxury in Paris',
        'Planifica o vacanta sub $250/noapte',
        'Am nevoie de o vila cu piscina in Bali',
      ],
    };
  }

  if (language === 'ru') {
    return {
      text:
        "Здравствуйте, я AI-ассистент TravelDreams.\n\n" +
        "Я помогу подобрать направления, отели и аренду, оформить запрос на бронирование, связаться с хозяином, проверить визы, составить маршрут и обратиться в поддержку.\n\n" +
        "Напишите направление, даты, число гостей или бюджет, и начнем.",
      suggestions: [
        'Найди luxury отели в Paris',
        'Спланируй поездку до $250 за ночь',
        'Нужна вилла с бассейном в Bali',
      ],
    };
  }

  return {
    text:
      "Hello, I'm your TravelDreams AI assistant.\n\n" +
      "I can help with destination recommendations, hotel/rental search, reservation requests, host contact, visa guidance, itinerary planning, and support.\n\n" +
      'Tell me your destination, dates, guest count, or budget to begin.',
    suggestions: [
      'Find me luxury hotels in Paris',
      'Plan a budget trip under $250/night',
      'I need a rental with pool in Bali',
    ],
  };
}

function createWelcomeMessage(language: ChatLanguage = 'en'): ChatMessage {
  const copy = getWelcomeCopy(language);
  return {
    id: createId('assistant'),
    role: 'assistant',
    text: copy.text,
    timestamp: Date.now(),
    suggestions: copy.suggestions,
  };
}

function sanitizeStoredMessages(raw: unknown, language: ChatLanguage): ChatMessage[] {
  if (!Array.isArray(raw)) return [createWelcomeMessage(language)];
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
  return result.length > 0 ? result : [createWelcomeMessage(language)];
}

function loadSession(language: ChatLanguage): StoredSession {
  const fallback: StoredSession = {
    sessionId: createId('session'),
    messages: [createWelcomeMessage(language)],
    context: getDefaultAssistantContext(),
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    return {
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : fallback.sessionId,
      messages: sanitizeStoredMessages(parsed.messages, language),
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

function toChatLanguage(language: string): ChatLanguage {
  return language === 'ro' || language === 'ru' ? language : 'en';
}

function toSpeechLanguage(language: ChatLanguage) {
  if (language === 'ro') return 'ro-RO';
  if (language === 'ru') return 'ru-RU';
  return 'en-US';
}

function chatCopy(language: ChatLanguage, key: string) {
  const copy: Record<ChatLanguage, Record<string, string>> = {
    en: {
      bookingSubmitted: 'Reservation request submitted for',
      selectedProperty: 'selected property',
      guests: 'guests',
      requestOk: 'Your request has been submitted successfully.',
      referenceId: 'Reference ID',
      contactHost: 'Contact host',
      customerSupport: 'Customer support',
      headerSubtitle: 'Live booking guidance for destinations, properties, host contact, and support',
      newChat: 'New chat',
      retry: 'Retry',
      assistantUnavailable: 'I could not reach the assistant service right now. Please try again in a moment.',
      contactFollowUp: 'A host representative should reply shortly through your contact channel.',
      supportFollowUp: 'Our support team will follow up with you as soon as possible.',
      retryMoment: 'Please try again after a moment.',
      verifyRetry: 'Please verify your details and try again.',
      dashboardSupport: 'Please try again shortly or contact support from your account dashboard.',
      startVoiceInput: 'Start voice input',
      stopVoiceInput: 'Stop voice input',
      stoppingVoiceInput: 'Stopping voice input...',
      speechUnsupported: 'Speech recognition is not supported in this browser.',
      microphoneDenied: 'Microphone permission denied. Please allow microphone access and try again.',
      noMicrophone: 'No microphone detected. Connect a microphone and try again.',
      noSpeech: 'No speech detected. Please speak clearly and try again.',
      voiceNetwork: 'Network error while processing speech. Please check your connection.',
      voiceFailed: 'Voice recognition failed. Please try again.',
      voiceStartFailed: 'Voice recognition could not be started. Try again.',
      listening: 'Listening...',
      processingVoice: 'Processing voice input...',
    },
    ro: {
      bookingSubmitted: 'Cerere de rezervare trimisa pentru',
      selectedProperty: 'proprietatea selectata',
      guests: 'persoane',
      requestOk: 'Cererea ta a fost trimisa cu succes.',
      referenceId: 'ID referinta',
      contactHost: 'Contacteaza gazda',
      customerSupport: 'Suport clienti',
      headerSubtitle: 'Ghid live pentru destinatii, cazari, contact gazda si suport',
      newChat: 'Chat nou',
      retry: 'Incearca din nou',
      assistantUnavailable: 'Nu pot contacta serviciul de chat acum. Incearca din nou peste cateva momente.',
      contactFollowUp: 'Un reprezentant al gazdei ar trebui sa raspunda curand pe canalul tau de contact.',
      supportFollowUp: 'Echipa de suport va reveni cat mai curand.',
      retryMoment: 'Incearca din nou peste cateva momente.',
      verifyRetry: 'Verifica detaliile si incearca din nou.',
      dashboardSupport: 'Incearca din nou in scurt timp sau contacteaza suportul din cont.',
      startVoiceInput: 'Porneste dictarea',
      stopVoiceInput: 'Opreste dictarea',
      stoppingVoiceInput: 'Se opreste dictarea...',
      speechUnsupported: 'Recunoasterea vocala nu este suportata in acest browser.',
      microphoneDenied: 'Permisiunea pentru microfon a fost refuzata. Permite accesul si incearca din nou.',
      noMicrophone: 'Nu am detectat microfon. Conecteaza un microfon si incearca din nou.',
      noSpeech: 'Nu am detectat voce. Vorbeste mai clar si incearca din nou.',
      voiceNetwork: 'Eroare de retea la procesarea vocii. Verifica conexiunea.',
      voiceFailed: 'Recunoasterea vocala a esuat. Incearca din nou.',
      voiceStartFailed: 'Dictarea nu a putut fi pornita. Incearca din nou.',
      listening: 'Ascult...',
      processingVoice: 'Procesez vocea...',
    },
    ru: {
      bookingSubmitted: 'Запрос на бронирование отправлен для',
      selectedProperty: 'выбранного объекта',
      guests: 'гостей',
      requestOk: 'Ваш запрос успешно отправлен.',
      referenceId: 'ID запроса',
      contactHost: 'Связаться с хозяином',
      customerSupport: 'Поддержка',
      headerSubtitle: 'Помощь с направлениями, жильем, связью с хозяином и поддержкой',
      newChat: 'Новый чат',
      retry: 'Повторить',
      assistantUnavailable: 'Сервис чата сейчас недоступен. Попробуйте еще раз через несколько минут.',
      contactFollowUp: 'Представитель хозяина скоро ответит через ваш контактный канал.',
      supportFollowUp: 'Команда поддержки свяжется с вами как можно скорее.',
      retryMoment: 'Попробуйте еще раз через несколько минут.',
      verifyRetry: 'Проверьте данные и попробуйте снова.',
      dashboardSupport: 'Попробуйте позже или обратитесь в поддержку из аккаунта.',
      startVoiceInput: 'Начать голосовой ввод',
      stopVoiceInput: 'Остановить голосовой ввод',
      stoppingVoiceInput: 'Остановка голосового ввода...',
      speechUnsupported: 'Распознавание речи не поддерживается в этом браузере.',
      microphoneDenied: 'Доступ к микрофону запрещен. Разрешите доступ и попробуйте снова.',
      noMicrophone: 'Микрофон не найден. Подключите микрофон и попробуйте снова.',
      noSpeech: 'Речь не обнаружена. Говорите четче и попробуйте снова.',
      voiceNetwork: 'Ошибка сети при обработке речи. Проверьте подключение.',
      voiceFailed: 'Распознавание речи не удалось. Попробуйте снова.',
      voiceStartFailed: 'Не удалось запустить голосовой ввод. Попробуйте снова.',
      listening: 'Слушаю...',
      processingVoice: 'Обработка голоса...',
    },
  };
  return copy[language][key] || copy.en[key] || key;
}

function mapSpeechError(language: ChatLanguage, errorCode: string) {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return chatCopy(language, 'microphoneDenied');
    case 'audio-capture':
      return chatCopy(language, 'noMicrophone');
    case 'no-speech':
      return chatCopy(language, 'noSpeech');
    case 'network':
      return chatCopy(language, 'voiceNetwork');
    default:
      return chatCopy(language, 'voiceFailed');
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

function toServiceErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    if (error.status === 401) return 'Session expired. Please sign in again.';
    if (error.status === 403) return 'Access denied for this action.';
    if (error.status && error.status >= 500) return 'Server error. Please try again in a moment.';
    if (error.isNetworkError) return 'Network error. Check your internet connection and retry.';
    if (error.isTimeout) return 'Request timed out. Please retry.';
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function ChatPage() {
  const { t, formatPrice, theme, language, publicDestinations, publicHotels, publicRentals } = useApp();
  const navigate = useNavigate();
  const chatLanguage = toChatLanguage(language);
  const initialSession = useMemo(() => loadSession(chatLanguage), []);
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

  useEffect(() => {
    setAssistantCatalogData({
      destinations: publicDestinations,
      hotels: publicHotels,
      rentals: publicRentals,
    });
  }, [publicDestinations, publicHotels, publicRentals]);

  const listingCatalog = useMemo(() => {
    setAssistantCatalogData({
      destinations: publicDestinations,
      hotels: publicHotels,
      rentals: publicRentals,
    });
    return getAllChatListings();
  }, [publicDestinations, publicHotels, publicRentals]);

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
          language: chatLanguage,
        });

        setContextState(reply.context);
        setMessages((prev) => [...prev, createAssistantMessage(reply)]);
      } catch (error) {
        const errorMessage = toServiceErrorMessage(
          error,
          chatCopy(chatLanguage, 'assistantUnavailable'),
        );
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant'),
            role: 'assistant',
            text: errorMessage,
            timestamp: Date.now(),
            actions: [
              { id: createId('retry'), label: chatCopy(chatLanguage, 'retry'), kind: 'check_availability' },
              { id: createId('support'), label: chatCopy(chatLanguage, 'customerSupport'), kind: 'open_support' },
            ],
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [chatLanguage, contextState, input, isSending, messages, sessionId],
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
      try {
        const response = await submitBookingRequest(sessionId, draft, chatLanguage);

        setMessages((prev) => [
          ...prev,
          {
            id: createId('system'),
            role: 'system',
            text:
              `${chatCopy(chatLanguage, 'bookingSubmitted')} ${listing?.title || chatCopy(chatLanguage, 'selectedProperty')} ` +
              `(${draft.checkIn} -> ${draft.checkOut}, ${draft.guests} ${chatCopy(chatLanguage, 'guests')}).`,
            timestamp: Date.now(),
          },
          {
            id: createId('assistant'),
            role: 'assistant',
            text:
              `${response.message || chatCopy(chatLanguage, 'requestOk')}\n` +
              `${chatCopy(chatLanguage, 'referenceId')}: ${response.referenceId}`,
            timestamp: Date.now(),
            actions: [
              { id: createId('contact-host'), kind: 'contact_host', label: chatCopy(chatLanguage, 'contactHost'), payload: { listingId: draft.listingId } },
              { id: createId('support'), kind: 'open_support', label: chatCopy(chatLanguage, 'customerSupport') },
            ],
          },
        ]);
        setActiveComposer(null);
      } catch (error) {
        const errorMessage = toServiceErrorMessage(error, 'Reservation request failed.');
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant'),
            role: 'assistant',
            text: `${errorMessage}\n${chatCopy(chatLanguage, 'retryMoment')}`,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [chatLanguage, listingCatalog, sessionId],
  );

  const handleContactSubmit = useCallback(
    async (draft: Parameters<typeof submitContactRequest>[1]) => {
      try {
        const response = await submitContactRequest(sessionId, draft, chatLanguage);
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant'),
            role: 'assistant',
            text:
              `${response.message || 'Host contact request sent.'}\n` +
              `${chatCopy(chatLanguage, 'referenceId')}: ${response.referenceId}\n` +
              chatCopy(chatLanguage, 'contactFollowUp'),
            timestamp: Date.now(),
          },
        ]);
        setActiveComposer(null);
      } catch (error) {
        const errorMessage = toServiceErrorMessage(error, 'Host contact request failed.');
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant'),
            role: 'assistant',
            text: `${errorMessage}\n${chatCopy(chatLanguage, 'verifyRetry')}`,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [chatLanguage, sessionId],
  );

  const handleSupportSubmit = useCallback(
    async (draft: Parameters<typeof submitSupportRequest>[1]) => {
      try {
        const response = await submitSupportRequest(sessionId, draft, chatLanguage);
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant'),
            role: 'assistant',
            text:
              `${response.message || 'Support request submitted.'}\n` +
              `${chatCopy(chatLanguage, 'referenceId')}: ${response.referenceId}\n` +
              chatCopy(chatLanguage, 'supportFollowUp'),
            timestamp: Date.now(),
          },
        ]);
        setActiveComposer(null);
      } catch (error) {
        const errorMessage = toServiceErrorMessage(error, 'Support request failed.');
        setMessages((prev) => [
          ...prev,
          {
            id: createId('assistant'),
            role: 'assistant',
            text: `${errorMessage}\n${chatCopy(chatLanguage, 'dashboardSupport')}`,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [chatLanguage, sessionId],
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
      setVoiceError(chatCopy(chatLanguage, 'speechUnsupported'));
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
    recognition.lang = toSpeechLanguage(chatLanguage);
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
      setVoiceError(mapSpeechError(chatLanguage, event.error));
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
      setVoiceError(chatCopy(chatLanguage, 'voiceStartFailed'));
      setVoiceState('error');
    }
  }, [chatLanguage]);

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
    setMessages([createWelcomeMessage(chatLanguage)]);
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
    <div className={`h-dvh pt-16 ${isDarkTheme ? 'bg-[#0B1220]' : 'bg-[#F8FAFC]'}`}>
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col overflow-hidden px-4 py-6">
        <div className="travel-shell mb-4 flex items-center justify-between gap-3 bg-linear-to-r from-blue-600 to-cyan-500 p-5 text-white shadow-md">
          <div className="flex min-w-0 items-center gap-3">
            <div className="travel-panel flex h-12 w-12 items-center justify-center bg-white/20">
              <Bot size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black">Travel AI Assistant</h1>
              <p className="truncate text-sm text-white/80">
                {chatCopy(chatLanguage, 'headerSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetConversation}
            className="travel-badge inline-flex items-center gap-2 bg-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/30"
          >
            <RefreshCw size={14} />
            {chatCopy(chatLanguage, 'newChat')}
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
          {QUICK_PROMPTS[chatLanguage].map((prompt) => (
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
                            ? 'bg-linear-to-br from-blue-600 to-cyan-500 text-white'
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
                              ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white'
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
                  <div className="travel-panel flex h-9 w-9 items-center justify-center bg-linear-to-br from-blue-600 to-cyan-500 text-white">
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
                ? chatCopy(chatLanguage, 'stopVoiceInput')
                : voiceState === 'processing'
                  ? chatCopy(chatLanguage, 'stoppingVoiceInput')
                  : chatCopy(chatLanguage, 'startVoiceInput')
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
                ? `${chatCopy(chatLanguage, 'listening')}${interimTranscript ? ` ${interimTranscript}` : ''}`
                : voiceState === 'processing'
                  ? chatCopy(chatLanguage, 'processingVoice')
                  : null}
          </div>
        )}
      </div>
    </div>
  );
}

