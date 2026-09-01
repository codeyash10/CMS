import { api } from "@/lib/api";

export async function uploadBlogImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.postForm<{ data: { url: string | null } }>(
    "/api/v1/storage/image",
    formData,
  );
  if (!response.data.url)
    throw new Error(
      "Image uploaded, but the backend did not return a public image URL.",
    );
  return response.data.url;
}
