import type { ComponentType } from "react";
import {
  MapPin, Building2, Home, Utensils, ShoppingBag,
  TrainFront, Calendar, Clock
} from "lucide-react";

type Icon = ComponentType<any>;
const fallback: Icon = MapPin;

// よく使いそうな種別をざっくり網羅（なければ MapPin を返す）
const TABLE: Record<string, Icon> = {
  spot: MapPin, poi: MapPin, attraction: MapPin, sightseeing: MapPin,
  hotel: Building2, stay: Home,
  food: Utensils, lunch: Utensils, dinner: Utensils, gourmet: Utensils,
  shopping: ShoppingBag, shop: ShoppingBag,
  transfer: TrainFront, move: TrainFront, transit: TrainFront,
  schedule: Calendar, time: Clock,
};

export function pickIconFrom(kind?: string): Icon {
  if (!kind) return fallback;
  const key = kind.toLowerCase();
  return TABLE[key] ?? fallback;
}
