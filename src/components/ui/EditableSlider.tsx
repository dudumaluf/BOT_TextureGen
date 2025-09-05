"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/appStore";

interface EditableSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

export default function EditableSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (val) => val.toFixed(2),
  className = ""
}: EditableSliderProps) {
  const { theme } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {label}
        </label>
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            min={min}
            max={max}
            step={step}
            className={`w-16 px-1 py-0.5 text-xs text-right rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className={`text-xs font-mono cursor-pointer px-1 py-0.5 rounded hover:bg-opacity-50 ${
              theme === 'dark'
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Double-click to edit"
          >
            {formatValue(value)}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
        }`}
      />
    </div>
  );
}
