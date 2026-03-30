import type { TravelIntent } from './types';

const INTENT_KEYWORDS: Array<{ intent: TravelIntent; terms: string[] }> = [
  {
    intent: 'visa_requirements',
    terms: ['visa', 'entry', 'passport', 'requirements', 'border', 'immigration'],
  },
  {
    intent: 'budget_planning',
    terms: ['budget', 'cost', 'cheap', 'affordable', 'price', 'under', 'quote', 'estimate'],
  },
  {
    intent: 'itinerary_suggestions',
    terms: ['itinerary', 'plan trip', 'schedule', 'day by day', 'trip plan', 'route'],
  },
  {
    intent: 'host_contact',
    terms: ['contact host', 'message host', 'reach host', 'owner', 'landlord', 'host'],
  },
  {
    intent: 'rental_reservation',
    terms: ['reserve', 'reservation', 'book rental', 'villa', 'apartment', 'house', 'check in', 'check-out', 'availability'],
  },
  {
    intent: 'property_search',
    terms: ['hotel', 'property', 'stay', 'room', 'resort', 'accommodation'],
  },
  {
    intent: 'destination_recommendation',
    terms: ['destination', 'where to go', 'recommend', 'place', 'beach', 'city break', 'romantic'],
  },
  {
    intent: 'faq_support',
    terms: ['help', 'support', 'problem', 'issue', 'refund', 'cancel', 'payment', 'faq'],
  },
];

export function detectTravelIntent(message: string): TravelIntent {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return 'general';

  let bestIntent: TravelIntent = 'general';
  let bestScore = 0;

  for (const item of INTENT_KEYWORDS) {
    const score = item.terms.reduce((acc, term) => {
      return acc + (normalized.includes(term) ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestIntent = item.intent;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestIntent : 'general';
}

