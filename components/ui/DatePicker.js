"use client";

import { useState } from "react";
import RDatePicker from "react-date-picker";
import { CalendarDays } from "lucide-react";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "@/components/ui/date-picker.css";

function toISODate(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDate(iso) {
  return iso ? new Date(`${iso}T00:00:00`) : null;
}

export default function DatePicker({ name, defaultValue, value, onChange, required, bare = false, className = "" }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ? toDate(defaultValue) : null);
  const current = isControlled ? toDate(value) : internal;

  function handleChange(date) {
    if (!isControlled) setInternal(date);
    onChange?.(toISODate(date));
  }

  return (
    <div className={className}>
      <RDatePicker
        onChange={handleChange}
        value={current}
        format="dd-MMM-y"
        clearIcon={null}
        calendarIcon={<CalendarDays size={15} />}
        className={bare ? "app-date-picker app-date-picker--bare" : "app-date-picker"}
        calendarProps={{ className: "app-date-picker-calendar" }}
      />
      {name ? <input type="hidden" name={name} value={toISODate(current)} required={required} /> : null}
    </div>
  );
}
