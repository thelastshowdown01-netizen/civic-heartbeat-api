export const categoryLabels: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  sewer_overflow: "Sewer Overflow",
  water_leakage: "Water Leakage",
  street_light: "Street Light",
  road_damage: "Road Damage",
  other: "Other",
};

export const statusColors: Record<string, string> = {
  reported: "bg-muted text-muted-foreground",
  verified: "bg-info/15 text-info",
  assigned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-destructive/15 text-destructive",
};

export const priorityColors: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-accent/15 text-accent-foreground",
  low: "bg-secondary text-secondary-foreground",
};

export function formatCategory(cat: string): string {
  return categoryLabels[cat] ?? cat;
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const categoryIcons: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  sewer_overflow: "🚰",
  water_leakage: "💧",
  street_light: "💡",
  road_damage: "🚧",
  other: "📋",
};
