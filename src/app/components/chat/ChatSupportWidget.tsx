import React, { useState } from 'react';
import { Headset, Mail, SendHorizontal, User, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { SupportDraft } from '../../chat/types';

interface ChatSupportWidgetProps {
  onSubmit: (draft: SupportDraft) => Promise<void> | void;
  onCancel: () => void;
}

const SUPPORT_TOPICS = [
  { value: 'booking', label: 'Booking issue' },
  { value: 'payment', label: 'Payment issue' },
  { value: 'refund', label: 'Refund request' },
  { value: 'account', label: 'Account support' },
  { value: 'other', label: 'Other request' },
];

export function ChatSupportWidget({ onSubmit, onCancel }: ChatSupportWidgetProps) {
  const [topic, setTopic] = useState(SUPPORT_TOPICS[0].value);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = Boolean(name.trim() && email.trim() && message.trim());

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        topic,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="travel-shell border border-[#D9E2EC] bg-white p-4 shadow-sm dark:border-[#334155] dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">Customer Support</h3>
          <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">Open a support ticket directly from chat.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="travel-icon-button p-2 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#243144] dark:hover:text-[#F9FAFB]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Issue Type</label>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="travel-select-trigger h-11 rounded-[18px] text-sm">
              <SelectValue placeholder="Choose issue type" />
            </SelectTrigger>
            <SelectContent className="travel-select-content">
              {SUPPORT_TOPICS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="travel-select-item">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Full Name</label>
          <div className="travel-input-field flex h-11 items-center gap-2">
            <User size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="John Doe"
              className="w-full bg-transparent text-sm text-[#0F172A] outline-none dark:text-[#F9FAFB]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Email</label>
          <div className="travel-input-field flex h-11 items-center gap-2">
            <Mail size={14} className="text-[#64748B] dark:text-[#94A3B8]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="john@example.com"
              className="w-full bg-transparent text-sm text-[#0F172A] outline-none dark:text-[#F9FAFB]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">Describe the issue</label>
          <div className="travel-input-field flex gap-2">
            <Headset size={14} className="mt-1 text-[#64748B] dark:text-[#94A3B8]" />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="Share your booking ID, issue details, and preferred resolution."
              className="w-full resize-none bg-transparent text-sm text-[#0F172A] outline-none dark:text-[#F9FAFB]"
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
          {isSubmitting ? 'Submitting...' : 'Submit support request'}
        </button>
      </div>
    </div>
  );
}
