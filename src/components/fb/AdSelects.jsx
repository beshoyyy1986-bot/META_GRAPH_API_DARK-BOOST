import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cls = "bg-black/40 border-white/10 text-zinc-100 text-xs h-9";

export function DarkSelect({ value, onValueChange, placeholder, options }) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className={cls}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-zinc-950 border-white/10 text-zinc-100">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const AGES = Array.from({ length: 53 }, (_, i) => String(i + 13));