const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost/ws";

export function buildPresenceUrl(): string {
  return `${WS_BASE_URL}/presence/`;
}

