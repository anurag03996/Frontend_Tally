import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-shimmer rounded-md bg-slate-100", className)}
      {...props}
    />
  );
}
