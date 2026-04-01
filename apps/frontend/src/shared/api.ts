export type DeviceSessionPayload = {
  id: string;
  device_id: string;
  device_name: string;
  platform: string;
  last_seen_at: string;
  is_revoked: boolean;
  is_current: boolean;
};

export type ProfilePayload = {
  public_id: string;
  display_name: string;
  avatar: string;
  bio: string;
  birth_date: string | null;
  preferred_language: "en" | "ru";
  last_seen_visibility: string;
  profile_visibility: string;
};

export type AuthUserPayload = {
  id: string;
  public_id: string;
  display_name: string;
  avatar: string;
};

export type NotesChannelPayload = {
  id: string;
  title: string;
  is_personal_notes: boolean;
};

export type AuthEnvelope = {
  user: AuthUserPayload;
  profile: ProfilePayload;
  device_session: DeviceSessionPayload;
  notes_channel: NotesChannelPayload;
  access_token: string;
  refresh_token: string;
  recovery_key?: string;
};

export type MePayload = {
  user: AuthUserPayload;
  profile: ProfilePayload;
  device_session: DeviceSessionPayload;
  notes_channel_id: string;
};

export type ChatPayload = {
  id: string;
  kind: string;
  title: string;
  is_personal_notes: boolean;
  last_message_preview: string;
  last_message_at: string | null;
  updated_at: string;
  members: Array<{
    id: string;
    public_id: string;
    display_name: string;
    avatar: string;
    joined_at: string;
    is_muted: boolean;
  }>;
};

export type SearchPayload = {
  chats: ChatPayload[];
  users: AuthUserPayload[];
};

export type MessagePayload = {
  id: string;
  chat_id: string;
  sender_public_id: string;
  body: string;
  kind: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  is_self: boolean;
};

export type AnonymousRegisterInput = {
  device_name: string;
  platform: string;
  preferred_language: "en" | "ru";
};

export type ProfileUpdateInput = {
  display_name?: string;
  avatar?: string;
  bio?: string;
  birth_date?: string | null;
  preferred_language?: "en" | "ru";
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

function buildHeaders(locale?: string, token?: string, includeJson = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (locale) {
    headers["Accept-Language"] = locale;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed with ${response.status}.`;
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) {
        detail = data.detail;
      }
    } catch {
      // Ignore JSON parsing errors and keep the generic message.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function anonymousRegister(input: AnonymousRegisterInput, locale: "en" | "ru"): Promise<AuthEnvelope> {
  const response = await fetch(`${API_BASE_URL}/auth/anonymous-register`, {
    method: "POST",
    headers: buildHeaders(locale, undefined, true),
    body: JSON.stringify(input),
  });
  return parseJson<AuthEnvelope>(response);
}

export async function fetchMe(token: string, locale: "en" | "ru"): Promise<MePayload> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: buildHeaders(locale, token),
  });
  return parseJson<MePayload>(response);
}

export async function updateProfile(
  token: string,
  locale: "en" | "ru",
  payload: ProfileUpdateInput,
): Promise<ProfilePayload> {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "PATCH",
    headers: buildHeaders(locale, token, true),
    body: JSON.stringify(payload),
  });
  return parseJson<ProfilePayload>(response);
}

export async function fetchChats(token: string, locale: "en" | "ru"): Promise<ChatPayload[]> {
  const response = await fetch(`${API_BASE_URL}/chats`, {
    headers: buildHeaders(locale, token),
  });
  return parseJson<ChatPayload[]>(response);
}

export async function searchChats(token: string, locale: "en" | "ru", query: string): Promise<SearchPayload> {
  const response = await fetch(`${API_BASE_URL}/chats/search?q=${encodeURIComponent(query)}`, {
    headers: buildHeaders(locale, token),
  });
  return parseJson<SearchPayload>(response);
}

export async function createDirectChat(
  token: string,
  locale: "en" | "ru",
  memberPublicId: string,
): Promise<ChatPayload> {
  const response = await fetch(`${API_BASE_URL}/chats`, {
    method: "POST",
    headers: buildHeaders(locale, token, true),
    body: JSON.stringify({ member_public_id: memberPublicId }),
  });
  return parseJson<ChatPayload>(response);
}

export async function fetchMessages(token: string, locale: "en" | "ru", chatId: string): Promise<MessagePayload[]> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    headers: buildHeaders(locale, token),
  });
  return parseJson<MessagePayload[]>(response);
}

export async function sendMessage(
  token: string,
  locale: "en" | "ru",
  chatId: string,
  body: string,
): Promise<MessagePayload> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    method: "POST",
    headers: buildHeaders(locale, token, true),
    body: JSON.stringify({ body }),
  });
  return parseJson<MessagePayload>(response);
}

export async function logoutRequest(token: string, locale: "en" | "ru"): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: buildHeaders(locale, token),
  });
  return parseJson<void>(response);
}
