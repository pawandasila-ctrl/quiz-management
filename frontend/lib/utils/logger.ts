type LogLevel = "debug" | "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== "production";

function formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

const logger = {
  debug(message: string, data?: unknown, meta?: LogMeta): void {
    if (!isDev) return;
    console.debug(formatMessage("debug", message, meta), data ?? "");
  },
  info(message: string, data?: unknown, meta?: LogMeta): void {
    if (!isDev) return;
    console.info(formatMessage("info", message, meta), data ?? "");
  },
  warn(message: string, data?: unknown, meta?: LogMeta): void {
    console.warn(formatMessage("warn", message, meta), data ?? "");
  },
  error(message: string, data?: unknown, meta?: LogMeta): void {
    console.error(formatMessage("error", message, meta), data ?? "");
  },
};

export default logger;
