export type TravelIntent =
  | 'destination_recommendation'
  | 'property_search'
  | 'rental_reservation'
  | 'host_contact'
  | 'visa_requirements'
  | 'budget_planning'
  | 'itinerary_suggestions'
  | 'faq_support'
  | 'general';

export type AssistantActionKind =
  | 'book_now'
  | 'check_availability'
  | 'contact_host'
  | 'get_quote'
  | 'plan_trip'
  | 'open_support'
  | 'search_hotels'
  | 'search_rentals';

export interface AssistantAction {
  id: string;
  label: string;
  kind: AssistantActionKind;
  payload?: Record<string, string | number | boolean | undefined>;
}

export interface AssistantListing {
  id: string;
  type: 'hotel' | 'rental';
  destinationId: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating: number;
  image: string;
  amenities: string[];
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  intent?: TravelIntent;
  actions?: AssistantAction[];
  listings?: AssistantListing[];
  suggestions?: string[];
}

export interface AssistantContextState {
  lastIntent: TravelIntent;
  lastDestinationId?: string;
  preferredListingType?: 'hotel' | 'rental';
  budgetCap?: number;
  travelers?: number;
}

export interface AssistantRequestPayload {
  sessionId: string;
  message: string;
  history: Array<Pick<ChatMessage, 'role' | 'text'>>;
  context: AssistantContextState;
}

export interface AssistantReply {
  text: string;
  intent: TravelIntent;
  context: AssistantContextState;
  actions: AssistantAction[];
  suggestions: string[];
  listings: AssistantListing[];
  source: 'api' | 'local';
}

export interface BookingDraft {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  note?: string;
}

export interface ContactDraft {
  listingId?: string;
  name: string;
  email: string;
  message: string;
}

export interface SupportDraft {
  topic: string;
  name: string;
  email: string;
  message: string;
}

