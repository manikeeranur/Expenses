"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CategoryIcon from "@/components/ui/CategoryIcon";

export default function CategorySelect({ categories, name = "categoryId", defaultValue, onValueChange, className = "" }) {
  return (
    <Select name={name} defaultValue={defaultValue || categories[0]?._id} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c._id} value={c._id}>
            <CategoryIcon icon={c.icon} color={c.color} size="sm" />
            <span className="truncate">{c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
