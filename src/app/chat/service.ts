import { destinations, hotels, rentals } from '../data/travelData';
import { detectTravelIntent } from './intent';
import type {
  AssistantAction,
  AssistantContextState,
  AssistantListing,
  AssistantReply,
  AssistantRequestPayload,
  BookingDraft,
  ContactDraft,
  SupportDraft,
  TravelIntent,
} from './types';

const REQUEST_TIMEOUT_MS = 16000;
const DEFAULT_CHAT_API_URL = '/api/assistant/chat';
const DEFAULT_ACTIONS_API_BASE = '/api/assistant';

const DEFAULT_CONTEXT: AssistantContextState = {
  lastIntent: 'general',
};

const VISA_GUIDANCE: Record<string, string> = {
  maldives:
    'Most travelers can receive a 30-day visa on arrival in Maldives with passport validity, return ticket, and accommodation proof.',
  bali:
    'Indonesia usually supports visa-free or visa-on-arrival for many passports, but duration and extensions vary by nationality.',
  dubai:
    'UAE visa policy depends on nationality and passport type. Some travelers enter visa-free, others need pre-approved eVisa.',
  japan:
    'Japan entry rules depend on passport and travel purpose. Always check the latest embassy advisories before booking.',
  france:
    'France follows Schengen entry rules. Travelers may need a Schengen visa unless their nationality has visa-free access.',
  greece:
    'Greece follows Schengen entry requirements. Visa-free stays are limited by nationality and trip duration.',
};

const FAQ_GUIDANCE: Record<string, string> = {
  refund:
    'Refund timing depends on cancellation policy and payment method. Most eligible refunds are processed within 5-10 business days.',
  cancellation:
    'You can cancel from your booking page. Flexible rates usually allow free cancellation before the cutoff date.',
  payment:
    'We support major cards and secure checkout. If payment fails, verify card limits, 3D Secure prompts, and billing details.',
  support:
    'Our support team can help with booking edits, payment issues, and host communication.',
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildAction(
  kind: AssistantAction['kind'],
  label: string,
  payload?: Record<string, string | number | boolean | undefined>,
): AssistantAction {
  return { id: createId(kind), kind, label, payload };
}

function normalizeText(input: string) {
  return input.toLowerCase().trim();
}

function findDestinationId(message: string, context: AssistantContextState) {
  const normalized = normalizeText(message);
  const exact = destinations.find((destination) => {
    return normalized.includes(destination.name.toLowerCase()) || normalized.includes(destination.country.toLowerCase());
  });
  return exact?.id ?? context.lastDestinationId;
}

function extractBudget(message: string, currentBudget?: number) {
  const normalized = normalizeText(message);
  const underMatch = normalized.match(/(?:under|below|max|budget)\s*\$?(\d{2,4})/i);
  const plainMatch = normalized.match(/\$?(\d{2,4})\s*(?:per night|night|usd|\$)?/i);

  const parsed = underMatch?.[1] ?? plainMatch?.[1];
  if (!parsed) return currentBudget;

  const value = Number(parsed);
  if (Number.isNaN(value) || value < 30) return currentBudget;
  return value;
}

function extractGuests(message: string, currentGuests?: number) {
  const guestMatch = message.match(/(\d+)\s*(?:guest|guests|people|persons|traveler|travelers)/i);
  if (!guestMatch) return currentGuests;
  const parsed = Number(guestMatch[1]);
  if (Number.isNaN(parsed) || parsed <= 0) return currentGuests;
  return parsed;
}

function listingFromHotel(hotel: (typeof hotels)[number]): AssistantListing {
  return {
    id: hotel.id,
    type: 'hotel',
    destinationId: hotel.destinationId,
    title: hotel.name,
    location: hotel.location,
    pricePerNight: hotel.pricePerNight,
    rating: hotel.rating,
    image: hotel.images[0] || '/images/_site/hero-hotels.jpg',
    amenities: hotel.amenities.slice(0, 6),
    summary: hotel.description,
  };
}

function listingFromRental(rental: (typeof rentals)[number]): AssistantListing {
  return {
    id: rental.id,
    type: 'rental',
    destinationId: rental.destinationId,
    title: rental.name,
    location: rental.location,
    pricePerNight: rental.pricePerNight,
    rating: rental.rating,
    image: rental.images[0] || '/images/_site/hero-rentals.jpg',
    amenities: rental.amenities.slice(0, 6),
    summary: rental.description,
  };
}

function getTopHotels(destinationId?: string, budgetCap?: number) {
  let pool = [...hotels];
  if (destinationId) {
    pool = pool.filter((item) => item.destinationId === destinationId);
  }
  if (budgetCap) {
    pool = pool.filter((item) => item.pricePerNight <= budgetCap);
  }
  return pool
    .sort((a, b) => b.rating - a.rating || a.pricePerNight - b.pricePerNight)
    .slice(0, 4)
    .map(listingFromHotel);
}

function getTopRentals(destinationId?: string, budgetCap?: number) {
  let pool = [...rentals];
  if (destinationId) {
    pool = pool.filter((item) => item.destinationId === destinationId);
  }
  if (budgetCap) {
    pool = pool.filter((item) => item.pricePerNight <= budgetCap);
  }
  return pool
    .sort((a, b) => b.rating - a.rating || a.pricePerNight - b.pricePerNight)
    .slice(0, 4)
    .map(listingFromRental);
}

function getBestDestinationsByTheme(message: string) {
  const normalized = normalizeText(message);
  const keywordToTag: Record<string, string> = {
    beach: 'Beach',
    romantic: 'Romance',
    romance: 'Romance',
    food: 'Food',
    culture: 'Culture',
    city: 'City',
    adventure: 'Adventure',
    luxury: 'Luxury',
    nature: 'Nature',
  };

  const matchedTag = Object.entries(keywordToTag).find(([keyword]) => normalized.includes(keyword))?.[1];

  let pool = [...destinations];
  if (matchedTag) {
    pool = pool.filter((destination) => destination.tags.includes(matchedTag));
  }

  return pool
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    .slice(0, 3);
}

function getDestinationById(destinationId?: string) {
  if (!destinationId) return undefined;
  return destinations.find((item) => item.id === destinationId);
}

function buildContext(
  context: AssistantContextState,
  next: Partial<AssistantContextState>,
): AssistantContextState {
  return {
    ...context,
    ...next,
  };
}

type ViteEnvMap = Record<string, string | undefined>;

function getViteEnv(): ViteEnvMap {
  const meta = import.meta as ImportMeta & { env?: ViteEnvMap };
  return meta.env ?? {};
}

function getApiUrl() {
  const env = getViteEnv();
  return (env.VITE_TRAVEL_ASSISTANT_API_URL || DEFAULT_CHAT_API_URL).trim();
}

function getActionsApiBase() {
  const env = getViteEnv();
  return (env.VITE_TRAVEL_ASSISTANT_ACTIONS_API_BASE || DEFAULT_ACTIONS_API_BASE).replace(/\/+$/, '');
}

function isIntent(value: unknown): value is TravelIntent {
  return [
    'destination_recommendation',
    'property_search',
    'rental_reservation',
    'host_contact',
    'visa_requirements',
    'budget_planning',
    'itinerary_suggestions',
    'faq_support',
    'general',
  ].includes(String(value));
}

function sanitizeListings(value: unknown): AssistantListing[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw): AssistantListing | null => {
      if (!raw || typeof raw !== 'object') return null;
      const row = raw as Record<string, unknown>;
      if (typeof row.id !== 'string' || typeof row.title !== 'string') return null;

      const type = row.type === 'rental' ? 'rental' : 'hotel';
      return {
        id: row.id,
        type,
        destinationId: typeof row.destinationId === 'string' ? row.destinationId : '',
        title: row.title,
        location: typeof row.location === 'string' ? row.location : 'Location not provided',
        pricePerNight: typeof row.pricePerNight === 'number' ? row.pricePerNight : Number(row.pricePerNight) || 0,
        rating: typeof row.rating === 'number' ? row.rating : Number(row.rating) || 0,
        image: typeof row.image === 'string' ? row.image : '',
        amenities: Array.isArray(row.amenities) ? row.amenities.map((item) => String(item)).slice(0, 8) : [],
        summary: typeof row.summary === 'string' ? row.summary : '',
      };
    })
    .filter((row): row is AssistantListing => Boolean(row));
}

function sanitizeActions(value: unknown): AssistantAction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw): AssistantAction | null => {
      if (!raw || typeof raw !== 'object') return null;
      const row = raw as Record<string, unknown>;
      if (typeof row.kind !== 'string' || typeof row.label !== 'string') return null;
      return {
        id: typeof row.id === 'string' ? row.id : createId('api-action'),
        kind: row.kind as AssistantAction['kind'],
        label: row.label,
        payload: typeof row.payload === 'object' && row.payload ? (row.payload as Record<string, string | number | boolean>) : undefined,
      };
    })
    .filter((row): row is AssistantAction => Boolean(row));
}

function sanitizeApiReply(data: unknown, context: AssistantContextState): AssistantReply | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  const text =
    (typeof row.text === 'string' && row.text) ||
    (typeof row.reply === 'string' && row.reply) ||
    (typeof row.message === 'string' && row.message);
  if (!text) return null;

  const detectedIntent = isIntent(row.intent) ? row.intent : detectTravelIntent(text);
  const nextContext = buildContext(context, isIntent(row.intent) ? { lastIntent: row.intent } : { lastIntent: detectedIntent });

  const suggestions = Array.isArray(row.suggestions)
    ? row.suggestions.map((item) => String(item)).filter(Boolean).slice(0, 6)
    : [];

  return {
    text,
    intent: detectedIntent,
    context: nextContext,
    actions: sanitizeActions(row.actions),
    listings: sanitizeListings(row.listings),
    suggestions,
    source: 'api',
  };
}

function buildGeneralReply(message: string, context: AssistantContextState): AssistantReply {
  const inferredDestination = findDestinationId(message, context);
  const destination = getDestinationById(inferredDestination);
  const intro = destination
    ? `Great, I can help with ${destination.name}. I can search stays, estimate budget, and build a day-by-day plan.`
    : 'I can help you find destinations, compare hotels and rentals, estimate budgets, and prepare booking requests.';

  return {
    text: `${intro} Tell me your destination, dates, guest count, or budget to get started.`,
    intent: 'general',
    context: buildContext(context, { lastIntent: 'general', lastDestinationId: destination?.id }),
    actions: [
      buildAction('search_hotels', 'Check availability'),
      buildAction('plan_trip', 'Plan my trip'),
      buildAction('open_support', 'Customer support'),
    ],
    suggestions: [
      'Find beach destinations for couples',
      'Show me top-rated hotels in Santorini',
      'Plan a 4-day itinerary in Bali',
      'I need a budget-friendly rental under $250',
    ],
    listings: destination ? getTopHotels(destination.id).slice(0, 3) : getTopHotels(undefined).slice(0, 3),
    source: 'local',
  };
}

function buildLocalReply(payload: AssistantRequestPayload): AssistantReply {
  const message = payload.message.trim();
  const inferredIntent = detectTravelIntent(message);
  const destinationId = findDestinationId(message, payload.context);
  const budgetCap = extractBudget(message, payload.context.budgetCap);
  const travelers = extractGuests(message, payload.context.travelers);
  const destination = getDestinationById(destinationId);

  if (inferredIntent === 'destination_recommendation') {
    const recommendations = getBestDestinationsByTheme(message);
    const recommendationText = recommendations
      .map((item, index) => `${index + 1}. ${item.name}, ${item.country} (${item.rating.toFixed(1)}★)`)
      .join('\n');

    const destinationListings = recommendations.flatMap((item) => getTopHotels(item.id).slice(0, 1));
    return {
      text:
        recommendations.length > 0
          ? `Here are strong destination matches based on your request:\n${recommendationText}\n\nPick one and I can check availability instantly.`
          : 'Share your vibe (beach, culture, city, luxury, or adventure) and I will recommend matching destinations.',
      intent: 'destination_recommendation',
      context: buildContext(payload.context, {
        lastIntent: 'destination_recommendation',
        lastDestinationId: recommendations[0]?.id ?? destinationId,
      }),
      actions: [
        buildAction('check_availability', 'Check availability', { destinationId: recommendations[0]?.id }),
        buildAction('plan_trip', 'Plan my trip', { destinationId: recommendations[0]?.id }),
        buildAction('search_hotels', 'Book now', { destinationId: recommendations[0]?.id }),
      ],
      suggestions: [
        'Show me luxury options there',
        'Any family-friendly stays?',
        'What is the best season to travel?',
      ],
      listings: destinationListings.slice(0, 4),
      source: 'local',
    };
  }

  if (inferredIntent === 'property_search') {
    const hotelMatches = getTopHotels(destinationId, budgetCap);
    const destinationLabel = destination ? `${destination.name}` : 'your destination';
    return {
      text:
        hotelMatches.length > 0
          ? `I found ${hotelMatches.length} strong hotel options for ${destinationLabel}${budgetCap ? ` under $${budgetCap}/night` : ''}. You can book now or request a quote directly from chat.`
          : `I could not find exact matches for ${destinationLabel}${budgetCap ? ` under $${budgetCap}` : ''}. I can widen the search or switch to rentals.`,
      intent: 'property_search',
      context: buildContext(payload.context, {
        lastIntent: 'property_search',
        lastDestinationId: destinationId,
        preferredListingType: 'hotel',
        budgetCap,
        travelers,
      }),
      actions: [
        buildAction('check_availability', 'Check availability', { listingId: hotelMatches[0]?.id }),
        buildAction('book_now', 'Book now', { listingId: hotelMatches[0]?.id }),
        buildAction('get_quote', 'Get quote', { listingId: hotelMatches[0]?.id }),
      ],
      suggestions: [
        'Show boutique hotels',
        'Show options with pool and spa',
        'I need something closer to city center',
      ],
      listings: hotelMatches,
      source: 'local',
    };
  }

  if (inferredIntent === 'rental_reservation') {
    const rentalMatches = getTopRentals(destinationId, budgetCap);
    return {
      text:
        rentalMatches.length > 0
          ? `I found ${rentalMatches.length} rentals that fit your request. I can open a reservation flow with dates, guests, and instant pricing.`
          : 'I could not find a rental match with your current filters. Share destination, dates, and budget and I will refine it.',
      intent: 'rental_reservation',
      context: buildContext(payload.context, {
        lastIntent: 'rental_reservation',
        lastDestinationId: destinationId,
        preferredListingType: 'rental',
        budgetCap,
        travelers,
      }),
      actions: [
        buildAction('check_availability', 'Check availability', { listingId: rentalMatches[0]?.id }),
        buildAction('book_now', 'Book now', { listingId: rentalMatches[0]?.id }),
        buildAction('contact_host', 'Contact host', { listingId: rentalMatches[0]?.id }),
      ],
      suggestions: [
        'Show villas with private pool',
        'Need pet-friendly rental',
        '2-bedroom options only',
      ],
      listings: rentalMatches,
      source: 'local',
    };
  }

  if (inferredIntent === 'host_contact') {
    const pool = [...getTopRentals(destinationId, budgetCap), ...getTopHotels(destinationId, budgetCap)].slice(0, 4);
    return {
      text:
        pool.length > 0
          ? 'I can help you contact the host or property team. Pick a listing below and I will prepare your contact request with your message.'
          : 'I can prepare a host contact request. Tell me which listing you want to contact, and your travel dates.',
      intent: 'host_contact',
      context: buildContext(payload.context, {
        lastIntent: 'host_contact',
        lastDestinationId: destinationId,
        budgetCap,
        travelers,
      }),
      actions: [
        buildAction('contact_host', 'Contact host', { listingId: pool[0]?.id }),
        buildAction('check_availability', 'Check availability', { listingId: pool[0]?.id }),
      ],
      suggestions: [
        'Ask host about early check-in',
        'Ask if airport transfer is available',
        'Ask about cancellation flexibility',
      ],
      listings: pool,
      source: 'local',
    };
  }

  if (inferredIntent === 'visa_requirements') {
    const normalized = normalizeText(message);
    const matchedGuidance =
      Object.entries(VISA_GUIDANCE).find(([key]) => normalized.includes(key))?.[1] ||
      (destination ? VISA_GUIDANCE[destination.id] : undefined);
    return {
      text:
        `${matchedGuidance || 'Visa requirements depend on your passport, destination, and stay duration.'} ` +
        'For final compliance, verify current rules with the official embassy or immigration portal before travel.',
      intent: 'visa_requirements',
      context: buildContext(payload.context, {
        lastIntent: 'visa_requirements',
        lastDestinationId: destinationId,
      }),
      actions: [
        buildAction('open_support', 'Customer support'),
        buildAction('plan_trip', 'Plan my trip', { destinationId }),
      ],
      suggestions: [
        'What documents should I carry?',
        'How early should I apply?',
        'Do I need travel insurance?',
      ],
      listings: destinationId ? getTopHotels(destinationId).slice(0, 3) : [],
      source: 'local',
    };
  }

  if (inferredIntent === 'budget_planning') {
    const combinedPool = [...getTopHotels(destinationId, budgetCap), ...getTopRentals(destinationId, budgetCap)]
      .sort((a, b) => a.pricePerNight - b.pricePerNight)
      .slice(0, 4);

    const averageNightly =
      combinedPool.length > 0
        ? Math.round(combinedPool.reduce((sum, row) => sum + row.pricePerNight, 0) / combinedPool.length)
        : undefined;

    const stayNights = 4;
    const accommodation = averageNightly ? averageNightly * stayNights : 0;
    const extras = averageNightly ? Math.round(accommodation * 0.35) : 0;
    const estimate = accommodation + extras;

    return {
      text:
        averageNightly
          ? `Based on current inventory${destination ? ` in ${destination.name}` : ''}, a realistic budget is around $${averageNightly}/night. For a ${stayNights}-night trip, estimate about $${estimate} including basic extras.`
          : 'Share your target destination and max nightly budget, and I will generate a more precise estimate.',
      intent: 'budget_planning',
      context: buildContext(payload.context, {
        lastIntent: 'budget_planning',
        lastDestinationId: destinationId,
        budgetCap,
        travelers,
      }),
      actions: [
        buildAction('get_quote', 'Get quote', { listingId: combinedPool[0]?.id }),
        buildAction('check_availability', 'Check availability', { listingId: combinedPool[0]?.id }),
        buildAction('plan_trip', 'Plan my trip', { destinationId }),
      ],
      suggestions: [
        'Keep it under $250/night',
        'Compare hotels vs rentals',
        'Show best value properties',
      ],
      listings: combinedPool,
      source: 'local',
    };
  }

  if (inferredIntent === 'itinerary_suggestions') {
    const itineraryDestination = destination || destinations[0];
    const points = itineraryDestination.mustVisit.slice(0, 3);
    const itineraryText = [
      `Day 1: Arrival + ${points[0] || 'city walk'} and local dinner`,
      `Day 2: ${points[1] || 'main attractions'} + cultural experiences`,
      `Day 3: ${points[2] || 'relaxation'} + shopping + departure prep`,
    ].join('\n');

    return {
      text: `Here is a simple itinerary for ${itineraryDestination.name}:\n${itineraryText}\n\nI can tailor this around your budget, travel pace, and accommodation type.`,
      intent: 'itinerary_suggestions',
      context: buildContext(payload.context, {
        lastIntent: 'itinerary_suggestions',
        lastDestinationId: itineraryDestination.id,
      }),
      actions: [
        buildAction('plan_trip', 'Plan my trip', { destinationId: itineraryDestination.id }),
        buildAction('book_now', 'Book now', { destinationId: itineraryDestination.id }),
        buildAction('check_availability', 'Check availability', { destinationId: itineraryDestination.id }),
      ],
      suggestions: [
        'Make it luxury-focused',
        'Make it family-friendly',
        'Add food and nightlife stops',
      ],
      listings: getTopHotels(itineraryDestination.id).slice(0, 4),
      source: 'local',
    };
  }

  if (inferredIntent === 'faq_support') {
    const normalized = normalizeText(message);
    const faqAnswer =
      (Object.entries(FAQ_GUIDANCE).find(([key]) => normalized.includes(key)) || [])[1] ||
      FAQ_GUIDANCE.support;

    return {
      text: `${faqAnswer} If you want, I can open a support request now and include your trip details.`,
      intent: 'faq_support',
      context: buildContext(payload.context, {
        lastIntent: 'faq_support',
      }),
      actions: [
        buildAction('open_support', 'Customer support'),
        buildAction('contact_host', 'Contact host'),
      ],
      suggestions: [
        'I need help with a payment issue',
        'I need cancellation support',
        'I need help contacting a host',
      ],
      listings: [],
      source: 'local',
    };
  }

  return buildGeneralReply(message, payload.context);
}

export async function requestTravelAssistantReply(payload: AssistantRequestPayload): Promise<AssistantReply> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const apiUrl = getApiUrl();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json();
      const normalized = sanitizeApiReply(data, payload.context);
      if (normalized) {
        return normalized;
      }
    }
  } catch {
    // Gracefully fallback to local orchestrator
  } finally {
    window.clearTimeout(timeout);
  }

  return buildLocalReply(payload);
}

async function postAction(endpoint: string, payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const data = await response.json();
    const referenceId =
      typeof data?.referenceId === 'string'
        ? data.referenceId
        : typeof data?.id === 'string'
          ? data.id
          : createId('REQ');
    const message = typeof data?.message === 'string' ? data.message : undefined;
    return { success: true, referenceId, message };
  } catch {
    return {
      success: true,
      referenceId: createId('REQ'),
      message: 'Request captured locally and queued for delivery.',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function submitBookingRequest(sessionId: string, draft: BookingDraft) {
  const endpoint = `${getActionsApiBase()}/booking-request`;
  return postAction(endpoint, { sessionId, ...draft });
}

export async function submitContactRequest(sessionId: string, draft: ContactDraft) {
  const endpoint = `${getActionsApiBase()}/contact-host`;
  return postAction(endpoint, { sessionId, ...draft });
}

export async function submitSupportRequest(sessionId: string, draft: SupportDraft) {
  const endpoint = `${getActionsApiBase()}/support`;
  return postAction(endpoint, { sessionId, ...draft });
}

export function getAllChatListings(): AssistantListing[] {
  return [
    ...hotels.map(listingFromHotel),
    ...rentals.map(listingFromRental),
  ];
}

export function getDefaultAssistantContext(): AssistantContextState {
  return { ...DEFAULT_CONTEXT };
}
