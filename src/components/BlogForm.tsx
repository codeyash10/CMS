"use client";

import { ArrowLeft, ArrowRight, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, inputClassName } from "@/components/ui/Input";
import type { Blog } from "@/lib/mock-db";
import { RichTextEditor } from "@/components/RichTextEditor";
import { uploadBlogImage } from "@/lib/image-upload";

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const LIMITS = { title: 160, excerpt: 300, content: 50_000, metaTitle: 60, metaDescription: 160 };

export interface BlogFormValues {
  title: string; slug: string; excerpt: string; content: string; coverImageUrl: string[]; metaTitle: string; metaDescription: string;
}

function toValues(blog?: Blog | null): BlogFormValues {
  return { title: blog?.title ?? "", slug: blog?.slug ?? "", excerpt: blog?.excerpt ?? "", content: blog?.content ?? "", coverImageUrl: blog?.coverImageUrls ?? (blog?.coverImageUrl ? [blog.coverImageUrl] : []), metaTitle: blog?.metaTitle ?? "", metaDescription: blog?.metaDescription ?? "" };
}

export function BlogForm({ blog, readOnly, onSave, saving, formId, hideSubmit }: { blog?: Blog | null; readOnly?: boolean; onSave: (values: BlogFormValues) => Promise<void>; saving?: boolean; formId?: string; hideSubmit?: boolean }) {
  const draftKey = `cms-blog-draft:${blog?.id ?? "new"}`;
  const [values, setValues] = useState<BlogFormValues>(() => {
    const initialValues = toValues(blog);
    if (readOnly || typeof window === "undefined") return initialValues;
    try { return { ...initialValues, ...JSON.parse(window.localStorage.getItem(draftKey) ?? "null") }; } catch { return initialValues; }
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [contentMode, setContentMode] = useState<"write" | "preview">("write");
  const [contentCharacterCount, setContentCharacterCount] = useState(() => toValues(blog).content.replace(/<[^>]*>/g, "").length);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!readOnly) window.localStorage.setItem(draftKey, JSON.stringify(values));
  }, [draftKey, readOnly, values]);
  function update<K extends keyof BlogFormValues>(key: K, value: BlogFormValues[K]) { setValues((current) => ({ ...current, [key]: value })); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const missing = !values.title.trim() ? "Add a title before saving." : contentCharacterCount === 0 ? "Add blog content before saving." : null;
    if (missing) { setFormError(missing); return; }
    const tooLong = Object.entries(LIMITS).find(([key, limit]) => key === "content" ? contentCharacterCount > limit : values[key as keyof typeof LIMITS].length > limit);
    if (tooLong) { setFormError(`${tooLong[0] === "metaTitle" ? "Meta title" : tooLong[0] === "metaDescription" ? "Meta description" : tooLong[0]} exceeds the ${tooLong[1]} character limit.`); return; }
    setFormError(null);
    await onSave(values);
    window.localStorage.removeItem(draftKey);
  }
  async function addImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversizedFile) {
      setUploadError(`${oversizedFile.name} is larger than ${MAX_IMAGE_SIZE_MB}MB.`);
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const imageUrls = await Promise.all(files.map(uploadBlogImage));
      update("coverImageUrl", [...values.coverImageUrl, ...imageUrls]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }
  function removeImage(index: number) {
    update("coverImageUrl", values.coverImageUrl.filter((_, currentIndex) => currentIndex !== index));
  }
  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= values.coverImageUrl.length) return;
    const images = [...values.coverImageUrl];
    [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
    update("coverImageUrl", images);
  }

  return <form id={formId} onSubmit={save} className="space-y-6">
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,0.85fr)]">
    <section className="space-y-4 rounded-xl border border-line bg-panel p-5"><h2 className="font-heading text-base font-semibold text-ink">Content</h2>
      <div className="flex border-b border-line" role="tablist" aria-label="Post preview mode">
        <button type="button" role="tab" aria-selected={contentMode === "write"} onClick={() => setContentMode("write")} className={`border-b-2 px-3 py-2 text-sm font-medium ${contentMode === "write" ? "border-accent text-accent" : "border-transparent text-ink/55 hover:text-ink"}`}>Write</button>
        <button type="button" role="tab" aria-selected={contentMode === "preview"} onClick={() => setContentMode("preview")} className={`border-b-2 px-3 py-2 text-sm font-medium ${contentMode === "preview" ? "border-accent text-accent" : "border-transparent text-ink/55 hover:text-ink"}`}>Preview</button>
      </div>
      {contentMode === "write" ? <>
      <Field label="Title" hint={`${values.title.length}/${LIMITS.title} characters`}><Input disabled={readOnly} required maxLength={LIMITS.title} value={values.title} onChange={(event) => update("title", event.target.value)} placeholder="A clear, specific headline" /></Field>
      <Field label="URL slug" hint="Leave blank to generate it from the title."><Input disabled={readOnly} value={values.slug} onChange={(event) => update("slug", event.target.value)} className="font-mono" placeholder="auto-generated-from-title" /></Field>
      <Field label="Excerpt" hint={`Short summary used in blog cards and search results. ${values.excerpt.length}/${LIMITS.excerpt}`}><Textarea disabled={readOnly} maxLength={LIMITS.excerpt} value={values.excerpt} onChange={(event) => update("excerpt", event.target.value)} rows={3} placeholder="One or two sentences shown in blog listings" /></Field>
      <Field label="Content" hint={`${contentCharacterCount}/${LIMITS.content} visible characters`}><RichTextEditor disabled={readOnly} value={values.content} onChange={(content, characterCount) => { update("content", content); setContentCharacterCount(characterCount); }} /></Field>
      </> : <article className="article-content rounded-lg border border-line bg-canvas p-4 sm:p-6">
        {values.coverImageUrl[0] && <img src={values.coverImageUrl[0]} alt="" className="mb-6 h-52 w-full rounded-lg object-cover sm:h-72" />}
        <h1>{values.title || "Untitled post"}</h1>
        {values.excerpt && <p className="mt-3 text-base leading-7 text-ink/65">{values.excerpt}</p>}
        {blog?.tags?.length ? <p className="mt-4 text-xs text-ink/50">{blog.tags.join(" · ")}</p> : null}
        <div className="mt-6">{contentCharacterCount > 0 ? <div dangerouslySetInnerHTML={{ __html: values.content }} /> : <p className="text-ink/45">Your post preview will appear here as you write.</p>}</div>
      </article>}
    </section>
    <div className="space-y-6 xl:sticky xl:top-20">
    <section className="space-y-4 rounded-xl border border-line bg-panel p-5"><h2 className="font-heading text-base font-semibold text-ink">Publishing details</h2>
      <Field label="Blog images" hint="Upload one or more images. The first image is used as the blog cover.">
        <input ref={fileInputRef} disabled={readOnly || uploading} type="file" accept="image/*" multiple onChange={addImages} className="sr-only" />
        <button type="button" disabled={readOnly || uploading} onClick={() => fileInputRef.current?.click()} className={`${inputClassName} flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 border-dashed text-center disabled:cursor-not-allowed`}>
          <Upload className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">{uploading ? "Uploading..." : "Choose images"}</span>
          <span className="text-xs text-ink/45">PNG, JPG, WEBP, or GIF up to {MAX_IMAGE_SIZE_MB}MB each</span>
        </button>
      </Field>
      {uploadError && <p className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">{uploadError}</p>}
      {values.coverImageUrl.length > 0 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {values.coverImageUrl.map((imageUrl, index) => <div key={`${imageUrl}-${index}`} className="group relative overflow-hidden rounded-lg border border-line bg-canvas">
          <img src={imageUrl} alt={`Blog image preview ${index + 1}`} className="h-40 w-full object-cover" />
          <div className="absolute left-2 top-2 rounded bg-ink/70 px-2 py-1 text-xs font-medium text-canvas">{index === 0 ? "Cover" : `Image ${index + 1}`}</div>
          {!readOnly && <div className="absolute right-2 top-2 flex gap-1"><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} earlier`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-canvas hover:bg-accent disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === values.coverImageUrl.length - 1} aria-label={`Move image ${index + 1} later`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-canvas hover:bg-accent disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-canvas hover:bg-status-rejected"><X className="h-4 w-4" /></button></div>}
        </div>)}
      </div>}
    </section>
    <section className="space-y-4 rounded-xl border border-line bg-panel p-5"><h2 className="font-heading text-base font-semibold text-ink">SEO</h2><Field label="Meta title" hint={`${values.metaTitle.length}/${LIMITS.metaTitle} characters`}><Input disabled={readOnly} maxLength={LIMITS.metaTitle} value={values.metaTitle} onChange={(event) => update("metaTitle", event.target.value)} placeholder="Title shown in search engines" /></Field><Field label="Meta description" hint={`${values.metaDescription.length}/${LIMITS.metaDescription} characters`}><Textarea disabled={readOnly} maxLength={LIMITS.metaDescription} value={values.metaDescription} onChange={(event) => update("metaDescription", event.target.value)} rows={3} placeholder="Short description for search engines" /></Field></section>
    </div>
    </div>
    {formError && <p role="alert" className="rounded-lg border border-status-rejected/20 bg-status-rejected/10 px-3 py-2 text-sm text-status-rejected">{formError}</p>}
    {!readOnly && !hideSubmit && <Button type="submit" variant="dark" disabled={saving}>{saving ? "Saving..." : "Save draft"}</Button>}
  </form>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <div><label className="mb-1.5 block text-sm font-medium text-ink/80">{label}</label>{children}{hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}</div>; }
