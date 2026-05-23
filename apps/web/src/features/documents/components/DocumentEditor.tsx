import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { common, createLowlight } from "lowlight";
import { SlashCommands } from "./slashCommands";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

const lowlight = createLowlight(common);

interface DocumentEditorProps {
  initialContent: JSONContent | null;
  onChange: (content: JSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
}

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
    link: {
      openOnClick: false,
    },
  }),
  Placeholder.configure({
    placeholder: "Type '/' for commands, or just start writing...",
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  CodeBlockLowlight.configure({ lowlight }),
  Image,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Highlight.configure({ multicolor: true }),
  Color,
  TextStyle,
  Typography,
  SlashCommands,
];

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

/* ─── Shared Bubble Components ────────────────────────────────────────────── */
const BubbleBtn = ({
  onClick,
  isActive,
  children,
  title,
}: {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-all duration-150 shrink-0 ${
      isActive
        ? "bg-primary-accent/20 text-primary-accent shadow-[0_0_8px_rgba(94,234,212,0.15)]"
        : "text-text-secondary hover:text-text-primary hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

const BubbleDropdown = ({
  label,
  icon,
  isOpen,
  onClick,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) => (
  <div className="relative shrink-0" onMouseDown={(e) => e.stopPropagation()}>
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-150 text-xs font-semibold ${
        isOpen
          ? "bg-primary-accent/20 text-primary-accent shadow-[0_0_8px_rgba(94,234,212,0.15)]"
          : "text-text-secondary hover:text-text-primary hover:bg-white/10"
      }`}
    >
      {icon}
      <span className="hidden md:inline text-[11px] font-semibold">{label}</span>
      <ChevronDown size={11} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    
    {isOpen && (
      <div className="absolute left-0 top-full mt-2 bg-surface-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 min-w-[145px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
        {children}
      </div>
    )}
  </div>
);

const DropdownItem = ({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-full text-left transition-colors text-xs font-medium ${
      isActive
        ? "bg-primary-accent/15 text-primary-accent"
        : "text-text-secondary hover:text-text-primary hover:bg-white/5"
    }`}
  >
    <div className="shrink-0">{icon}</div>
    <span>{label}</span>
  </button>
);

const ColorDropdownPanel = ({
  editor,
  onSelect,
}: {
  editor: Editor;
  onSelect: () => void;
}) => (
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


export const DocumentEditor = ({
  initialContent,
  onChange,
  onEditorReady,
}: DocumentEditorProps) => {
  const [activeDropdown, setActiveDropdown] = useState<'headings' | 'lists' | 'align' | 'color' | null>(null);

  const editor = useEditor({
    extensions,
    content: initialContent || undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[60vh] cursor-text",
      },
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Global handler to close active dropdowns on click outside
  useEffect(() => {
    const handleClose = () => setActiveDropdown(null);
    window.addEventListener("mousedown", handleClose);
    return () => window.removeEventListener("mousedown", handleClose);
  }, []);

  if (!editor) return null;

  /* ─── Dropdown helpers ──────────────────────────────────────────────────── */
  const getActiveHeadingIcon = () => {
    if (editor.isActive("heading", { level: 1 })) return <Heading1 size={14} />;
    if (editor.isActive("heading", { level: 2 })) return <Heading2 size={14} />;
    if (editor.isActive("heading", { level: 3 })) return <Heading3 size={14} />;
    return <Type size={14} />;
  };

  const getActiveHeadingLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    return "Normal";
  };

  const getActiveListIcon = () => {
    if (editor.isActive("bulletList")) return <List size={14} />;
    if (editor.isActive("orderedList")) return <ListOrdered size={14} />;
    if (editor.isActive("taskList")) return <CheckSquare size={14} />;
    return <List size={14} />;
  };

  const getActiveAlignIcon = () => {
    if (editor.isActive({ textAlign: "center" })) return <AlignCenter size={14} />;
    if (editor.isActive({ textAlign: "right" })) return <AlignRight size={14} />;
    if (editor.isActive({ textAlign: "justify" })) return <AlignJustify size={14} />;
    return <AlignLeft size={14} />;
  };

  return (
    <div className="document-editor">
      {/* Bubble Menu — appears on text selection */}
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 bg-surface-elevated/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-xl border border-white/10 p-1 overflow-visible z-50"
      >
        {/* Block Type Dropdown */}
        <BubbleDropdown
          label={getActiveHeadingLabel()}
          icon={getActiveHeadingIcon()}
          isOpen={activeDropdown === 'headings'}
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === 'headings' ? null : 'headings');
          }}
        >
          <DropdownItem
            label="Normal Text"
            icon={<Type size={14} />}
            isActive={!editor.isActive("heading") && editor.isActive("paragraph")}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().setParagraph().run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Heading 1"
            icon={<Heading1 size={14} />}
            isActive={editor.isActive("heading", { level: 1 })}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 1 }).run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Heading 2"
            icon={<Heading2 size={14} />}
            isActive={editor.isActive("heading", { level: 2 })}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Heading 3"
            icon={<Heading3 size={14} />}
            isActive={editor.isActive("heading", { level: 3 })}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: 3 }).run();
              setActiveDropdown(null);
            }}
          />
        </BubbleDropdown>

        {/* Lists Dropdown */}
        <BubbleDropdown
          label="Lists"
          icon={getActiveListIcon()}
          isOpen={activeDropdown === 'lists'}
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === 'lists' ? null : 'lists');
          }}
        >
          <DropdownItem
            label="Bullet List"
            icon={<List size={14} />}
            isActive={editor.isActive("bulletList")}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Numbered List"
            icon={<ListOrdered size={14} />}
            isActive={editor.isActive("orderedList")}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Todo List"
            icon={<CheckSquare size={14} />}
            isActive={editor.isActive("taskList")}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleTaskList().run();
              setActiveDropdown(null);
            }}
          />
        </BubbleDropdown>

        {/* Alignment Dropdown */}
        <BubbleDropdown
          label="Align"
          icon={getActiveAlignIcon()}
          isOpen={activeDropdown === 'align'}
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === 'align' ? null : 'align');
          }}
        >
          <DropdownItem
            label="Align Left"
            icon={<AlignLeft size={14} />}
            isActive={editor.isActive({ textAlign: "left" }) || (!editor.isActive({ textAlign: "center" }) && !editor.isActive({ textAlign: "right" }) && !editor.isActive({ textAlign: "justify" }))}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("left").run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Align Center"
            icon={<AlignCenter size={14} />}
            isActive={editor.isActive({ textAlign: "center" })}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("center").run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Align Right"
            icon={<AlignRight size={14} />}
            isActive={editor.isActive({ textAlign: "right" })}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("right").run();
              setActiveDropdown(null);
            }}
          />
          <DropdownItem
            label="Align Justify"
            icon={<AlignJustify size={14} />}
            isActive={editor.isActive({ textAlign: "justify" })}
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().setTextAlign("justify").run();
              setActiveDropdown(null);
            }}
          />
        </BubbleDropdown>

        <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

        {/* Text Formatting Group */}
        <BubbleBtn
          title="Bold"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </BubbleBtn>
        <BubbleBtn
          title="Italic"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </BubbleBtn>
        <BubbleBtn
          title="Underline"
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </BubbleBtn>
        <BubbleBtn
          title="Strikethrough"
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} />
        </BubbleBtn>

        <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

        {/* Colors Dropdown */}
        <div className="relative shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === 'color' ? null : 'color');
            }}
            title="Colors"
            className={`p-1.5 rounded-md transition-all duration-150 ${
              activeDropdown === 'color'
                ? "bg-primary-accent/20 text-primary-accent shadow-[0_0_8px_rgba(94,234,212,0.15)]"
                : "text-text-secondary hover:text-text-primary hover:bg-white/10"
            }`}
          >
            <Palette size={15} />
          </button>
          
          {activeDropdown === 'color' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-surface-elevated/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <ColorDropdownPanel
                editor={editor}
                onSelect={() => setActiveDropdown(null)}
              />
            </div>
          )}
        </div>

        <BubbleBtn
          title="Inline Code"
          isActive={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={15} />
        </BubbleBtn>
        <BubbleBtn
          title="Link"
          isActive={editor.isActive("link")}
          onClick={() => {
            const prev = editor.getAttributes("link").href;
            const url = window.prompt("URL", prev || "https://");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            }
          }}
        >
          <LinkIcon size={15} />
        </BubbleBtn>

        <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

        {/* Clear formatting */}
        <BubbleBtn
          title="Clear formatting"
          isActive={false}
          onClick={() => {
            editor.chain().focus().clearNodes().unsetAllMarks().run();
          }}
        >
          <RotateCcw size={15} />
        </BubbleBtn>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
};
