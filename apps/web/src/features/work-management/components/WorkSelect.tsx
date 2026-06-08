import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    onSelect: (index) => handleSelect(index),
    onClose: () => handleClose(),
  });

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    resetHighlight();
  }, [resetHighlight]);

  // Handle click outside for portal
  useEffect(() => {
    if (!isOpen) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      // Do nothing if clicking trigger or menu
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (menuRef.current && menuRef.current.contains(target))
      ) {
        return;
      }
      handleClose();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [isOpen, handleClose]);


  const handleSelect = (index: number) => {
    const option = filteredOptions[index];
    if (option && !option.disabled) {
      onChange(option.value);
      handleClose();
    }
  };

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!isOpen || !containerRef.current || !menuRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Default to opening below
    let top = rect.bottom + 8;
    let bottom: number | 'auto' = 'auto';

    // If space below is less than 300px (approx max menu height) and space above is greater
    if (spaceBelow < 300 && spaceAbove > spaceBelow) {
      top = 'auto' as any;
      bottom = window.innerHeight - rect.top + 8;
    }

    // Handle horizontal overflow
    let left: number | 'auto' = rect.left;
    let right: number | 'auto' = 'auto';
    
    // Approximate menu width (we use max of rect.width and 200px minimum from our CSS)
    const menuWidth = Math.max(rect.width, 200); 
    
    if (rect.left + menuWidth > window.innerWidth - 16) {
      // Menu would overflow right side of screen, align it to the right edge of the trigger
      left = 'auto';
      right = window.innerWidth - rect.right;
    }

    setMenuStyle({
      position: 'fixed',
      top,
      bottom,
      left,
      right,
      minWidth: Math.max(rect.width, 200),
      zIndex: 120,
    });
  }, [isOpen]);

  // We need to call updatePosition twice when opening: 
  // once to mount, once to adjust after menuRef is attached
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      // Use requestAnimationFrame to ensure the DOM has updated
      const raf = requestAnimationFrame(() => {
        updatePosition();
      });
      window.addEventListener('scroll', updatePosition, true); // true to catch all scroll events
      window.addEventListener('resize', updatePosition);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

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
    <>
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
            flex items-center justify-between w-full h-11
            bg-surface-elevated border border-white/5 rounded-xl px-3 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-accent/50 transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/10 hover:bg-surface-elevated/80'}
            ${isOpen ? 'ring-1 ring-primary-accent/50 border-primary-accent/30 bg-surface-elevated/80' : ''}
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
                <span className="truncate font-medium">{selectedOption.label}</span>
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
                className="p-1 rounded-md hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-accent/50"
              >
                <X className="w-3 h-3" />
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-text-primary' : ''}`} />
          </div>
        </button>
      </div>

      {/* Dropdown Menu (Portaled) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          style={menuStyle}
          className="bg-surface-elevated border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-zoom-in overflow-hidden p-1.5 min-w-[200px] max-w-[min(24rem,calc(100vw-2rem))]"
        >
          {searchable && (
            <div className="p-1 pb-2 border-b border-white/5 mb-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className="w-full bg-main-bg/50 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all"
                />
              </div>
            </div>
          )}

          <ul
            ref={listboxRef}
            role="listbox"
            className="max-h-60 overflow-y-auto scrollbar-thin p-0.5 space-y-0.5"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-xs text-text-muted text-center italic rounded-xl bg-white/5">
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
                      relative flex items-center px-3 py-2.5 text-sm rounded-xl cursor-pointer transition-colors
                      ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-primary-accent/10 text-primary-accent font-semibold' : 'text-text-secondary'}
                      ${isHighlighted && !isSelected && !option.disabled ? 'bg-white/5 text-text-primary' : ''}
                      ${!isHighlighted && !isSelected && !option.disabled ? 'hover:bg-white/5 hover:text-text-primary' : ''}
                    `}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <div className="flex items-center gap-2.5 w-full truncate">
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
        </div>,
        document.body
      )}
    </>
  );
};
