import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[40vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2.5">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Loading Dashboard...
        </p>
      </div>
    </div>
  );
}
