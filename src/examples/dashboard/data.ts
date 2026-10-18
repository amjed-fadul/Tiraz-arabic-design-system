export type CustomerStatus = "active" | "paused";
export interface Customer {
  id: number;
  name: string;
  email: string;
  status: CustomerStatus;
}
export type Channel = "web" | "store" | "partner";
export interface Order {
  id: number;
  date: string;
  channel: Channel;
  amount: number;
}
export type Period = 7 | 14;
// Fixed sample clock: reloads and time zones never move this example's period.
export const sampleEnd = "2026-10-14";
export const sampleCustomers: Customer[] = [
  ["شركة مدار للتقنية", "hello@madar.example"],
  ["ليلى أحمد", "layla@bayt.example"],
  ["Nadia Hassan", "nadia@atlas.example"],
  ["استوديو سارة", "sara@studio.example"],
  ["Omar Khalid", "omar@cedar.example"],
  ["مؤسسة نور للاستشارات", "team@nour.example"],
  ["خالد المنصوري", "khalid@wadi.example"],
  ["Maya Patel", "maya@loom.example"],
  ["أفق للخدمات", "hello@ofuq.example"],
  ["Yara Nasser", "yara@field.example"],
  ["يوسف علي", "yousef@sahl.example"],
  ["Cedar Consulting", "team@cedar.example"],
  ["ريم الشامسي", "reem@dune.example"],
  ["Adam Wilson", "adam@north.example"],
  ["دار للتصميم", "hello@dar.example"],
  ["Lina Haddad", "lina@linen.example"],
  ["مريم إبراهيم", "mariam@bay.example"],
  ["Noor Studio", "team@noor.example"],
].map(([name, email], index) => ({
  id: index + 1,
  name,
  email,
  status: index % 3 === 1 ? "paused" : "active",
}));
const dailyCounts = [4, 6, 5, 8, 7, 6, 9, 7, 10, 8, 12, 9, 11, 14];
export const sampleOrders: Order[] = dailyCounts.flatMap((count, day) =>
  Array.from({ length: count }, (_, index) => ({
    id: day * 100 + index + 1,
    date: `2026-10-${String(day + 1).padStart(2, "0")}`,
    channel: (["web", "web", "store", "partner"] as const)[(day + index) % 4],
    amount: 160 + ((day * 3 + index) % 8) * 45,
  })),
);
export function calculateOrders(orders: readonly Order[], period: Period) {
  const end = Date.parse(`${sampleEnd}T00:00:00Z`);
  const dates = Array.from({ length: period }, (_, index) =>
    new Date(end - (period - index - 1) * 86_400_000)
      .toISOString()
      .slice(0, 10),
  );
  const filtered = orders.filter(
    (order) => order.date >= dates[0] && order.date <= sampleEnd,
  );
  const channels: Record<Channel, number> = { web: 0, store: 0, partner: 0 };
  for (const order of filtered) channels[order.channel] += 1;
  return {
    start: dates[0],
    end: sampleEnd,
    count: filtered.length,
    revenue: filtered.reduce((total, order) => total + order.amount, 0),
    channels,
    // Every date is known in this complete sample; dates without orders are zero.
    trend: dates.map((category) => ({
      category,
      orders: filtered.filter((order) => order.date === category).length,
    })),
  };
}
export function filterCustomers(
  customers: readonly Customer[],
  query: string,
  status: CustomerStatus | "all",
) {
  const term = query.trim().toLocaleLowerCase();
  return customers.filter(
    (customer) =>
      (status === "all" || customer.status === status) &&
      `${customer.name} ${customer.email}`.toLocaleLowerCase().includes(term),
  );
}
