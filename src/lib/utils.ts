export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

const IMAGE_MIME_PREFIX = 'image/';

export function isImageMime(mime: string): boolean {
  return mime.startsWith(IMAGE_MIME_PREFIX);
}

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|heic|avif|bmp|ico)$/i;

export function isImageFile(file: File): boolean {
  return file.type.startsWith(IMAGE_MIME_PREFIX) || IMAGE_EXT_RE.test(file.name);
}

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toUpperCase() : 'FILE';
}

const FILE_ICON_COLORS: Record<string, string> = {
  PDF: '#e74c3c',
  DOC: '#2b579a',
  DOCX: '#2b579a',
  XLS: '#217346',
  XLSX: '#217346',
  CSV: '#217346',
  PPT: '#d35400',
  PPTX: '#d35400',
  TXT: '#7f8c8d',
  ZIP: '#f39c12',
  RAR: '#f39c12',
  JS: '#f7df1e',
  TS: '#3178c6',
  HTML: '#e34c26',
  CSS: '#264de4',
  PY: '#3776ab',
  JAVA: '#ed8b00',
  C: '#a8b9cc',
  CPP: '#00599c',
  JSON: '#cbcb41',
  XML: '#e37933',
  SQL: '#e38c00',
};

export function getFileAccentColor(ext: string): string {
  return FILE_ICON_COLORS[ext] || '#64748b';
}

const LANG_BY_EXT: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  html: 'html', htm: 'html',
  css: 'css', scss: 'css', sass: 'css',
  json: 'json',
  sql: 'sql',
  py: 'python',
  md: 'markdown', markdown: 'markdown',
  xml: 'xml', svg: 'xml',
  java: 'java',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', hpp: 'cpp',
  php: 'php',
  rs: 'rust',
  go: 'go',
  rb: 'ruby',
  sh: 'shell', bash: 'shell',
  yml: 'yaml', yaml: 'yaml',
};

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return LANG_BY_EXT[ext] || ext || 'text';
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
