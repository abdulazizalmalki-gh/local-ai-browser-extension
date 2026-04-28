import cn from "../../utils/classnames.ts";

interface SliderProps {
  className?: string;
  width: number;
  text?: string;
  showPercentage?: boolean;
}

export default function Slider({
  className = "",
  width,
  text = "",
  showPercentage = false,
}: SliderProps) {
  return (
    <div className={cn(className, "w-full")}>
      {/* Label and Percentage */}
      {(text || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {text && (
            <span className="text-sm text-chrome-text-primary font-medium">
              {text}
            </span>
          )}
          {showPercentage && (
            <span className="text-xs text-chrome-text-secondary">
              {Math.round(width)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-chrome-bg-tertiary overflow-hidden">
        <div
          className="h-full rounded-full bg-chrome-accent-primary transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, width))}%` }}
        />
      </div>
    </div>
  );
}
