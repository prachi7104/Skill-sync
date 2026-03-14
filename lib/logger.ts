/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Structured Logger
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Lightweight structured JSON logger for server-side code.
 *
 * Output format (one JSON line per log entry):
 *   { "level": "info", "ts": "2026-...", "msg": "...", "context": { ... } }
 *
 * Levels:  debug < info < warn < error
 * Default: "info" (set LOG_LEVEL env var to override)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
  return LEVEL_ORDER[env] !== undefined ? env : "info";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[getMinLevel()];
}

function emit(level: LogLevel, msg: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: Record<string, unknown> = {
    level,
    ts: new Date().toISOString(),
    msg,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  const line = JSON.stringify(entry);

  switch (level) {
    case "error":
      // eslint-disable-next-line no-console
      console.error(line);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(line);
      break;
    case "debug":
      // eslint-disable-next-line no-console
      console.debug(line);
      break;
    default:
      // eslint-disable-next-line no-console
      console.log(line);
  }
}

export const logger = {
  debug: (msg: string, context?: Record<string, unknown>) => emit("debug", msg, context),
  info: (msg: string, context?: Record<string, unknown>) => emit("info", msg, context),
  warn: (msg: string, context?: Record<string, unknown>) => emit("warn", msg, context),
  error: (msg: string, context?: Record<string, unknown>) => emit("error", msg, context),
};
