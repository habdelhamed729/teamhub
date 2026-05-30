import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { SlashCommandItem } from "./slashCommandItems";

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  SlashCommandListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length,
        );
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  // Group items
  const grouped: Record<string, { item: SlashCommandItem; idx: number }[]> = {};
  props.items.forEach((item, idx) => {
    const g = item.group || "Other";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push({ item, idx });
  });

  return (
    <div className="bg-surface-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden w-72 text-text-primary text-sm z-50 max-h-80 overflow-y-auto">
      {props.items.length === 0 ? (
        <div className="p-4 text-text-muted text-center text-xs">
          No matching commands
        </div>
      ) : (
        Object.entries(grouped).map(([group, entries]) => (
          <div key={group}>
            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest sticky top-0 bg-surface-elevated/95 backdrop-blur-xl border-b border-white/5">
              {group}
            </div>
            <div className="p-1">
              {entries.map(({ item, idx }) => (
                <button
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all duration-100 ${
                    idx === selectedIndex
                      ? "bg-primary-accent/10 text-primary-accent"
                      : "hover:bg-white/5"
                  }`}
                  key={idx}
                  onClick={() => selectItem(idx)}
                >
                  <div
                    className={`p-1.5 rounded-md ${idx === selectedIndex ? "bg-primary-accent/20" : "bg-white/5"} transition-colors`}
                  >
                    <item.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-text-muted truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded font-mono shrink-0">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
