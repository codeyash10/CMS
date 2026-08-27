"use client";

import { useParams } from "next/navigation";
import { DraftPreviewPage } from "@/components/DraftPreviewPage";

export default function BlogDraftPreviewPage() {
  const { id } = useParams<{ id: string }>();
  return <DraftPreviewPage draftKey={`cms-blog-draft:${id}`} blogId={id} />;
}
