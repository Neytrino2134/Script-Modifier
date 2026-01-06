
import React from 'react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  title?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, disabled, id, className = "h-4 w-4", title }) => {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation(); // Prevent node selection/drag
        if (!disabled) onChange(!checked);
      }}
      onMouseDown={(e) => {
        e.stopPropagation(); // Prevent node drag start
        e.preventDefault(); // Prevent focus outline flashing on click
      }}
      title={title}
      className={`
        relative flex items-center justify-center 
        rounded border 
        transition-colors duration-200 ease-in-out flex-shrink-0
        outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500
        ${className}
        ${checked 
            ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500' 
            : 'bg-gray-900 border-gray-600 hover:border-gray-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
        <svg 
            className={`w-[70%] h-[70%] text-white transition-transform duration-200 ${checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="3"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    </button>
  );
};

export default CustomCheckbox;
