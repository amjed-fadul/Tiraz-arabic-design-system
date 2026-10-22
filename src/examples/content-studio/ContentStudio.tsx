import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Image,
  Layers,
  Palette,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  ColorPicker,
  ImageGeneration,
  RadioGroup,
  SuggestedEdits,
  TagInput,
  Textarea,
} from "../../system";
import type {
  DiffSegment,
  ImageGenerationProps,
  SuggestedEditsProps,
} from "../../system";
import { story } from "../../system/ai/examples/finance-story";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { useScreenDemo } from "../frame/useScreenDemo";
import { useScreenAgentPresentation } from "../frame/useScreenAgentPresentation";
import { recorded, useScreen } from "../frame/screen";
import {
  actions,
  brief as opening,
  caption as openingCaption,
  pictures,
  seconds,
  shapes,
  versions,
} from "./data";
import type { ShapeId } from "./data";
import "./content-studio.css";

type Decisions = Record<string, "accepted" | "rejected">;
/** What a generation was made from. null: the brief's own words, in the page's language. */
interface Made {
  prompt: string | null;
  tags: string[] | null;
  color: string;
  shape: ShapeId;
}
interface Job {
  status: ImageGenerationProps["status"];
  progress: number;
}

// The host's moments: a request waits a beat, then the weave climbs 20 points
// every 300 ms, and the images are reported a beat after it reaches 100.
const queuedMs = 600;
const tickMs = 300;
const stepBy = 20;
/** How long the assistant takes to answer a request for a better caption. */
const answerMs = 1400;

/** The caption's own state, which lives while its image is the campaign's. */
function Caption({
  text,
  label,
  onText,
  onNotice,
}: {
  text: string;
  label: string;
  onText: (next: string) => void;
  onNotice: (message: string) => void;
}) {
  const { t, language } = useScreen();
  const [status, setStatus] = useState<SuggestedEditsProps["status"]>("idle");
  const agentPresentation = useScreenAgentPresentation(
    "campaigns",
    status === "rewriting"
      ? "working"
      : status === "reviewing"
        ? "waiting"
        : status === "applied"
          ? "done"
          : "idle",
  );
  const [request, setRequest] = useState<{
    action: string;
    start: number;
    end: number;
    segments: DiffSegment[];
  } | null>(null);
  const [decisions, setDecisions] = useState<Decisions>({});
  // The text before the last Apply, which Undo brings back.
  const [previous, setPrevious] = useState<string | null>(null);
  const answer = useRef<AbortController | null>(null);
  useEffect(() => () => answer.current?.abort(), []);

  // A real host sends the text and the action to its model. This one tightens
  // the phrases it knows wherever they appear in the selected text.
  function suggest(action: (typeof actions)[number], selected: string) {
    const segments: DiffSegment[] = [];
    let rest = selected,
      count = 0;
    for (const [from, to] of action.rewrites[language]) {
      const at = rest.indexOf(from);
      if (at < 0) continue;
      count += 1;
      if (at > 0)
        segments.push({
          id: `same-${count}`,
          kind: "same",
          text: rest.slice(0, at),
        });
      segments.push({ id: `c${count}`, kind: "delete", text: from });
      segments.push({ id: `c${count}-new`, kind: "insert", text: to });
      rest = rest.slice(at + from.length);
    }
    if (rest) segments.push({ id: "same-end", kind: "same", text: rest });
    return segments;
  }
  const current = request && actions.find((item) => item.id === request.action);

  return (
    <Card className="content-studio-caption">
      <CardHeader>
        <h2 className="content-studio-heading">
          {t("النص المرافق", "Campaign caption")}
        </h2>
        <p className="content-studio-chosen">
          <Check size={14} aria-hidden="true" />
          {label}
        </p>
        <CardDescription>
          {t("حدّد النص لتحسينه.", "Select the text to polish it.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SuggestedEdits
          agentPresentation={agentPresentation}
          announcement="off"
          status={status}
          actions={actions.map((item) => ({
            id: item.id,
            label: item.label[language],
          }))}
          onAction={(id, picked) => {
            const action = actions.find((item) => item.id === id)!;
            setRequest({
              action: id,
              start: picked.start,
              end: picked.end,
              segments: suggest(action, text.slice(picked.start, picked.end)),
            });
            setDecisions({});
            setStatus("rewriting");
            answer.current?.abort();
            const controller = new AbortController();
            answer.current = controller;
            onNotice(
              t("يجري تحسين النص المرافق.", "Polishing the campaign caption."),
            );
            void recorded(controller.signal, answerMs).then(
              () => {
                if (controller.signal.aborted) return;
                setStatus("reviewing");
                onNotice(
                  t(
                    "اقتراح النص جاهز للمراجعة.",
                    "The caption suggestion is ready to review.",
                  ),
                );
              },
              () => {},
            );
          }}
          suggestion={
            request && current
              ? { title: current.title[language], segments: request.segments }
              : undefined
          }
          selection={
            request ? { start: request.start, end: request.end } : undefined
          }
          decisions={decisions}
          onDecisionsChange={setDecisions}
          onApply={(next, at) => {
            setPrevious(text);
            onText(text.slice(0, at.start) + next + text.slice(at.end));
            setStatus("applied");
            onNotice(
              t("حُدّث النص المرافق.", "The campaign caption was updated."),
            );
          }}
          onUndo={
            previous === null
              ? undefined
              : () => {
                  onText(previous);
                  setPrevious(null);
                  setStatus("idle");
                  onNotice(
                    t(
                      "أُعيد النص المرافق السابق.",
                      "The previous campaign caption was restored.",
                    ),
                  );
                }
          }
          onDismiss={() => {
            answer.current?.abort();
            setStatus("idle");
            if (status === "rewriting" || status === "reviewing")
              onNotice(
                t(
                  "أُغلق الاقتراح دون تطبيقه.",
                  "The suggestion was dismissed without applying it.",
                ),
              );
          }}
          labels={{ region: t("النص المرافق", "Campaign caption") }}
        >
          <p>{text}</p>
        </SuggestedEdits>
      </CardContent>
    </Card>
  );
}

function Studio() {
  const { t, language, size, number } = useScreen();
  const demo = useScreenDemo();
  const wide = size === "wide";
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The brief as the person edits it. null: untouched, so it follows the page's
  // language.
  const [prompt, setPrompt] = useState<string | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [color, setColor] = useState<string>(opening.color);
  const [shape, setShape] = useState<ShapeId>(opening.shape);
  // The brief the pictures on the canvas were made from, and where the job is.
  const [made, setMade] = useState<Made>({
    prompt: null,
    tags: null,
    color: opening.color,
    shape: opening.shape,
  });
  const [job, setJob] = useState<Job>({ status: "completed", progress: 100 });
  const [version, setVersion] = useState("v1");
  // The version chosen for the campaign, and the caption that follows it.
  const [used, setUsed] = useState<string | null>(null);
  const [edited, setEdited] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");

  // Manual requests advance separately from the opening presentation.
  useEffect(() => {
    if (job.status === "completed") return;
    const timer = setTimeout(
      () => {
        const next: Job =
          job.status === "queued"
            ? { status: "weaving", progress: 0 }
            : job.progress < 100
              ? { status: "weaving", progress: job.progress + stepBy }
              : { status: "completed", progress: 100 };
        setJob(next);
        if (next.status !== job.status)
          setAnnouncement(
            next.status === "weaving"
              ? t("بدأ توليد الصور.", "Image generation started.")
              : t("الصور جاهزة للاختيار.", "The images are ready to choose."),
          );
      },
      job.status === "queued" ? queuedMs : tickMs,
    );
    return () => clearTimeout(timer);
  }, [job, t]);
  const busy = job.status !== "completed";
  const shownStatus = demo.active
    ? demo.phase === "working"
      ? "weaving"
      : "queued"
    : job.status;
  const shownProgress = demo.active
    ? Math.round(demo.progress * 100)
    : job.progress;
  const introducing = demo.phase === "typing" || demo.phase === "sending";
  const agentPresentation = useScreenAgentPresentation(
    "campaigns",
    introducing
      ? "idle"
      : shownStatus === "queued"
        ? "thinking"
        : shownStatus === "weaving"
          ? "working"
          : used
            ? "done"
            : "waiting",
  );

  function generate() {
    if (busy) return;
    setMade({ prompt, tags, color, shape });
    setJob({ status: "queued", progress: 0 });
    setAnnouncement(
      t("أُضيف طلب توليد الصور إلى الانتظار.", "Image generation was queued."),
    );
    // A new set of versions is a new choice; the caption keeps its words.
    setVersion("v1");
    setUsed(null);
  }

  const form = shapes.find((item) => item.id === made.shape)!;
  const pics = useMemo(
    () => pictures(made.color, made.shape),
    [made.color, made.shape],
  );
  const images: ImageGenerationProps["images"] = versions.map(
    (item, index) => ({
      id: item.id,
      src: pics[index],
      alt: item.alt[language],
      width: form.size[0],
      height: form.size[1],
    }),
  );
  const madeTags = made.tags ?? opening.tags.map((tag) => tag[language]);
  const options = [
    {
      id: "size",
      label: `${form.name[language]} · ${number(form.ratio[0])}:${number(form.ratio[1])}`,
    },
    ...madeTags.map((tag) => ({ id: `tag-${tag}`, label: tag })),
    {
      id: "color",
      label: (
        <span className="content-studio-color">
          <span
            className="content-studio-swatch"
            style={{ background: made.color }}
            aria-hidden="true"
          />
          <bdi dir="ltr">{made.color}</bdi>
        </span>
      ),
    },
    { id: "count", label: t(`${number(4)} صور`, `${number(4)} images`) },
  ];

  const chosenLabel = (id: string) =>
    t(
      `مختارة للحملة · النسخة ${number(versions.findIndex((item) => item.id === id) + 1)}`,
      `Chosen for the campaign · Version ${number(versions.findIndex((item) => item.id === id) + 1)}`,
    );
  const chosen = used ? chosenLabel(used) : "";

  const main = (
    <div key="main" className="content-studio-main">
      <ImageGeneration
        agentPresentation={agentPresentation}
        announcement="off"
        headingLevel={2}
        prompt={made.prompt ?? opening.prompt.en}
        options={options}
        status={shownStatus}
        progress={shownStatus === "weaving" ? shownProgress : null}
        images={images}
        selected={version}
        onSelectedChange={setVersion}
        onUse={(id) => {
          setUsed(id);
          if (id !== used) setAnnouncement(chosenLabel(id));
        }}
        // The pencil takes the person to the brief, the only input.
        onEditPrompt={() => panel.current?.querySelector("textarea")?.focus()}
        agent={story.agents.campaigns[language]}
        duration={shownStatus === "completed" ? seconds : undefined}
      />

      {used && (
        <Caption
          key={language}
          text={edited ?? openingCaption[language]}
          label={chosen}
          onText={setEdited}
          onNotice={setAnnouncement}
        />
      )}
    </div>
  );
  const brief = (
    <div
      key="brief"
      ref={panel}
      className="content-studio-panel"
      data-demo-composer
    >
      <Card className="content-studio-brief-card">
        <CardHeader className="content-studio-brief-header">
          <span className="content-studio-brief-mark" aria-hidden="true">
            <Palette size={18} />
          </span>
          <div>
            <h2 className="content-studio-heading">{t("الموجز", "Brief")}</h2>
            <CardDescription>
              {t(
                "امنح فكرتك اتجاهًا بصريًا.",
                "Give your idea a visual direction.",
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="content-studio-brief">
          <Textarea
            label={t("وصف الصورة", "Describe the image")}
            dir="auto"
            rows={4}
            value={
              introducing
                ? demo.draft(opening.prompt.en)
                : (prompt ?? opening.prompt.en)
            }
            onChange={(event) => setPrompt(event.target.value)}
          />
          <details
            className="content-studio-settings"
            open={size !== "narrow" || settingsOpen}
            onToggle={(event) => {
              if (size === "narrow") setSettingsOpen(event.currentTarget.open);
            }}
          >
            <summary>
              {t("الأسلوب واللون والمقاس", "Style, color & size")}
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="content-studio-settings-fields">
              <TagInput
                announcement="off"
                label={t("وسوم الأسلوب", "Style tags")}
                helper={t(
                  "اضغط Enter لإضافة وسم.",
                  "Press Enter to add a tag.",
                )}
                placeholder={t("أضف وسمًا…", "Add a tag…")}
                maxTags={5}
                value={tags ?? opening.tags.map((tag) => tag[language])}
                onValueChange={setTags}
              />
              <ColorPicker
                announcement="off"
                label={t("لون الحملة", "Campaign color")}
                value={color}
                onValueChange={setColor}
              />
              <RadioGroup
                label={t("المقاس", "Size")}
                name="size"
                options={shapes.map((item) => ({
                  value: item.id,
                  label: item.name[language],
                }))}
                value={shape}
                onValueChange={(next) => setShape(next as ShapeId)}
              />
            </div>
          </details>
          <Button
            className="content-studio-generate"
            data-demo-submit
            state={busy ? "loading" : "idle"}
            onClick={generate}
          >
            <Sparkles size={16} aria-hidden="true" />
            {t(
              `ولّد ${number(4)} صور · نحو ${number(seconds)} ثانية`,
              `Generate ${number(4)} images · about ${number(seconds)} seconds`,
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <ScreenHeader />
      <section
        className="content-studio-campaign"
        aria-label={t("الحملة الحالية", "Current campaign")}
      >
        <div className="content-studio-campaign-identity">
          <span className="content-studio-campaign-mark" aria-hidden="true">
            <Image size={22} />
          </span>
          <div>
            <p className="content-studio-eyebrow">
              {t("حملة اجتماعية", "Social campaign")}
            </p>
            <h2>
              {t(
                "تذكير لطيف، أثر جميل",
                "A little reminder, thoughtfully made",
              )}
            </h2>
          </div>
        </div>
        <div className="content-studio-campaign-meta">
          <span>
            <Layers size={15} aria-hidden="true" />
            {t(`${number(4)} اتجاهات بصرية`, `${number(4)} visual directions`)}
          </span>
          <Badge tone={used ? "success" : "neutral"}>
            {used ? t("صورة مختارة", "Image selected") : t("مسودة", "Draft")}
          </Badge>
        </div>
      </section>
      <span
        className="tz-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </span>
      {/* The brief sits beside the canvas from 960px, and above it below. */}
      <div className="content-studio-layout">
        {wide ? (
          <>
            {main}
            {brief}
          </>
        ) : (
          <>
            {brief}
            {main}
          </>
        )}
      </div>
    </>
  );
}

export function ContentStudio() {
  return (
    <ScreenFrame slug="content-studio">
      <div className="content-studio">
        <Studio />
      </div>
    </ScreenFrame>
  );
}
