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

const source =
  "https://github.com/amjed-fadul/Tiraz-arabic-design-system/tree/main/src/system";

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
  file,
  tag,
  ar,
  delay = 0,
  children,
}: {
  span: 2 | 3 | 4;
  title: string;
  text: string;
  file: string;
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
        <a className="lp-tile-source" href={`${source}/${file}`}>
          <bdi dir="ltr">{tag}</bdi>
          <Arrow size={13} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

/** Real Tiraz components, configured by the page's single SystemProvider. */
export function Showcase({ ar }: { ar: boolean }) {
  const locale = ar ? "ar" : "en";
  const Forward = ar ? MoveLeft : MoveRight;
  const percent = new Intl.NumberFormat(ar ? "ar-u-nu-arab" : "en", {
    style: "percent",
  });
  return (
    <div className="lp-bento">
      <Tile
        span={3}
        ar={ar}
        title={ar ? "نماذج واضحة" : "Clear forms"}
        text={
          ar
            ? "حقول وأزرار لخطوات مفهومة."
            : "Inputs and buttons for understandable steps."
        }
        file="Input.tsx"
        tag="Input · Button"
      >
        <div className="lp-form-demo">
          <Input
            label={ar ? "اسم المشروع" : "Project name"}
            placeholder={ar ? "مشروعك القادم" : "Your next project"}
          />
          <Button onClick={() => document.getElementById("start")?.focus()}>
            {ar ? "ابدأ مشروعك" : "Start your project"}
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
            ? "أرقام تُكتب من اليسار، داخل واجهة من اليمين."
            : "Digits stay left to right inside a right-to-left interface."
        }
        file="OTPInput.tsx"
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
        title={ar ? "حالة تُفهم" : "Status with meaning"}
        text={ar ? "نص ولون، بمعنى واحد." : "Text and color, one meaning."}
        file="Progress.tsx"
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
        title={ar ? "تاريخ بلا التباس" : "Dates without doubt"}
        text={
          ar
            ? "تقويم ميلادي بأسماء عربية واتجاه صحيح."
            : "A Gregorian calendar that follows the reading direction."
        }
        file="DatePicker.tsx"
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
        title={ar ? "تحكّم مريح" : "Comfortable controls"}
        text={
          ar
            ? "مفاتيح ومنزلقات تتبع الاتجاه."
            : "Switches and sliders that follow direction."
        }
        file="Slider.tsx"
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
        title={ar ? "بيانات أقرب للقراءة" : "Data, easier to read"}
        text={
          ar
            ? "رسوم مساحية وأعمدة، مع جدول للقيم."
            : "Area and bar charts, with a table of exact values."
        }
        file="Charts.tsx"
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
        title={ar ? "تنبيهات هادئة" : "Quiet alerts"}
        text={
          ar ? "رسائل قصيرة تُقرأ بلمحة." : "Short messages, read at a glance."
        }
        file="Alert.tsx"
        tag="Alert"
      >
        <Alert
          tone="success"
          title={ar ? "حُفظت التغييرات" : "Changes saved"}
          description={
            ar
              ? "حُفظت مسودّتك قبل لحظات."
              : "Your draft was saved a moment ago."
          }
        />
      </Tile>
    </div>
  );
}
