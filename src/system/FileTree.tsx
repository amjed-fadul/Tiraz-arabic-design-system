import { useId, useLayoutEffect, useRef, useState } from "react";
import type {
  ComponentPropsWithRef,
  CSSProperties,
  KeyboardEvent,
  ReactNode,
} from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useSystem } from "./useSystem";

export interface FileTreeFile {
  /** Unique, nonempty application ID, stable across renames and moves. */
  id: string;
  kind: "file";
  name: string;
  /** Short, noninteractive description. */
  metadata?: string;
}
export interface FileTreeFolder {
  id: string;
  kind: "folder";
  name: string;
  metadata?: string;
  children: readonly FileTreeNode[];
}
export type FileTreeNode = FileTreeFile | FileTreeFolder;
export type FileTreeProps = Omit<
  ComponentPropsWithRef<"div">,
  "children" | "onSelect"
> & {
  nodes: readonly FileTreeNode[];
  label: string;
  size?: "sm" | "md";
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (id: string) => void;
  onActivate?: (file: FileTreeFile) => void;
  /** Noninteractive empty content, outside the tree's item hierarchy. */
  emptyState?: ReactNode;
};
type Entry = { node: FileTreeNode; parent: string | null; ancestors: string[] };
/** Displays supplied data only. File activation is delegated to the host. */
export function FileTree({
  nodes,
  label,
  size = "sm",
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  selectedId,
  defaultSelectedId = null,
  onSelectedChange,
  onActivate,
  emptyState,
  className = "",
  onKeyDown,
  onFocusCapture,
  onBlurCapture,
  ref,
  ...props
}: FileTreeProps) {
  const { config } = useSystem();
  const uid = useId();
  const [localExpanded, setLocalExpanded] =
    useState<readonly string[]>(defaultExpandedIds);
  const [localSelected, setLocalSelected] = useState<string | null>(
    defaultSelectedId,
  );
  const expanded = expandedIds ?? localExpanded;
  const selected = selectedId === undefined ? localSelected : selectedId;
  const visible: Entry[] = [];
  function visit(
    items: readonly FileTreeNode[],
    parent: string | null,
    ancestors: string[],
  ) {
    for (const node of items) {
      visible.push({ node, parent, ancestors });
      if (node.kind === "folder" && expanded.includes(node.id))
        visit(node.children, node.id, [node.id, ...ancestors]);
    }
  }
  visit(nodes, null, []);
  const [focusPosition, setFocusPosition] = useState<{
    id: string | null;
    index: number;
    ancestors: string[];
  }>({ id: selected, index: 0, ancestors: [] });
  const elements = useRef(new Map<string, HTMLLIElement>());
  const root = useRef<HTMLDivElement | null>(null);
  const ownedFocus = useRef(false);
  const lastTarget = useRef<HTMLElement | null>(null);
  const search = useRef({ value: "", time: 0 });
  // Remember ancestry and position as state so render never reads a mutable DOM snapshot.
  const visibleIds = new Set(visible.map((entry) => entry.node.id));
  const currentId = visibleIds.has(focusPosition.id ?? "")
    ? focusPosition.id
    : (focusPosition.ancestors.find((id) => visibleIds.has(id)) ??
      visible[Math.min(focusPosition.index, visible.length - 1)]?.node.id ??
      null);
  const currentIndex = visible.findIndex(
    (entry) => entry.node.id === currentId,
  );
  const ancestors = visible[currentIndex]?.ancestors ?? [];
  if (
    focusPosition.id !== currentId ||
    focusPosition.index !== Math.max(currentIndex, 0) ||
    focusPosition.ancestors.length !== ancestors.length ||
    focusPosition.ancestors.some((id, index) => id !== ancestors[index])
  ) {
    setFocusPosition({
      id: currentId,
      index: Math.max(currentIndex, 0),
      ancestors,
    });
  }
  useLayoutEffect(() => {
    const doc = root.current?.ownerDocument;
    if (
      ownedFocus.current &&
      ((lastTarget.current &&
        !lastTarget.current.isConnected &&
        doc?.activeElement === doc?.body) ||
        (currentId !== null && doc?.activeElement === root.current))
    ) {
      const target = currentId ? elements.current.get(currentId) : root.current;
      target?.focus();
    }
  });
  function focus(id: string) {
    elements.current.get(id)?.focus();
  }
  function changeExpanded(next: string[]) {
    if (expandedIds === undefined) setLocalExpanded(next);
    onExpandedChange?.(next);
  }
  function toggle(node: FileTreeNode) {
    if (node.kind !== "folder" || !node.children.length) return;
    changeExpanded(
      expanded.includes(node.id)
        ? expanded.filter((id) => id !== node.id)
        : [...expanded, node.id],
    );
  }
  function select(node: FileTreeNode) {
    if (selectedId === undefined) setLocalSelected(node.id);
    if (selected !== node.id) onSelectedChange?.(node.id);
  }
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.nativeEvent.isComposing
    )
      return;
    const index = visible.findIndex((entry) => entry.node.id === currentId);
    const entry = visible[index];
    if (!entry) return;
    const { node, parent } = entry;
    const openKey = config.direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const closeKey = config.direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key === "ArrowDown")
      focus(visible[Math.min(index + 1, visible.length - 1)].node.id);
    else if (event.key === "ArrowUp")
      focus(visible[Math.max(index - 1, 0)].node.id);
    else if (event.key === "Home") focus(visible[0].node.id);
    else if (event.key === "End") focus(visible[visible.length - 1].node.id);
    else if (event.key === openKey) {
      if (node.kind === "folder" && node.children.length) {
        if (!expanded.includes(node.id)) toggle(node);
        else focus(node.children[0].id);
      }
    } else if (event.key === closeKey) {
      if (
        node.kind === "folder" &&
        node.children.length &&
        expanded.includes(node.id)
      )
        toggle(node);
      else if (parent) focus(parent);
    } else if (event.key === "Enter") {
      select(node);
      if (node.kind === "file") onActivate?.(node);
      else toggle(node);
    } else if (event.key === " ") select(node);
    else if (event.key === "*") {
      const siblings = visible
        .filter(
          (entry) =>
            entry.parent === parent &&
            entry.node.kind === "folder" &&
            entry.node.children.length > 0,
        )
        .map((entry) => entry.node.id);
      changeExpanded([...new Set([...expanded, ...siblings])]);
    } else if (event.key.length === 1) {
      const now = event.timeStamp;
      const value =
        (now - search.current.time < 700 ? search.current.value : "") +
        event.key.toLocaleLowerCase();
      search.current = { value, time: now };
      const query = [...value].every((char) => char === value[0])
        ? value[0]
        : value;
      const candidates =
        query.length > 1
          ? [...visible.slice(index), ...visible.slice(0, index)]
          : [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
      const match = candidates.find((entry) =>
        entry.node.name.toLocaleLowerCase().startsWith(query),
      );
      if (match) focus(match.node.id);
    } else return;
    if (event.key.length !== 1 || event.key === " " || event.key === "*")
      search.current = { value: "", time: 0 };
    event.preventDefault();
  }
  function renderNodes(
    items: readonly FileTreeNode[],
    depth: number,
  ): ReactNode {
    return items.map((node) => {
      const folder = node.kind === "folder";
      const expandable = folder && node.children.length > 0;
      const open = expandable && expanded.includes(node.id);
      const Icon = folder ? (open ? FolderOpen : Folder) : File;
      const nameId = `${uid}-${encodeURIComponent(node.id)}-name`;
      return (
        <li
          key={node.id}
          role="treeitem"
          ref={(element) => {
            if (element) elements.current.set(node.id, element);
            else elements.current.delete(node.id);
          }}
          tabIndex={currentId === node.id ? 0 : -1}
          aria-describedby={node.metadata ? `${nameId}-meta` : undefined}
          aria-selected={selected === node.id}
          aria-expanded={expandable ? open : undefined}
          onFocus={(event) => {
            if (event.target === event.currentTarget)
              setFocusPosition({
                id: node.id,
                index: visible.findIndex((entry) => entry.node.id === node.id),
                ancestors: visible.find((entry) => entry.node.id === node.id)!
                  .ancestors,
              });
          }}
          className="tz-file-tree-item"
          onClick={(event) => {
            if (
              (event.target as Element).closest('[role="treeitem"]') !==
              event.currentTarget
            )
              return;
            focus(node.id);
            select(node);
            if (folder) toggle(node);
            else onActivate?.(node);
          }}
        >
          <div
            className="tz-file-tree-row"
            style={{ "--tree-depth": depth } as CSSProperties}
          >
            <ChevronRight
              aria-hidden="true"
              className="tz-file-tree-chevron"
              data-folder={expandable}
              data-open={open}
            />
            <Icon aria-hidden="true" className="tz-file-tree-icon" />
            <span className="tz-file-tree-name" title={node.name}>
              <bdi id={nameId}>{node.name}</bdi>
            </span>
            {node.metadata && (
              <bdi
                id={`${nameId}-meta`}
                aria-hidden="true"
                className="tz-file-tree-meta"
                title={node.metadata}
              >
                {node.metadata}
              </bdi>
            )}
          </div>
          {folder && open && node.children.length > 0 && (
            <ul role="group">{renderNodes(node.children, depth + 1)}</ul>
          )}
        </li>
      );
    });
  }
  return (
    <div className={`tz-file-tree ${className}`} data-size={size}>
      <div
        {...props}
        ref={(element) => {
          root.current = element;
          if (typeof ref === "function") return ref(element);
          else if (ref) ref.current = element;
        }}
        role="tree"
        aria-label={label}
        tabIndex={visible.length ? -1 : 0}
        onKeyDown={keyDown}
        onFocusCapture={(event) => {
          ownedFocus.current = true;
          lastTarget.current = event.target as HTMLElement;
          onFocusCapture?.(event);
        }}
        onBlurCapture={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget) &&
            (event.target as HTMLElement).isConnected
          ) {
            ownedFocus.current = false;
            search.current = { value: "", time: 0 };
          }
          onBlurCapture?.(event);
        }}
      >
        <ul role="none">{renderNodes(nodes, 0)}</ul>
      </div>
      {!nodes.length &&
        (emptyState ?? (
          <p className="tz-file-tree-empty">
            {config.direction === "rtl" ? "لا توجد ملفات" : "No files"}
          </p>
        ))}
    </div>
  );
}
