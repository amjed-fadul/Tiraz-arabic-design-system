import { useState } from "react";
import { Settings } from "lucide-react";
import {
  Button,
  Tabs,
  Switch,
  DropdownMenu,
  Sheet,
  SystemProvider,
  defaultConfig,
  ToastProvider,
  useToast,
} from "../../index";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../tokens.css";
import "../../components.css";

function DashboardTask() {
  const [notifications, setNotifications] = useState(true);
  const [view, setView] = useState("overview");
  const { toast } = useToast();
  const actions = [
    {
      id: "save",
      label: "حفظ التفضيلات",
      onSelect: () => toast({ title: "تم حفظ التفضيلات", tone: "success" }),
    },
  ];
  return (
    <main lang="ar">
      <h1>إدارة الحساب</h1>
      <p>
        الحساب <bdi dir="ltr">ACC-42</bdi>
      </p>
      <Tabs
        label="معلومات الحساب"
        value={view}
        onValueChange={setView}
        items={[
          {
            value: "overview",
            label: "نظرة عامة",
            content: (
              <Switch
                label="إشعارات البريد"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            ),
          },
          {
            value: "activity",
            label: "النشاط",
            content: <p>آخر تحديث اليوم</p>,
          },
        ]}
      />
      <DropdownMenu
        trigger={<Button variant="secondary">الإجراءات</Button>}
        items={actions}
      />
      <Sheet
        trigger={<Button>تفاصيل الحساب</Button>}
        title="تفاصيل الحساب"
        description="راجع معلومات الحساب وتفضيلاته"
        closeLabel="إغلاق تفاصيل الحساب"
      >
        <DropdownMenu
          trigger={<Button variant="secondary">إجراءات الحساب</Button>}
          items={actions}
        />
      </Sheet>
      <Button
        iconOnly
        aria-label="إعدادات الحساب"
        variant="ghost"
        onClick={() =>
          toast({
            title: "الإعدادات الحالية",
            description: notifications ? "الإشعارات مفعلة" : "الإشعارات متوقفة",
          })
        }
      >
        <Settings aria-hidden="true" size={16} />
      </Button>
    </main>
  );
}
export function UsageExample() {
  return (
    <div lang="ar">
      <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
        <ToastProvider label="التنبيهات" closeLabel="إغلاق التنبيه">
          <DashboardTask />
        </ToastProvider>
      </SystemProvider>
    </div>
  );
}
