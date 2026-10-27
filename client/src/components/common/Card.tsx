import React from "react";

import type {
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from "@types";

import { CARD_UI } from "@constants/designTokens";

/** True when className sets all-sides padding (`p-0`, `p-4`) so defaults are not stacked. */
function hasAllSidesPaddingClass(className: string): boolean {
  return className.split(/\s+/).some((token) => {
    return CARD_UI.ALL_SIDES_PADDING_CLASS.test(token);
  });
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-border bg-card text-card-foreground shadow-none ${className}`}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className = "", ...props }, ref) => {
  const padding = hasAllSidesPaddingClass(className) ? "" : CARD_UI.HEADER_PADDING_CLASS;
  return (
    <div ref={ref} className={`flex flex-col space-y-1 sm:space-y-1.5 ${padding} ${className}`.trim()} {...props} />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className = "", ...props }, ref) => (
  <h3 ref={ref} className={`text-lg sm:text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = "", ...props }, ref) => (
    <p ref={ref} className={`text-xs sm:text-sm text-muted-foreground ${className}`} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className = "", ...props }, ref) => {
  const padding = hasAllSidesPaddingClass(className) ? "" : CARD_UI.CONTENT_PADDING_CLASS;
  return <div ref={ref} className={`${padding} ${className}`.trim()} {...props} />;
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className = "", ...props }, ref) => {
  const padding = hasAllSidesPaddingClass(className) ? "" : CARD_UI.FOOTER_PADDING_CLASS;
  return <div ref={ref} className={`flex items-center ${padding} ${className}`.trim()} {...props} />;
});
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
