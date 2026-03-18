"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import { liftListItem } from "@tiptap/pm/schema-list";
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
        breaks: true,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] w-full bg-background px-3 py-2 text-sm focus:outline-none",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
          const { state } = view;
          const { $from } = state.selection;
          // 리스트 내에서는 기본 동작 유지 (새 항목 생성)
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === "listItem") {
              return false;
            }
          }
          // 그 외에는 줄바꿈(hard break) 삽입
          const tr = state.tr.replaceSelectionWith(
            state.schema.nodes.hardBreak.create()
          ).scrollIntoView();
          view.dispatch(tr);
          return true;
        }
        // 리스트 항목 맨 앞에서 Backspace → bullet 해제
        if (event.key === "Backspace") {
          const { state } = view;
          const { $from, empty } = state.selection;
          if (empty && $from.parentOffset === 0) {
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === "listItem") {
                return liftListItem(state.schema.nodes.listItem)(state, view.dispatch);
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = (editor.storage as any).markdown.getMarkdown();
      console.log("📝 HTML 구조:", html);
      console.log("📝 저장되는 마크다운:", JSON.stringify(markdown));
      onChange(markdown);
    },
  });

  // 외부에서 value가 변경되면 에디터 내용 업데이트
  useEffect(() => {
    if (editor && value !== (editor.storage as any).markdown.getMarkdown()) {
      console.log("📖 불러오는 마크다운:", JSON.stringify(value));
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 animate-pulse" />
    );
  }

  /**
   * 선택 영역의 hard break를 별도 문단으로 분리한 뒤 리스트를 토글
   */
  const splitAndToggleList = (listType: "bulletList" | "orderedList") => {
    // 이미 리스트면 해제만
    if (editor.isActive(listType)) {
      if (listType === "bulletList") {
        editor.chain().focus().toggleBulletList().run();
      } else {
        editor.chain().focus().toggleOrderedList().run();
      }
      return;
    }

    const { state } = editor;
    const { from, to } = state.selection;

    // 선택 영역을 포함하는 블록 전체 범위로 확장
    const $from = state.doc.resolve(from);
    const $to = state.doc.resolve(to);
    const blockFrom = $from.start($from.depth);
    const blockTo = $to.end($to.depth);

    // 확장된 범위 내 hard break 위치 수집
    const hardBreakPositions: number[] = [];
    state.doc.nodesBetween(blockFrom, blockTo, (node, pos) => {
      if (node.type.name === "hardBreak") {
        hardBreakPositions.push(pos);
      }
    });

    // hard break가 있으면 각각을 문단 분리로 변환
    if (hardBreakPositions.length > 0) {
      const tr = state.tr;
      for (let i = hardBreakPositions.length - 1; i >= 0; i--) {
        const mappedPos = tr.mapping.map(hardBreakPositions[i]);
        tr.delete(mappedPos, mappedPos + 1);
        tr.split(mappedPos);
      }
      // 분리된 전체 영역을 다시 선택
      const newFrom = tr.mapping.map(blockFrom);
      const newTo = tr.mapping.map(blockTo);
      tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo));
      editor.view.dispatch(tr);
    }

    // 분리 후 리스트 토글
    if (listType === "bulletList") {
      editor.chain().focus().toggleBulletList().run();
    } else {
      editor.chain().focus().toggleOrderedList().run();
    }
  };

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
          onClick={() => splitAndToggleList("bulletList")}
          title="글머리 기호 목록"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("orderedList") ? "bg-accent" : ""}`}
          onClick={() => splitAndToggleList("orderedList")}
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
