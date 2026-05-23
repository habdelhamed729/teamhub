import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Highlighter,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

const Divider = () => <div className="w-px h-6 bg-white/10 mx-2" />;

const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
  icon: any;
  title: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-colors ${
      isActive
        ? "bg-primary-accent/20 text-primary-accent"
        : "text-text-secondary hover:text-text-primary hover:bg-white/5"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <Icon size={18} />
  </button>
);

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-secondary border-b border-white/5 mb-4 sticky top-0 z-10">
      {/* Text formatting */}
      <ToolbarButton
        title="Bold"
        icon={Bold}
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        title="Italic"
        icon={Italic}
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        title="Underline"
        icon={Underline}
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        title="Strikethrough"
        icon={Strikethrough}
        isActive={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
      />

      <Divider />

      {/* Headings */}
      <ToolbarButton
        title="Heading 1"
        icon={Heading1}
        isActive={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        title="Heading 2"
        icon={Heading2}
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        title="Heading 3"
        icon={Heading3}
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <Divider />

      {/* Lists */}
      <ToolbarButton
        title="Bullet List"
        icon={List}
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        title="Ordered List"
        icon={ListOrdered}
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        title="Task List"
        icon={CheckSquare}
        isActive={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />

      <Divider />

      {/* Insert */}
      <ToolbarButton
        title="Code Block"
        icon={Code}
        isActive={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        title="Blockquote"
        icon={Quote}
        isActive={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        title="Divider"
        icon={Minus}
        isActive={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <ToolbarButton
        title="Image"
        icon={ImageIcon}
        isActive={false}
        onClick={() => {
          const url = window.prompt("Enter image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
      />

      <Divider />

      {/* Align */}
      <ToolbarButton
        title="Align Left"
        icon={AlignLeft}
        isActive={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      />
      <ToolbarButton
        title="Align Center"
        icon={AlignCenter}
        isActive={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      />
      <ToolbarButton
        title="Align Right"
        icon={AlignRight}
        isActive={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      />

      <Divider />

      {/* Misc */}
      <ToolbarButton
        title="Link"
        icon={LinkIcon}
        isActive={editor.isActive("link")}
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
      />
      <ToolbarButton
        title="Highlight"
        icon={Highlighter}
        isActive={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />
    </div>
  );
};
