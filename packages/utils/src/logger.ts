export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const subscribers = new Set<(entry: LogEntry) => void>();

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = { level, message, context };
  if (process.env.NODE_ENV !== "production") {
    console[level === "debug" ? "info" : level](`[${level.toUpperCase()}] ${message}`, context);
  }
  subscribers.forEach((subscriber) => subscriber(entry));
}

export function subscribeLogger(callback: (entry: LogEntry) => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}
