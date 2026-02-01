import React from "react";
import { INPUT_SIZES } from "../../constants/designTokens";

const Input = React.forwardRef(
  (
    {
      className = "",
      type = "text",
      label,
      required = false,
      hint,
      error,
      leftIcon,
      rightIcon,
      onRightIconClick,
      size = INPUT_SIZES.MD,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const sizeClasses = {
      [INPUT_SIZES.SM]: "h-8 px-2.5 text-xs",
      [INPUT_SIZES.MD]: "h-10 px-3 text-sm",
      [INPUT_SIZES.LG]: "h-11 px-3.5 text-sm",
    };
    const inputSizeClass = sizeClasses[size] ?? sizeClasses[INPUT_SIZES.MD];

    const inputClasses = [
      "flex w-full rounded-lg border bg-background py-2 ring-offset-background",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      hasError ? "border-destructive focus-visible:ring-destructive" : "border-input",
      inputSizeClass,
      leftIcon ? "pl-10" : "",
      rightIcon || onRightIconClick ? "pr-10" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const id = props.id ?? props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex items-center gap-2">
            <label htmlFor={id} className="block text-sm font-medium text-foreground">
              {label}
            </label>
            {required && <span className="text-xs font-medium text-muted-foreground">Required</span>}
          </div>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={id}
            className={inputClasses}
            aria-invalid={hasError}
            aria-describedby={hint ? `${id}-hint` : hasError ? `${id}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <div
              className={`absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground ${onRightIconClick ? "cursor-pointer" : "pointer-events-none"}`}
              onClick={onRightIconClick}
              onKeyDown={onRightIconClick ? (e) => e.key === "Enter" && onRightIconClick(e) : undefined}
              role={onRightIconClick ? "button" : undefined}
              tabIndex={onRightIconClick ? 0 : undefined}
              aria-label={onRightIconClick ? "Toggle visibility" : undefined}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {hint && !hasError && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {hasError && (
          <p id={`${id}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
