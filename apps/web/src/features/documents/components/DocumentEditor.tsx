import { useEditor, EditorContent } from "@tiptap/react";
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
import { useEffect } from "react";
import { BubbleMenuBar } from "./BubbleMenuBar";
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
      {/* Refactored Bubble Menu — handles selection styles */}
      <BubbleMenuBar editor={editor} />

      <EditorContent editor={editor} />
    </div>
  );
};
