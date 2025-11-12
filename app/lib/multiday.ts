export type MultiDayMode = "off" | "scaffold" | "roundrobin";

export function readMultiDayMode(env = process.env.MULTIDAY_MODE): MultiDayMode {
  const v = (env || "off").toLowerCase();
  if (v === "scaffold" || v === "roundrobin") return v;
  return "off";
}
