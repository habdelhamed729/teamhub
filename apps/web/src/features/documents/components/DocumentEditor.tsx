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
import { useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
  Heading1,
  Heading2,
  Type,
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

/* ─── Bubble Menu Button ──────────────────────────────────────────────────── */
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
    className={`p-1.5 rounded-md transition-all duration-150 ${
      isActive
        ? "bg-primary-accent/20 text-primary-accent shadow-[0_0_8px_rgba(94,234,212,0.15)]"
        : "text-text-secondary hover:text-text-primary hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const DocumentEditor = ({
  initialContent,
  onChange,
  onEditorReady,
}: DocumentEditorProps) => {
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

  if (!editor) return null;

  return (
    <div className="document-editor">
      {/* Bubble Menu — appears on text selection */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{
          duration: 150,
          animation: "shift-toward-subtle",
        }}
        className="flex items-center gap-0.5 bg-surface-elevated/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-xl border border-white/10 p-1 overflow-hidden"
      >
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

        <div className="w-px h-4 bg-white/10 mx-1" />

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

        <div className="w-px h-4 bg-white/10 mx-1" />

        <BubbleBtn
          title="Highlight"
          isActive={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter size={15} />
        </BubbleBtn>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <BubbleBtn
          title="Heading 1"
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={15} />
        </BubbleBtn>
        <BubbleBtn
          title="Heading 2"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={15} />
        </BubbleBtn>
        <BubbleBtn
          title="Normal text"
          isActive={
            !editor.isActive("heading") && editor.isActive("paragraph")
          }
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Type size={15} />
        </BubbleBtn>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
};
