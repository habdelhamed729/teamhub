import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Highlighter,
  Image as ImageIcon,
  Table as TableIcon,
} from "lucide-react";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: typeof Heading1;
  shortcut?: string;
  group: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: (props: { editor: any; range: any }) => void;
}

export const getSuggestionItems = ({
  query,
}: {
  query: string;
}): SlashCommandItem[] => {
  return (
    [
      {
        title: "Heading 1",
        description: "Large section heading",
        icon: Heading1,
        shortcut: "Ctrl+Alt+1",
        group: "Headings",
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 1 })
            .run();
        },
      },
      {
        title: "Heading 2",
        description: "Medium section heading",
        icon: Heading2,
        shortcut: "Ctrl+Alt+2",
        group: "Headings",
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 2 })
            .run();
        },
      },
      {
        title: "Heading 3",
        description: "Small section heading",
        icon: Heading3,
        shortcut: "Ctrl+Alt+3",
        group: "Headings",
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 3 })
            .run();
        },
      },
      {
        title: "Bullet List",
        description: "Create a simple bulleted list",
        icon: List,
        shortcut: "Ctrl+Shift+8",
        group: "Lists",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "Numbered List",
        description: "Create a list with numbering",
        icon: ListOrdered,
        shortcut: "Ctrl+Shift+7",
        group: "Lists",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: "To-do List",
        description: "Track tasks with a to-do list",
        icon: CheckSquare,
        shortcut: "Ctrl+Shift+9",
        group: "Lists",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: "Code Block",
        description: "Capture a code snippet",
        icon: Code,
        shortcut: "Ctrl+Alt+C",
        group: "Media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
      },
      {
        title: "Quote",
        description: "Capture a quote",
        icon: Quote,
        shortcut: "Ctrl+Shift+B",
        group: "Media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        title: "Divider",
        description: "Visually divide blocks",
        icon: Minus,
        shortcut: "Ctrl+Shift+D",
        group: "Media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
      {
        title: "Table",
        description: "Insert a simple 3x3 grid table",
        icon: TableIcon,
        shortcut: "Ctrl+Alt+T",
        group: "Media",
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        },
      },
      {
        title: "Highlight",
        description: "Highlight text",
        icon: Highlighter,
        shortcut: "Ctrl+Shift+H",
        group: "Media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleHighlight().run();
        },
      },
      {
        title: "Image",
        description: "Upload or embed an image",
        icon: ImageIcon,
        group: "Media",
        command: ({ editor, range }) => {
          const url = window.prompt("Enter image URL");
          if (url) {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setImage({ src: url })
              .run();
          } else {
            editor.chain().focus().deleteRange(range).run();
          }
        },
      },
    ] as SlashCommandItem[]
  )
    .filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 10);
};
