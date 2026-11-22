export function contentDisposition(name: string, inline = false) {
  const ascii = name.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(name);

  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
