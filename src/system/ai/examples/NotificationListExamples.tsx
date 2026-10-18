import { useLayoutEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { Avatar, Button, EmptyState, NotificationList } from "../../index";
import type { NotificationItem } from "../../index";

export interface NotificationListExampleProps {
  language?: "ar" | "en";
  empty?: boolean;
  longContent?: boolean;
  avatars?: boolean;
  readControls?: boolean;
}
export function NotificationListExample({
  language = "ar",
  empty = false,
  longContent = false,
  avatars = true,
  readControls = true,
}: NotificationListExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [readIds, setReadIds] = useState(["ready"]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [details, setDetails] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<number | null>(null);
  const markRead = t("تعليم كمقروءة", "Mark as read");
  // Focus recovery is application behavior: only run when a focused row is removed.
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    const controls = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    ).filter((button) =>
      button.getAttribute("aria-label")?.startsWith(`${markRead}: `),
    );
    const fallback = filtersRef.current?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    (controls[Math.min(index, controls.length - 1)] ?? fallback)?.focus();
  }, [readIds, filter, markRead]);
  const labels = {
    unread: t("غير مقروءة", "unread"),
    read: t("مقروءة", "Read"),
    markRead,
    markAllRead: t("تعليم الكل كمقروء", "Mark all as read"),
  };
  const title = t("طلب مراجعة", "Review requested");
  const notifications: NotificationItem[] = empty
    ? []
    : [
        {
          id: "review",
          title,
          read: readIds.includes("review"),
          timestamp: t("١٥ أكتوبر، ٠٩:١٢", "15 Oct, 09:12"),
          dateTime: "2026-10-15T09:12:00+04:00",
          avatar: avatars ? (
            <Avatar
              name={t("سارة علي", "Sara Ali")}
              fallback={t("س ع", "SA")}
            />
          ) : undefined,
          description: (
            <>
              {t("عرض سعر شركة الندى ", "Al Nada Trading quote ")}
              <bdi dir="ltr">PRO-2026-118</bdi>
              {longContent &&
                t(
                  " — راجِع جدول الأسعار وشروط الدفع وأسماء المنتجات بالتفصيل قبل أن يُرسل العرض إلى العميل يوم الخميس.",
                  " — A detailed review of the price table, payment terms and product names before the quote goes to the client on Thursday.",
                )}
            </>
          ),
          action: (
            <>
              <Button
                size="sm"
                variant="secondary"
                aria-label={`${t("عرض التفاصيل", "Show details")}: ${title}`}
                aria-expanded={details.includes("review")}
                onClick={() =>
                  setDetails((ids) =>
                    ids.includes("review")
                      ? ids.filter((id) => id !== "review")
                      : [...ids, "review"],
                  )
                }
              >
                {t("التفاصيل", "Details")}
              </Button>
              {details.includes("review") && (
                <p style={{ flexBasis: "100%", margin: 0 }}>
                  {t(
                    "تطلب منك سارة مراجعة جدول الأسعار في الصفحة ٤ وتأكيد مدة الضمان قبل الإرسال.",
                    "Sara asks you to check the price table on page 4 and confirm the warranty period before it goes out.",
                  )}
                </p>
              )}
            </>
          ),
        },
        {
          id: "note",
          title: t("تعليق جديد على العقد", "New comment on the contract"),
          read: readIds.includes("note"),
          timestamp: t("١٤ أكتوبر", "14 Oct"),
          dateTime: "2026-10-14",
          icon: <FileText />,
          description: longContent ? (
            <bdi dir="ltr">
              CONTRACT-AL-NADA-SUPPLY-2026-CLAUSE-07-RENEWAL-COMMENT-4F2A9C1E7B3D5A8F
            </bdi>
          ) : (
            t(
              "أضاف خالد ملاحظة على البند ٧ (مدة التجديد).",
              "Khalid commented on clause 7 (renewal term).",
            )
          ),
        },
        {
          id: "ready",
          title: t("التقرير الشهري جاهز", "Monthly report ready"),
          read: readIds.includes("ready"),
          timestamp: t("أمس", "Yesterday"),
          description: t(
            "تقرير مبيعات سبتمبر جاهز للتنزيل.",
            "The September sales report is ready to download.",
          ),
        },
      ];
  const visible =
    filter === "unread"
      ? notifications.filter((item) => !item.read)
      : notifications;
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-4)",
        inlineSize: "100%",
        minInlineSize: 0,
      }}
    >
      <div
        ref={filtersRef}
        role="group"
        aria-label={t("تصفية الإشعارات", "Notification filter")}
        style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
      >
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          {t("الكل", "All")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={filter === "unread"}
          onClick={() => setFilter("unread")}
        >
          {t("غير المقروءة", "Unread")}
        </Button>
      </div>
      <NotificationList
        ref={listRef}
        label={t("إشعارات المشروع", "Project notifications")}
        items={visible}
        labels={labels}
        onMarkRead={
          readControls
            ? (id) => {
                if (
                  filter === "unread" &&
                  listRef.current?.contains(document.activeElement)
                )
                  pendingFocus.current = visible.findIndex(
                    (item) => item.id === id,
                  );
                setReadIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
              }
            : undefined
        }
        onMarkAllRead={
          readControls
            ? () => {
                if (listRef.current?.contains(document.activeElement))
                  pendingFocus.current = filter === "unread" ? 0 : -1;
                setReadIds(notifications.map((item) => item.id));
              }
            : undefined
        }
        emptyState={
          <EmptyState
            title={
              notifications.length === 0
                ? t("لا توجد إشعارات", "No notifications")
                : t("لا توجد إشعارات غير مقروءة", "No unread notifications")
            }
            description={
              notifications.length === 0
                ? t(
                    "ستظهر هنا التحديثات والطلبات الموجّهة إليك.",
                    "Updates and requests for you will appear here.",
                  )
                : t(
                    "قرأت كل إشعاراتك. اختر «الكل» لعرض الإشعارات السابقة.",
                    "You're all caught up. Show all to read earlier notifications.",
                  )
            }
            action={
              notifications.length > 0 ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFilter("all");
                    filtersRef.current
                      ?.querySelector<HTMLButtonElement>("button")
                      ?.focus();
                  }}
                >
                  {t("عرض الكل", "Show all")}
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
}
