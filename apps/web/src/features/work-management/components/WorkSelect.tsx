import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { useKeyboardListNavigation } from '../hooks/useKeyboardListNavigation';

export type WorkSelectOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

interface WorkSelectProps<TValue extends string> {
  value: TValue;
  onChange: (value: TValue) => void;
  options: WorkSelectOption<TValue>[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  renderValue?: (option: WorkSelectOption<TValue> | undefined) => React.ReactNode;
  renderOption?: (option: WorkSelectOption<TValue>) => React.ReactNode;
}

export const WorkSelect = <TValue extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  clearable = false,
  onClear,
  searchable = false,
  searchPlaceholder = 'Search...',
  className = '',
  renderValue,
  renderOption,
}: WorkSelectProps<TValue>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const { highlightedIndex, setHighlightedIndex, handleKeyDown, resetHighlight } = useKeyboardListNavigation({
    itemCount: filteredOptions.length,
    isOpen,
    onSelect: (index) => handleSelect(index), // Wrap in arrow to avoid hoisting issues
    onClose: () => handleClose(), // Wrap in arrow to avoid hoisting issues
  });

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    resetHighlight();
  };

  useClickOutside(containerRef, handleClose, isOpen);

  const handleSelect = (index: number) => {
    const option = filteredOptions[index];
    if (option && !option.disabled) {
      onChange(option.value);
      handleClose();
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle opening with keyboard
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
    } else if (isOpen) {
      handleKeyDown(e);
    }
  };

  const hasValue = value !== '' && value !== 'all' && value !== null;

  return (
    <div 
      className={`relative inline-block text-left w-full ${className}`} 
      ref={containerRef}
      onKeyDown={handleTriggerKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full
          bg-surface-elevated/50 border border-white/5 rounded-xl px-3 py-2 text-sm
          focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/10'}
          ${isOpen ? 'ring-1 ring-primary-accent/50 border-primary-accent/30' : ''}
          ${hasValue && !isOpen ? 'border-primary-accent/20 bg-primary-accent/5' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate text-text-primary">
          {renderValue ? (
            renderValue(selectedOption)
          ) : selectedOption ? (
            <>
              {selectedOption.icon && <span className="text-text-muted shrink-0">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-text-muted truncate">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {clearable && hasValue && onClear && (
            <div 
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onClear();
                }
              }}
              className="p-0.5 rounded hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[100] w-full min-w-[200px] mt-2 right-0 origin-top-right rounded-xl bg-surface-elevated border border-white/10 shadow-premium animate-zoom-in overflow-hidden">
          
          {searchable && (
            <div className="p-2 border-b border-white/5 bg-main-bg/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    resetHighlight();
                  }}
                  onKeyDown={(e) => {
                    // Prevent search input from closing the modal unintentionally on enter
                    if (e.key === 'Enter' && highlightedIndex >= 0) {
                      e.preventDefault();
                      handleSelect(highlightedIndex);
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      handleKeyDown(e);
                    } else if (e.key === 'Escape') {
                      handleClose();
                    }
                  }}
                  className="w-full bg-surface-secondary border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/50"
                />
              </div>
            </div>
          )}

          <ul
            ref={listboxRef}
            role="listbox"
            className="max-h-60 overflow-y-auto scrollbar-thin p-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-xs text-text-muted text-center italic">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = value === option.value;
                const isHighlighted = highlightedIndex === index;
                
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        handleClose();
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      relative flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'text-text-secondary hover:text-text-primary'}
                      ${isHighlighted && !isSelected && !option.disabled ? 'bg-white/5 text-text-primary' : ''}
                    `}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <div className="flex items-center gap-2 w-full truncate">
                        {option.icon && <span className="shrink-0 opacity-80">{option.icon}</span>}
                        <div className="flex flex-col truncate">
                          <span className="truncate">{option.label}</span>
                          {option.description && (
                            <span className="text-[10px] text-text-muted truncate opacity-80 mt-0.5">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
