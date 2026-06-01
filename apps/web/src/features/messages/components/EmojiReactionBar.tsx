import React, { useState, useEffect, useRef } from 'react';
import { Plus, Smile } from 'lucide-react';

// Quick-react emoji presets matching the Figma design
const QUICK_EMOJIS = ['😆', '😍', '🤔', '😡'];

interface EmojiReactionBarProps {
  /** Called when an emoji is selected */
  onReact: (emoji: string) => void;
  /** Whether the message belongs to the current user (affects positioning of extended picker) */
  isOwn: boolean;
}

export const EmojiReactionBar: React.FC<EmojiReactionBarProps> = ({ onReact, isOwn }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extended emoji list when user clicks the "+" button
  const EXTENDED_EMOJIS = ['👍', '👎', '❤️', '🔥', '🎉', '😢', '😮', '👏'];

  // Handle click outside to close the extended picker
  useEffect(() => {
    if (!showExtended) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowExtended(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showExtended]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        // Only collapse on mouse leave if the extended picker is not open
        if (!showExtended) {
          setIsExpanded(false);
        }
      }}
      className={`relative flex items-center h-[26px] rounded-full shadow-lg transition-all duration-300 ease-out select-none ${
        isExpanded
          ? 'w-[160px] bg-reaction-bar-bg px-1 border border-white/5'
          : 'w-[26px] bg-[#969799]/90 hover:bg-[#969799] justify-center cursor-pointer text-white'
      }`}
    >
      {!isExpanded ? (
        <Smile className="w-3.5 h-3.5 animate-in fade-in duration-200 shrink-0" />
      ) : (
        <div className="flex items-center justify-between w-full px-0.5 animate-in fade-in zoom-in-95 duration-200">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="w-[24px] h-[24px] flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-base hover:scale-120 active:scale-90"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowExtended(!showExtended)}
            className="w-[24px] h-[24px] flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white/60 hover:text-white"
            title="More reactions"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Extended emoji picker */}
      {showExtended && (
        <div
          className={`absolute bottom-8 ${
            isOwn ? 'left-0' : 'right-0'
          } bg-reaction-bar-bg border border-white/5 rounded-xl p-2 shadow-2xl grid grid-cols-4 gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150 z-30`}
        >
          {EXTENDED_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(emoji);
                setShowExtended(false);
                setIsExpanded(false);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors text-lg hover:scale-110 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
