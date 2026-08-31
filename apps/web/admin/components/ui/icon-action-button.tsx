"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" dir="rtl">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

type IconActionButtonProps = ButtonProps & {
  tooltip: string;
};

export const IconActionButton = React.forwardRef<HTMLButtonElement, IconActionButtonProps>(
  ({ tooltip, size = "icon", variant = "ghost", children, ...props }, ref) => {
    return (
      <ActionTooltip label={tooltip}>
        <Button ref={ref} type="button" size={size} variant={variant} aria-label={tooltip} {...props}>
          {children}
        </Button>
      </ActionTooltip>
    );
  }
);
IconActionButton.displayName = "IconActionButton";
