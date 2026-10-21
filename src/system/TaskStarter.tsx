import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popper from "@radix-ui/react-popper";
import { AtSign, Check, ChevronDown, Mic, Paperclip } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { numberLocale } from "./config";
import type { ContextMeterProps } from "./ContextMeter";
import { contextStatus } from "./context-status";
import type { ContextStatusKey } from "./context-status";
import { formatCount } from "./format";
import type { ModelOption } from "./ModelSelector";
import { PromptEntry } from "./PromptEntry";
import { PromptSuggestions } from "./PromptBar";
import { RemoveButton } from "./RemoveButton";
import { StatusPill } from "./StatusPill";
import type { StatusPillState } from "./StatusPill";
import { Tray } from "./Tray";
import { taskStarterCopy } from "./task-starter-copy";
import { useGlide } from "./useGlide";
import { useSystem } from "./useSystem";

/** A record attached to the request, or offered by the @ picker. */
export interface ContextItem {
  id: string;
  label: string;
  /** What kind of record it is, beside its name in the picker: «عميل», «فاتورة». */
  kind?: string;
  icon?: ReactNode;
}
export interface ModeOption {
  id: string;
  label: string;
  description?: string;
}
/** Every built-in string Start a task shows; `labels` overrides any of them. */
export interface TaskStarterLabels {
  /** The question above the entry, unless the host gives its own `title`. */
  title: string;
  /** The text area's name, its placeholder and the tool buttons' names. */
  field: string;
  placeholder: string;
  attach: string;
  /** The @ button, and the picker's name. */
  mention: string;
  voice: string;
  send: string;
  failure: string;
  removeContext: (name: string) => string;
  /** The polite region's two sentences, when the host's context gains or loses a record. */
  contextAdded: (name: string) => string;
  contextRemoved: (name: string) => string;
  /** The region's sentence when the ring's status word changes: «السياق: يقترب من الامتلاء». */
  contextStatus: (status: string) => string;
  /** The mode button's name, the models' section and their unavailable word. */
  mode: string;
  model: string;
  unavailable: string;
  /** «السياق المستخدم ٣٢٪», and what agrees with the count of attached records. */
  used: (percent: string) => string;
  attached: (count: number, records: string) => string;
  suggestions: string;
  recent: string;
  /** The status word of a recent task; it agrees with المهمة. */
  recentStates: Record<StatusPillState, string>;
}
export interface TaskStarterProps {
  value: string;
  onValueChange: (value: string) => void;
  /** As the entry beneath: a rejected promise keeps the draft and shows the error. */
  onSubmit: (value: string, context: ContextItem[]) => void | Promise<void>;
  context?: readonly ContextItem[];
  onRemoveContext?: (id: string) => void;
  onAttach?: () => void;
  onVoice?: () => void;
  /** The records "@" offers, filtered by what follows it. */
  mentionOptions?: readonly ContextItem[];
  /** Called with the chosen record's id; the host adds it to `context`. */
  onAddContext?: (id: string) => void;
  /** Used when `mentionOptions` is absent: the host opens its own picker. */
  onMention?: (query: string) => void;
  modes?: readonly ModeOption[];
  mode?: string;
  onModeChange?: (id: string) => void;
  /** Explicit models, as a second radio section of the mode menu. */
  models?: readonly ModelOption[];
  model?: string;
  onModelChange?: (id: string) => void;
  /** The ring beside the mode, and the usage line in its menu. */
  contextUsage?: ContextMeterProps;
  suggestions?: readonly {
    id: string;
    label: string;
    prompt?: string;
    icon?: ReactNode;
  }[];
  /** Called with the chosen suggestion's id; the host fills the draft or sends. */
  onSuggestion?: (id: string) => void;
  recent?: readonly {
    id: string;
    title: string;
    status: StatusPillState;
    time: ReactNode;
  }[];
  onOpenRecent?: (id: string) => void;
  /** The small line above the question. */
  greeting?: ReactNode;
  /** The question; «ماذا نُنجز اليوم؟» by default. */
  title?: ReactNode;
  disabled?: boolean;
  /** Why the assistant cannot take a request, as a line under the entry. */
  disabledReason?: ReactNode;
  /** Controls the mode menu; pair `modeMenuOpen` with `onModeMenuOpenChange`. */
  modeMenuOpen?: boolean;
  onModeMenuOpenChange?: (open: boolean) => void;
  /** The question's level; the recent list's is one lower. 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<TaskStarterLabels>;
  /** Speak context changes and submission errors, or leave them to the host. */
  announcement?: "polite" | "off";
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

// The "@word" that ends at the caret: "@" starts the text or follows a space,
// and a space ends the word.
type Mention = { start: number; end: number; query: string };
function mentionAt(text: string, caret: number): Mention | null {
  const before = text.slice(0, caret),
    start = before.lastIndexOf("@");
  if (start < 0 || (start > 0 && !/\s/.test(before[start - 1]))) return null;
  const query = before.slice(start + 1);
  return /\s/.test(query) ? null : { start, end: caret, query };
}
// Names match as Arabic is typed: without marks or tatweel (NFKD also folds
// أ, إ and آ to ا), with ة as ه and ى as ي, and Latin in any case.
const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\p{M}\u0640]/gu, "")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
// An icon button on the entry's row of tools.
function ToolButton({
  label,
  disabled,
  onMouseDown,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onMouseDown?: (event: MouseEvent) => void;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label={label}
      disabled={disabled}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
const none: readonly ContextItem[] = [];

/**
 * Start a task (spec section 12.1): a request from the page you are on, with
 * the right records attached. The host owns the draft, the context and the
 * mode; the pattern is a prompt entry with chips for the records, an @ picker,
 * a mode menu that also shows how much of the context is used, suggestions
 * and recent tasks. The picker is a combobox on the text area, which keeps
 * focus; an input method's keys never choose, move or send.
 */
export function TaskStarter({
  value,
  onValueChange,
  onSubmit,
  context = none,
  onRemoveContext,
  onAttach,
  onVoice,
  mentionOptions,
  onAddContext,
  onMention,
  modes,
  mode,
  onModeChange,
  models,
  model,
  onModelChange,
  contextUsage,
  suggestions,
  onSuggestion,
  recent,
  onOpenRecent,
  greeting,
  title,
  disabled = false,
  disabledReason,
  modeMenuOpen,
  onModeMenuOpenChange,
  headingLevel = 3,
  labels,
  announcement = "polite",
  appearance = "card",
}: TaskStarterProps) {
  const { config, container } = useSystem(),
    uid = useId(),
    glide = useGlide();
  const copy: TaskStarterLabels = {
    ...taskStarterCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    live = useRef<HTMLSpanElement>(null),
    paper = useRef<HTMLDivElement>(null),
    field = useRef<HTMLTextAreaElement>(null),
    list = useRef<HTMLDivElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    composing = useRef(false),
    caret = useRef<number | null>(null),
    known = useRef(context),
    heard = useRef<ContextStatusKey | null>(null);
  const [submitting, setSubmitting] = useState(false),
    [token, setToken] = useState<Mention | null>(null),
    [active, setActive] = useState(0),
    [closed, setClosed] = useState(false),
    [localMenu, setLocalMenu] = useState(false);
  const Heading = `h${headingLevel}` as const,
    below = Math.min(headingLevel + 1, 6) as 2 | 3 | 4 | 5 | 6,
    RecentHeading = `h${below}` as const;

  // The "@word" at the caret, while the text still holds it. With records to
  // offer, the matches are the ones not yet attached whose names hold the word.
  const mentions = mentionOptions !== undefined;
  const mention =
    token && value.slice(token.start, token.end) === `@${token.query}`
      ? token
      : null;
  const matches =
    mentions && mention
      ? mentionOptions.filter(
          (option) =>
            !context.some((item) => item.id === option.id) &&
            fold(option.label).includes(fold(mention.query)),
        )
      : [];
  const open = matches.length > 0 && !closed && !disabled && !submitting;
  const index = Math.min(active, Math.max(0, matches.length - 1));
  const listId = `${uid}-mentions`,
    optionId = (position: number) => `${listId}-${position}`;

  // Context usage: the ring's fill, its tone and status word, as the context
  // meter reads them, and the line in the mode menu.
  const {
    ratio,
    tone,
    key: statusKey,
    status,
  } = contextStatus(contextUsage ?? {}, config.direction === "rtl");
  // The percent sign comes without the direction marks Intl adds around it.
  const percent =
    ratio === null
      ? ""
      : new Intl.NumberFormat(numberLocale(config), {
          style: "percent",
          maximumFractionDigits: 0,
        })
          .format(ratio)
          .replace(/\p{Cf}/gu, "");
  const attached = copy.attached(
    context.length,
    formatCount(context.length, "record", config),
  );

  // One polite region, for the one change the person makes without leaving the
  // text area: a record joining or leaving the context. It speaks changes of
  // the host's list, never the list it mounts with, and a reset of several
  // records at once (a sent request clears them) is not a change to announce.
  useEffect(() => {
    const before = known.current;
    known.current = context;
    if (announcement === "off" || before === context || !live.current) return;
    const added = context.filter(
        (item) => !before.some((b) => b.id === item.id),
      ),
      removed = before.filter((b) => !context.some((item) => item.id === b.id));
    if (added.length === 1 && removed.length === 0)
      live.current.textContent = copy.contextAdded(added[0].label);
    else if (removed.length === 1 && added.length === 0)
      live.current.textContent = copy.contextRemoved(removed[0].label);
    // A reset says nothing, and empties the sentence so the next one is heard.
    else if (added.length || removed.length) live.current.textContent = "";
  });
  // The same region says each crossing of the ring's thresholds once, never
  // the status the pattern mounts with and never a number.
  useEffect(() => {
    const was = heard.current;
    heard.current = statusKey;
    if (
      announcement === "off" ||
      was === null ||
      was === statusKey ||
      !status ||
      !live.current
    )
      return;
    live.current.textContent = copy.contextStatus(status);
  });
  useLayoutEffect(() => {
    // A chosen record takes its "@word" with it; the caret goes where it was.
    const place = caret.current;
    caret.current = null;
    if (place !== null) field.current?.setSelectionRange(place, place);
    // When a change removes the focused control (a chip's remove button), focus
    // moves to the pattern rather than dropping to the page.
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node || element.isConnected) return;
    lastFocus.current = null;
    const focused = node.ownerDocument.activeElement;
    if (!focused || focused === node.ownerDocument.body) node.focus();
  });
  useEffect(() => {
    if (open)
      list.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: "nearest" });
  }, [open, index]);
  // While the picker is open, Escape closes it and goes no further: a window
  // capture, as Tooltip's, so a dialog around the pattern does not take it.
  useEffect(() => {
    const view = field.current?.ownerDocument.defaultView;
    if (!open || !view) return;
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || composing.current) return;
      if (event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      event.stopPropagation();
      setClosed(true);
    }
    view.addEventListener("keydown", escape, true);
    return () => view.removeEventListener("keydown", escape, true);
  }, [open]);

  // Reads the text area as it is: the word at the caret, or none. Text that is
  // still being composed never opens the picker, but one that is open keeps
  // filtering as the word is composed, as keyboards that compose every word
  // need; it opens on what was written once the composition ends.
  function track() {
    const node = field.current;
    if (!node || (composing.current && !open) || !(mentions || onMention))
      return;
    const found = mentionAt(
      node.value,
      node.selectionStart ?? node.value.length,
    );
    if (found?.start === token?.start && found?.query === token?.query) return;
    // A closed picker opens again with the next change to the word.
    setToken(found);
    setActive(0);
    setClosed(false);
    if (found && !mentions) onMention?.(found.query);
  }
  function choose(option: ContextItem) {
    if (!mention) return;
    const before = value.slice(0, mention.start),
      after = value.slice(mention.end);
    // One of the two spaces goes with the word when it sat between them.
    caret.current = before.length;
    setToken(null);
    setClosed(false);
    onAddContext?.(option.id);
    onValueChange(
      /\s$/.test(before) && /^\s/.test(after)
        ? before + after.slice(1)
        : before + after,
    );
  }
  function insertMention() {
    const node = field.current;
    if (!node || disabled) return;
    if (!mentions) return onMention?.("");
    // Where the caret is, or the end when the text area has not been used.
    const here = node.ownerDocument.activeElement === node;
    const at = here ? (node.selectionStart ?? 0) : value.length,
      to = here ? (node.selectionEnd ?? at) : at;
    const start = at + (at > 0 && !/\s/.test(value[at - 1]) ? 1 : 0);
    caret.current = start + 1;
    setToken({ start, end: start + 1, query: "" });
    setActive(0);
    setClosed(false);
    onValueChange(
      `${value.slice(0, at)}${start > at ? " " : ""}@${value.slice(to)}`,
    );
    node.focus();
  }
  function keys(event: KeyboardEvent<HTMLTextAreaElement>) {
    // An input method's keys pick words: they never move, choose or send.
    if (
      composing.current ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229
    )
      return;
    // A held Enter acts once: it never sends what the first press chose.
    if (event.key === "Enter" && event.repeat && !event.shiftKey)
      return event.preventDefault();
    if (!open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : matches.length - 1;
      setActive((index + step) % matches.length);
    } else if (event.key === "Enter" && !event.shiftKey) {
      // Enter chooses; the entry sees it handled and sends nothing.
      event.preventDefault();
      choose(matches[index]);
    }
  }
  async function send(text: string) {
    setSubmitting(true);
    try {
      await onSubmit(text, [...context]);
    } finally {
      setSubmitting(false);
    }
  }
  const keepFocus = (event: MouseEvent) => {
    if (event.currentTarget.ownerDocument.activeElement === field.current)
      event.preventDefault();
  };
  // Animation can move an unfocused item away from a stationary pointer; its
  // leave must not clear the keyboard's place (as DropdownMenu does).
  const keepHighlight = (event: PointerEvent<HTMLElement>) => {
    if (event.currentTarget !== event.currentTarget.ownerDocument.activeElement)
      event.preventDefault();
  };

  // The mode button: the ring of context used, the mode's name, a chevron.
  const mode_ = modes?.find((item) => item.id === mode),
    model_ = models?.find((item) => item.id === model);
  const menu = !!(modes?.length || models?.length) && (
    <DropdownMenu.Root
      modal={false}
      dir={config.direction}
      open={modeMenuOpen ?? localMenu}
      onOpenChange={(next) => {
        setLocalMenu(next);
        onModeMenuOpenChange?.(next);
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="tz-context-trigger tz-task-starter-mode"
          data-tone={tone}
          disabled={disabled || submitting}
          aria-label={
            mode_ || model_
              ? `${copy.mode}: ${mode_?.label ?? model_?.name}`
              : copy.mode
          }
          aria-describedby={ratio === null ? undefined : `${uid}-used`}
        >
          {ratio !== null && (
            <svg
              className="tz-context-ring"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="7.5" />
              <circle
                cx="10"
                cy="10"
                r="7.5"
                pathLength="100"
                style={{ strokeDasharray: `${Math.min(100, ratio * 100)} 100` }}
              />
            </svg>
          )}
          <bdi>{mode_?.label ?? model_?.name ?? copy.mode}</bdi>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content
          ref={glide}
          className="tz-menu tz-task-starter-menu"
          side="bottom"
          align="end"
          sideOffset={7}
          collisionPadding={12}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault();
              setLocalMenu(false);
              onModeMenuOpenChange?.(false);
            }
          }}
        >
          {!!modes?.length && (
            <DropdownMenu.RadioGroup
              aria-label={copy.mode}
              value={mode ?? ""}
              onValueChange={(id) => id !== mode && onModeChange?.(id)}
            >
              {modes.map((item) => (
                <DropdownMenu.RadioItem
                  key={item.id}
                  value={item.id}
                  textValue={item.label}
                  className="tz-menu-item tz-task-starter-item"
                  aria-labelledby={`${uid}-${item.id}-name`}
                  aria-describedby={
                    item.description ? `${uid}-${item.id}-hint` : undefined
                  }
                  onPointerLeave={keepHighlight}
                >
                  <span className="tz-task-starter-item-copy">
                    <span id={`${uid}-${item.id}-name`}>{item.label}</span>
                    {item.description && (
                      <small id={`${uid}-${item.id}-hint`}>
                        {item.description}
                      </small>
                    )}
                  </span>
                  <DropdownMenu.ItemIndicator aria-hidden="true">
                    <Check size={14} />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          )}
          {!!models?.length && (
            <>
              {!!modes?.length && (
                <DropdownMenu.Separator className="tz-menu-separator" />
              )}
              <DropdownMenu.Label className="tz-task-starter-menu-label">
                {copy.model}
              </DropdownMenu.Label>
              <DropdownMenu.RadioGroup
                aria-label={copy.model}
                value={model ?? ""}
                onValueChange={(id) => id !== model && onModelChange?.(id)}
              >
                {models.map((item) => (
                  <DropdownMenu.RadioItem
                    key={item.id}
                    value={item.id}
                    textValue={item.name}
                    disabled={item.disabled}
                    className="tz-menu-item tz-task-starter-item"
                    aria-labelledby={`${uid}-${item.id}-name`}
                    aria-describedby={
                      item.disabled ? `${uid}-${item.id}-hint` : undefined
                    }
                    onPointerLeave={keepHighlight}
                  >
                    <span className="tz-task-starter-item-copy">
                      <bdi id={`${uid}-${item.id}-name`}>{item.name}</bdi>
                      {item.disabled && (
                        <small id={`${uid}-${item.id}-hint`}>
                          {copy.unavailable}
                        </small>
                      )}
                    </span>
                    <DropdownMenu.ItemIndicator aria-hidden="true">
                      <Check size={14} />
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </>
          )}
          {ratio !== null && (
            <>
              <DropdownMenu.Separator className="tz-menu-separator" />
              <div className="tz-task-starter-usage" data-tone={tone}>
                <span className="tz-task-starter-meter" aria-hidden="true">
                  <span
                    style={{ inlineSize: `${Math.min(100, ratio * 100)}%` }}
                  />
                </span>
                <span>{`${copy.used(percent)} · ${attached}`}</span>
              </div>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  const chips = context.length > 0 && (
    <ul className="tz-task-starter-context">
      {context.map((item) => (
        <li key={item.id} className="tz-tag tz-task-starter-chip">
          {item.icon && <span aria-hidden="true">{item.icon}</span>}
          <bdi>{item.label}</bdi>
          {onRemoveContext && (
            <RemoveButton
              label={copy.removeContext(item.label)}
              disabled={disabled || submitting}
              onClick={() => onRemoveContext(item.id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
  const entry = (
    <div
      ref={paper}
      className={`tz-task-starter-paper ${appearance === "card" ? "tz-tray-paper" : ""}`}
      data-zone="paper"
    >
      {chips}
      <PromptEntry
        announcement={announcement}
        ref={field}
        dir="auto"
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          track();
        }}
        onSubmit={send}
        state={submitting ? "submitting" : "idle"}
        label={copy.field}
        labels={{ send: copy.send, failure: copy.failure }}
        placeholder={copy.placeholder}
        disabled={disabled}
        readOnly={submitting}
        appearance="plain"
        aria-describedby={disabledReason != null ? `${uid}-reason` : undefined}
        {...(mentions && {
          role: "combobox",
          "aria-expanded": open,
          "aria-controls": listId,
          "aria-autocomplete": "list" as const,
          "aria-activedescendant": open ? optionId(index) : undefined,
        })}
        onKeyDown={keys}
        onSelect={track}
        onBlur={() => setToken(null)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          track();
        }}
        tools={{
          start: (
            <>
              {onAttach && (
                <ToolButton
                  label={copy.attach}
                  disabled={disabled || submitting}
                  onClick={onAttach}
                >
                  <Paperclip size={18} aria-hidden="true" />
                </ToolButton>
              )}
              {(mentions || onMention) && (
                <ToolButton
                  label={copy.mention}
                  disabled={disabled || submitting}
                  onMouseDown={keepFocus}
                  onClick={insertMention}
                >
                  <AtSign size={18} aria-hidden="true" />
                </ToolButton>
              )}
            </>
          ),
          end: (
            <>
              {menu}
              {onVoice && (
                <ToolButton
                  label={copy.voice}
                  disabled={disabled || submitting}
                  onClick={onVoice}
                >
                  <Mic size={18} aria-hidden="true" />
                </ToolButton>
              )}
            </>
          ),
        }}
      />
    </div>
  );

  const reason = disabledReason != null && (
    <p id={`${uid}-reason`} className="tz-task-starter-reason">
      {disabledReason}
    </p>
  );
  const chosen = !!suggestions?.length && (
    <PromptSuggestions
      items={suggestions}
      label={copy.suggestions}
      disabled={disabled || submitting}
      onSelect={(suggestion) => onSuggestion?.(suggestion.id)}
    />
  );
  const footer = (reason || chosen) && (
    <>
      {reason}
      {chosen}
    </>
  );

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-task-starter"
      data-status={
        disabled
          ? "disabled"
          : submitting
            ? "submitting"
            : value.trim()
              ? "writing"
              : "empty"
      }
      data-appearance={appearance}
      onFocus={(event) => {
        lastFocus.current = event.target as HTMLElement;
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null))
          return;
        // Focus moved to another control on purpose is never reclaimed. A
        // control that is disabled or removed drops focus to the page.
        if (event.relatedTarget) lastFocus.current = null;
      }}
    >
      {announcement === "polite" && (
        <span
          ref={live}
          className="tz-visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
      )}
      {ratio !== null && (
        <span id={`${uid}-used`} hidden>
          {copy.used(percent)}
        </span>
      )}
      {greeting != null || title != null ? (
        <div className="tz-task-starter-greeting" data-zone="header">
          {greeting != null && (
            <p className="tz-task-starter-hello">{greeting}</p>
          )}
          <Heading id={`${uid}-title`} className="tz-task-starter-title">
            {title ?? copy.title}
          </Heading>
        </div>
      ) : (
        <Heading id={`${uid}-title`} className="tz-visually-hidden">
          {copy.title}
        </Heading>
      )}
      <Popper.Root>
        {/* The picker anchors to the whole entry, so a flip lands above the
            draft rather than over it. */}
        <Popper.Anchor virtualRef={paper as RefObject<HTMLElement>} />
        {appearance === "card" ? (
          <Tray paper={false} footer={footer || undefined}>
            {entry}
          </Tray>
        ) : (
          <>
            {entry}
            {footer && <div className="tz-task-starter-footer">{footer}</div>}
          </>
        )}
        {open &&
          createPortal(
            <Popper.Content
              ref={list}
              id={listId}
              role="listbox"
              aria-label={copy.mention}
              className="tz-task-starter-mentions"
              dir={config.direction}
              side="bottom"
              align="start"
              sideOffset={6}
              collisionPadding={8}
              // Pressing the list, its scrollbar included, never moves focus.
              onMouseDown={(event) => event.preventDefault()}
            >
              {matches.map((option, position) => (
                <div
                  key={option.id}
                  id={optionId(position)}
                  role="option"
                  aria-selected={position === index}
                  className="tz-task-starter-option"
                  onPointerMove={() => setActive(position)}
                  onClick={() => choose(option)}
                >
                  {option.icon && <span aria-hidden="true">{option.icon}</span>}
                  <span className="tz-task-starter-option-label">
                    <bdi>{option.label}</bdi>
                  </span>
                  {option.kind && <small>{option.kind}</small>}
                </div>
              ))}
            </Popper.Content>,
            container ?? document.body,
          )}
      </Popper.Root>
      {!!recent?.length && (
        <div className="tz-task-starter-recent" data-zone="meta">
          <RecentHeading
            id={`${uid}-recent`}
            className="tz-task-starter-recent-title"
          >
            {copy.recent}
          </RecentHeading>
          <ul aria-labelledby={`${uid}-recent`}>
            {recent.map((task) => {
              const content = (
                <>
                  <span className="tz-task-starter-task-title">
                    <bdi>{task.title}</bdi>
                  </span>
                  <StatusPill
                    state={task.status}
                    label={copy.recentStates[task.status]}
                  />
                  <span className="tz-task-starter-time">{task.time}</span>
                </>
              );
              return (
                <li key={task.id}>
                  {onOpenRecent ? (
                    <button
                      type="button"
                      className="tz-task-starter-task"
                      onClick={() => onOpenRecent(task.id)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="tz-task-starter-task">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
