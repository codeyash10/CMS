"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/auth-api";
import { resetPasswordSchema } from "@/lib/schemas/auth";

export interface ResetPasswordFormInput {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordFormInput) => {
      const { email, otp, newPassword } = resetPasswordSchema.parse(input);
      return authApi.resetPassword({ email, otp, newPassword });
    },
  });
}
