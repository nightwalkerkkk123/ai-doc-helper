import React from 'react';

type NumberInputProps = {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  className?: string;
};

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  className = '',
}: NumberInputProps) {
  return (
    <div className={`relative mt-2 max-w-xs ${className}`}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(parseInt(e.target.value || '0', 10))
        }
        className={
          'w-full pl-4 pr-16 py-2.5 border border-gray-200 rounded-lg outline-none font-mono text-gray-700 focus:border-indigo-500 transition-colors'
        }
      />

      {suffix && (
        <span className="absolute right-2 top-2.5 text-gray-400 text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
