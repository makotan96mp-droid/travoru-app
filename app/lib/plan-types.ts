export type PlanItem = {
  time: string;
  title: string;
  note?: string;
  tags?: string[];
  meta?: {
    dayOffset?: number;
    [key: string]: unknown;
  };
};
};

export type PlanFlags = {
  wantsFood: boolean;
  wantsStay: boolean;
  wantsShop: boolean;
  wantsSight: boolean;
};

export type PlanResponse = {
  city: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  items: PlanItem[];
  flags: PlanFlags;
};
