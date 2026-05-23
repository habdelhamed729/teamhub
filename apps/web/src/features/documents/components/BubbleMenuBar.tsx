import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { BubbleBtn, BubbleDropdown, DropdownItem } from "./MenuComponents";
import { ColorDropdownPanel } from "./ColorDropdownPanel";

interface BubbleMenuBarProps {
  editor: Editor;
}

export const BubbleMenuBar = ({ editor }: BubbleMenuBarProps) => {
  const [activeDropdown, setActiveDropdown] = useState<'headings' | 'lists' | 'align' | 'color' | null>(null);

  // Global handler to close active dropdowns on click outside
  useEffect(() => {
    const handleClose = () => setActiveDropdown(null);
    window.addEventListener("mousedown", handleClose);
    return () => window.removeEventListener("mousedown", handleClose);
  }, []);

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
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 bg-surface-elevated/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-xl border border-white/10 p-1 overflow-visible z-50 animate-in fade-in zoom-in-95 duration-200"
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
  );
};
