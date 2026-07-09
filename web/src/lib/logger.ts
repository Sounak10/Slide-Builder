type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const levels: Record<Exclude<LogLevel, "silent">, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredLevel(): LogLevel {
  const level = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined;

  if (!level || !(level in levels || level === "silent")) {
    return "debug";
  }

  return level;
}

function shouldLog(level: Exclude<LogLevel, "silent">) {
  const current = configuredLevel();

  if (current === "silent") {
    return false;
  }

  return levels[level] >= levels[current];
}

function write(level: Exclude<LogLevel, "silent">, scope: string, message: string, meta?: unknown) {
  if (!shouldLog(level)) {
    return;
  }

  const prefix = `[slide-builder:${scope}] ${message}`;

  if (meta === undefined) {
    console[level](prefix);
    return;
  }

  console[level](prefix, meta);
}

export const logger = {
  debug(scope: string, message: string, meta?: unknown) {
    write("debug", scope, message, meta);
  },
  info(scope: string, message: string, meta?: unknown) {
    write("info", scope, message, meta);
  },
  warn(scope: string, message: string, meta?: unknown) {
    write("warn", scope, message, meta);
  },
  error(scope: string, message: string, meta?: unknown) {
    write("error", scope, message, meta);
  },
};
