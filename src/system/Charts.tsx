import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart as RechartsLine,
  AreaChart as RechartsArea,
  BarChart as RechartsBar,
  PieChart,
  Line,
  Area,
  Bar,
  Pie,
  Sector,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { TooltipContentProps, PieSectorShapeProps } from "recharts";
import { useSystem } from "./useSystem";
import { chartCategory, chartNumber, chartValue } from "./chart-format";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./Table";

export interface ChartSeries {
  /** Stable, unique key into each data row. Reuse order/colors across comparable charts. */
  key: string;
  label: string;
  /** CSS color or variable; omit for the system palette. */
  color?: string;
}
export interface ChartDatum {
  category: string;
  [key: string]: string | number | null | undefined;
}
export interface DonutDatum {
  key: string;
  label: string;
  value: number | null;
  color?: string;
}
export interface ChartProps {
  label: string;
  /** Concise, application-owned text explaining the data, visible below the plot. */
  summary: string;
  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;
  legend?: boolean;
  /** Native buttons, with aria-pressed. Defaults true; requires legend=true. */
  interactiveLegend?: boolean;
  dataTable?: boolean;
  height?: number;
  className?: string;
  style?: CSSProperties;
}
export interface CartesianChartProps extends ChartProps {
  data: ChartDatum[];
  series: ChartSeries[];
  grid?: boolean;
  categoryFormat?: "text" | "date";
}
export interface DonutChartProps extends ChartProps {
  data: DonutDatum[];
}
function chartWords(locale: string) {
  const ar = locale.startsWith("ar");
  return {
    empty: ar ? "لا توجد بيانات للعرض." : "No data to display.",
    hidden: ar
      ? "كل السلاسل مخفية. اختر عنصرًا من المفتاح لعرض البيانات."
      : "All series are hidden. Select a legend item to show data.",
    positive: ar
      ? "لا توجد قيم موجبة للعرض."
      : "No positive values to display.",
    missing: ar ? "غير متاح" : "Not available",
    table: ar ? "عرض جدول البيانات" : "Show data table",
    category: ar ? "الفئة / التاريخ" : "Category / date",
    value: ar ? "القيمة" : "Value",
    legend: ar ? "مفتاح الرسم" : "Chart legend",
  };
}
function useChart(props: ChartProps, entries: ChartSeries[]) {
  const { config } = useSystem();
  const locale = props.locale ?? (config.direction === "rtl" ? "ar" : "en");
  const [hidden, setHidden] = useState<string[]>([]);
  const effectiveHidden =
    props.legend && props.interactiveLegend !== false ? hidden : [];
  const palette = [
    config.accent,
    ...(["sage", "blue", "plum", "clay"] as const).filter(
      (color) => color !== config.accent,
    ),
  ];
  // Resolve from the full series list, never the filtered list: toggling cannot recolor.
  const colored = entries.map((entry, index) => ({
    ...entry,
    color:
      entry.color ??
      (index % palette.length === 0
        ? "var(--action)"
        : `var(--chart-${palette[index % palette.length]})`),
  }));
  return {
    locale,
    numerals: config.numerals,
    direction: config.direction,
    words: chartWords(locale),
    colored,
    visible: colored.filter((entry) => !effectiveHidden.includes(entry.key)),
    hidden: effectiveHidden,
    toggle: (key: string) =>
      setHidden((previous) =>
        previous.includes(key)
          ? previous.filter((item) => item !== key)
          : [...previous, key],
      ),
    number: (value: unknown) =>
      chartValue(value) === null
        ? chartWords(locale).missing
        : chartNumber(
            value as number,
            locale,
            props.numberFormat,
            config.numerals,
          ),
  };
}
type ChartState = ReturnType<typeof useChart>;
function ChartFrame({
  props,
  state,
  summaryId,
  children,
  table,
}: {
  props: ChartProps;
  state: ChartState;
  summaryId: string;
  children: ReactNode;
  table: ReactNode;
}) {
  return (
    <section
      className={`tz-chart ${props.className ?? ""}`}
      style={props.style}
      role="region"
      aria-label={props.label}
      aria-describedby={summaryId}
    >
      {children}
      {props.legend && (
        <div
          className="tz-chart-legend"
          role="group"
          aria-label={state.words.legend}
        >
          {state.colored.map((entry) =>
            props.interactiveLegend !== false ? (
              <button
                key={entry.key}
                type="button"
                aria-pressed={!state.hidden.includes(entry.key)}
                onClick={() => state.toggle(entry.key)}
              >
                <span
                  className="tz-chart-swatch"
                  style={{ background: entry.color }}
                  aria-hidden="true"
                />
                <bdi dir="auto">{entry.label}</bdi>
              </button>
            ) : (
              <span key={entry.key}>
                <span
                  className="tz-chart-swatch"
                  style={{ background: entry.color }}
                  aria-hidden="true"
                />
                <bdi dir="auto">{entry.label}</bdi>
              </span>
            ),
          )}
        </div>
      )}
      <p className="tz-chart-summary" id={summaryId} dir="auto">
        {props.summary}
      </p>
      {props.dataTable && (
        <details className="tz-chart-table">
          <summary>{state.words.table}</summary>
          {table}
        </details>
      )}
    </section>
  );
}
/** Shared content stays inside the provider; Recharts constrains its position to the plot. */
function ChartTooltip({
  active,
  payload,
  state,
  category,
  donut = false,
}: TooltipContentProps & {
  state: ChartState;
  category: (value: string) => string;
  donut?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ChartDatum & {
    label?: string;
    key?: string;
    value?: number;
    fill?: string;
  };
  const entries = donut
    ? state.visible.filter((entry) => entry.key === row.key)
    : state.visible;
  return (
    <div
      className="tz-chart-tooltip"
      dir={state.direction}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p>
        <bdi dir="auto">{category(donut ? row.label! : row.category)}</bdi>
      </p>
      <dl>
        {entries.map((entry) => (
          <div key={entry.key}>
            <dt>
              <span
                className="tz-chart-swatch"
                style={{ background: entry.color }}
                aria-hidden="true"
              />
              <bdi dir="auto">{entry.label}</bdi>
            </dt>
            <dd>
              <bdi>{state.number(donut ? row.value : row[entry.key])}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
function chartHeight(height = 240) {
  return Number.isFinite(height) ? Math.max(180, height) : 240;
}
function CartesianPlot({
  kind,
  ...props
}: CartesianChartProps & { kind: "line" | "area" | "bar" }) {
  const { data, series, grid = true, categoryFormat = "text" } = props;
  const state = useChart(props, series),
    summaryId = useId();
  const category = (value: string) =>
    chartCategory(String(value), state.locale, categoryFormat, state.numerals);
  const values = data.map((row) => ({
    ...row,
    ...Object.fromEntries(
      series.map((entry) => [entry.key, chartValue(row[entry.key])]),
    ),
  }));
  const height = chartHeight(props.height);
  const empty =
    !data.length ||
    !series.length ||
    (state.visible.length > 0 &&
      !values.some((row) =>
        state.visible.some((entry) => chartValue(row[entry.key]) !== null),
      ));
  const Renderer =
    kind === "line"
      ? RechartsLine
      : kind === "area"
        ? RechartsArea
        : RechartsBar;
  const table = (
    <Table caption={`${props.label} — ${state.words.table}`}>
      <TableHeader>
        <TableRow>
          <TableHead>{state.words.category}</TableHead>
          {series.map((entry) => (
            <TableHead key={entry.key} data-numeric="">
              <bdi dir="auto">{entry.label}</bdi>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            <TableHead scope="row">
              <bdi dir="auto">{category(row.category)}</bdi>
            </TableHead>
            {series.map((entry) => (
              <TableCell key={entry.key} data-numeric="">
                <bdi>{state.number(row[entry.key])}</bdi>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  return (
    <ChartFrame props={props} state={state} summaryId={summaryId} table={table}>
      <div className="tz-chart-plot" dir="ltr" style={{ height }}>
        {empty || !state.visible.length ? (
          <p className="tz-chart-empty" dir={state.direction} role="status">
            {empty ? state.words.empty : state.words.hidden}
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={height}
            initialDimension={{ width: 600, height }}
          >
            <Renderer
              data={values}
              accessibilityLayer
              aria-label={props.label}
              aria-describedby={summaryId}
              margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
            >
              {grid && (
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                />
              )}
              <XAxis
                dataKey="category"
                reversed={false}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                minTickGap={28}
                height={38}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  const label = category(String(value));
                  return [...label].length > 20
                    ? `${[...label].slice(0, 12).join("")}…${[...label].slice(-6).join("")}`
                    : label;
                }}
                tick={{
                  fill: "var(--text-secondary)",
                  fontSize: "var(--text-meta)",
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={62}
                tickCount={4}
                tickFormatter={(value) =>
                  chartNumber(
                    value,
                    state.locale,
                    { ...props.numberFormat, notation: "compact" },
                    state.numerals,
                  )
                }
                tick={{
                  fill: "var(--text-secondary)",
                  fontSize: "var(--text-meta)",
                }}
              />
              <Tooltip
                filterNull={false}
                isAnimationActive={false}
                allowEscapeViewBox={{ x: false, y: false }}
                cursor={
                  kind === "bar"
                    ? { fill: "var(--action-soft)" }
                    : {
                        stroke: "var(--border-strong)",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }
                }
                content={(tooltip) => (
                  <ChartTooltip
                    {...tooltip}
                    state={state}
                    category={category}
                  />
                )}
              />
              {state.visible.map((entry) =>
                kind === "line" ? (
                  <Line
                    key={entry.key}
                    name={entry.label}
                    dataKey={entry.key}
                    type="linear"
                    stroke={entry.color}
                    strokeWidth={2}
                    connectNulls={false}
                    dot={{
                      r: 2,
                      fill: entry.color,
                      fillOpacity: 1,
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 4,
                      stroke: "var(--surface)",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                ) : kind === "area" ? (
                  <Area
                    key={entry.key}
                    name={entry.label}
                    dataKey={entry.key}
                    type="linear"
                    stroke={entry.color}
                    fill={entry.color}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    connectNulls={false}
                    dot={{
                      r: 2,
                      fill: entry.color,
                      fillOpacity: 1,
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 4,
                      stroke: "var(--surface)",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                ) : (
                  <Bar
                    key={entry.key}
                    name={entry.label}
                    dataKey={entry.key}
                    fill={entry.color}
                    maxBarSize={36}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                ),
              )}
            </Renderer>
          </ResponsiveContainer>
        )}
      </div>
    </ChartFrame>
  );
}
export function LineChart(props: CartesianChartProps) {
  return <CartesianPlot {...props} kind="line" />;
}
export function AreaChart(props: CartesianChartProps) {
  return <CartesianPlot {...props} kind="area" />;
}
export function BarChart(props: CartesianChartProps) {
  return <CartesianPlot {...props} kind="bar" />;
}
function DonutSegment(props: PieSectorShapeProps) {
  const { key, ...shapeProps } = props;
  return (
    <Sector
      key={key}
      {...shapeProps}
      className="tz-chart-segment"
      fillOpacity={props.isActive ? 0.78 : 1}
      stroke="var(--surface)"
      strokeWidth={2}
    />
  );
}
export function DonutChart(props: DonutChartProps) {
  const state = useChart(props, props.data),
    summaryId = useId(),
    height = chartHeight(props.height);
  const values = props.data
    .filter((entry) =>
      state.visible.some((visible) => visible.key === entry.key),
    )
    .filter((entry) => (chartValue(entry.value) ?? 0) > 0)
    .map((entry) => ({
      ...entry,
      fill: state.colored.find((color) => color.key === entry.key)!.color,
    }));
  const message = !props.data.length
    ? state.words.empty
    : !state.visible.length
      ? state.words.hidden
      : !values.length
        ? state.words.positive
        : null;
  const table = (
    <Table caption={`${props.label} — ${state.words.table}`}>
      <TableHeader>
        <TableRow>
          <TableHead>{state.words.category}</TableHead>
          <TableHead data-numeric="">{state.words.value}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.data.map((entry) => (
          <TableRow key={entry.key}>
            <TableHead scope="row">
              <bdi dir="auto">{entry.label}</bdi>
            </TableHead>
            <TableCell data-numeric="">
              <bdi>{state.number(entry.value)}</bdi>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  return (
    <ChartFrame props={props} state={state} summaryId={summaryId} table={table}>
      <div className="tz-chart-plot" dir="ltr" style={{ height }}>
        {message ? (
          <p className="tz-chart-empty" dir={state.direction} role="status">
            {message}
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={height}
            initialDimension={{ width: 600, height }}
          >
            <PieChart
              accessibilityLayer
              aria-label={props.label}
              aria-describedby={summaryId}
            >
              <Tooltip
                isAnimationActive={false}
                allowEscapeViewBox={{ x: false, y: false }}
                content={(tooltip) => (
                  <ChartTooltip
                    {...tooltip}
                    state={state}
                    category={(value) => value}
                    donut
                  />
                )}
              />
              <Pie
                data={values}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="85%"
                startAngle={90}
                endAngle={-270}
                shape={DonutSegment}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartFrame>
  );
}
