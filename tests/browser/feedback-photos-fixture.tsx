import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Alert,
  Avatar,
  AvatarGroup,
  Button,
  Progress,
  Skeleton,
  Spinner,
  SystemProvider,
  defaultConfig,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import {
  saraPortrait,
  omarPortrait,
  photoMembers,
} from "../../src/system/ai/examples/portraits";
import {
  AlertExamples,
  SkeletonExamples,
} from "../../src/system/ai/examples/FeedbackExamples";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
export function Fixture() {
  const q = new URLSearchParams(location.search),
    language = q.get("language") === "en" ? "en" : "ar",
    ar = language === "ar";
  const [config, setConfig] = useState<SystemConfig>({
    ...defaultConfig,
    direction: ar ? "rtl" : "ltr",
    theme: q.get("theme") === "dark" ? "dark" : "light",
    density: q.get("density") === "standard" ? "standard" : "compact",
    typography: q.get("typography") === "large" ? "large" : "standard",
    reducedMotion: q.get("motion") === "reduce",
  });
  const [source, setSource] = useState(saraPortrait),
    [value, setValue] = useState<number | null>(64),
    [announcement, setAnnouncement] = useState<"off" | "polite" | "assertive">(
      "off",
    );
  useEffect(() => {
    Object.assign(window, {
      updateTiraz: (patch: Partial<SystemConfig>) =>
        setConfig((c) => ({ ...c, ...patch })),
      setProgress: setValue,
      setAnnouncement,
    });
    document.documentElement.lang = language;
  }, [language]);
  return (
    <div lang={language}>
      <SystemProvider config={config}>
        <main
          style={{
            padding: "var(--space-4)",
            maxWidth: 760,
            margin: "auto",
            display: "grid",
            gap: "var(--space-4)",
          }}
        >
          <h1>
            {ar ? "الرسائل والتحميل والصور" : "Feedback, loading and portraits"}
          </h1>
          <section aria-label="Photos">
            <h2>{ar ? "الصور الشخصية" : "Avatar photos"}</h2>
            <div className="tz-preferences-actions">
              <Avatar
                name={ar ? "سارة علي" : "Sara Ali"}
                fallback={ar ? "س ع" : "SA"}
                src={source}
              />
              <Button
                variant="secondary"
                onClick={() => setSource(omarPortrait)}
              >
                {ar ? "استبدال الصورة" : "Replace image"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSource("/missing-feedback-portrait.jpg")}
              >
                {ar ? "صورة غير متاحة" : "Fail image"}
              </Button>
              <Button variant="secondary" onClick={() => setSource("")}>
                {ar ? "إزالة الصورة" : "Remove image"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSource(saraPortrait)}
              >
                {ar ? "استعادة الصورة" : "Restore image"}
              </Button>
            </div>
            <AvatarGroup
              members={photoMembers(language)}
              label={ar ? "فريق المشروع" : "Project team"}
              maxVisible={3}
              overflowLabel={(n) =>
                ar ? `${n} أعضاء إضافيون` : `${n} more members`
              }
            />
          </section>
          <section aria-label="Alerts">
            <h2>Alert</h2>
            {/* Scopes the announcement checks: the composed AlertExamples
                include a polite Alert of their own. */}
            <div role="group" aria-label="Static alert">
              <Alert
                title={ar ? "المعاينة جاهزة" : "Preview ready"}
                description={
                  ar
                    ? "رسالة ثابتة داخل المحتوى."
                    : "Persistent inline feedback."
                }
                announcement={announcement}
              />
            </div>
            <AlertExamples language={language} />
          </section>
          <section aria-label="Skeletons">
            <h2>Skeleton</h2>
            <SkeletonExamples language={language} />
            <Skeleton
              shape="circle"
              style={{ inlineSize: 48, blockSize: 48 }}
            />
          </section>
          <section aria-label="Progress">
            <h2>Progress</h2>
            <Progress
              label={ar ? "تجهيز التقرير" : "Preparing report"}
              value={value}
              showValue
              locale={language}
            />
            <Progress label={ar ? "بانتظار الحجم" : "Waiting for size"} />
          </section>
          <section aria-label="Spinners">
            <h2>Spinner</h2>
            <Spinner label={ar ? "جارٍ التحميل" : "Loading"} />
            <p role="status" className="tz-preferences-actions">
              <Spinner decorative />
              {ar ? "جارٍ تجهيز المحتوى" : "Preparing content"}
            </p>
          </section>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
