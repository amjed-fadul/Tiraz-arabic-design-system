import { Analytics } from "@vercel/analytics/react";

export function SiteAnalytics() {
  // Embedded demos are part of their parent page, not additional visits.
  if (!import.meta.env.PROD || window.self !== window.top) return null;

  return <Analytics />;
}
