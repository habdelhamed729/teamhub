import React, { useEffect, useRef } from 'react';
import { Reply, Copy, Trash2 } from 'lucide-react';

interface MessageContextMenuProps {
  /** Screen position to render the menu */
  position: { x: number; y: number };
  /** Whether the current user owns this message */
  isOwn: boolean;
  /** Callbacks for menu actions */
  onReply: () => void;
  onCopy: () => void;
  onDelete?: () => void;
  /** Close the menu */
  onClose: () => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  position,
  isOwn,
  onReply,
  onCopy,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuItems = [
    {
      label: 'Reply',
      icon: <Reply className="h-5 w-5 scale-x-[-1]" />,
      onClick: () => { onReply(); onClose(); },
      show: true,
    },
    {
      label: 'Copy',
      icon: <Copy className="h-5 w-5" />,
      onClick: () => { onCopy(); onClose(); },
      show: true,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-5 w-5" />,
      onClick: () => { onDelete?.(); onClose(); },
      show: isOwn && !!onDelete,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-context-menu-bg rounded-lg py-3 px-4 flex flex-col gap-3 shadow-2xl min-w-[160px] animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      {menuItems
        .filter((item) => item.show)
        .map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="flex items-center gap-4 px-2 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors w-full text-left"
          >
            <span className="text-white/80">{item.icon}</span>
            <span className="text-base font-normal font-[Roboto] leading-normal">
              {item.label}
            </span>
          </button>
        ))}
    </div>
  );
};
