import React from "react";

/** True when className sets all-sides padding (`p-0`, `p-4`) so defaults are not stacked. */
function hasAllSidesPaddingClass(className: string): boolean {
  return className.split(/\s+/).some((token) => {
    return /^!?p-/.test(token);
  });
}

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl border border-border bg-card text-card-foreground shadow-none ${className}`}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => {
    const padding = hasAllSidesPaddingClass(className) ? "" : "p-3 sm:p-6";
    return (
      <div ref={ref} className={`flex flex-col space-y-1 sm:space-y-1.5 ${padding} ${className}`.trim()} {...props} />
    );
  },
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`text-lg sm:text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => (
    <p ref={ref} className={`text-xs sm:text-sm text-muted-foreground ${className}`} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => {
    const padding = hasAllSidesPaddingClass(className) ? "" : "p-3 sm:p-6 lg:pt-4";
    return <div ref={ref} className={`${padding} ${className}`.trim()} {...props} />;
  },
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => {
    const padding = hasAllSidesPaddingClass(className) ? "" : "p-3 sm:p-6 pt-0";
    return <div ref={ref} className={`flex items-center ${padding} ${className}`.trim()} {...props} />;
  },
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
