import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../index";
/** Small application example; data and empty content belong to the caller. */
export function TableExample({
  language = "ar",
  caption,
  empty = false,
}: {
  language?: "ar" | "en";
  caption?: string;
  empty?: boolean;
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const rows = [
    {
      id: "madar",
      name: t("شركة مدار للتقنية", "Madar Technology"),
      email: "hello@madar.example",
      status: t("نشط", "Active"),
    },
    {
      id: "nour",
      name: t("مؤسسة نور للخدمات والاستشارات", "Nour Services and Consulting"),
      email: "team@nour.example",
      status: t("متوقف", "Paused"),
    },
  ];
  const name = caption ?? t("العملاء", "Customers");
  return (
    <Table
      caption={name}
      aria-label={name ? undefined : t("العملاء", "Customers")}
    >
      <TableHeader>
        <TableRow>
          <TableHead>{t("الاسم", "Name")}</TableHead>
          <TableHead>{t("البريد الإلكتروني", "Email")}</TableHead>
          <TableHead>{t("الحالة", "Status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {empty ? (
          <TableRow>
            <TableCell colSpan={3}>
              {t("لا يوجد عملاء بعد.", "No customers yet.")}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableHead scope="row">
                <bdi>{row.name}</bdi>
              </TableHead>
              <TableCell>
                <bdi dir="ltr">{row.email}</bdi>
              </TableCell>
              <TableCell>{row.status}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
