import { api } from "@/lib/api";

export type UploadedImage = { key: string; url: string };

export async function uploadBlogImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.postForm<{ data: { key: string | null; url: string | null } }>(
    "/api/v1/storage/image",
    formData
  );
  if (!response.data.url || !response.data.key) {
    throw new Error("Image uploaded, but the backend did not return the expected image data.");
  }
  return { key: response.data.key, url: response.data.url };
}
