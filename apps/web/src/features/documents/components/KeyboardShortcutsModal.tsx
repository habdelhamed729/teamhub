import React, { useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/shared/components/Button";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const mod = isMac ? "⌘" : "Ctrl";
  const shift = isMac ? "⇧" : "Shift";
  const alt = isMac ? "⌥" : "Alt";

  const categories = [
    {
      title: "Text Formatting",
      shortcuts: [
        { keys: [mod, "B"], description: "Toggle Bold" },
        { keys: [mod, "I"], description: "Toggle Italic" },
        { keys: [mod, "U"], description: "Toggle Underline" },
        { keys: [mod, shift, "X"], description: "Strikethrough" },
        { keys: [mod, shift, "C"], description: "Inline Code" },
        { keys: [mod, shift, "H"], description: "Highlight Text" },
      ],
    },
    {
      title: "Blocks & Elements",
      shortcuts: [
        { keys: [mod, alt, "1"], description: "Heading 1" },
        { keys: [mod, alt, "2"], description: "Heading 2" },
        { keys: [mod, alt, "3"], description: "Heading 3" },
        { keys: [mod, shift, "B"], description: "Blockquote" },
        { keys: [mod, shift, "D"], description: "Horizontal Divider" },
        { keys: [mod, alt, "T"], description: "Insert 3x3 Table" },
      ],
    },
    {
      title: "Lists & Layout",
      shortcuts: [
        { keys: [mod, shift, "8"], description: "Bullet List" },
        { keys: [mod, shift, "7"], description: "Ordered List" },
        { keys: [mod, shift, "9"], description: "Checklist (Task List)" },
        { keys: ["?"], description: "Open Keyboard Cheat Sheet" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-surface-secondary/95 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animate-zoom-in backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary-accent to-blue-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-accent/10 rounded-lg">
              <Keyboard className="w-5 h-5 text-primary-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Keyboard Shortcuts</h2>
              <p className="text-xs text-text-muted">Notion-style cheat sheet for quick actions</p>
            </div>
          </div>
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            onClick={onClose}
            icon={<X className="w-4 h-4" />}
            className="text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
          />
        </div>

        {/* Grid of categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {cat.title}
              </h3>
              <div className="flex flex-col gap-2">
                {cat.shortcuts.map((s) => (
                  <div
                    key={s.description}
                    className="flex justify-between items-center text-xs py-1 border-b border-white/2"
                  >
                    <span className="text-text-muted pr-2">{s.description}</span>
                    <div className="flex gap-1 shrink-0">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 bg-surface-elevated border border-white/10 rounded text-[10px] font-bold text-text-primary font-mono shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
