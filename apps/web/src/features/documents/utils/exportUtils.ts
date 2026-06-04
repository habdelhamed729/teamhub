// client-side Markdown and PDF exporters

// Type definition for text marks
interface TextMark {
  type: string;
  attrs?: Record<string, any>;
}

// Convert text nodes to markdown with proper marks (bold, italic, code, link, strike)
const textNodeToMarkdown = (node: any): string => {
  let text = node.text || "";
  if (!node.marks || node.marks.length === 0) return text;

  // Sort marks to ensure nested elements parse logically
  const marks = [...node.marks] as TextMark[];

  for (const mark of marks) {
    if (mark.type === "code") {
      text = `\`${text}\``;
    } else if (mark.type === "bold") {
      text = `**${text}**`;
    } else if (mark.type === "italic") {
      text = `*${text}*`;
    } else if (mark.type === "strike") {
      text = `~~${text}~~`;
    } else if (mark.type === "link") {
      const href = mark.attrs?.href || "";
      text = `[${text}](${href})`;
    }
  }
  return text;
};

// Convert list item node recursively to markdown
const listItemToMarkdown = (node: any, depth: number, isOrdered: boolean, index: number): string => {
  const indent = "  ".repeat(depth);
  const prefix = isOrdered ? `${index}. ` : "- ";

  let children = "";
  if (node.content) {
    node.content.forEach((child: any) => {
      if (child.type === "paragraph") {
        const textContent = (child.content || []).map((n: any) => n.type === "text" ? textNodeToMarkdown(n) : "").join("");
        children += textContent;
      } else if (child.type === "bulletList") {
        children += "\n" + listNodeToMarkdown(child, depth + 1, false);
      } else if (child.type === "orderedList") {
        children += "\n" + listNodeToMarkdown(child, depth + 1, true);
      } else {
        children += nodeToMarkdown(child, depth + 1);
      }
    });
  }

  return `${indent}${prefix}${children.trim()}\n`;
};

// Convert list node recursively to markdown
const listNodeToMarkdown = (node: any, depth = 0, isOrdered = false): string => {
  let result = "";
  if (!node.content) return "";

  node.content.forEach((item: any, idx: number) => {
    if (item.type === "listItem") {
      result += listItemToMarkdown(item, depth, isOrdered, idx + 1);
    }
  });
  return result;
};

// Convert task item node to markdown
const taskItemToMarkdown = (node: any, depth: number): string => {
  const checked = node.attrs?.checked ? "[x]" : "[ ]";
  const indent = "  ".repeat(depth);
  let children = "";

  if (node.content) {
    node.content.forEach((child: any) => {
      if (child.type === "paragraph") {
        const textContent = (child.content || []).map((n: any) => n.type === "text" ? textNodeToMarkdown(n) : "").join("");
        children += textContent;
      } else if (child.type === "bulletList") {
        children += "\n" + listNodeToMarkdown(child, depth + 1, false);
      } else if (child.type === "orderedList") {
        children += "\n" + listNodeToMarkdown(child, depth + 1, true);
      } else {
        children += nodeToMarkdown(child, depth + 1);
      }
    });
  }

  return `${indent}- ${checked} ${children.trim()}\n`;
};

// Convert table node to markdown
const tableToMarkdown = (node: any): string => {
  const rows = node.content || [];
  if (rows.length === 0) return "";

  const markdownRows: string[][] = [];

  rows.forEach((rowNode: any) => {
    if (rowNode.type === "tableRow") {
      const cells: string[] = [];
      (rowNode.content || []).forEach((cellNode: any) => {
        let cellText = "";
        if (cellNode.content) {
          cellText = cellNode.content
            .map((pNode: any) => {
              return (pNode.content || []).map((n: any) => n.type === "text" ? textNodeToMarkdown(n) : "").join("");
            })
            .join(" ");
        }
        cells.push(cellText.replace(/\|/g, "\\|").trim());
      });
      markdownRows.push(cells);
    }
  });

  if (markdownRows.length === 0) return "";

  let result = "";
  const header = markdownRows[0];
  result += `| ${header.join(" | ")} |\n`;

  const separator = header.map(() => "---");
  result += `| ${separator.join(" | ")} |\n`;

  markdownRows.slice(1).forEach((row) => {
    result += `| ${row.join(" | ")} |\n`;
  });

  return result + "\n";
};

// Recursive Tiptap node to markdown parser
export const nodeToMarkdown = (node: any, depth = 0): string => {
  if (!node) return "";

  switch (node.type) {
    case "doc":
      return (node.content || []).map((child: any) => nodeToMarkdown(child, depth)).join("");
    case "paragraph":
      const pText = (node.content || []).map((n: any) => n.type === "text" ? textNodeToMarkdown(n) : "").join("");
      return pText + "\n\n";
    case "heading":
      const level = node.attrs?.level || 1;
      const hashes = "#".repeat(level);
      const hText = (node.content || []).map((n: any) => n.type === "text" ? textNodeToMarkdown(n) : "").join("");
      return `${hashes} ${hText}\n\n`;
    case "blockquote":
      const bText = (node.content || []).map((child: any) => nodeToMarkdown(child, depth)).join("").trim();
      return bText.split("\n").map((line: string) => `> ${line}`).join("\n") + "\n\n";
    case "codeBlock":
      const lang = node.attrs?.language || "";
      const codeText = (node.content || []).map((n: any) => n.text || "").join("");
      return `\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
    case "horizontalRule":
      return "---\n\n";
    case "image":
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      const title = node.attrs?.title ? ` "${node.attrs.title}"` : "";
      return `![${alt}](${src}${title})\n\n`;
    case "hardBreak":
      return "\n";
    case "bulletList":
      return listNodeToMarkdown(node, depth, false) + "\n";
    case "orderedList":
      return listNodeToMarkdown(node, depth, true) + "\n";
    case "taskList":
      let taskListResult = "";
      (node.content || []).forEach((item: any) => {
        if (item.type === "taskItem") {
          taskListResult += taskItemToMarkdown(item, depth);
        }
      });
      return taskListResult + "\n";
    case "table":
      return tableToMarkdown(node);
    default:
      if (node.content) {
        return (node.content || []).map((child: any) => nodeToMarkdown(child, depth)).join("");
      }
      return "";
  }
};

// Download document content as Markdown (.md)
export const downloadMarkdown = (title: string, contentJson: any) => {
  const bodyMarkdown = nodeToMarkdown(contentJson);
  // Prepend title as Heading 1
  const cleanTitle = title.trim() || "Untitled Document";
  const fullMarkdown = `# ${cleanTitle}\n\n${bodyMarkdown.replace(/\n{3,}/g, "\n\n")}`;

  const blob = new Blob([fullMarkdown], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  // Clean title for filename
  const filename = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  link.setAttribute("download", `${filename || "document"}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Download document content as PDF (.pdf) using html2pdf.js
export const downloadPDF = async (elementId: string, title: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Print area element with id ${elementId} not found`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const html2pdf = (await import("html2pdf.js")).default;

  const cleanTitle = title.trim() || "Untitled Document";
  const filename = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Inject a temporary <style> that overrides dark theme to clean light/white theme
  // for the PDF. This works on the LIVE element so flex layouts, Tailwind classes,
  // and gradients all render correctly.
  const pdfStyle = document.createElement("style");
  pdfStyle.id = "pdf-export-theme";
  pdfStyle.textContent = `
    #${elementId}.exporting-pdf {
      background-color: #ffffff !important;
      color: #1a1a2e !important;
    }
    #${elementId}.exporting-pdf * {
      color: #1f2937 !important;
      border-color: #e5e7eb !important;
    }
    #${elementId}.exporting-pdf h1,
    #${elementId}.exporting-pdf h2,
    #${elementId}.exporting-pdf h3,
    #${elementId}.exporting-pdf h4,
    #${elementId}.exporting-pdf h5,
    #${elementId}.exporting-pdf h6 {
      color: #111827 !important;
    }
    #${elementId}.exporting-pdf a {
      color: #0d9488 !important;
      text-decoration: underline !important;
    }
    #${elementId}.exporting-pdf pre,
    #${elementId}.exporting-pdf code {
      background-color: #f3f4f6 !important;
      color: #1f2937 !important;
      border: 1px solid #d1d5db !important;
    }
    #${elementId}.exporting-pdf blockquote {
      border-left-color: #10b981 !important;
      color: #374151 !important;
    }
    #${elementId}.exporting-pdf th {
      background-color: #f9fafb !important;
      color: #1f2937 !important;
    }
    #${elementId}.exporting-pdf td {
      color: #1f2937 !important;
      border-color: #d1d5db !important;
    }
    #${elementId}.exporting-pdf input {
      color: #111827 !important;
    }
    #${elementId}.exporting-pdf .no-pdf {
      display: none !important;
    }
  `;
  document.head.appendChild(pdfStyle);

  // Add export class to the live element
  element.classList.add("exporting-pdf");

  // Scroll to top so html2canvas captures from the beginning
  const scrollTop = element.scrollTop;
  element.scrollTop = 0;

  const opt = {
    margin: [0.4, 0.5, 0.4, 0.5] as [number, number, number, number],
    filename: `${filename || "document"}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollY: 0,
    },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
    enableLinks: true,
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  // Monkeypatch window.getComputedStyle to bypass html2canvas oklab/oklch color parsing crash
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        const val = Reflect.get(target, prop);
        if (typeof val === "string" && (val.includes("oklab") || val.includes("oklch"))) {
          return val.replace(/(oklab|oklch)\([^)]+\)/g, "rgba(100, 100, 100, 1)");
        }
        if (typeof val === "function") {
          return val.bind(target);
        }
        return val;
      },
    });
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error("PDF generation failed:", err);
  } finally {
    // Restore everything
    window.getComputedStyle = originalGetComputedStyle;
    element.classList.remove("exporting-pdf");
    element.scrollTop = scrollTop;
    pdfStyle.remove();
  }
};
