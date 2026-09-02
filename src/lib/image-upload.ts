import { api } from "@/lib/api";

export type UploadedImage = { url: string };

export async function uploadBlogImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.postForm<{ data: { url: string | null } }>(
    "/api/v1/storage/image",
    formData,
  );
  const { url } = response.data;
  if (!url)
    throw new Error(
      "Image uploaded, but the backend did not return a public image URL.",
    );
  return { url };
}
