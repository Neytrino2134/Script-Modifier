
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

// Тип для одной опции в списке
export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode; // Опциональная иконка
}

// Пропсы компонента
interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string; // Текущее выбранное значение
  onChange: (value: string) => void; // Коллбек при выборе
  disabled?: boolean;
  id?: string;
  title?: string; // Тултип при наведении
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, disabled, id, title, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, minWidth: 0, maxHeight: 300 });

  // Рефы для управления фокусом и обнаружения кликов вне компонента
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const optionsRef = useRef<(HTMLLIElement | null)[]>([]);

  // Находим активную опцию для отображения в закрытом состоянии
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || value);

  // Animation Logic
  useEffect(() => {
    if (isOpen) {
        setIsRendered(true);
        requestAnimationFrame(() => setIsVisible(true));
    } else {
        setIsVisible(false);
        const timer = setTimeout(() => setIsRendered(false), 200); // Wait for transition
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const updatePosition = () => {
    if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate available space below
        const spaceBelow = windowHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;
        
        // Calculate needed height for options (approximate)
        const estimatedHeight = options.length * 36 + 10; // 36px per item + padding

        let top = 0;
        let maxHeight = 0;

        // Determine position based on space
        if (spaceBelow >= estimatedHeight || spaceBelow > spaceAbove) {
             // Place below
             top = rect.bottom + window.scrollY + 4;
             maxHeight = Math.min(estimatedHeight, spaceBelow);
        } else {
             // Place above
             top = rect.top + window.scrollY - Math.min(estimatedHeight, spaceAbove) - 4;
             maxHeight = Math.min(estimatedHeight, spaceAbove);
        }

        setDropdownPosition({
            top: top,
            left: rect.left + window.scrollX,
            minWidth: rect.width,
            maxHeight: maxHeight
        });
    }
  };

  // Логика закрытия меню при клике снаружи и прокрутке
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    const handleScrollOrResize = (e: Event) => {
        // If resizing window, always close to avoid position drift
        if (e.type === 'resize') {
             if(isOpen) setIsOpen(false);
             return;
        }

        // If scrolling, check if the scroll happened INSIDE the dropdown
        if (
            dropdownRef.current && 
            e.target instanceof Node && 
            dropdownRef.current.contains(e.target)
        ) {
            // Scroll happened inside the menu (e.g. list scroll), do NOT close
            return;
        }

        // Otherwise (page scroll), close the menu
        if(isOpen) setIsOpen(false);
    };

    if (isOpen) {
        updatePosition();
        document.addEventListener('mousedown', handleClickOutside, true);
        window.addEventListener('scroll', handleScrollOrResize, true); // Capture phase true is important for scroll
        window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Установка фокуса на выбранный элемент при открытии
  useEffect(() => {
    if (isOpen) {
      const selectedIdx = options.findIndex(opt => opt.value === value);
      setFocusedIndex(selectedIdx > -1 ? selectedIdx : 0);
    }
  }, [isOpen, options, value]);

  // Обработка клавиатуры (доступность)
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement | HTMLLIElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const newIndex = Math.min(focusedIndex + 1, options.length - 1);
          setFocusedIndex(newIndex);
          optionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          const newIndex = Math.max(focusedIndex - 1, 0);
          setFocusedIndex(newIndex);
          optionsRef.current[newIndex]?.scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex !== -1) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        type="button"
        title={title}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center text-left group h-9 text-sm transition-colors hover:border-gray-500`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon && <span className="text-gray-400">{selectedOption.icon}</span>}
          <span className={!selectedOption ? 'text-gray-400' : ''}>{displayLabel}</span>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-1 ${isOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isRendered && createPortal(
        <ul
          ref={dropdownRef}
          role="listbox"
          className={`fixed z-[9999] bg-gray-800 border border-gray-600 rounded-md shadow-2xl focus:outline-none overflow-y-auto custom-scrollbar py-1 transition-[opacity,transform] duration-200 ease-out origin-top ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ 
              top: dropdownPosition.top, 
              left: dropdownPosition.left, 
              minWidth: dropdownPosition.minWidth,
              width: 'max-content',
              maxWidth: '90vw',
              maxHeight: `${dropdownPosition.maxHeight}px`
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              ref={(el) => { optionsRef.current[index] = el; }}
              tabIndex={-1}
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`px-3 py-2 text-sm cursor-pointer select-none transition-colors flex items-center gap-2 group whitespace-nowrap ${
                focusedIndex === index || value === option.value ? 'bg-emerald-600 text-white' : 'text-gray-200 hover:bg-gray-700'
              } ${
                value === option.value ? 'font-semibold' : ''
              }`}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {option.icon && (
                  <span className={`${focusedIndex === index || value === option.value ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {option.icon}
                  </span>
              )}
              <span>{option.label}</span>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </>
  );
};
export default CustomSelect;
