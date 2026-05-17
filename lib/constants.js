// Central color map — keyed by color name stored in job_roles.color
export const ROLE_COLOR_MAP = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400", bar: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400",    bar: "bg-blue-400",    badge: "bg-blue-100 text-blue-700",    border: "border-blue-200"    },
  orange:  { bg: "bg-orange-50",  text: "text-orange-600",  dot: "bg-orange-400",  bar: "bg-orange-400",  badge: "bg-orange-100 text-orange-700", border: "border-orange-200"  },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   bar: "bg-amber-400",   badge: "bg-amber-100 text-amber-700",   border: "border-amber-200"   },
  red:     { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     bar: "bg-red-400",     badge: "bg-red-100 text-red-700",      border: "border-red-200"     },
  purple:  { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400",  bar: "bg-violet-400",  badge: "bg-violet-100 text-violet-700", border: "border-violet-200"  },
  pink:    { bg: "bg-pink-50",    text: "text-pink-600",    dot: "bg-pink-400",    bar: "bg-pink-400",    badge: "bg-pink-100 text-pink-700",    border: "border-pink-200"    },
  gray:    { bg: "bg-gray-50",    text: "text-gray-500",    dot: "bg-gray-400",    bar: "bg-gray-400",    badge: "bg-gray-100 text-gray-600",    border: "border-gray-200"    },
};

export const AVAILABLE_COLORS = [
  { value: "emerald", label: "Green"  },
  { value: "blue",    label: "Blue"   },
  { value: "orange",  label: "Orange" },
  { value: "amber",   label: "Yellow" },
  { value: "red",     label: "Red"    },
  { value: "purple",  label: "Purple" },
  { value: "pink",    label: "Pink"   },
  { value: "gray",    label: "Gray"   },
];

export function roleStyle(color) {
  return ROLE_COLOR_MAP[color] ?? ROLE_COLOR_MAP.gray;
}

// Health plan styles — assigned by position in the health_plans settings array
const HEALTH_PALETTE = [
  { bg: "bg-gray-100",   text: "text-gray-500"   },
  { bg: "bg-blue-50",    text: "text-blue-700"   },
  { bg: "bg-violet-50",  text: "text-violet-700" },
  { bg: "bg-green-50",   text: "text-green-700"  },
  { bg: "bg-amber-50",   text: "text-amber-700"  },
];

export function healthStyle(value, healthPlans) {
  const idx = (healthPlans ?? []).findIndex(p => p.value === value);
  return HEALTH_PALETTE[idx >= 0 ? idx : 0] ?? HEALTH_PALETTE[0];
}

export function nextPayDate(refDateStr, period = "weekly") {
  const today = new Date();
  const ref   = new Date(refDateStr ?? "2026-04-24");
  const days  = period === "biweekly" ? 14 : period === "monthly" ? 30 : 7;
  while (ref <= today) ref.setDate(ref.getDate() + days);
  return ref.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}
