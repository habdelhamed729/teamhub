import React from "react";

export const parseMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  const parseInline = (inlineText: string): React.ReactNode => {
    // Split by bold patterns (**text**)
    const parts = inlineText.split(/(\*\*[^*]+\*\*)/g);
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={index} className="font-bold text-text-primary">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </>
    );
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (trimmed === "") {
      i++;
      continue;
    }

    // 2. Headings (#, ##, ###, ####)
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];
        const headingClasses = {
          1: "text-lg font-extrabold text-text-primary mt-6 mb-3 border-b border-white/5 pb-1",
          2: "text-base font-bold text-text-primary mt-5 mb-2 border-b border-white/5 pb-1",
          3: "text-sm font-bold text-text-primary mt-4 mb-2 uppercase tracking-wider",
          4: "text-xs font-bold text-text-secondary mt-3 mb-1 uppercase tracking-wider",
        }[level as 1 | 2 | 3 | 4] || "text-sm font-bold text-text-primary mt-4 mb-2";

        elements.push(
          React.createElement(
            `h${Math.min(level, 4)}`,
            { key: `h-${i}`, className: headingClasses },
            parseInline(headingText)
          )
        );
        i++;
        continue;
      }
    }

    // 2b. Heading underline styles (e.g. title followed by === or ---)
    if (i + 1 < lines.length && lines[i + 1].trim().match(/^===+$/)) {
      elements.push(
        <h3 key={`h-eq-${i}`} className="text-base font-bold text-text-primary mt-5 mb-2 border-b border-white/5 pb-1">
          {parseInline(trimmed)}
        </h3>
      );
      i += 2;
      continue;
    }
    if (i + 1 < lines.length && lines[i + 1].trim().match(/^---+$/)) {
      elements.push(
        <h4 key={`h-dash-${i}`} className="text-sm font-bold text-text-primary mt-4 mb-2 uppercase tracking-wider">
          {parseInline(trimmed)}
        </h4>
      );
      i += 2;
      continue;
    }

    // 3. Code Blocks (```)
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++; // skip opening fence
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      elements.push(
        <pre key={`code-${i}`} className="bg-surface-elevated border border-white/5 rounded-xl p-3 font-mono text-xs overflow-x-auto my-3 text-text-secondary select-text">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // 4. Tables (| col | col |)
    if (trimmed.startsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const rowLine = lines[i].trim();
        // Skip table separator line (e.g. |---|---|)
        if (rowLine.match(/^\|(?:\s*:-*:\s*|:-*|-*:|:*-+:*\s*|[- ]+)+\|$/)) {
          i++;
          continue;
        }
        const cells = rowLine
          .split("|")
          .map((c) => c.trim())
          .slice(1, -1); // remove the leading/trailing empty elements from split
        tableRows.push(cells);
        i++;
      }

      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const dataRows = tableRows.slice(1);
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4 rounded-xl border border-white/5 bg-surface-elevated/30">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/2">
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2 font-bold text-text-primary">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-white/5 last:border-b-0 hover:bg-white/1">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-text-secondary">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 5. Unordered Lists (bullet styles *, -, +)
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("+ ")) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("* ") ||
          lines[i].trim().startsWith("- ") ||
          lines[i].trim().startsWith("+ "))
      ) {
        const itemLine = lines[i].trim();
        // Extract content after bullet marker
        const content = itemLine.substring(2).trim();
        listItems.push(content);
        i++;
      }

      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-2 space-y-1.5">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="text-sm leading-relaxed text-text-secondary">
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered Lists (number style e.g. 1., 2.)
    if (trimmed.match(/^\d+\.\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        const itemLine = lines[i].trim();
        const content = itemLine.replace(/^\d+\.\s+/, "").trim();
        listItems.push(content);
        i++;
      }

      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-2 space-y-1.5">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="text-sm leading-relaxed text-text-secondary">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular Paragraphs
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-text-secondary mb-3">
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
};
