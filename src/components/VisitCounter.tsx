import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { SITE_CONFIG } from "../config";

// One request per document load, including React Strict Mode remounts.
let visitRequest: Promise<number> | undefined;
function recordVisit() {
  visitRequest ??= (async () => {
    const response = await fetch(SITE_CONFIG.adminApiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "visit", requestId: crypto.randomUUID() }),
    });
    if (!response.ok) throw new Error("Visit counter unavailable.");
    const result = await response.json();
    if (!result.ok || !Number.isSafeInteger(result.visits) || result.visits < 0) throw new Error("Visit counter unavailable.");
    return result.visits as number;
  })();
  return visitRequest;
}

export default function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void recordVisit().then((value) => { if (active) setCount(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 12, color: "var(--puja-heading)" }}>
    <Eye size={16} aria-hidden="true" />
    <span>Total site visits: <strong>{count !== null ? (count * 100).toLocaleString("en-IN") : failed ? "Unavailable" : "Loading..."}</strong></span>
  </div>;
}
