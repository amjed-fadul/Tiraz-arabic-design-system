import { useState } from "react";
import {
  SystemProvider,
  defaultConfig,
  Button,
  Input,
  Chip,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@amjedfadul/tiraz";
import type { SystemProviderProps } from "@amjedfadul/tiraz";
import "@amjedfadul/tiraz/styles.css";
import "./style.css";

export function Example({ arabic }: { arabic: boolean }) {
  const [dark, setDark] = useState(!arabic);
  const [selected, setSelected] = useState(false);
  const [value, setValue] = useState(arabic ? "أمجد" : "Amjed");
  const provider: SystemProviderProps = {
    config: {
      ...defaultConfig,
      theme: dark ? "dark" : "light",
      direction: arabic ? "rtl" : "ltr",
    },
    className: "embedded-demo",
    lang: arabic ? "ar" : "en",
    style: { minHeight: 420, width: "100%" },
    children: null,
  };
  return (
    <SystemProvider {...provider}>
      <h1>{arabic ? "مساحة عربية" : "English workspace"}</h1>
      <Input
        label={arabic ? "الاسم" : "Name"}
        helper={arabic ? "اسم العرض" : "Display name"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="actions">
        <Button onClick={() => setDark(!dark)}>
          {arabic ? "تبديل المظهر" : "Toggle theme"}
        </Button>
        <Chip selected={selected} onClick={() => setSelected(!selected)}>
          {arabic ? "محدد" : "Selected"}
        </Chip>
        <Badge tone="success">{arabic ? "نشط" : "Active"}</Badge>
      </div>
      <Table caption={arabic ? "المستخدمون" : "Users"}>
        <TableHeader>
          <TableRow>
            <TableHead>{arabic ? "الاسم" : "Name"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{value}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </SystemProvider>
  );
}
