"use client";
import { useState, type ReactNode } from "react";

/** Keep native pre-hydration toggles from changing the server-rendered markup. */
export function StudyTools({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="records-study-tools">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
        }}
      >
        見本の操作を開閉
      </button>
      {open && children}
    </div>
  );
}
