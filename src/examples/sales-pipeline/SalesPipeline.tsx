import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  ChangeSummary,
  DraftReview,
  DropdownMenu,
  FilterBar,
  Select,
  Sheet,
  Tabs,
  Tray,
} from "../../system";
import type { ChangeSummaryProps, DraftReviewProps } from "../../system";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { recorded, today, useScreen } from "../frame/screen";
import { dayCount } from "../invoices/words";
import {
  deals as initialDeals,
  lastWeekNegotiation,
  owners,
  stages,
} from "./data";
import type { Deal, OwnerId, StageId } from "./data";
import {
  dealCount,
  daysInStage,
  englishInitials,
  followUpText,
  stageName,
} from "./words";
import "./sales-pipeline.css";
import { useScreenDemo } from "../frame/useScreenDemo";

type Status = DraftReviewProps["status"];
/** What the host keeps for a deal's follow-up; a deal without one is ready. */
interface Draft {
  status: Status;
  /** The text the person edited or sent; until then it is the assistant's. */
  edited?: string;
}

/** The host's region lives inside an open modal so it remains accessible. */
function TransitionAnnouncement({
  text,
  count,
}: {
  text: string;
  count: number;
}) {
  const [initialCount] = useState(count);
  return (
    <div
      className="sales-pipeline-announcement tz-visually-hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {count !== initialCount && <span key={count}>{text}</span>}
    </div>
  );
}

export function SalesPipeline() {
  return (
    <ScreenFrame slug="sales-pipeline">
      <PipelineScreen />
    </ScreenFrame>
  );
}

/** One deal's follow-up: the assistant's message, to review and send. */
function FollowUp({
  deal,
  draft,
  onBodyChange,
  onSend,
  onUnmount,
}: {
  deal: Deal;
  draft: Draft;
  onBodyChange: (body: string) => void;
  onSend: (text: string) => void;
  onUnmount: (id: string) => void;
}) {
  const { language, money } = useScreen();
  // A responsive branch or a filter can remove the Sheet without asking
  // Radix to close it. The content owns cancellation for every unmount path.
  // StrictMode replays cleanup on mount, so cancellation must not close it.
  useEffect(() => () => onUnmount(deal.id), [deal.id, onUnmount]);
  const owner = owners.find((item) => item.id === deal.owner)!.name[language];
  return (
    <DraftReview
      status={draft.status}
      record={{
        id: deal.id,
        customer: deal.customer[language],
        amount: money(deal.amount),
      }}
      recipients={[{ id: "contact", label: deal.contact[language] }]}
      body={draft.edited ?? followUpText(deal, language, owner)}
      onBodyChange={onBodyChange}
      onSend={onSend}
      headingLevel={3}
      appearance="plain"
      announcement="off"
    />
  );
}

function PipelineScreen() {
  const demo = useScreenDemo();
  const [arrived, setArrived] = useState<string | null>(null);
  const screen = useScreen();
  const { t, language, locale, number, money, date, size, endSide } = screen;
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const sending = useRef(new Map<string, AbortController>());
  const focusFrame = useRef<number | null>(null);
  const [deals, setDeals] = useState(initialDeals);
  const [owner, setOwner] = useState<OwnerId | "all">("all");
  // The stage the tabs show, when the board is too narrow for five columns.
  const [shown, setShown] = useState<StageId>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  // The screen's one polite region: moves and recording transitions, once.
  const [announcement, setAnnouncement] = useState({ text: "", count: 0 });
  const announce = (text: string) =>
    setAnnouncement(({ count }) => ({ text, count: count + 1 }));
  const cancelSend = useCallback((id: string) => {
    const request = sending.current.get(id);
    if (request) {
      sending.current.delete(id);
      request.abort();
      setDrafts((current) => ({
        ...current,
        [id]: { ...current[id], status: "ready" },
      }));
    }
  }, []);
  const closeFollowUp = useCallback(
    (id: string) => {
      cancelSend(id);
      setOpenId((current) => (current === id ? null : current));
    },
    [cancelSend],
  );
  // Whatever is still being sent when the screen goes records nothing.
  useEffect(() => {
    const requests = sending.current;
    return () => {
      requests.forEach((request) => request.abort());
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    };
  }, []);

  const ownerName = (id: OwnerId) =>
    owners.find((item) => item.id === id)!.name[language];
  const visible = deals.filter(
    (deal) => owner === "all" || deal.owner === owner,
  );
  const inStage = (id: StageId) => visible.filter((deal) => deal.stage === id);
  const total = (list: readonly Deal[]) =>
    list.reduce((sum, deal) => sum + deal.amount, 0);

  useEffect(() => {
    if (!openId) return;
    const deal = deals.find((item) => item.id === openId);
    if (
      deal &&
      (owner === "all" || deal.owner === owner) &&
      (size !== "narrow" || deal.stage === shown)
    )
      return;
    // The vanished trigger cannot receive Radix's return focus.
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      closeFollowUp(openId);
      root.current
        ?.querySelector<HTMLElement>(
          size === "narrow"
            ? '[role="tab"][data-state="active"]'
            : ".sales-pipeline-filters .tz-select-trigger",
        )
        ?.focus();
    });
  }, [openId, deals, owner, size, shown, closeFollowUp]);

  // A move updates both columns: the deal leaves its stage and heads the next
  // one, a new day in it. Then the screen says so, and puts focus where it was
  // lost: on the moved card's button when the columns show, and when one stage
  // shows at a time, on the card that took its place, else the one before it,
  // else the stage's tab.
  function move(id: string, to: StageId) {
    setArrived(id);
    const deal = deals.find((item) => item.id === id)!;
    const list = inStage(deal.stage);
    const at = list.findIndex((item) => item.id === id);
    const neighbor = list[at + 1] ?? list[at - 1];
    setDeals((current) => [
      { ...deal, stage: to, days: 0 },
      ...current.filter((item) => item.id !== id),
    ]);
    announce(
      t(
        `نُقلت صفقة ${deal.customer.ar} إلى ${stageName(to).ar}`,
        `${deal.customer.en}'s deal moved to ${stageName(to).en}`,
      ),
    );
    requestAnimationFrame(() => {
      const target =
        size !== "narrow"
          ? `[data-deal="${id}"]`
          : neighbor
            ? `[data-deal="${neighbor.id}"]`
            : '[role="tab"][data-state="active"]';
      root.current?.querySelector<HTMLElement>(target)?.focus();
    });
  }
  function edit(id: string, edited: string) {
    setDrafts((current) => ({
      ...current,
      [id]: { status: current[id]?.status ?? "ready", edited },
    }));
  }
  // Stands in for your mail server: the message goes out after a moment.
  // Closing the Sheet while it records aborts it, and the draft is ready again.
  function send(id: string, text: string) {
    sending.current.get(id)?.abort();
    const deal = deals.find((item) => item.id === id)!;
    const settle = (status: Status) =>
      setDrafts((current) => ({ ...current, [id]: { status, edited: text } }));
    settle("sending");
    const request = new AbortController();
    sending.current.set(id, request);
    announce(
      t(
        `تُرسَل رسالة متابعة ${deal.customer.ar}`,
        `Sending the follow-up for ${deal.customer.en}`,
      ),
    );
    recorded(request.signal)
      .then(() => {
        if (sending.current.get(id) !== request || request.signal.aborted)
          return;
        settle("sent");
        announce(
          t(
            `أُرسلت رسالة متابعة ${deal.customer.ar}`,
            `The follow-up for ${deal.customer.en} was sent`,
          ),
        );
      })
      .catch(() => {
        if (sending.current.get(id) === request) settle("ready");
      })
      .finally(() => {
        if (sending.current.get(id) === request) sending.current.delete(id);
      });
  }

  const card = (deal: Deal) => {
    const draft = drafts[deal.id] ?? { status: "ready" };
    const move_ = t("نقل إلى", "Move to");
    return (
      <li key={deal.id}>
        <Card
          className="sales-pipeline-card"
          data-arrived={arrived === deal.id || undefined}
          onAnimationEnd={() => {
            if (arrived === deal.id) setArrived(null);
          }}
        >
          <CardContent>
            <h3 className="sales-pipeline-deal">
              <Sheet
                open={openId === deal.id}
                onOpenChange={(open) => {
                  if (open) setOpenId(deal.id);
                  else closeFollowUp(deal.id);
                }}
                side={endSide}
                title={t(
                  `متابعة صفقة ${deal.customer.ar}`,
                  `Follow up on ${deal.customer.en}'s deal`,
                )}
                description={t(
                  "راجع رسالة المتابعة قبل إرسالها.",
                  "Review the follow-up before it is sent.",
                )}
                closeLabel={t("إغلاق المتابعة", "Close the follow-up")}
                trigger={
                  <button
                    type="button"
                    className="sales-pipeline-customer"
                    data-deal={deal.id}
                  >
                    <bdi>{deal.customer[language]}</bdi>
                  </button>
                }
              >
                <div className="sales-pipeline-sheet">
                  {openId === deal.id && (
                    <TransitionAnnouncement {...announcement} />
                  )}
                  <FollowUp
                    deal={deal}
                    draft={draft}
                    onBodyChange={(body) => edit(deal.id, body)}
                    onSend={(text) => send(deal.id, text)}
                    onUnmount={cancelSend}
                  />
                </div>
              </Sheet>
            </h3>
            <p className="sales-pipeline-amount">{money(deal.amount)}</p>
            <p className="sales-pipeline-next">{deal.next[language]}</p>
            <div className="sales-pipeline-meta">
              <Avatar
                name={ownerName(deal.owner)}
                fallback={englishInitials(ownerName(deal.owner), language)}
              />
              <span>{daysInStage(screen, deal.days)}</span>
            </div>
            <DropdownMenu
              trigger={
                <Button
                  variant="secondary"
                  className="sales-pipeline-move"
                  aria-label={`${move_} · ${deal.customer[language]}`}
                >
                  {move_}
                  <ChevronDown size={14} aria-hidden="true" />
                </Button>
              }
              items={stages
                .filter((item) => item.id !== deal.stage)
                .map((item) => ({
                  id: item.id,
                  label: item.name[language],
                  onSelect: () => move(deal.id, item.id),
                }))}
            />
          </CardContent>
        </Card>
      </li>
    );
  };

  // A stage on the tray: its name, how many deals and what they are worth, then
  // its cards.
  const lane = (stage: (typeof stages)[number]) => {
    const list = inStage(stage.id);
    const id = `${uid}-${stage.id}`;
    return (
      <section
        key={stage.id}
        className="sales-pipeline-lane"
        aria-labelledby={id}
      >
        <Tray
          paper={false}
          header={
            <div className="sales-pipeline-lane-head">
              <h2 id={id}>{stage.name[language]}</h2>
              <span className="sales-pipeline-lane-count">
                {dealCount(screen, list.length)}
              </span>
              <span className="sales-pipeline-lane-total">
                {money(total(list))}
              </span>
            </div>
          }
        >
          {list.length > 0 ? (
            <ul role="list" className="sales-pipeline-cards">
              {list.map(card)}
            </ul>
          ) : (
            <p className="sales-pipeline-empty">
              {t("لا صفقات في هذه المرحلة", "No deals in this stage")}
            </p>
          )}
        </Tray>
      </section>
    );
  };

  // What changed this week, from the deals as they were on the screen's clock:
  // it is a summary, not a live count.
  const moved = initialDeals.filter(
    (deal) => deal.stage !== "new" && deal.days <= 7,
  ).length;
  const negotiating = total(
    initialDeals.filter((deal) => deal.stage === "negotiation"),
  );
  const stalled = initialDeals.reduce((longest, deal) =>
    deal.days > longest.days ? deal : longest,
  );
  const changes: ChangeSummaryProps["rows"] = [
    {
      id: "moved",
      metric: t("صفقات انتقلت هذا الأسبوع", "Deals that moved this week"),
      change: t(
        `${dealCount(screen, moved)} من ${number(initialDeals.length)}`,
        `${number(moved)} of ${number(initialDeals.length)} deals`,
      ),
      direction: "up",
      tone: "good",
    },
    {
      id: "negotiation",
      metric: t("قيمة صفقات التفاوض", "Value in negotiation"),
      change: t(
        `ارتفعت إلى ${money(negotiating)}`,
        `Rose to ${money(negotiating)}`,
      ),
      direction:
        negotiating > lastWeekNegotiation
          ? "up"
          : negotiating < lastWeekNegotiation
            ? "down"
            : "flat",
      tone: "good",
    },
    {
      id: "stalled",
      metric: t(
        `صفقة متوقفة · ${stalled.customer.ar}`,
        `Stalled deal · ${stalled.customer.en}`,
      ),
      change: t(
        `بلا حركة منذ ${dayCount(screen, stalled.days)}`,
        `No movement in ${dayCount(screen, stalled.days)}`,
      ),
      direction: "flat",
      tone: "bad",
    },
  ];

  const month = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(today));

  return (
    <>
      <ScreenHeader
        description={`${month} · ${dealCount(screen, deals.length)} · ${money(total(deals))}`}
      />
      <div className="sales-pipeline" ref={root}>
        <FilterBar
          className="sales-pipeline-filters"
          label={t("تصفية الصفقات", "Deal filters")}
          filters={
            owner === "all"
              ? []
              : [
                  {
                    id: "owner",
                    label: ownerName(owner),
                    removeLabel: t(
                      "إزالة تصفية المسؤول",
                      "Remove owner filter",
                    ),
                    onRemove: () => setOwner("all"),
                  },
                ]
          }
          onClearAll={() => setOwner("all")}
          clearLabel={t("مسح التصفية", "Clear filters")}
        >
          <Select
            aria-label={t("المسؤول", "Owner")}
            value={owner}
            onValueChange={(value) => setOwner(value as OwnerId | "all")}
            options={[
              { value: "all", label: t("كل المسؤولين", "All owners") },
              ...owners.map((item) => ({
                value: item.id,
                label: item.name[language],
              })),
            ]}
          />
        </FilterBar>
        <ChangeSummary
          announcement="off"
          status={demo.active ? "updating" : "ready"}
          rows={changes}
          basedOn={t(
            `اعتمادًا على ${dealCount(screen, initialDeals.length)} حتى ${date(today)}`,
            `Based on ${dealCount(screen, initialDeals.length)} as of ${date(today)}`,
          )}
          headingLevel={2}
        />
        {size === "narrow" ? (
          <Tabs
            label={t("مراحل الصفقات", "Deal stages")}
            value={shown}
            onValueChange={(value) => setShown(value as StageId)}
            items={stages.map((stage) => ({
              value: stage.id,
              label: (
                <>
                  {stage.name[language]}{" "}
                  <span
                    key={inStage(stage.id).length}
                    className="sales-pipeline-tab-count"
                  >
                    {number(inStage(stage.id).length)}
                  </span>
                </>
              ),
              content: (
                <div className="sales-pipeline-panel">{lane(stage)}</div>
              ),
            }))}
          />
        ) : (
          <div
            className="sales-pipeline-scroll"
            {...(size === "medium"
              ? {
                  role: "region",
                  "aria-label": t("لوحة الصفقات", "Deals board"),
                  tabIndex: 0,
                }
              : {})}
          >
            <div className="sales-pipeline-board">{stages.map(lane)}</div>
          </div>
        )}
        {!openId && <TransitionAnnouncement {...announcement} />}
      </div>
    </>
  );
}
