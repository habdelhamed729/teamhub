import type { Editor } from "@tiptap/react";

/* ─── Color Configs ───────────────────────────────────────────────────────── */
const TEXT_COLORS = [
  { label: "Default", color: "inherit", value: "" },
  { label: "Teal", color: "#5EEAD4", value: "#5EEAD4" },
  { label: "Red", color: "#F87171", value: "#F87171" },
  { label: "Yellow", color: "#FBBF24", value: "#FBBF24" },
  { label: "Green", color: "#34D399", value: "#34D399" },
  { label: "Blue", color: "#60A5FA", value: "#60A5FA" },
  { label: "Purple", color: "#C084FC", value: "#C084FC" },
  { label: "Pink", color: "#F472B6", value: "#F472B6" },
];

const BG_COLORS = [
  { label: "None", color: "transparent", value: "" },
  { label: "Teal", color: "#5EEAD4", value: "rgba(94,234,212,0.2)" },
  { label: "Red", color: "#F87171", value: "rgba(248,113,113,0.2)" },
  { label: "Yellow", color: "#FBBF24", value: "rgba(251,191,36,0.2)" },
  { label: "Green", color: "#34D399", value: "rgba(52,211,153,0.2)" },
  { label: "Blue", color: "#60A5FA", value: "rgba(96,165,250,0.2)" },
  { label: "Purple", color: "#C084FC", value: "rgba(192,132,252,0.2)" },
  { label: "Pink", color: "#F472B6", value: "rgba(244,114,182,0.2)" },
];

interface ColorDropdownPanelProps {
  editor: Editor;
  onSelect: () => void;
}

export const ColorDropdownPanel = ({
  editor,
  onSelect,
}: ColorDropdownPanelProps) => (
  <div className="p-3 w-56 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
    <div>
      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Text Color</h4>
      <div className="grid grid-cols-4 gap-2">
        {TEXT_COLORS.map((tc) => (
          <button
            key={tc.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              if (tc.value === "") {
                editor.chain().focus().unsetColor().run();
              } else {
                editor.chain().focus().setColor(tc.value).run();
              }
              onSelect();
            }}
            title={tc.label}
            className="group flex flex-col items-center gap-1 py-1 rounded hover:bg-white/5 transition-colors relative"
          >
            {tc.value === "" ? (
              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                Ø
              </div>
            ) : (
              <div
                className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                style={{ backgroundColor: tc.color }}
              />
            )}
            <span className="text-[9px] text-text-muted font-medium group-hover:text-text-primary transition-colors">
              {tc.label}
            </span>
          </button>
        ))}
      </div>
    </div>

    <div className="h-px bg-white/10" />

    <div>
      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Highlight Color</h4>
      <div className="grid grid-cols-4 gap-2">
        {BG_COLORS.map((bg) => (
          <button
            key={bg.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              if (bg.value === "") {
                editor.chain().focus().unsetHighlight().run();
              } else {
                editor.chain().focus().setHighlight({ color: bg.value }).run();
              }
              onSelect();
            }}
            title={bg.label}
            className="group flex flex-col items-center gap-1 py-1 rounded hover:bg-white/5 transition-colors relative"
          >
            {bg.value === "" ? (
              <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                Ø
              </div>
            ) : (
              <div
                className="w-5 h-5 rounded border border-black/20 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: bg.color }}
              />
            )}
            <span className="text-[9px] text-text-muted font-medium group-hover:text-text-primary transition-colors">
              {bg.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
