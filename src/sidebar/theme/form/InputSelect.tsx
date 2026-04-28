import { type ReactNode, type SelectHTMLAttributes, forwardRef } from "react";

import cn from "../../utils/classnames.ts";
import { FormError } from "../index.ts";
import LabelTooltip from "./LabelTooltip.tsx";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface OptGroup {
  label: string;
  options: Option[];
}

type SelectOptions = Option[] | OptGroup[];

interface InputSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  options: SelectOptions;
  tooltip?: string | ReactNode;
  more?: ReactNode;
  moreTitle?: string;
}

const InputSelect = forwardRef<HTMLSelectElement, InputSelectProps>(
  (
    {
      label,
      placeholder,
      error,
      required,
      className = "",
      id,
      options,
      tooltip = "",
      more = null,
      moreTitle = null,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label
          htmlFor={id}
          className="relative text-sm font-medium text-chrome-text-primary"
        >
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
        </label>
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded px-4 py-2.5 text-sm transition-colors focus:ring-1 focus:outline-none",
            "bg-chrome-bg-primary text-chrome-text-primary",
            "focus:ring-offset-chrome-bg-primary",
            error
              ? "border border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border border-chrome-border focus:border-chrome-accent-primary focus:ring-chrome-accent-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((item, index) => {
            // Check if this is an OptGroup by checking for 'options' property
            if ("options" in item) {
              return (
                <optgroup key={`optgroup-${index}`} label={item.label}>
                  {item.options.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              );
            } else {
              // This is a regular Option
              return (
                <option
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                >
                  {item.label}
                </option>
              );
            }
          })}
        </select>
        {error && <FormError>{error}</FormError>}
      </div>
    );
  }
);

InputSelect.displayName = "InputSelect";

export default InputSelect;
