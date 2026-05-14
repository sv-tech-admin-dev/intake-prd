function sanitize(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function makeDocumentFilename(clientName: string, projectName: string, documentLabel: string, extension: "md" | "pdf") {
  const date = new Date().toISOString().slice(0, 10);
  return `${sanitize(clientName)}_${sanitize(projectName)}_${sanitize(documentLabel)}_${date}.${extension}`;
}
