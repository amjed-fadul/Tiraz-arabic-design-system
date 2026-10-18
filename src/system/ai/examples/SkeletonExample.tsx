import { useEffect, useState } from "react";
import { Avatar, Skeleton, useSystem } from "../../index";
import { saraPortrait } from "./portraits";
type Language = "ar" | "en";
function usePrefersReducedMotion() {
  const { config } = useSystem();
  return (
    config.reducedMotion ||
    (typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}
/**
 * Placeholders hold the layout while a profile loads, then the content takes
 * their place. `shape` picks the placeholder for the profile's media: a photo
 * (circle), a balance tile (rectangle) or none (text). With reduced motion the
 * placeholders simply hold still.
 */
export function SkeletonExample({
  language = "ar",
  shape = "circle",
}: {
  language?: Language;
  shape?: "text" | "rectangle" | "circle";
}) {
  const ar = language === "ar",
    reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setReady(true), 2400);
    return () => clearTimeout(timer);
  }, [reduced]);
  const loading = !ready;
  const name = ar ? "سارة علي" : "Sara Ali";
  return (
    <div className="tz-feedback-examples" style={{ maxInlineSize: 380 }}>
      <div
        aria-busy={loading}
        className="tz-feedback-placeholder"
        style={shape === "rectangle" ? { flexDirection: "column" } : undefined}
      >
        {shape === "circle" &&
          (loading ? (
            <Skeleton shape="circle" />
          ) : (
            <Avatar
              name={name}
              fallback={ar ? "س ع" : "SA"}
              src={saraPortrait}
              decorative
            />
          ))}
        {shape === "rectangle" &&
          (loading ? (
            <Skeleton shape="rectangle" />
          ) : (
            <div
              style={{
                display: "grid",
                alignContent: "center",
                inlineSize: "100%",
                blockSize: "calc(var(--control-height) * 2)",
                paddingInline: "var(--space-4)",
                borderRadius: "var(--radius)",
                background: "var(--surface-subtle)",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                {ar ? "الرصيد المستحق" : "Balance due"}
              </span>
              <strong>{ar ? "١٢٬٤٠٠ ر.س" : "SAR 12,400"}</strong>
            </div>
          ))}
        <div className="tz-feedback-lines" style={{ inlineSize: "100%" }}>
          {loading ? (
            <>
              <Skeleton style={{ inlineSize: "55%" }} />
              <Skeleton style={{ inlineSize: "35%" }} />
              <Skeleton style={{ inlineSize: "90%" }} />
            </>
          ) : (
            <>
              <strong>{name}</strong>
              <bdi dir="ltr" style={{ justifySelf: "start" }}>
                sara@madar.sa
              </bdi>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                {ar
                  ? "مديرة الحسابات في شركة مدار للتقنية."
                  : "Accounts manager at Madar Technology."}
              </p>
            </>
          )}
        </div>
      </div>
      <p role="status" className="tz-visually-hidden">
        {loading
          ? ar
            ? "جارٍ تحميل الملف الشخصي…"
            : "Loading profile…"
          : ar
            ? "تم تحميل الملف الشخصي"
            : "Profile loaded"}
      </p>
    </div>
  );
}
