"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("travel-calendar p-0", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-4",
        caption: "relative flex items-center justify-center pb-1 pt-1",
        caption_label:
          "text-sm font-semibold tracking-[0.01em] text-[#0F172A] dark:text-[#F9FAFB]",
        nav: "flex items-center gap-2",
        nav_button:
          "travel-icon-button h-9 w-9 rounded-full border border-[#D9E2EC] bg-[#F8FAFC] p-0 text-[#475569] opacity-100 transition-colors hover:bg-[#EFF6FF] hover:text-[#0F172A] dark:border-[#334155] dark:bg-[#243144] dark:text-[#CBD5E1] dark:hover:bg-[#334155] dark:hover:text-[#F9FAFB]",
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "mb-1 flex",
        head_cell:
          "w-10 rounded-full text-center text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-[#94A3B8]",
        row: "mt-1.5 flex w-full",
        cell: cn(
          "relative h-10 w-10 p-0 text-center text-sm",
          props.mode === "range"
            ? "[&:has(>.day-range-start)]:rounded-l-[12px] [&:has(>.day-range-end)]:rounded-r-[12px] [&:has(>.day-range-middle)]:bg-[#DBEAFE] dark:[&:has(>.day-range-middle)]:bg-[#1E3A5F]"
            : "[&:has([aria-selected])]:rounded-[12px]",
        ),
        day: "h-10 w-10 rounded-[12px] p-0 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#EFF6FF] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]/70 dark:text-[#F9FAFB] dark:hover:bg-[#243144] dark:hover:text-[#F9FAFB] dark:focus-visible:ring-[#3B82F6]/70",
        day_range_start:
          "day-range-start bg-[#60A5FA] text-white hover:bg-[#60A5FA] hover:text-white dark:bg-[#3B82F6]",
        day_range_end:
          "day-range-end bg-[#60A5FA] text-white hover:bg-[#60A5FA] hover:text-white dark:bg-[#3B82F6]",
        day_selected:
          "bg-[#60A5FA] text-white hover:bg-[#60A5FA] hover:text-white focus:bg-[#60A5FA] focus:text-white dark:bg-[#3B82F6] dark:hover:bg-[#3B82F6]",
        day_today:
          "border border-[#60A5FA] bg-[#EFF6FF] text-[#1D4ED8] dark:border-[#3B82F6] dark:bg-[#0F2A4A] dark:text-[#93C5FD]",
        day_outside:
          "day-outside text-[#94A3B8] opacity-55 aria-selected:text-[#94A3B8] dark:text-[#64748B]",
        day_disabled: "text-[#94A3B8] opacity-60 dark:text-[#64748B]",
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
