import React from "react";
import { Loader2 } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#EBEBE7] rounded-2xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}
