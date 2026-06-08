import { useState, type KeyboardEvent } from 'react';

interface UseKeyboardListNavigationProps {
  itemCount: number;
  isOpen: boolean;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export const useKeyboardListNavigation = ({
  itemCount,
  isOpen,
  onSelect,
  onClose,
}: UseKeyboardListNavigationProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < itemCount) {
          onSelect(highlightedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Tab':
        // Let natural tab behavior happen, but maybe close the dropdown
        onClose();
        break;
    }
  };

  const resetHighlight = () => setHighlightedIndex(-1);

  return {
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    resetHighlight,
  };
};
