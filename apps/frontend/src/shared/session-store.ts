import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthEnvelope, ProfilePayload } from "./api";

export type SessionStatus = "guest" | "authenticated" | "revoked";

type SessionState = {
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  profile: ProfilePayload | null;
  notesChannelId: string | null;
  setAuthenticated: (payload: AuthEnvelope) => void;
  setProfile: (profile: ProfilePayload) => void;
  setNotesChannelId: (chatId: string | null) => void;
  clearAuth: () => void;
  revoke: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      status: "guest",
      accessToken: null,
      refreshToken: null,
      profile: null,
      notesChannelId: null,
      setAuthenticated: (payload) =>
        set({
          status: "authenticated",
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
          profile: payload.profile,
          notesChannelId: payload.notes_channel.id,
        }),
      setProfile: (profile) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...profile,
                public_id: state.profile.public_id,
              }
            : profile,
        })),
      setNotesChannelId: (chatId) => set({ notesChannelId: chatId }),
      clearAuth: () =>
        set({
          status: "guest",
          accessToken: null,
          refreshToken: null,
          profile: null,
          notesChannelId: null,
        }),
      revoke: () =>
        set({
          status: "revoked",
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: "underworld-session",
      partialize: (state) => ({
        status: state.status,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        profile: state.profile,
        notesChannelId: state.notesChannelId,
      }),
    },
  ),
);
