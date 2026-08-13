import { cn } from "@/lib/utils";

export const inputClassName = cn(
  "w-full rounded-lg border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none",
  "focus:border-accent disabled:bg-canvas disabled:text-ink/60"
);

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClassName, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClassName, className)} {...props} />;
}
