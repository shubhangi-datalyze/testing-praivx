export function logEvent(name: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[event] ${name}`, data ?? {});
  }
}
