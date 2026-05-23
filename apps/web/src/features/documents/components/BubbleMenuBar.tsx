import { BubbleMenu } from "@tiptap/react/menus";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
  Palette,
} from "lucide-react";

interface BubbleMenuBarProps {
  editor: Editor | null;
}

export const BubbleMenuBar = ({ editor }: BubbleMenuBarProps) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex bg-surface-elevated shadow-premium rounded-lg border border-white/10 p-1 gap-1 overflow-hidden"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("bold") ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("italic") ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("underline") ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Underline"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("strike") ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px h-5 bg-white/10 my-auto mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("code") ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Code"
      >
        <Code size={16} />
      </button>
      <button
        onClick={() => {
          const url = window.prompt("Enter link URL");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("link") ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Link"
      >
        <LinkIcon size={16} />
      </button>

      <div className="w-px h-5 bg-white/10 my-auto mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("highlight") ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Highlight"
      >
        <Highlighter size={16} />
      </button>
      <button
        onClick={() => {
          if (editor.isActive("textStyle", { color: "#5EEAD4" })) {
            editor.chain().focus().unsetColor().run();
          } else {
            editor.chain().focus().setColor("#5EEAD4").run();
          }
        }}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("textStyle", { color: "#5EEAD4" }) ? "bg-white/10 text-primary-accent" : "text-text-secondary"}`}
        title="Color (Accent)"
      >
        <Palette size={16} />
      </button>
    </BubbleMenu>
  );
};
