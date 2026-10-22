import { expect, it } from "vitest";
import {
  calculateOrders,
  filterCustomers,
  sampleCustomers,
  sampleOrders,
} from "./data";

it("uses an inclusive fixed period for both charts and metrics, ignoring out-of-range orders", () => {
  const orders = [
    { id: 1, date: "2026-10-07", channel: "web" as const, amount: 10 },
    { id: 2, date: "2026-10-08", channel: "web" as const, amount: 100 },
    { id: 3, date: "2026-10-14", channel: "store" as const, amount: 250 },
    { id: 4, date: "2026-10-15", channel: "web" as const, amount: 999 },
  ];
  const result = calculateOrders(orders, 7);
  expect(result.count).toBe(2);
  expect(result.revenue).toBe(350);
  expect(result.trend).toHaveLength(7);
  expect(result.trend[0]).toEqual({ category: "2026-10-08", orders: 1 });
  expect(result.trend[1]).toEqual({ category: "2026-10-09", orders: 0 });
  expect(result.trend[6]).toEqual({ category: "2026-10-14", orders: 1 });
  expect(result.channels).toEqual({ web: 1, store: 1, partner: 0 });
  expect(calculateOrders(orders, 14).count).toBe(3);
});

it("adds up each channel's revenue from the period's orders only", () => {
  const orders = [
    { id: 1, date: "2026-10-07", channel: "web" as const, amount: 10 },
    { id: 2, date: "2026-10-08", channel: "web" as const, amount: 100 },
    { id: 3, date: "2026-10-12", channel: "web" as const, amount: 40 },
    { id: 4, date: "2026-10-14", channel: "partner" as const, amount: 250 },
  ];
  const result = calculateOrders(orders, 7);
  expect(result.channelRevenue).toEqual({ web: 140, store: 0, partner: 250 });
  // The channels add up to the period's revenue, in the sample too.
  const sample = calculateOrders(sampleOrders, 7);
  expect(sample.channelRevenue).toEqual({
    web: 11_545,
    store: 5_060,
    partner: 5_555,
  });
  expect(Object.values(sample.channelRevenue).reduce((a, b) => a + b, 0)).toBe(
    sample.revenue,
  );
});

it("has deterministic unique sample IDs and keeps empty order metrics zero", () => {
  expect(new Set(sampleCustomers.map((c) => c.id)).size).toBe(
    sampleCustomers.length,
  );
  expect(new Set(sampleOrders.map((o) => o.id)).size).toBe(sampleOrders.length);
  const result = calculateOrders([], 14);
  expect(result.count).toBe(0);
  expect(result.revenue).toBe(0);
  expect(Object.values(result.channels)).toEqual([0, 0, 0]);
  expect(Object.values(result.channelRevenue)).toEqual([0, 0, 0]);
});

it("combines trimmed case-insensitive name/email search and status without mutating records", () => {
  const customers = [
    {
      id: 1,
      name: "مدار ACME",
      email: "hello@madar.example",
      status: "active" as const,
    },
    {
      id: 2,
      name: "ACME Studio",
      email: "team@studio.example",
      status: "paused" as const,
    },
  ];
  expect(filterCustomers(customers, " acme ", "active")).toEqual([
    customers[0],
  ]);
  expect(filterCustomers(customers, "TEAM@", "all")).toEqual([customers[1]]);
  expect(filterCustomers(customers, "مدار", "paused")).toEqual([]);
  expect(customers).toHaveLength(2);
});
