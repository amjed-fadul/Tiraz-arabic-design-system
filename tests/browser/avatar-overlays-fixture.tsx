import { teamMembers } from "../../src/system/ai/examples/team";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Close } from "@radix-ui/react-dialog";
import {
  Avatar,
  AvatarGroup,
  Button,
  DropdownMenu,
  EmptyState,
  GettingStartedIllustration,
  Input,
  Modal,
  NoRecordsIllustration,
  NoSearchResultsIllustration,
  Select,
  SystemProvider,
  Tooltip,
  defaultConfig,
} from "../../src/system";
import type { SystemConfig } from "../../src/system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../src/system/tokens.css";
import "../../src/system/components.css";
import { ModalExample } from "../../src/system/ai/examples/OverlayExamples";
import { EmptyStateExamples } from "../../src/system/ai/examples/EmptyStateExamples";
export function Fixture() {
  const query = new URLSearchParams(location.search);
  const language = query.get("language") === "en" ? "en" : "ar";
  const [config, setConfig] = useState<SystemConfig>({
    ...defaultConfig,
    direction: language === "ar" ? "rtl" : "ltr",
    theme: query.get("theme") === "dark" ? "dark" : "light",
    density: query.get("density") === "standard" ? "standard" : "compact",
    typography: query.get("typography") === "large" ? "large" : "standard",
    reducedMotion: query.get("motion") === "reduce",
  });
  const [source, setSource] = useState("/missing-portrait.png");
  const [result, setResult] = useState("");
  const focusRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    Object.assign(window, {
      updateTiraz: (patch: Partial<SystemConfig>) =>
        setConfig((current) => ({ ...current, ...patch })),
      tooltipRef: () => ref.current,
    });
  }, []);
  const ar = language === "ar";
  return (
    <div lang={language}>
      <SystemProvider config={config}>
        <main
          style={{
            padding: "var(--space-4)",
            maxWidth: 1000,
            margin: "auto",
            minWidth: 0,
          }}
        >
          <h1>
            {ar
              ? "الصور والنوافذ والحالات الفارغة"
              : "Avatars, overlays and empty states"}
          </h1>
          <div className="tz-preferences-actions">
            <Avatar name="Sara Ali" fallback="SA" src={source} />
            <Button
              onClick={() =>
                setSource(
                  "data:image/svg+xml," +
                    encodeURIComponent(
                      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#616b64"/></svg>',
                    ),
                )
              }
            >
              Replace image
            </Button>
            <Button onClick={() => setSource("")}>Remove image</Button>
          </div>
          <AvatarGroup
            members={teamMembers(language)}
            maxVisible={3}
            label={ar ? "فريق المشروع" : "Project team"}
            overflowLabel={(n) =>
              ar ? `${n} أعضاء إضافيون` : `${n} more members`
            }
          />
          <div style={{ width: 120 }} data-testid="tight-group">
            <AvatarGroup
              members={Array.from({ length: 10 }, (_, i) => ({
                id: String(i),
                name: `Member ${i}`,
                fallback: `M${i}`,
              }))}
              maxVisible={9}
              label="Narrow team"
              size="md"
              overflowLabel={(n) => `${n} more members`}
            />
          </div>
          <p id="external-help">Existing help</p>
          <Tooltip
            trigger={
              <button
                ref={ref}
                className="tz-button"
                aria-describedby="external-help"
                onClick={() => setResult("Details shown")}
              >
                Details
              </button>
            }
            content="Short explanation"
          />
          <output>{result}</output>
          <Modal
            trigger={<Button>Open long modal</Button>}
            title={ar ? "نافذة اختبار" : "Test modal"}
            description={
              ar
                ? "اختيار وتفاعل داخل نافذة واحدة."
                : "Choose and interact within one dialog."
            }
            closeLabel={ar ? "إغلاق الاختبار" : "Close test"}
            initialFocusRef={focusRef}
            footer={
              <Close asChild>
                <Button>Done</Button>
              </Close>
            }
          >
            <div className="tz-preferences-form">
              <Input label="Initial input" ref={focusRef} />
              <Select
                aria-label="Nested view"
                placeholder="Choose view"
                options={[
                  { value: "list", label: "List" },
                  { value: "cards", label: "Cards" },
                ]}
              />
              <DropdownMenu
                trigger={<Button>Nested actions</Button>}
                items={[
                  {
                    id: "first",
                    label: "First",
                    onSelect: () => setResult("First chosen"),
                  },
                  {
                    id: "last",
                    label: "Last",
                    onSelect: () => setResult("Last chosen"),
                  },
                ]}
              />
              <Tooltip
                content="Nested help"
                trigger={<span tabIndex={0}>Nested explanation</span>}
              />
              {Array.from({ length: 15 }, (_, i) => (
                <p key={i}>
                  {ar
                    ? "محتوى إضافي للتحقق من التمرير الداخلي واستمرار قابلية الاستخدام."
                    : "Additional content to check internal scrolling and continued usability."}{" "}
                  {i + 1}
                </p>
              ))}
            </div>
          </Modal>
          <ModalExample language={language} />
          <div className="tz-empty-examples">
            <EmptyState
              title={ar ? "لا توجد سجلات" : "No records"}
              illustration={<NoRecordsIllustration />}
            />
            <EmptyState
              title={ar ? "لا توجد نتائج" : "No results"}
              illustration={<NoSearchResultsIllustration />}
            />
            <EmptyState
              title={ar ? "البداية" : "Getting started"}
              illustration={<GettingStartedIllustration />}
            />
          </div>
          <EmptyStateExamples language={language} />
          <div style={{ position: "fixed", top: 0, right: 0 }}>
            <Tooltip
              trigger={<button className="tz-button">Edge help</button>}
              content="This short explanation stays inside the viewport."
              delayDuration={0}
            />
          </div>
        </main>
      </SystemProvider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
