function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function wrapText(text: string, maxLength = 90) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export function renderMarkdownToPdfBuffer(title: string, markdown: string) {
  const textLines = [
    title,
    "",
    ...markdown.split("\n").flatMap((line) => wrapText(line)),
  ];

  const contentStream =
    "BT\n" +
    "/F1 12 Tf\n" +
    "1 0 0 1 50 760 Tm\n" +
    textLines
      .map((line, index) => {
        const y = 760 - index * 14;
        return `1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`;
      })
      .join("\n") +
    "\nET";

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`,
  ];

  const header = "%PDF-1.4\n";
  const parts: string[] = [header];
  const offsets = [0];
  let length = header.length;

  for (const object of objects) {
    offsets.push(length);
    parts.push(`${object}\n`);
    length += `${object}\n`.length;
  }

  const xrefStart = length;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => String(offset).padStart(10, "0") + " 00000 n "),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ].join("\n");

  parts.push(xref);
  return new TextEncoder().encode(parts.join(""));
}
