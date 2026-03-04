"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * 노션 스타일 마크다운 에디터
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
}: MarkdownEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] w-full bg-background px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown.getMarkdown();
      onChange(markdown);
    },
  });

  // 외부에서 value가 변경되면 에디터 내용 업데이트
  useEffect(() => {
    if (editor && value !== (editor.storage as any).markdown.getMarkdown()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 animate-pulse" />
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL을 입력하세요", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="rounded-md border border-input overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center gap-0.5 p-1 border-b bg-gray-6 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="제목 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="제목 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("bold") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="굵게 (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("italic") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="기울임 (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("strike") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="취소선"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("code") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="인라인 코드"
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("link") ? "bg-accent" : ""}`}
          onClick={setLink}
          title="링크"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("bulletList") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="글머리 기호 목록"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("orderedList") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="번호 매기기 목록"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("blockquote") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="인용"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* 에디터 */}
      <EditorContent editor={editor} />
    </div>
  );
}
