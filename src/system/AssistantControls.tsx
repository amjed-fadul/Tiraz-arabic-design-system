import { Lock } from "lucide-react";
import { useId, useLayoutEffect, useRef } from "react";
import type { FocusEvent, ReactNode } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { ContextMeter } from "./ContextMeter";
import type { ContextMeterProps } from "./ContextMeter";
import { ModelSelector } from "./ModelSelector";
import type { ModelOption } from "./ModelSelector";
import { Switch } from "./Switch";
import { Tray } from "./Tray";
import { assistantControlsCopy } from "./assistant-controls-copy";
import { useSystem } from "./useSystem";

/** How much the assistant may do before it asks: always, if sensitive, or never. */
export type PermissionLevel = "always" | "sensitive" | "auto";
export interface AssistantPermission {
  id: string;
  /** The action, in the person's words: «إرسال رسائل للعملاء». */
  label: ReactNode;
  description?: ReactNode;
  level: PermissionLevel;
  /** An irreversible action is locked to «اسأل دائمًا», whatever `level` says. */
  risks?: readonly ("sensitive" | "irreversible")[];
}
export interface AssistantMemoryItem {
  id: string;
  /** What the assistant remembers: «تفضّل شركة مدار التواصل مع سارة العتيبي». */
  text: ReactNode;
  /** The heading it is grouped under, in the order categories first appear. */
  category: string;
  source?: ReactNode;
  date?: ReactNode;
  paused?: boolean;
}
/** Every built-in string Assistant controls shows; `labels` overrides any of them. */
export interface AssistantControlsLabels {
  /** The heading when the host gives no `title`: «إعدادات المساعد». */
  title: string;
  /** The three sections' headings. */
  permissions: string;
  memory: string;
  context: string;
  /** The three levels: «اسأل دائمًا», «إن كان حساسًا», «تلقائي بالكامل». */
  levels: Record<PermissionLevel, string>;
  /** The risk tags: «حساس» and «لا يمكن التراجع». */
  risks: Record<"sensitive" | "irreversible", string>;
  /** Why a locked action always asks; it describes the action's group. */
  locked: string;
  /** The memory switch, and the note while memory is off. */
  useMemory: string;
  memoryOff: string;
  /** A paused item's tag, and the item buttons, each named with its item. */
  paused: string;
  pause: string;
  resume: string;
  delete: string;
  /** Names the model selector. */
  model: string;
}
export interface AssistantControlsProps {
  permissions?: readonly AssistantPermission[];
  /** The person's choice for an action; never called for a locked one. */
  onPermissionChange?: (id: string, level: PermissionLevel) => void;
  memoryEnabled?: boolean;
  onMemoryEnabledChange?: (enabled: boolean) => void;
  memory?: readonly AssistantMemoryItem[];
  onMemoryPauseChange?: (id: string, paused: boolean) => void;
  /** Asks the host to delete an item; it stays until the host removes it. */
  onMemoryDelete?: (id: string) => void;
  /** The context meter's data, shown as its detail view. */
  contextUsage?: ContextMeterProps;
  models?: readonly ModelOption[];
  model?: string;
  onModelChange?: (id: string) => void;
  /** The heading; «إعدادات المساعد» / Assistant controls by default. */
  title?: ReactNode;
  /** The title's level; the sections are one lower. 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<AssistantControlsLabels>;
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

const levels: readonly PermissionLevel[] = ["always", "sensitive", "auto"];

/**
 * Assistant controls (spec section 13.4): the person decides what the
 * assistant may do without asking, what it remembers and how much context it
 * uses. These are the person's settings, not the assistant's work, so the
 * pattern has no AI mark, no status pill and no state of its own. The host
 * owns every setting and enforces it; the pattern shows them and reports the
 * person's choices. An irreversible action stays at «اسأل دائمًا» whatever
 * level the host passes, and a deleted memory stays until the host removes it.
 */
export function AssistantControls({
  permissions,
  onPermissionChange,
  memoryEnabled,
  onMemoryEnabledChange,
  memory,
  onMemoryPauseChange,
  onMemoryDelete,
  contextUsage,
  models,
  model,
  onModelChange,
  title,
  headingLevel = 3,
  labels,
  appearance = "card",
}: AssistantControlsProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: AssistantControlsLabels = {
    ...assistantControlsCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    lastFocus = useRef<HTMLElement | null>(null);
  const below = Math.min(headingLevel + 1, 6) as 3 | 4 | 5 | 6,
    twoBelow = Math.min(headingLevel + 2, 6) as 4 | 5 | 6;
  const Heading = `h${headingLevel}` as const,
    Section = `h${below}` as const,
    Group = `h${twoBelow}` as const;

  // When a change removes the focused control (a deleted memory's buttons, or
  // the meter's action once there is room again), focus moves to the section
  // rather than dropping to the page.
  useLayoutEffect(() => {
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node) return;
    if (element.isConnected && !(element as HTMLButtonElement).disabled) return;
    lastFocus.current = null;
    const active = node.ownerDocument.activeElement;
    if (!active || active === node.ownerDocument.body || active === element)
      node.focus();
  });

  // Memories under their categories, in the order the categories first appear.
  const groups: { category: string; items: AssistantMemoryItem[] }[] = [];
  for (const item of memory ?? []) {
    const group = groups.find((g) => g.category === item.category);
    if (group) group.items.push(item);
    else groups.push({ category: item.category, items: [item] });
  }

  const header = (
    <div className="tz-assistant-controls-header" data-zone="header">
      <Heading id={`${uid}-title`} className="tz-assistant-controls-title">
        {title ?? copy.title}
      </Heading>
    </div>
  );

  const permissionsSection = !!permissions?.length && (
    <div className="tz-assistant-controls-section">
      <Section className="tz-assistant-controls-heading">
        {copy.permissions}
      </Section>
      <div className="tz-assistant-controls-permissions">
        {permissions.map((permission, index) => {
          const id = `${uid}-p${index}`,
            risks = permission.risks ?? [],
            locked = risks.includes("irreversible"),
            // A locked action always asks, whatever the host passed.
            checked = locked ? "always" : permission.level;
          return (
            <fieldset
              key={permission.id}
              className="tz-assistant-controls-permission"
              data-locked={locked || undefined}
              aria-describedby={
                [
                  permission.description != null && `${id}-description`,
                  locked && `${id}-lock`,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            >
              <legend className="tz-assistant-controls-legend">
                <span className="tz-assistant-controls-action">
                  {permission.label}
                </span>
                {risks.includes("sensitive") && (
                  <Badge tone="neutral">{copy.risks.sensitive}</Badge>
                )}
                {locked && (
                  <Badge tone="warning">{copy.risks.irreversible}</Badge>
                )}
              </legend>
              {permission.description != null && (
                <p
                  id={`${id}-description`}
                  className="tz-assistant-controls-description"
                >
                  {permission.description}
                </p>
              )}
              <div className="tz-assistant-controls-levels">
                {levels.map((level) => (
                  <label key={level} className="tz-assistant-controls-level">
                    <input
                      type="radio"
                      name={id}
                      value={level}
                      checked={checked === level}
                      disabled={
                        !onPermissionChange || (locked && level !== "always")
                      }
                      onChange={() => {
                        if (!locked) onPermissionChange?.(permission.id, level);
                      }}
                    />
                    <span>{copy.levels[level]}</span>
                  </label>
                ))}
              </div>
              {locked && (
                <p id={`${id}-lock`} className="tz-assistant-controls-lock">
                  <Lock size={14} aria-hidden="true" />
                  <span>{copy.locked}</span>
                </p>
              )}
            </fieldset>
          );
        })}
      </div>
    </div>
  );

  const memorySection = (memory !== undefined ||
    memoryEnabled !== undefined) && (
    <div className="tz-assistant-controls-section">
      <Section className="tz-assistant-controls-heading">{copy.memory}</Section>
      {(memoryEnabled !== undefined || onMemoryEnabledChange) && (
        <Switch
          label={copy.useMemory}
          checked={memoryEnabled !== false}
          disabled={!onMemoryEnabledChange}
          onCheckedChange={(enabled) => onMemoryEnabledChange?.(enabled)}
        />
      )}
      {memoryEnabled === false && (
        <p className="tz-assistant-controls-note">{copy.memoryOff}</p>
      )}
      {groups.map((group, g) => (
        <div key={group.category} className="tz-assistant-controls-group">
          <Group className="tz-assistant-controls-category">
            {group.category}
          </Group>
          <ul className="tz-assistant-controls-memory">
            {group.items.map((item, index) => {
              const id = `${uid}-m${g}-${index}`;
              return (
                <li
                  key={item.id}
                  className="tz-assistant-controls-item"
                  data-paused={item.paused || undefined}
                >
                  <div className="tz-assistant-controls-memo">
                    <p id={`${id}-text`} className="tz-assistant-controls-text">
                      {item.text}
                    </p>
                    {(item.source != null ||
                      item.date != null ||
                      item.paused) && (
                      <p className="tz-assistant-controls-meta">
                        {(item.source != null || item.date != null) && (
                          <span>
                            {item.source}
                            {item.source != null && item.date != null && " · "}
                            {item.date}
                          </span>
                        )}
                        {item.paused && (
                          <Badge tone="neutral">{copy.paused}</Badge>
                        )}
                      </p>
                    )}
                  </div>
                  {(onMemoryPauseChange || onMemoryDelete) && (
                    <div className="tz-assistant-controls-item-actions">
                      {onMemoryPauseChange && (
                        <Button
                          id={`${id}-pause`}
                          variant="ghost"
                          size="sm"
                          aria-labelledby={`${id}-pause ${id}-text`}
                          onClick={() =>
                            onMemoryPauseChange(item.id, !item.paused)
                          }
                        >
                          {item.paused ? copy.resume : copy.pause}
                        </Button>
                      )}
                      {onMemoryDelete && (
                        <Button
                          id={`${id}-delete`}
                          variant="ghost"
                          size="sm"
                          aria-labelledby={`${id}-delete ${id}-text`}
                          onClick={() => onMemoryDelete(item.id)}
                        >
                          {copy.delete}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  const contextSection = (contextUsage !== undefined || !!models?.length) && (
    <div className="tz-assistant-controls-section">
      <Section className="tz-assistant-controls-heading">
        {copy.context}
      </Section>
      {/* The meter's region is the pattern's one live region. */}
      {contextUsage !== undefined && <ContextMeter {...contextUsage} inline />}
      {!!models?.length && (
        <div className="tz-assistant-controls-model">
          <span>{copy.model}</span>
          <ModelSelector
            label={copy.model}
            models={models}
            value={model ?? ""}
            disabled={!onModelChange}
            onValueChange={(id) => onModelChange?.(id)}
          />
        </div>
      )}
    </div>
  );

  const paper = (
    <>
      {permissionsSection}
      {memorySection}
      {contextSection}
    </>
  );
  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-assistant-controls"
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
      {appearance === "card" ? (
        <Tray paper={false} header={header}>
          <div
            className="tz-tray-paper tz-assistant-controls-paper"
            data-zone="paper"
          >
            {paper}
          </div>
        </Tray>
      ) : (
        <>
          {header}
          <div className="tz-assistant-controls-paper" data-zone="paper">
            {paper}
          </div>
        </>
      )}
    </section>
  );
}
