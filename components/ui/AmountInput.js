"use client";

import { useState } from "react";

// `<input type="number">` can't render grouped digits, so the visible field is
// text (formatted en-IN as you type) and a hidden field carries the raw number
// the server action parses.
function formatIndian(raw) {
  if (!raw) return "";
  const [intPart, decPart] = raw.split(".");
  const grouped = intPart === "" ? "" : Number(intPart).toLocaleString("en-IN");
  return decPart === undefined ? grouped : `${grouped}.${decPart}`;
}

function clean(value) {
  const digitsOnly = value.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = digitsOnly.split(".");
  if (!rest.length) return intPart;
  return `${intPart}.${rest.join("").slice(0, 2)}`;
}

export default function AmountInput({ name, defaultValue, placeholder, required, className }) {
  const [raw, setRaw] = useState(defaultValue == null ? "" : String(defaultValue));

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        value={formatIndian(raw)}
        onChange={(e) => setRaw(clean(e.target.value))}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  );
}
