/**
 * Minimal shared types for API and components.
 * Later, replace `any` with concrete shapes.
 */
export type PlanRequest = {
  city: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  purposes: string[]; // 例: ["グルメ","宿泊","観光"]
  places?: string[];
  hotelName?: string | null;
  days?: number;
  adults?: number;
  children?: number;
  [k: string]: any;
};

// API response (暫定：緩め)
export interface _PlanResponse {
  [k: string]: any;
}

// Keep-alive markers (安全)
export type __TypesMarker = unknown;
export const __TYPES_ALIVE = true;
