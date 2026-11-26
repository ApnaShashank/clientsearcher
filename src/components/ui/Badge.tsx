import React from "react";

const STATUS_STYLES: Record<string, string> = {
  Unassigned: "bg-[#F3F3F0] text-[#5C5C58]",
  Assigned: "bg-[#EEF2FF] text-[#3B5BDB]",
  Interested: "bg-[#E6F9EE] text-[#12804A]",
  "Meeting Fixed": "bg-[#FFF0EA] text-[#E84E10]",
  Won: "bg-[#111111] text-[#FFFFFF]",
  Callback: "bg-[#FFF7E6] text-[#B86B00]",
  "Not Interested": "bg-[#FEECEC] text-[#C92A2A]",
  "No Answer": "bg-[#F3F3F0] text-[#5C5C58]",
  Busy: "bg-[#F3F3F0] text-[#5C5C58]",
  "Wrong Number": "bg-[#FEECEC] text-[#C92A2A]",
  Hot: "bg-[#FFF0EA] text-[#FF5C1C]",
  Warm: "bg-[#FFF7E6] text-[#B86B00]",
  Cold: "bg-[#EEF2FF] text-[#3B5BDB]",
  Scheduled: "bg-[#FFF7E6] text-[#B86B00]",
  Live: "bg-[#E6F9EE] text-[#12804A]",
  Completed: "bg-[#F3F3F0] text-[#5C5C58]",
};

export function StatusBadge({ label }: { label: string }) {
  const cls = STATUS_STYLES[label] || "bg-[#F3F3F0] text-[#5C5C58]";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}
