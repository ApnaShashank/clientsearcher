import React from "react";

export function BrandLogo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims =
    size === "sm"
      ? "w-8 h-8 rounded-xl"
      : size === "lg"
      ? "w-11 h-11 rounded-2xl"
      : "w-9 h-9 rounded-2xl";

  return (
    <div
      className={`${dims} bg-[#0B0B0C] overflow-hidden flex items-center justify-center shrink-0 border border-[#27272A] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/creightweb-logo.jpg"
        alt="Creightweb"
        className="w-full h-full object-cover scale-125"
      />
    </div>
  );
}
