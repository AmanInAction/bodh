export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}
