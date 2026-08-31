"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Blog } from "@/lib/mock-db";

export interface BlogFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}

function toValues(blog?: Blog | null): BlogFormValues {
  return {
    title: blog?.title ?? "",
    slug: blog?.slug ?? "",
    excerpt: blog?.excerpt ?? "",
    content: blog?.content ?? "",
    metaTitle: blog?.metaTitle ?? "",
    metaDescription: blog?.metaDescription ?? "",
  };
}

export function BlogForm({
  blog,
  readOnly,
  onSave,
  saving,
}: {
  blog?: Blog | null;
  readOnly?: boolean;
  onSave: (values: BlogFormValues) => Promise<void>;
  saving?: boolean;
}) {
  const [values, setValues] = useState<BlogFormValues>(toValues(blog));

  function update<K extends keyof BlogFormValues>(
    key: K,
    val: BlogFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values);
      }}
      className="space-y-5"
    >
      <Field label="Title">
        <Input
          disabled={readOnly}
          required
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="A clear, specific headline"
        />
      </Field>

      <Field label="URL slug">
        <Input
          disabled={readOnly}
          value={values.slug}
          onChange={(e) => update("slug", e.target.value)}
          className="font-mono"
          placeholder="auto-generated-from-title"
        />
      </Field>

      <Field label="Excerpt">
        <Textarea
          disabled={readOnly}
          value={values.excerpt}
          onChange={(e) => update("excerpt", e.target.value)}
          rows={2}
          placeholder="One or two sentences shown in blog listings"
        />
      </Field>

      <Field label="Content (HTML for now — swap for a rich text editor later)">
        <Textarea
          disabled={readOnly}
          required
          value={values.content}
          onChange={(e) => update("content", e.target.value)}
          rows={10}
          className="font-mono"
          placeholder="<p>Start writing…</p>"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Meta title">
          <Input
            disabled={readOnly}
            value={values.metaTitle}
            onChange={(e) => update("metaTitle", e.target.value)}
          />
        </Field>
        <Field label="Meta description">
          <Input
            disabled={readOnly}
            value={values.metaDescription}
            onChange={(e) => update("metaDescription", e.target.value)}
          />
        </Field>
      </div>

      {!readOnly && (
        <Button type="submit" variant="dark" disabled={saving}>
          {saving ? "Saving…" : "Save draft"}
        </Button>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink/80 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
