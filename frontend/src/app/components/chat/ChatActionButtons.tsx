import React from 'react';
import { ArrowRight, Headset, Hotel, Map, MessageSquare, Search } from 'lucide-react';
import type { AssistantAction } from '../../chat/types';

interface ChatActionButtonsProps {
  actions: AssistantAction[];
  onAction: (action: AssistantAction) => void;
  disabled?: boolean;
}

function iconForAction(kind: AssistantAction['kind']) {
  switch (kind) {
    case 'book_now':
      return <Hotel size={14} />;
    case 'check_availability':
      return <Search size={14} />;
    case 'contact_host':
      return <MessageSquare size={14} />;
    case 'get_quote':
      return <ArrowRight size={14} />;
    case 'plan_trip':
      return <Map size={14} />;
    case 'open_support':
      return <Headset size={14} />;
    default:
      return <ArrowRight size={14} />;
  }
}

function actionClasses(kind: AssistantAction['kind']) {
  if (kind === 'book_now' || kind === 'check_availability' || kind === 'get_quote') {
    return 'travel-primary-button border-transparent text-white';
  }
  return 'travel-secondary-button';
}

export function ChatActionButtons({ actions, onAction, disabled = false }: ChatActionButtonsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={disabled}
          onClick={() => onAction(action)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-45 ${actionClasses(action.kind)}`}
        >
          {iconForAction(action.kind)}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

