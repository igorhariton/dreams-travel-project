import React, { useMemo, useState } from 'react';
import { Mail, MessageCircle, SendHorizontal, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { AssistantListing, ContactDraft } from '../../chat/types';

interface ChatContactWidgetProps {
  listings: AssistantListing[];
  defaultListingId?: string;
  onSubmit: (draft: ContactDraft) => Promise<void> | void;
  onCancel: () => void;
}

export function ChatContactWidget({
  listings,
  defaultListingId,
  onSubmit,
  onCancel,
}: ChatContactWidgetProps) {
  const { theme } = useApp();
  const isDarkTheme = theme === 'dark';
  const [listingId, setListingId] = useState(defaultListingId || listings[0]?.id || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedListing = useMemo(() => {
    return listings.find((listing) => listing.id === listingId);
  }, [listingId, listings]);

  const isValid = Boolean(name.trim() && email.trim() && message.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        listingId: selectedListing?.id,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`travel-shell border p-4 shadow-sm ${
        isDarkTheme ? 'border-[#334155] bg-[#111827]' : 'border-[#D9E2EC] bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={`text-sm font-bold ${isDarkTheme ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Contact Host</h3>
          <p className={`mt-1 text-xs ${isDarkTheme ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Send a direct message to host or property team.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={`travel-icon-button p-2 ${
            isDarkTheme
              ? 'text-[#94A3B8] hover:bg-[#243144] hover:text-[#F9FAFB]'
              : 'text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#0F172A]'
          }`}
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className={`mb-1 block text-xs font-semibold ${isDarkTheme ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>Property (optional)</label>
          <Select value={listingId} onValueChange={setListingId}>
            <SelectTrigger className="travel-select-trigger h-11 rounded-[18px] text-sm">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent className="travel-select-content">
              {listings.map((listing) => (
                <SelectItem key={listing.id} value={listing.id} className="travel-select-item">
                  {listing.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={`mb-1 block text-xs font-semibold ${isDarkTheme ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>Your Name</label>
          <div className="travel-input-field flex h-11 items-center gap-2">
            <User size={14} className={isDarkTheme ? 'text-[#94A3B8]' : 'text-[#64748B]'} />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="John Doe"
              className={`w-full bg-transparent text-sm outline-none ${isDarkTheme ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}
            />
          </div>
        </div>

        <div>
          <label className={`mb-1 block text-xs font-semibold ${isDarkTheme ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>Email</label>
          <div className="travel-input-field flex h-11 items-center gap-2">
            <Mail size={14} className={isDarkTheme ? 'text-[#94A3B8]' : 'text-[#64748B]'} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="john@example.com"
              className={`w-full bg-transparent text-sm outline-none ${isDarkTheme ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}
            />
          </div>
        </div>

        <div>
          <label className={`mb-1 block text-xs font-semibold ${isDarkTheme ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>Message</label>
          <div className="travel-input-field flex gap-2">
            <MessageCircle size={14} className={`mt-1 ${isDarkTheme ? 'text-[#94A3B8]' : 'text-[#64748B]'}`} />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="Hi, is early check-in available and is airport transfer included?"
              className={`w-full resize-none bg-transparent text-sm outline-none ${isDarkTheme ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className="travel-secondary-button flex-1 px-3 py-2.5 text-xs font-semibold">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="travel-primary-button inline-flex flex-1 items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizontal size={14} />
          {isSubmitting ? 'Sending...' : 'Send to host'}
        </button>
      </div>
    </div>
  );
}
