import button from "../../knowledge/components/button.json";
import tabs from "../../knowledge/components/tabs.json";
import switchContract from "../../knowledge/components/switch.json";
import dropdown from "../../knowledge/components/dropdown.json";
import sheet from "../../knowledge/components/sheet.json";
import toast from "../../knowledge/components/toast.json";
import type { ComponentId } from "./catalog";
export interface ComponentContract {
  exportName: string;
  props: Record<string, { type: string; required: boolean }>;
  defaults: Record<string, string>;
}
export const contracts: Record<ComponentId, ComponentContract> = {
  button,
  tabs,
  switch: switchContract,
  dropdown,
  sheet,
  toast,
};
