import React from 'react';
import { TRAVEL_COLORS } from '../../types/travel';
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type Option<T extends string> = {
  value: T;
  label: string;
};

type SelectProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
      {label}
      <UiSelect value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger
          className="h-10 rounded-2xl border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:ring-2"
          style={{ borderColor: TRAVEL_COLORS.border, boxShadow: '0 1px 0 rgba(15,23,42,0.02)' }}
        >
          <SelectValue placeholder={options[0]?.label || 'Select'} />
        </SelectTrigger>
        <SelectContent
          className="max-h-80 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_36px_rgba(15,23,42,0.14)]"
          style={{ borderColor: TRAVEL_COLORS.border }}
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </UiSelect>
    </label>
  );
}
