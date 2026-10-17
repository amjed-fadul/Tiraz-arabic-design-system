import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Menu, MessageSquare, Plus } from "lucide-react";
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
}
export interface ChatAppLabels {
  navigation?: string;
  newConversation?: string;
  openNavigation?: string;
  closeNavigation?: string;
  navigationDescription?: string;
}
export interface ChatAppProps {
  conversations: readonly ChatConversationItem[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  children: ReactNode;
  composer: ReactNode;
  toolbar?: ReactNode;
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
  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0].contentRect.width > 640) setOpen(false);
    });
    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);
  function sidebar() {
    return (
      <Sidebar collapsed={false} aria-label={navigation}>
        <SidebarHeader>
          <SidebarIdentity>
            <SidebarLabel>{brand ?? "Tiraz"}</SidebarLabel>
          </SidebarIdentity>
        </SidebarHeader>
        <SidebarContent aria-label={navigation}>
          <SidebarAction
            label={newConversation}
            icon={<Plus size={16} />}
            onClick={() => {
              setOpen(false);
              onNewConversation();
            }}
          />
          <SidebarGroup heading={navigation}>
            {conversations.map((conversation) => (
              <SidebarAction
                key={conversation.id}
                label={conversation.title}
                icon={<MessageSquare size={16} />}
                aria-current={
                  conversation.id === activeConversationId ? true : undefined
                }
                data-active={conversation.id === activeConversationId}
                onClick={() => {
                  setOpen(false);
                  onConversationSelect(conversation.id);
                }}
              />
            ))}
          </SidebarGroup>
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
          </header>
          <div className="tz-chat-app-content">{children}</div>
          <footer className="tz-chat-app-composer">{composer}</footer>
        </section>
      </div>
    </div>
  );
}
