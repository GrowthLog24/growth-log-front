import JSZip from "jszip";
import type { TistoryAttachment, TistoryDraftJob } from "@/shared/lib/playwrightHelper";

const MAX_ZIP_BYTES = 80_000_000;
const MAX_POSTS = 30;

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function splitTags(value: string | string[]) {
  const candidates = Array.isArray(value) ? value : String(value ?? "").split(/[\n,]+/);
  return [...new Set(
    candidates
      .map((tag) => String(tag).trim().replace(/^#+/, ""))
      .filter(Boolean),
  )].slice(0, 10);
}

function inlineMarkdown(value: string) {
  let text = htmlEscape(value);
  const code: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, content: string) => {
    code.push(content);
    return `\u0000CODE${code.length - 1}\u0000`;
  });
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  return text.replace(
    /\u0000CODE(\d+)\u0000/g,
    (_match, index: string) => `<code>${htmlEscape(code[Number(index)])}</code>`,
  );
}

function markdownImage(line: string) {
  const image = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/.exec(line.trim());
  const captionedLink = /^\[([^\]]+)\]\(([^)\s]+)\)\s*$/.exec(line.trim());
  const match = image || (
    captionedLink
    && (
      /^growthlog-asset:\/\//.test(captionedLink[2])
      || /\.(?:png|jpe?g|gif|webp)(?:[?#].*)?$/i.test(captionedLink[2])
    )
      ? captionedLink
      : null
  );
  if (!match) return "";
  const caption = htmlEscape(match[1]);
  const source = htmlEscape(match[2]);
  return `<figure data-ke-type="image"><img src="${source}" alt="${caption}" />${
    caption ? `<figcaption>${caption}</figcaption>` : ""
  }</figure>`;
}

function markdownToHtml(markdown: string) {
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  let paragraph: string[] = [];
  let listType = "";
  let codeFence = false;
  let codeLines: string[] = [];
  let tableBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${paragraph.map(inlineMarkdown).join("<br />")}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = "";
  };
  const flushTable = () => {
    if (tableBuffer.length < 2) {
      paragraph.push(...tableBuffer);
      tableBuffer = [];
      return;
    }
    const rows = tableBuffer.map((line) =>
      line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()),
    );
    if (!rows[1].every((cell) => /^:?-{3,}:?$/.test(cell))) {
      paragraph.push(...tableBuffer);
      tableBuffer = [];
      return;
    }
    output.push("<table><thead><tr>");
    output.push(rows[0].map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join(""));
    output.push("</tr></thead><tbody>");
    for (const row of rows.slice(2)) {
      output.push(`<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`);
    }
    output.push("</tbody></table>");
    tableBuffer = [];
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      flushParagraph();
      closeList();
      flushTable();
      if (codeFence) {
        output.push(`<pre><code>${htmlEscape(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
      }
      codeFence = !codeFence;
      continue;
    }
    if (codeFence) {
      codeLines.push(line);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushParagraph();
      closeList();
      tableBuffer.push(line);
      continue;
    }
    flushTable();
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const image = markdownImage(line);
    if (image) {
      flushParagraph();
      closeList();
      output.push(image);
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 6);
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote><p>${inlineMarkdown(quote[1])}</p></blockquote>`);
      continue;
    }

    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) {
        closeList();
        output.push(`<${nextType}>`);
        listType = nextType;
      }
      output.push(`<li>${inlineMarkdown((unordered || ordered)?.[1] ?? "")}</li>`);
      continue;
    }

    if (/^\s*<(?:p|div|figure|img|table|ul|ol|h[1-6]|blockquote|hr)\b/i.test(line)) {
      flushParagraph();
      closeList();
      output.push(line);
      continue;
    }
    paragraph.push(line.trim());
  }

  flushTable();
  flushParagraph();
  closeList();
  if (codeFence && codeLines.length) {
    output.push(`<pre><code>${htmlEscape(codeLines.join("\n"))}</code></pre>`);
  }
  return output.join("\n");
}

function posixNormalize(pathname: string) {
  const parts: string[] = [];
  for (const part of pathname.replaceAll("\\", "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function directoryOf(pathname: string) {
  const normalized = posixNormalize(pathname);
  return normalized.includes("/") ? normalized.slice(0, normalized.lastIndexOf("/") + 1) : "";
}

function mimeForPath(pathname: string) {
  const extension = pathname.toLowerCase().split(".").pop();
  return {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
  }[extension ?? ""] ?? "";
}

function extractDocument(markdown: string, filename: string) {
  let text = String(markdown).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  let frontmatter = "";
  if (text.startsWith("---\n")) {
    const end = text.indexOf("\n---\n", 4);
    if (end >= 0) {
      frontmatter = text.slice(4, end);
      text = text.slice(end + 5);
    }
  }

  const titleMatch = text.match(/^#\s+(.+)$/m);
  const frontTitle = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1];
  const fallbackTitle = filename.split("/").pop()?.replace(/\.md$/i, "").replace(/[_-]+/g, " ") ?? "제목 없음";
  const title = (frontTitle || titleMatch?.[1] || fallbackTitle).trim();
  if (titleMatch) text = text.replace(titleMatch[0], "").trimStart();

  const tags: string[] = [];
  const frontTags = frontmatter.match(/^tags:\s*(.+)$/m)?.[1] ?? "";
  tags.push(...frontTags.replace(/^\[|\]$/g, "").split(","));
  for (const line of text.split("\n")) {
    if (!/^\s*(?:#[^\s#]+\s*)+$/.test(line)) continue;
    tags.push(...[...line.matchAll(/#([^\s#]+)/g)].map((match) => match[1]));
  }
  text = text.split("\n")
    .filter((line) => !/^\s*(?:#[^\s#]+\s*)+$/.test(line))
    .join("\n");
  return { title, markdown: text, tags: splitTags(tags) };
}

export async function parseTistoryZip(file: File, excludedKeywords: string[] = []) {
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error("ZIP 파일은 최대 80MB까지 업로드할 수 있습니다.");
  }

  const archive = await JSZip.loadAsync(file);
  const entries = new Map<string, JSZip.JSZipObject>();
  archive.forEach((relativePath, entry) => {
    const normalized = posixNormalize(relativePath);
    if (
      !entry.dir
      && normalized
      && !normalized.startsWith("__MACOSX/")
      && !normalized.split("/").some((part) => part.startsWith("."))
    ) {
      entries.set(normalized, entry);
    }
  });

  const excludes = excludedKeywords.map((word) => word.trim().toLowerCase()).filter(Boolean);
  const markdownPaths = [...entries.keys()]
    .filter((pathname) => /\.md$/i.test(pathname))
    .filter((pathname) => !excludes.some((keyword) => pathname.toLowerCase().includes(keyword)))
    .sort((a, b) => a.localeCompare(b, "ko"));

  if (markdownPaths.length === 0) {
    throw new Error("ZIP 안에서 등록할 Markdown 파일을 찾지 못했습니다.");
  }
  if (markdownPaths.length > MAX_POSTS) {
    throw new Error(`한 번에 처리할 수 있는 글은 최대 ${MAX_POSTS}개입니다.`);
  }

  const jobs: TistoryDraftJob[] = [];
  for (const markdownPath of markdownPaths) {
    const raw = await entries.get(markdownPath)?.async("string");
    if (raw === undefined) continue;
    const document = extractDocument(raw, markdownPath);
    const attachments: TistoryAttachment[] = [];
    const replacements = new Map<string, string>();
    const referencePattern = /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

    for (const match of document.markdown.matchAll(referencePattern)) {
      let reference = match[2].replace(/^<|>$/g, "");
      try {
        reference = decodeURIComponent(reference);
      } catch {
        // Keep a path containing a literal percent sign as written.
      }
      if (/^(?:https?:|data:)/i.test(reference)) continue;
      const resolved = posixNormalize(`${directoryOf(markdownPath)}${reference}`);
      const entry = entries.get(resolved);
      const mime = mimeForPath(resolved);
      if (!entry || !mime || replacements.has(reference)) continue;

      const id = `asset-${jobs.length + 1}-${attachments.length + 1}`;
      attachments.push({
        id,
        name: resolved.split("/").pop() ?? `image-${attachments.length + 1}`,
        dataUrl: `data:${mime};base64,${await entry.async("base64")}`,
      });
      replacements.set(reference, `growthlog-asset://${id}`);
    }

    let markdownWithAssets = document.markdown;
    for (const [reference, placeholder] of replacements) {
      markdownWithAssets = markdownWithAssets.split(reference).join(placeholder);
      markdownWithAssets = markdownWithAssets.split(encodeURI(reference)).join(placeholder);
    }

    jobs.push({
      source: markdownPath,
      title: document.title,
      html: markdownToHtml(markdownWithAssets),
      tags: document.tags,
      attachments,
      status: "ready",
      message: "",
    });
  }
  return jobs;
}
