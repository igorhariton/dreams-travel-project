"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "./utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content> & {
  portalled?: boolean;
  portalContainer?: HTMLElement | null;
};

function PopoverContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 8,
  alignOffset = 0,
  collisionPadding = 12,
  avoidCollisions = false,
  sticky = "always",
  hideWhenDetached = false,
  portalled = true,
  portalContainer,
  ...props
}: PopoverContentProps) {
  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      side={side}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      collisionPadding={collisionPadding}
      avoidCollisions={avoidCollisions}
      sticky={sticky}
      hideWhenDetached={hideWhenDetached}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[180] max-w-[calc(100vw-1.5rem)] origin-[var(--radix-popover-content-transform-origin)] overflow-hidden rounded-[20px] border border-border p-0 shadow-[0_22px_48px_rgba(15,23,42,0.16)] outline-hidden will-change-[transform,opacity] dark:shadow-[0_20px_44px_rgba(2,6,23,0.44)]",
        className,
      )}
      {...props}
    />
  );

  if (!portalled) {
    return content;
  }

  return (
    <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
      {content}
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
