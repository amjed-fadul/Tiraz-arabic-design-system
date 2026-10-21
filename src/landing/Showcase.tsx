import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { ArrowUpLeft, ArrowUpRight, MoveLeft, MoveRight } from "lucide-react";
import {
  Alert,
  Badge,
  BarChart,
  Button,
  DatePicker,
  Input,
  OTPInput,
  Progress,
  Slider,
  Switch,
} from "../system";
import { numberLocale } from "../system/config";
import { useSystem } from "../system/useSystem";

function spotlight(event: PointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--mx",
    `${event.clientX - bounds.left}px`,
  );
  event.currentTarget.style.setProperty(
    "--my",
    `${event.clientY - bounds.top}px`,
  );
}

function Tile({
  span,
  title,
  text,
  component,
  tag,
  ar,
  delay = 0,
  children,
}: {
  span: 2 | 3 | 4;
  title: string;
  text: string;
  component: string;
  tag: string;
  ar: boolean;
  delay?: number;
  children: ReactNode;
}) {
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  return (
    <article
      className="lp-tile"
      data-span={span}
      data-reveal
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      onPointerMove={spotlight}
    >
      <div className="lp-tile-demo">{children}</div>
      <div className="lp-tile-meta">
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
        <a className="lp-tile-source" href={`/library/components/${component}`}>
          <bdi dir="ltr">{tag}</bdi>
          <Arrow size={13} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

/** Real Tiraz components, configured by the page's single SystemProvider. */
export function Showcase({ ar }: { ar: boolean }) {
  const { config } = useSystem();
  const locale = ar ? "ar" : "en";
  const Forward = ar ? MoveLeft : MoveRight;
  const percent = new Intl.NumberFormat(
    numberLocale(config, ar ? "ar" : "en"),
    {
      style: "percent",
    },
  );
  return (
    <div className="lp-bento">
      <Tile
        span={3}
        ar={ar}
        title={ar ? "حقول وأزرار" : "Inputs and buttons"}
        text={
          ar
            ? "حقول إدخال وأزرار يمكنك استخدامها في نماذج تطبيقك."
            : "Inputs and buttons for your app’s forms."
        }
        component="input"
        tag="Input · Button"
      >
        <div className="lp-form-demo">
          <Input
            label={ar ? "اسم المشروع" : "Project name"}
            placeholder={ar ? "مشروعك القادم" : "Your next project"}
          />
          <Button
            onClick={() => {
              const start = document.getElementById("start");
              start?.focus({ preventScroll: true });
              start?.scrollIntoView({ block: "start" });
            }}
          >
            {ar ? "دليل البدء" : "Get started"}
            <Forward size={14} aria-hidden="true" />
          </Button>
        </div>
      </Tile>
      <Tile
        span={3}
        ar={ar}
        delay={80}
        title={ar ? "رمز التحقق" : "Verification code"}
        text={
          ar
            ? "خانات لرمز التحقق مرتّبة من اليسار إلى اليمين داخل الواجهة العربية."
            : "Code fields stay left to right within an Arabic interface."
        }
        component="otp-input"
        tag="OTPInput"
      >
        <OTPInput
          label={ar ? "رمز التحقق" : "Verification code"}
          helper={ar ? "أرسلنا الرمز إلى بريدك." : "We sent the code by email."}
          length={6}
          defaultValue="4271"
        />
      </Tile>
      <Tile
        span={2}
        ar={ar}
        title={ar ? "الحالة والتقدّم" : "Status and progress"}
        text={
          ar
            ? "شارات لحالة الطلب وشريط يعرض نسبة الإنجاز."
            : "Badges for order status and a progress bar for completion."
        }
        component="progress"
        tag="Badge · Progress"
      >
        <div className="lp-status-demo">
          <div className="lp-badges">
            <Badge tone="success">{ar ? "مكتمل" : "Completed"}</Badge>
            <Badge tone="info">{ar ? "قيد المراجعة" : "In review"}</Badge>
            <Badge>{ar ? "مسودّة" : "Draft"}</Badge>
          </div>
          <Progress
            value={72}
            label={ar ? "تقدّم المشروع التجريبي" : "Sample project progress"}
            showValue
            locale={locale}
          />
        </div>
      </Tile>
      <Tile
        span={2}
        ar={ar}
        delay={80}
        title={ar ? "اختيار التاريخ" : "Date picker"}
        text={
          ar
            ? "تقويم ميلادي بأسماء الأشهر والأيام بالعربية."
            : "A Gregorian calendar with month and day names in Arabic."
        }
        component="date-picker"
        tag="DatePicker"
      >
        <DatePicker
          label={ar ? "تاريخ التسليم" : "Delivery date"}
          defaultValue="2026-10-15"
          locale={locale}
        />
      </Tile>
      <Tile
        span={2}
        ar={ar}
        delay={160}
        title={ar ? "عناصر التحكّم" : "Controls"}
        text={
          ar
            ? "مفاتيح تبديل ومنزلقات تراعي اتجاه الواجهة."
            : "Switches and sliders that adapt to the layout direction."
        }
        component="slider"
        tag="Switch · Slider"
      >
        <div className="lp-controls-demo">
          <Switch
            label={ar ? "الإشعارات الفورية" : "Instant notifications"}
            defaultChecked
          />
          <Slider
            label={ar ? "كثافة العرض" : "Display density"}
            defaultValue={60}
            formatValue={(value) => percent.format(value / 100)}
          />
        </div>
      </Tile>
      <Tile
        span={4}
        ar={ar}
        title={ar ? "الرسوم البيانية" : "Charts"}
        text={
          ar
            ? "رسم بالأعمدة مع جدول لقراءة القيم."
            : "A bar chart with a table of values."
        }
        component="bar-chart"
        tag="BarChart"
      >
        <BarChart
          label={ar ? "طلبات تجريبية حسب القناة" : "Sample orders by channel"}
          summary={
            ar
              ? "بيانات تجريبية · الموقع والمتجر، ٣ أيام."
              : "Sample data · website and store, 3 days."
          }
          data={[
            { category: ar ? "الأول" : "Day 1", web: 12, store: 8 },
            { category: ar ? "الثاني" : "Day 2", web: 18, store: 10 },
            { category: ar ? "الثالث" : "Day 3", web: 15, store: 12 },
          ]}
          series={[
            { key: "web", label: ar ? "الموقع" : "Website" },
            { key: "store", label: ar ? "المتجر" : "Store" },
          ]}
          height={190}
          locale={locale}
          dataTable
        />
      </Tile>
      <Tile
        span={2}
        ar={ar}
        delay={80}
        title={ar ? "التنبيهات" : "Alerts"}
        text={
          ar
            ? "رسائل توضّح نتيجة الإجراء، مثل حفظ التغييرات."
            : "Messages that confirm an action, such as saving changes."
        }
        component="alert"
        tag="Alert"
      >
        <Alert
          tone="success"
          title={ar ? "حُفظت التغييرات" : "Changes saved"}
        />
      </Tile>
    </div>
  );
}
