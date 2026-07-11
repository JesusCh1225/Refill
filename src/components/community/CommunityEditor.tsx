"use client";

import "@/styles/community.css";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Extension } from "@tiptap/core";
import { useCallback, useRef } from "react";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize || null,
          renderHTML: (attrs) => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

// 모듈 레벨 상수 — 매 렌더마다 새 인스턴스 생성을 막아 Tiptap 중복 경고 방지
const EXTENSIONS = [
  StarterKit,
  Underline,
  TextStyle,
  Color,
  FontSize,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-brand underline" } }),
  Image.configure({ HTMLAttributes: { class: "max-w-full rounded-lg my-2" } }),
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];
const COLORS = ["#000000", "#e03131", "#2f9e44", "#1971c2", "#7048e8", "#f08c00", "#666666", "#ffffff"];

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function CommunityEditor({ content, onChange, placeholder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[320px] px-4 py-3 focus:outline-none text-[14px] text-text-body leading-relaxed",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload/post-image", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url }).run();
    }
    e.target.value = "";
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("링크 URL을 입력하세요", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border-base rounded-xl overflow-hidden">
      <Toolbar editor={editor} onImageClick={() => fileInputRef.current?.click()} onLinkClick={setLink} />
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, onImageClick, onLinkClick }: { editor: Editor; onImageClick: () => void; onLinkClick: () => void }) {
  const btn = (active: boolean, onClick: () => void, label: string, title?: string) => (
    <button
      key={label}
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={`px-2 py-1 rounded text-[13px] border-none cursor-pointer transition-colors ${
        active ? "bg-brand text-white" : "bg-transparent text-text-body hover:bg-surface-card"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-border-base bg-surface-card">
      <select
        value={editor.getAttributes("textStyle").fontSize ?? "16px"}
        onChange={(e) => (editor.chain().focus() as any).setFontSize(e.target.value).run()}
        className="h-7 px-1 text-[12px] border border-border-base rounded bg-white text-text-body cursor-pointer mr-1"
      >
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s.replace("px", "")}px</option>)}
      </select>

      <Divider />

      {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "B", "굵게")}
      {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "I", "기울게")}
      {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "U", "밑줄")}
      {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "S̶", "취소선")}

      <Divider />

      {btn(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), "≡", "왼쪽 정렬")}
      {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), "≡̄", "가운데 정렬")}
      {btn(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), "≡→", "오른쪽 정렬")}

      <Divider />

      {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "•—", "글머리 기호")}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "1—", "번호 목록")}

      <Divider />

      {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "❝", "인용구")}
      {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), "</>", "코드 블록")}

      <Divider />

      <button
        type="button"
        title="링크 삽입"
        onClick={onLinkClick}
        className={`px-2 py-1 rounded text-[13px] border-none cursor-pointer transition-colors ${
          editor.isActive("link") ? "bg-brand text-white" : "bg-transparent text-text-body hover:bg-surface-card"
        }`}
      >
        🔗
      </button>

      <button
        type="button"
        title="이미지 삽입"
        onClick={onImageClick}
        className="px-2 py-1 rounded border-none cursor-pointer bg-transparent hover:bg-surface-card transition-colors flex items-center justify-center"
      >
        <img src="/image_icon.png" alt="이미지 삽입" width={16} height={16} />
      </button>

      <Divider />

      <div className="flex items-center gap-0.5">
        {COLORS.map((c) => {
          const active = editor.isActive("textStyle", { color: c });
          return (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => editor.chain().focus().setColor(c).run()}
              className="relative w-5 h-5 rounded-full border border-border-base cursor-pointer p-0 shrink-0 flex items-center justify-center"
              style={{ background: c }}
            >
              {active && (
                <span
                  className="text-[10px] font-bold leading-none select-none"
                  style={{ color: c === "#ffffff" ? "#1f2937" : "#ffffff" }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Divider />

      {btn(false, () => editor.chain().focus().undo().run(), "↩", "실행취소")}
      {btn(false, () => editor.chain().focus().redo().run(), "↪", "다시실행")}
    </div>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-border-base mx-1 shrink-0" />;
}
