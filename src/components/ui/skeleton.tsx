import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-button bg-surface-raised", className)}
      {...props}
    />
  );
}

export { Skeleton };
