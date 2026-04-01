const RAW_WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? "/ws";

function resolveWsBaseUrl(): string {
  if (RAW_WS_BASE_URL.startsWith("ws://") || RAW_WS_BASE_URL.startsWith("wss://")) {
    return RAW_WS_BASE_URL;
  }

  if (typeof window === "undefined") {
    return "ws://localhost/ws";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${RAW_WS_BASE_URL}`;
}

export function buildPresenceUrl(token: string): string {
  const url = new URL(`${resolveWsBaseUrl()}/presence/`);
  url.searchParams.set("token", token);
  return url.toString();
}

export function playNotificationTone() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    // Ignore notification sound errors to keep chat flow uninterrupted.
  }
}
