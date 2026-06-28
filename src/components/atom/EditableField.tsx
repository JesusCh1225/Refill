"use client";

import { useState } from "react";

interface EditableFieldProps {
  title: string;
  description?: string;
  type?: "text" | "url" | "textarea";
  initialValue: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  onSave: (value: string) => Promise<void>;
  extra?: (value: string) => React.ReactNode;
}

export default function EditableField({
  title,
  description,
  type = "text",
  initialValue,
  placeholder,
  maxLength,
  rows = 4,
  onSave,
  extra,
}: EditableFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(value); } finally { setSaving(false); }
  };

  const inputCls = "flex-1 px-3 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors";
  const saveBtnCls = "px-4 h-10 rounded-lg bg-brand text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0";

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[14px] font-bold text-text-heading">{title}</h2>
        {description && <p className="text-[12px] text-text-muted mt-0.5">{description}</p>}
      </div>
      {type === "textarea" ? (
        <>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={maxLength}
            rows={rows}
            placeholder={placeholder}
            className={`${inputCls} py-2 resize-none w-full`}
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-placeholder">{value.length}/{maxLength}</p>
            <button onClick={handleSave} disabled={saving || value === initialValue} className={saveBtnCls}>
              {saving ? "저장중…" : "저장"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type={type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={maxLength}
              placeholder={placeholder}
              className={`${inputCls} h-10`}
            />
            <button onClick={handleSave} disabled={saving || value === initialValue} className={saveBtnCls}>
              {saving ? "저장중…" : "저장"}
            </button>
          </div>
          {extra?.(value)}
        </>
      )}
    </section>
  );
}
