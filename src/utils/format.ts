export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function makeId(): string {
  return crypto.randomUUID();
}

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
