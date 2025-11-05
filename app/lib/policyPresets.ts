export type Policy = "light" | "normal" | "rush";

export const policyToOptions: Record<Policy, {
  maxPerDay: number;
  maxPerDayByDayIndex: { [k: string]: number }; // "1" | "last"
}> = {
  light:  { maxPerDay: 3, maxPerDayByDayIndex: { 1: 2, last: 2 } },
  normal: { maxPerDay: 2, maxPerDayByDayIndex: { 1: 2, last: 2 } },
  rush:   { maxPerDay: 5, maxPerDayByDayIndex: { 1: 4, last: 3 } },
};
