import { z } from "zod";

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request.";
}
