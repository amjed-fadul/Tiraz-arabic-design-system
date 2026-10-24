import { Analytics } from "@vercel/analytics/react";

function routeTemplate(path: string) {
  const families = [
    ["/library/components/", "[component]"],
    ["/library/screens/", "[screen]"],
    ["/examples/playground/", "[component]"],
    ["/examples/", "[screen]"],
    ["/illustrations/", "[illustration]"],
  ];
  const family = families.find(
    ([prefix]) =>
      path.startsWith(prefix) && !path.slice(prefix.length).includes("/"),
  );
  return family ? family.join("") : path;
}

export function SiteAnalytics({
  path = window.location.pathname,
}: {
  path?: string;
}) {
  // Embedded demos are part of their parent page, not additional visits.
  if (!import.meta.env.PROD || window.self !== window.top) return null;

  const pathname = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const canonical = pathname === "/landing.html" ? "/" : pathname;
  // The custom router supplies changes explicitly. Giving the SDK both values
  // disables automatic tracking, so a navigation is recorded only once.
  return <Analytics route={routeTemplate(canonical)} path={canonical} />;
}
