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
  Trash2,
  Table as TableIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { BubbleBtn, BubbleDropdown, DropdownItem } from "./MenuComponents";
import { ColorDropdownPanel } from "./ColorDropdownPanel";
import { Button } from "@/shared/components/Button";

interface BubbleMenuBarProps {
  editor: Editor;
}

export const BubbleMenuBar = ({ editor }: BubbleMenuBarProps) => {
  const [activeDropdown, setActiveDropdown] = useState<'headings' | 'lists' | 'align' | 'color' | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const handleOpenLinkModal = () => {
    const prev = editor.getAttributes("link").href || "";
    setLinkUrl(prev);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = () => {
    let url = linkUrl.trim();
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) {
        url = `https://${url}`;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setIsLinkModalOpen(false);
  };

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

  const isInsideTable = editor.isActive("table");

  return (
    <>
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 bg-surface-elevated/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-xl border border-white/10 p-1 overflow-visible z-50 animate-in fade-in zoom-in-95 duration-200"
      >
        {isInsideTable ? (
          <div className="flex items-center gap-0.5">
            <div className="flex items-center gap-1.5 px-2 text-primary-accent text-xs font-bold shrink-0">
              <TableIcon size={14} />
              Table
            </div>
            <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />
            
            <BubbleBtn
              title="Insert Row Above"
              isActive={false}
              onClick={() => editor.chain().focus().addRowBefore().run()}
            >
              <ChevronUp size={15} />
            </BubbleBtn>
            <BubbleBtn
              title="Insert Row Below"
              isActive={false}
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              <ChevronDown size={15} />
            </BubbleBtn>
            <BubbleBtn
              title="Insert Column Left"
              isActive={false}
              onClick={() => editor.chain().focus().addColumnBefore().run()}
            >
              <ChevronLeft size={15} />
            </BubbleBtn>
            <BubbleBtn
              title="Insert Column Right"
              isActive={false}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              <ChevronRight size={15} />
            </BubbleBtn>
            
            <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

            <button
              title="Delete Row"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-2 py-1 rounded-md text-danger hover:bg-danger/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              Del Row
            </button>
            <button
              title="Delete Column"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-2 py-1 rounded-md text-danger hover:bg-danger/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              Del Col
            </button>
            <button
              title="Delete Table"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-2 py-1 rounded-md text-danger hover:bg-danger/20 hover:text-white bg-danger/10 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} />
              Table
            </button>
          </div>
        ) : (
          <>
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
              onClick={handleOpenLinkModal}
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
          </>
        )}
      </BubbleMenu>

      {/* Insert Link Modal */}
      {isLinkModalOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-md bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl p-6 animate-zoom-in">
            {/* Close */}
            <button
              onClick={() => setIsLinkModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <LinkIcon size={18} className="text-primary-accent" />
              Insert Link
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  URL Link
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Paste or type URL (e.g. google.com)"
                  autoFocus
                  className="w-full bg-surface-secondary border border-white/10 focus:border-primary-accent/40 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/30 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveLink();
                    } else if (e.key === "Escape") {
                      setIsLinkModalOpen(false);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                {editor.isActive("link") ? (
                  <Button
                    onClick={() => {
                      editor.chain().focus().extendMarkRange("link").unsetLink().run();
                      setIsLinkModalOpen(false);
                    }}
                    variant="danger-solid"
                    size="sm"
                    className="rounded-xl font-bold cursor-pointer"
                  >
                    Remove Link
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsLinkModalOpen(false)}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveLink}
                    variant="primary"
                    size="sm"
                    className="rounded-xl font-bold cursor-pointer"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
