import { useState, useRef } from "react";
import { Button } from "@/shared/components/Button";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

export const COVERS = [
  // Gradients
  {
    name: "Sunset",
    value: "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500",
    category: "Gradient",
  },
  {
    name: "Aurora",
    value: "bg-gradient-to-r from-green-300 via-blue-500 to-purple-600",
    category: "Gradient",
  },
  {
    name: "Cherry",
    value: "bg-gradient-to-r from-yellow-100 via-pink-300 to-red-500",
    category: "Gradient",
  },
  {
    name: "Ocean",
    value: "bg-gradient-to-r from-blue-700 via-blue-800 to-gray-900",
    category: "Gradient",
  },
  {
    name: "Galaxy",
    value: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
    category: "Gradient",
  },
  {
    name: "Grass",
    value: "bg-gradient-to-r from-yellow-200 via-green-200 to-green-500",
    category: "Gradient",
  },
  {
    name: "Midnight",
    value: "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900",
    category: "Gradient",
  },
  {
    name: "Rose Gold",
    value: "bg-gradient-to-r from-rose-300 via-fuchsia-300 to-amber-200",
    category: "Gradient",
  },
  {
    name: "Sapphire",
    value: "bg-gradient-to-r from-blue-600 to-cyan-500",
    category: "Gradient",
  },
  {
    name: "Emerald",
    value: "bg-gradient-to-r from-emerald-500 to-teal-400",
    category: "Gradient",
  },
  {
    name: "Amber",
    value: "bg-gradient-to-r from-amber-500 to-orange-600",
    category: "Gradient",
  },
  {
    name: "Lavender",
    value: "bg-gradient-to-r from-violet-300 to-purple-400",
    category: "Gradient",
  },
  // Solids
  { name: "Onyx", value: "bg-[#1E1E2E]", category: "Solid" },
  { name: "Violet", value: "bg-[#2D1B4E]", category: "Solid" },
  { name: "Slate", value: "bg-[#3B4252]", category: "Solid" },
  { name: "Carbon", value: "bg-[#151515]", category: "Solid" },
];

interface DocumentCoverSectionProps {
  coverUrl: string | null;
  onUpdateCover: (cover: string | null) => Promise<any> | void;
}

export const DocumentCoverSection = ({
  coverUrl,
  onUpdateCover,
}: DocumentCoverSectionProps) => {
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const coverPickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close the picker on outside click, ignoring clicks on the trigger button
  useClickOutside(coverPickerRef, () => setShowCoverPicker(false), [triggerRef]);

  if (!coverUrl) return null;

  return (
    <div className="relative group/cover h-48 w-full shrink-0">
      <div className={`w-full h-full ${coverUrl}`} />
      <div className="absolute right-8 bottom-4 opacity-0 group-hover/cover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-2">
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          id="cover-trigger-btn"
          onClick={() => setShowCoverPicker(!showCoverPicker)}
          className="px-3 py-1.5 bg-black/60 hover:bg-black/85 text-white text-xs border border-white/10"
        >
          Change cover
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdateCover(null)}
          className="px-3 py-1.5 bg-black/60 hover:bg-black/85 text-white text-xs border border-white/10"
        >
          Remove
        </Button>
      </div>

      {showCoverPicker && (
        <div
          ref={coverPickerRef}
          className="popover-panel absolute right-8 top-44 p-4 w-72 flex flex-col gap-3 animate-in fade-in duration-200 z-50"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Gradients
            </span>
            <div className="grid grid-cols-4 gap-2">
              {COVERS.filter((c) => c.category === "Gradient").map((c) => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => {
                    onUpdateCover(c.value);
                    setShowCoverPicker(false);
                  }}
                  className={`h-8 rounded-lg ${c.value} border border-white/10 interactive-scale cursor-pointer relative group/cover-btn`}
                >
                  <span className="tooltip-bubble hidden group-hover/cover-btn:block">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Solid Colors
            </span>
            <div className="grid grid-cols-4 gap-2">
              {COVERS.filter((c) => c.category === "Solid").map((c) => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => {
                    onUpdateCover(c.value);
                    setShowCoverPicker(false);
                  }}
                  className={`h-8 rounded-lg ${c.value} border border-white/10 interactive-scale cursor-pointer relative group/cover-btn`}
                >
                  <span className="tooltip-bubble hidden group-hover/cover-btn:block">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
