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
import { InputRule, markInputRule, Extension } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";

const lowlight = createLowlight(common);

interface DocumentEditorProps {
  initialContent: JSONContent | null;
  onChange: (content: JSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
}

// Notion-style divider shortcut: triggers immediately when typing ---, ***, or ___
const customHorizontalRule = HorizontalRule.extend({
  addInputRules() {
    return [
      new InputRule({
        find: /^(?:---|—|\*\*\*|___)$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;
          tr.replaceWith(start - 1, end, this.type.create());
        },
      }),
    ];
  },
});

// Markdown highlight shortcut: triggers on ==highlight text==
const customHighlight = Highlight.extend({
  addInputRules() {
    return [
      markInputRule({
        find: /(?:==)([^==]+)(?:==)$/,
        type: this.type,
      }),
    ];
  },
});

// Custom keyboard shortcuts for enhanced editing control (e.g. Notion-like actions)
const KeyboardShortcutsExtension = Extension.create({
  name: "customKeyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      // Toggle Blockquote: Ctrl+Shift+B
      "Mod-Shift-b": () => this.editor.commands.toggleBlockquote(),

      // Toggle Task List (Checklist): Ctrl+Shift+9
      "Mod-Shift-9": () => this.editor.commands.toggleTaskList(),

      // Insert Table: Ctrl+Alt+T
      "Mod-Alt-t": () =>
        this.editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),

      // Toggle Highlight: Ctrl+Shift+H
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),

      // Insert Divider: Ctrl+Shift+D or Ctrl+Alt+D
      "Mod-Alt-d": () => this.editor.commands.setHorizontalRule(),
      "Mod-Shift-d": () => this.editor.commands.setHorizontalRule(),

      // Toggle Inline Code: Ctrl+Shift+C (in addition to standard Ctrl+E)
      "Mod-Shift-c": () => this.editor.commands.toggleCode(),

      // Toggle Strikethrough: Ctrl+Shift+X (in addition to default)
      "Mod-Shift-x": () => this.editor.commands.toggleStrike(),
    };
  },
});

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
    horizontalRule: false,
  }),
  Link.configure({
    openOnClick: true,
    autolink: true,
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
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
  customHighlight.configure({ multicolor: true }),
  Color,
  TextStyle,
  Typography,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  customHorizontalRule,
  KeyboardShortcutsExtension,
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
