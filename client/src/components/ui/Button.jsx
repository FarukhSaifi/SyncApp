import React from "react";

const Button = React.forwardRef(
  (
    { className = "", variant = "default", size = "default", disabled = false, children, ...props },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
    };

    const sizes = {
      default: "h-9 sm:h-10 py-2 px-3 sm:px-4 text-sm sm:text-sm",
      sm: "h-8 sm:h-9 px-2 sm:px-3 rounded-md text-xs sm:text-sm",
      lg: "h-10 sm:h-11 px-6 sm:px-8 rounded-md text-sm sm:text-base",
      icon: "h-9 w-9 sm:h-10 sm:w-10",
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button className={classes} ref={ref} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
