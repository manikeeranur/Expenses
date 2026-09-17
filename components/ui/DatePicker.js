"use client";

import { useState, useRef } from "react";
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

const CALENDAR_WIDTH = 300;
const CALENDAR_HEIGHT = 320;

export default function DatePicker({ name, defaultValue, value, onChange, required, bare = false, className = "" }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ? toDate(defaultValue) : null);
  const current = isControlled ? toDate(value) : internal;
  const wrapperRef = useRef(null);

  function handleChange(date) {
    if (!isControlled) setInternal(date);
    onChange?.(toISODate(date));
  }

  // Portaling the calendar to <body> (so it can't be clipped by a modal's
  // overflow) drops it into normal document flow with no positioning of its
  // own, so we pin it with fixed coords computed from the trigger's own
  // position as soon as it mounts.
  function positionCalendar() {
    requestAnimationFrame(() => {
      const wrapper = wrapperRef.current;
      const cal = document.querySelector(".react-date-picker__calendar--open");
      if (!wrapper || !cal) return;
      const rect = wrapper.getBoundingClientRect();
      const openUpward = window.innerHeight - rect.bottom < CALENDAR_HEIGHT + 16;
      cal.style.position = "fixed";
      cal.style.top = openUpward ? `${Math.max(8, rect.top - CALENDAR_HEIGHT - 4)}px` : `${rect.bottom + 4}px`;
      cal.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - CALENDAR_WIDTH - 8))}px`;
    });
  }

  return (
    <div className={className} ref={wrapperRef}>
      <RDatePicker
        onChange={handleChange}
        value={current}
        format="dd-MMM-y"
        clearIcon={null}
        calendarIcon={<CalendarDays size={15} />}
        className={bare ? "app-date-picker app-date-picker--bare" : "app-date-picker"}
        calendarProps={{ className: "app-date-picker-calendar" }}
        portalContainer={typeof document !== "undefined" ? document.body : undefined}
        onCalendarOpen={positionCalendar}
      />
      {name ? <input type="hidden" name={name} value={toISODate(current)} required={required} /> : null}
    </div>
  );
}
