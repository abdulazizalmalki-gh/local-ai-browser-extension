import { type ChangeEvent, forwardRef } from "react";

import cn from "../../utils/classnames.ts";

interface InputTextareaProps {
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  rows?: number;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const InputTextarea = forwardRef<HTMLTextAreaElement, InputTextareaProps>(
  (
    {
      label,
      placeholder,
      error,
      required,
      className = "",
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label
          htmlFor={id}
          className="text-sm font-medium text-chrome-text-primary"
        >
          {label}
          {required && (
            <span className="ml-1 text-chrome-accent-primary">*</span>
          )}
        </label>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            "resize-vertical w-full rounded px-4 py-2.5 text-sm transition-colors focus:ring-1 focus:outline-none",
            "bg-chrome-bg-primary text-chrome-text-primary",
            "focus:ring-offset-chrome-bg-primary",
            error
              ? "border border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border border-chrome-border focus:border-chrome-accent-primary focus:ring-chrome-accent-primary",
            "placeholder:text-chrome-text-disabled",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400">
            {error}
          </span>
        )}
      </div>
    );
  }
);

InputTextarea.displayName = "InputTextarea";

export default InputTextarea;
