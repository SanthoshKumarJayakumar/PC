import { useEffect } from "react";

export function Seo({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} — Kaelon` : "Kaelon";
    const m = document.querySelector('meta[name="description"]');
    if (m && description) m.setAttribute("content", description);
  }, [title, description]);
  return null;
}
