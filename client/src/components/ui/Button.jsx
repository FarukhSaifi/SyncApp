import React from "react";
import { BUTTON_VARIANTS } from "../../constants/designTokens";

const Button = React.forwardRef(
  (
    { className = "", variant = BUTTON_VARIANTS.DEFAULT, size = "default", disabled = false, children, ...props },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variants = {
      [BUTTON_VARIANTS.DEFAULT]: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      [BUTTON_VARIANTS.PRIMARY]: "bg-primary text-primary-foreground hover:bg-primary/90",
      [BUTTON_VARIANTS.SECONDARY]: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      [BUTTON_VARIANTS.SUBTLE]: "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80",
      [BUTTON_VARIANTS.ACCENT]: "bg-accent text-accent-foreground hover:bg-accent/90",
      [BUTTON_VARIANTS.WARNING]: "bg-warning text-warning-foreground hover:bg-warning/90",
      [BUTTON_VARIANTS.DANGER]: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      [BUTTON_VARIANTS.POSITIVE]: "bg-positive text-positive-foreground hover:bg-positive/90",
      [BUTTON_VARIANTS.OUTLINE]: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      [BUTTON_VARIANTS.GHOST]: "hover:bg-accent hover:text-accent-foreground",
      [BUTTON_VARIANTS.LINK]: "underline-offset-4 hover:underline text-primary",
      [BUTTON_VARIANTS.SELECTED]: "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };

    const sizes = {
      default: "h-10 py-2 px-4 text-sm",
      sm: "h-8 px-3 rounded-md text-xs",
      lg: "h-11 px-6 rounded-lg text-sm",
      icon: "h-10 w-10",
    };

    const resolvedVariant = variants[variant] ?? variants[BUTTON_VARIANTS.DEFAULT];
    const resolvedSize = sizes[size] ?? sizes.default;
    const classes = `${baseClasses} ${resolvedVariant} ${resolvedSize} ${className}`.trim();

    return (
      <button className={classes} ref={ref} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
