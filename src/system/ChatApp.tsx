import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { DropdownMenu } from "./DropdownMenu";
import type { MenuItem } from "./DropdownMenu";
import {
  Sidebar,
  SidebarAction,
  SidebarContent,
  SidebarHeader,
  SidebarIdentity,
  SidebarLabel,
  SidebarGroup,
} from "./Sidebar";
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { useSystem } from "./useSystem";
export interface ChatConversationItem {
  id: string;
  title: string;
  /**
   * Conversations that share a group sit under its heading, and groups follow
   * the order of their first conversation. Ungrouped ones sit under the
   * navigation's own heading.
   */
  group?: string;
}
export interface ChatAppLabels {
  navigation?: string;
  newConversation?: string;
  openNavigation?: string;
  closeNavigation?: string;
  navigationDescription?: string;
  /** Names a row's menu button, for example «خيارات {title}». */
  conversationActions?: (title: string) => string;
  rename?: string;
  delete?: string;
  /** Names the side panel; «التفاصيل» by default. */
  sidePanel?: string;
}
export interface ChatAppProps {
  conversations: readonly ChatConversationItem[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  children: ReactNode;
  composer: ReactNode;
  toolbar?: ReactNode;
  /** Controls at the header's end, after the toolbar. */
  actions?: ReactNode;
  /**
   * An aside at the inline end, for evidence, a draft or a task's details.
   * Below 960px it sits under the conversation.
   */
  sidePanel?: ReactNode;
  /**
   * Each row's menu offers «إعادة التسمية» and «حذف» when its callback is
   * given. They are intents: the host owns the rename field and the
   * confirmation. Without either callback the rows have no menu.
   */
  onConversationRename?: (id: string) => void;
  onConversationDelete?: (id: string) => void;
  /** The navigation's name. Nothing shows when it is absent. */
  brand?: ReactNode;
  title?: string;
  labels?: ChatAppLabels;
  className?: string;
}
/** Composition only. The application owns identity, drafts, messages and execution. */
export function ChatApp({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  children,
  composer,
  toolbar,
  actions,
  sidePanel,
  onConversationRename,
  onConversationDelete,
  brand,
  title,
  labels,
  className = "",
}: ChatAppProps) {
  const ar = useSystem().config.direction === "rtl";
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const navigation = labels?.navigation ?? (ar ? "المحادثات" : "Conversations");
  const newConversation =
    labels?.newConversation ?? (ar ? "محادثة جديدة" : "New conversation");
  const hasMenu = !!(onConversationRename || onConversationDelete);
  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0].contentRect.width > 640) setOpen(false);
    });
    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);
  // Conversations gather under their group in first-seen order. The ungrouped
  // ones are a group of their own, headed by the navigation's name.
  const groups: { name?: string; items: ChatConversationItem[] }[] = [];
  for (const conversation of conversations) {
    const name = conversation.group || undefined;
    let group = groups.find((entry) => entry.name === name);
    if (!group) groups.push((group = { name, items: [] }));
    group.items.push(conversation);
  }
  if (!groups.length) groups.push({ items: [] });
  function menuItems(id: string): MenuItem[] {
    // Choosing an intent closes the phone's sheet, as choosing a row does.
    const choose = (act: (id: string) => void) => () => {
      setOpen(false);
      act(id);
    };
    return [
      ...(onConversationRename
        ? [
            {
              id: "rename",
              label: labels?.rename ?? (ar ? "إعادة التسمية" : "Rename"),
              icon: <Pencil size={15} />,
              onSelect: choose(onConversationRename),
            },
          ]
        : []),
      ...(onConversationDelete
        ? [
            {
              id: "delete",
              label: labels?.delete ?? (ar ? "حذف" : "Delete"),
              icon: <Trash2 size={15} />,
              destructive: true,
              separatorBefore: !!onConversationRename,
              onSelect: choose(onConversationDelete),
            },
          ]
        : []),
    ];
  }
  function sidebar() {
    return (
      <Sidebar
        className="tz-chat-app-sidebar"
        collapsed={false}
        aria-label={navigation}
      >
        {brand ? (
          <SidebarHeader>
            <SidebarIdentity>
              <SidebarLabel>{brand}</SidebarLabel>
            </SidebarIdentity>
          </SidebarHeader>
        ) : null}
        <SidebarContent aria-label={navigation}>
          <SidebarAction
            label={newConversation}
            icon={<Plus size={16} />}
            onClick={() => {
              setOpen(false);
              onNewConversation();
            }}
          />
          {groups.map((group) => (
            <SidebarGroup
              key={group.name ?? ""}
              heading={group.name ?? navigation}
            >
              {group.items.map((conversation) => (
                <div
                  key={conversation.id}
                  className="tz-chat-app-conversation"
                  data-conversation-id={conversation.id}
                  data-menu={hasMenu || undefined}
                >
                  <SidebarAction
                    label={conversation.title}
                    icon={<MessageSquare size={16} />}
                    aria-current={
                      conversation.id === activeConversationId
                        ? true
                        : undefined
                    }
                    data-active={conversation.id === activeConversationId}
                    onClick={() => {
                      setOpen(false);
                      onConversationSelect(conversation.id);
                    }}
                  />
                  {hasMenu && (
                    <DropdownMenu
                      align="end"
                      trigger={
                        <button
                          type="button"
                          className="tz-icon-button tz-chat-app-menu"
                          aria-label={(
                            labels?.conversationActions ??
                            ((name: string) =>
                              ar ? `خيارات ${name}` : `Options for ${name}`)
                          )(conversation.title)}
                        >
                          <MoreHorizontal size={16} aria-hidden="true" />
                        </button>
                      }
                      items={menuItems(conversation.id)}
                    />
                  )}
                </div>
              ))}
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
    );
  }
  return (
    <div ref={root} className={`tz-chat-app ${className}`}>
      <div className="tz-chat-app-layout">
        <div className="tz-chat-app-navigation">{sidebar()}</div>
        <section
          className="tz-chat-app-main"
          aria-label={
            title ??
            conversations.find((item) => item.id === activeConversationId)
              ?.title ??
            newConversation
          }
        >
          <header className="tz-chat-app-header">
            <span className="tz-chat-app-mobile">
              <Sheet
                open={open}
                onOpenChange={setOpen}
                title={navigation}
                description={
                  labels?.navigationDescription ??
                  (ar
                    ? "اختر محادثة أو ابدأ محادثة جديدة."
                    : "Choose a conversation or start a new one.")
                }
                closeLabel={
                  labels?.closeNavigation ??
                  (ar ? "إغلاق المحادثات" : "Close conversations")
                }
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={
                      labels?.openNavigation ??
                      (ar ? "فتح المحادثات" : "Open conversations")
                    }
                  >
                    <Menu size={18} aria-hidden="true" />
                  </Button>
                }
              >
                {sidebar()}
              </Sheet>
            </span>
            <span className="tz-chat-app-title" dir="auto">
              {title ??
                conversations.find((item) => item.id === activeConversationId)
                  ?.title ??
                newConversation}
            </span>
            {toolbar && <div className="tz-chat-app-toolbar">{toolbar}</div>}
            {actions && <div className="tz-chat-app-actions">{actions}</div>}
          </header>
          <div className="tz-chat-app-content">{children}</div>
          <footer className="tz-chat-app-composer">{composer}</footer>
        </section>
        {sidePanel && (
          // Its own landmark beside the conversation, not inside it, so it
          // stays at the top level. It scrolls, so the keyboard reaches it.
          <aside
            className="tz-chat-app-panel"
            aria-label={labels?.sidePanel ?? (ar ? "التفاصيل" : "Details")}
            tabIndex={0}
          >
            {sidePanel}
          </aside>
        )}
      </div>
    </div>
  );
}
