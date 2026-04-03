"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { useApp } from "../../context/AppContext";
import { cn } from "./utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const { theme } = useApp();
  const isDarkTheme = theme === "dark";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "travel-calendar p-0",
        isDarkTheme ? "text-[#F9FAFB]" : "text-[#0F172A]",
        className,
      )}
      classNames={{
        button_reset:
          "m-0 inline-flex appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none",
        button: "inline-flex items-center justify-center",
        months: "flex flex-col",
        month: "space-y-3",
        caption: "relative flex items-center justify-center pb-1 pt-1",
        caption_label: cn(
          "text-sm font-semibold tracking-[0.01em]",
          isDarkTheme ? "text-[#F9FAFB]" : "text-[#1E293B]",
        ),
        nav: "flex items-center gap-2",
        nav_button: cn(
          "travel-icon-button h-9 w-9 rounded-full border p-0 opacity-100 transition-colors",
          isDarkTheme
            ? "border-[#334155] bg-[#243144] text-[#CBD5E1] hover:bg-[#334155] hover:text-[#F9FAFB]"
            : "border-[#D9E2EC] bg-[#F8FAFC] text-[#475569] hover:bg-[#EFF6FF] hover:text-[#0F172A]",
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "mb-1 flex",
        head_cell: cn(
          "w-10 rounded-full text-center text-[0.72rem] font-semibold uppercase tracking-[0.08em]",
          isDarkTheme ? "text-[#94A3B8]" : "text-[#64748B]",
        ),
        row: "mt-1.5 flex w-full",
        cell: cn(
          "relative h-10 w-10 p-0 text-center text-sm",
          props.mode === "range"
            ? "[&:has(>.day-range-start)]:rounded-l-[12px] [&:has(>.day-range-end)]:rounded-r-[12px] [&:has(>.day-range-middle)]:bg-[#DBEAFE] dark:[&:has(>.day-range-middle)]:bg-[#1E3A5F]"
            : "[&:has([aria-selected])]:rounded-[12px]",
        ),
        day: cn(
          "h-10 w-10 rounded-[12px] p-0 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
          isDarkTheme
            ? "text-[#F9FAFB] hover:bg-[#243144] hover:text-[#F9FAFB] focus-visible:ring-[#3B82F6]/70"
            : "text-[#1E293B] hover:bg-[#EFF6FF] hover:text-[#0F172A] focus-visible:ring-[#60A5FA]/70",
        ),
        day_range_start:
          "day-range-start bg-[#60A5FA] text-white hover:bg-[#60A5FA] hover:text-white dark:bg-[#3B82F6]",
        day_range_end:
          "day-range-end bg-[#60A5FA] text-white hover:bg-[#60A5FA] hover:text-white dark:bg-[#3B82F6]",
        day_selected:
          "bg-[#60A5FA] text-white hover:bg-[#60A5FA] hover:text-white focus:bg-[#60A5FA] focus:text-white dark:bg-[#3B82F6] dark:hover:bg-[#3B82F6]",
        day_today:
          "border border-[#60A5FA] bg-[#EFF6FF] text-[#1D4ED8] dark:border-[#3B82F6] dark:bg-[#0F2A4A] dark:text-[#93C5FD]",
        day_outside: cn(
          "day-outside aria-selected:text-[#94A3B8] opacity-90",
          isDarkTheme ? "text-[#64748B]" : "text-[#94A3B8]",
        ),
        day_disabled: "cursor-not-allowed text-[#64748B] opacity-100",
        day_range_middle:
          "day-range-middle rounded-[12px] bg-[#DBEAFE] text-[#0F172A] dark:bg-[#1E3A5F] dark:text-[#F9FAFB]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
