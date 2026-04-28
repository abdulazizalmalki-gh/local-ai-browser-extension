import { type ChangeEvent, type ReactNode, forwardRef } from "react";

import cn from "../../utils/classnames.ts";
import LabelTooltip from "./LabelTooltip.tsx";

interface InputCheckboxProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  tooltip?: string | ReactNode;
  more?: ReactNode;
  moreTitle?: string;
  checked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const InputCheckbox = forwardRef<HTMLInputElement, InputCheckboxProps>(
  (
    {
      label,
      description,
      error,
      required,
      className = "",
      id,
      tooltip = "",
      more = null,
      moreTitle = null,
      ...props
    },
    ref
  ) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <label htmlFor={id} className={cn("flex flex-col gap-2", className)}>
        <div className="relative text-sm font-medium text-chrome-text-primary">
          {label}
          {required && (
            <span className="ml-1 text-chrome-accent-primary">*</span>
          )}
          {tooltip !== "" && (
            <LabelTooltip
              text={<>{tooltip}</>}
              more={more ? { title: moreTitle || label, content: more } : null}
            />
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "h-4 w-4 cursor-pointer rounded border transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none",
              "bg-chrome-bg-primary",
              "focus:ring-offset-chrome-bg-primary",
              error
                ? "border-red-500 text-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-chrome-border text-chrome-accent-primary focus:border-chrome-accent-primary focus:ring-chrome-accent-primary"
            )}
            {...props}
          />
          {description && (
            <p className="mt-1 text-xs text-chrome-text-secondary">
              {description}
            </p>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-400">
            {error}
          </span>
        )}
      </label>
    );
  }
);

InputCheckbox.displayName = "InputCheckbox";

export default InputCheckbox;
