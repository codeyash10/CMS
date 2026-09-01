import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-panel border border-line",
        hover && "transition-colors hover:border-accent",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
