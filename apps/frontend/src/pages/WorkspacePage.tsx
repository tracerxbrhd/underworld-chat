import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ChatPayload,
  createDirectChat,
  fetchChats,
  fetchMe,
  fetchMessages,
  fetchUserProfile,
  logoutRequest,
  searchChats,
  sendMessage,
  updateProfile,
} from "../shared/api";
import { LanguageSwitch } from "../shared/LanguageSwitch";
import { ProfileDrawer } from "../shared/ProfileDrawer";
import { UserGlyph } from "../shared/UserGlyph";
import { useI18n } from "../shared/i18n";
import { useSessionStore } from "../shared/session-store";
import { buildPresenceUrl, playNotificationTone } from "../shared/ws";

function sortChats(chats: ChatPayload[]): ChatPayload[] {
  return [...chats].sort((left, right) => {
    if (left.is_personal_notes && !right.is_personal_notes) {
      return -1;
    }
    if (!left.is_personal_notes && right.is_personal_notes) {
      return 1;
    }

    const leftDate = left.last_message_at ?? left.updated_at;
    const rightDate = right.last_message_at ?? right.updated_at;
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

export function WorkspacePage() {
  const queryClient = useQueryClient();
  const { copy, locale } = useI18n();
  const { accessToken, clearAuth, notesChannelId, profile, setNotesChannelId, setProfile } = useSessionStore();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [peerProfileId, setPeerProfileId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(notesChannelId);
  const [draftMessage, setDraftMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue.trim());
  const messagesColumnRef = useRef<HTMLDivElement | null>(null);
  const selectedChatIdRef = useRef<string | null>(selectedChatId);
  const currentPublicIdRef = useRef<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["me", locale, accessToken],
    queryFn: () => fetchMe(accessToken!, locale),
    enabled: Boolean(accessToken),
  });

  const chatsQuery = useQuery({
    queryKey: ["chats", locale, accessToken],
    queryFn: () => fetchChats(accessToken!, locale),
    enabled: Boolean(accessToken),
  });

  const selectedChat = useMemo(
    () => chatsQuery.data?.find((chat) => chat.id === selectedChatId) ?? null,
    [chatsQuery.data, selectedChatId],
  );

  const messagesQuery = useQuery({
    queryKey: ["messages", locale, accessToken, selectedChatId],
    queryFn: () => fetchMessages(accessToken!, locale, selectedChatId!),
    enabled: Boolean(accessToken && selectedChatId),
  });
  const searchQuery = useQuery({
    queryKey: ["search", locale, accessToken, deferredSearchValue],
    queryFn: () => searchChats(accessToken!, locale, deferredSearchValue),
    enabled: Boolean(accessToken && deferredSearchValue),
  });
  const peerProfileQuery = useQuery({
    queryKey: ["user-profile", locale, accessToken, peerProfileId],
    queryFn: () => fetchUserProfile(accessToken!, locale, peerProfileId!),
    enabled: Boolean(accessToken && peerProfileId),
  });
  const meError = meQuery.error as Error | null;
  const chatsError = chatsQuery.error as Error | null;
  const messagesError = messagesQuery.error as Error | null;
  const searchError = searchQuery.error as Error | null;

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    if (meError?.message === "Invalid or expired access token.") {
      clearAuth();
      queryClient.clear();
    }
  }, [clearAuth, meError, queryClient]);

  useEffect(() => {
    if (meQuery.data?.profile) {
      setProfile(meQuery.data.profile);
    }
    if (meQuery.data?.notes_channel_id) {
      setNotesChannelId(meQuery.data.notes_channel_id);
    }
  }, [meQuery.data, setNotesChannelId, setProfile]);

  useEffect(() => {
    if (!chatsQuery.data?.length) {
      return;
    }
    if (!selectedChatId) {
      setSelectedChatId(notesChannelId ?? chatsQuery.data[0].id);
      return;
    }
    if (!chatsQuery.data.some((chat) => chat.id === selectedChatId)) {
      setSelectedChatId(notesChannelId ?? chatsQuery.data[0].id);
    }
  }, [chatsQuery.data, notesChannelId, selectedChatId]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        return;
      }
      await logoutRequest(accessToken, locale);
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });

  const profileMutation = useMutation({
    mutationFn: (payload: NonNullable<typeof profile>) =>
      updateProfile(accessToken!, locale, {
        display_name: payload.display_name,
        avatar: payload.avatar,
        bio: payload.bio,
        birth_date: payload.birth_date ?? null,
        preferred_language: payload.preferred_language,
      }),
    onSuccess: (payload) => {
      setProfile(payload);
      queryClient.setQueryData(["me", locale, accessToken], (current: Awaited<ReturnType<typeof fetchMe>> | undefined) =>
        current
          ? {
              ...current,
              profile: payload,
              user: {
                ...current.user,
                display_name: payload.display_name,
                avatar: payload.avatar,
              },
            }
          : current,
      );
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(accessToken!, locale, selectedChatId!, draftMessage.trim()),
    onSuccess: async () => {
      setDraftMessage("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages", locale, accessToken, selectedChatId] }),
        queryClient.invalidateQueries({ queryKey: ["chats", locale, accessToken] }),
      ]);
    },
  });
  const sendError = sendMutation.error as Error | null;
  const createChatMutation = useMutation({
    mutationFn: (memberPublicId: string) => createDirectChat(accessToken!, locale, memberPublicId),
    onSuccess: async (chat) => {
      queryClient.setQueryData(["chats", locale, accessToken], (current: Awaited<ReturnType<typeof fetchChats>> | undefined) => {
        if (!current) {
          return [chat];
        }
        if (current.some((item) => item.id === chat.id)) {
          return current;
        }
        return [chat, ...current];
      });
      setSelectedChatId(chat.id);
      setSearchValue("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chats", locale, accessToken] }),
        queryClient.invalidateQueries({ queryKey: ["messages", locale, accessToken, chat.id] }),
      ]);
    },
  });
  const createChatError = createChatMutation.error as Error | null;

  const currentProfile = profile ?? meQuery.data?.profile ?? null;
  const currentPublicId = currentProfile?.public_id ?? meQuery.data?.user.public_id ?? null;
  const isSearching = deferredSearchValue.length > 0;
  const orderedChats = useMemo(() => sortChats(chatsQuery.data ?? []), [chatsQuery.data]);
  const visibleChats = isSearching ? sortChats(searchQuery.data?.chats ?? []) : orderedChats;
  const peerMember = useMemo(() => {
    if (!selectedChat || selectedChat.is_personal_notes || !currentPublicId) {
      return null;
    }
    return selectedChat.members.find((member) => member.public_id !== currentPublicId) ?? null;
  }, [currentPublicId, selectedChat]);

  useEffect(() => {
    currentPublicIdRef.current = currentPublicId;
  }, [currentPublicId]);

  useEffect(() => {
    const node = messagesColumnRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messagesQuery.data?.length, selectedChatId]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = new WebSocket(buildPresenceUrl(accessToken));
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          chat_id?: string;
          sender_public_id?: string;
        };

        if (payload.type !== "message.new" || !payload.chat_id) {
          return;
        }

        void queryClient.invalidateQueries({ queryKey: ["chats", locale, accessToken] });
        if (selectedChatIdRef.current === payload.chat_id) {
          void queryClient.invalidateQueries({ queryKey: ["messages", locale, accessToken, payload.chat_id] });
        }

        if (
          payload.sender_public_id &&
          payload.sender_public_id !== currentPublicIdRef.current &&
          (payload.chat_id !== selectedChatIdRef.current || document.visibilityState === "hidden")
        ) {
          playNotificationTone();
        }
      } catch {
        // Ignore malformed websocket events and keep the socket alive.
      }
    };

    return () => {
      socket.close();
    };
  }, [accessToken, locale, queryClient]);

  return (
    <section className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">{copy.workspace.shellTag}</p>
          <h1>{copy.common.appName}</h1>
        </div>

        <div className="header-actions">
          <LanguageSwitch />
          <button
            aria-label={copy.workspace.openProfile}
            className="profile-trigger"
            onClick={() => setProfileOpen(true)}
            type="button"
          >
            <span>{currentProfile?.display_name ?? copy.common.profile}</span>
            <UserGlyph className="user-glyph" />
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="dialogs-panel">
          <div className="panel-heading panel-heading-compact">
            <h2>{copy.workspace.dialogsTitle}</h2>
          </div>

          <div className="search-block">
            <input
              className="search-input"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={copy.workspace.searchPlaceholder}
              type="search"
              value={searchValue}
            />
          </div>

          <div className="dialogs-list">
            {!isSearching && chatsQuery.isLoading ? <p className="muted">{copy.workspace.chatsLoading}</p> : null}
            {!isSearching && chatsError ? <p className="error">{chatsError.message}</p> : null}
            {!isSearching && !chatsQuery.isLoading && !chatsQuery.data?.length ? (
              <p className="muted">{copy.workspace.emptyChats}</p>
            ) : null}

            {isSearching && searchQuery.isLoading ? <p className="muted">{copy.common.loading}</p> : null}
            {isSearching && searchError ? <p className="error">{searchError.message}</p> : null}
            {isSearching && createChatError ? <p className="error">{createChatError.message}</p> : null}
            {visibleChats.map((chat) => (
              <button
                key={chat.id}
                className={selectedChatId === chat.id ? "dialog-row active" : "dialog-row"}
                onClick={() => {
                  setSelectedChatId(chat.id);
                  setSearchValue("");
                }}
                type="button"
              >
                <div className="dialog-row-top">
                  <strong>{chat.title}</strong>
                  {chat.is_personal_notes ? (
                    <span className="status-pill planned">{copy.workspace.personalChannelBadge}</span>
                  ) : null}
                </div>
                <p>{chat.last_message_preview || copy.workspace.emptyPreview}</p>
              </button>
            ))}

            {isSearching &&
            !searchQuery.isLoading &&
            !visibleChats.length &&
            !(searchQuery.data?.users?.length ?? 0) ? (
              <p className="muted">{copy.workspace.searchEmpty}</p>
            ) : null}
            {isSearching && (searchQuery.data?.users?.length ?? 0) > 0 ? (
              <p className="eyebrow search-heading">{copy.workspace.searchUsersTitle}</p>
            ) : null}
            {isSearching &&
              searchQuery.data?.users.map((user) => (
                <button
                  key={user.id}
                  className="dialog-row search-user-row"
                  onClick={() => createChatMutation.mutate(user.public_id)}
                  type="button"
                >
                  <div className="dialog-row-top">
                    <strong>{user.display_name}</strong>
                    <span className="status-pill planned">{copy.workspace.startChat}</span>
                  </div>
                  <p>@{user.public_id}</p>
                </button>
              ))}
          </div>
        </aside>

        <main className="chat-panel">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div>
                  <h2>{selectedChat.title}</h2>
                  <p className="muted">
                    {selectedChat.is_personal_notes ? copy.workspace.notesSubtitle : selectedChat.kind}
                  </p>
                </div>

                <div className="chat-header-side">
                  {peerMember ? (
                    <button className="ghost-button" onClick={() => setPeerProfileId(peerMember.public_id)} type="button">
                      {copy.common.profile}
                    </button>
                  ) : null}
                  <span className="status-pill authenticated">{copy.workspace.healthValue}</span>
                </div>
              </div>

              <div className="messages-column" ref={messagesColumnRef}>
                {messagesQuery.isLoading ? <p className="muted">{copy.workspace.messagesLoading}</p> : null}
                {messagesError ? <p className="error">{messagesError.message}</p> : null}
                {messagesQuery.data?.map((message) => {
                  const messageClassName =
                    message.kind === "system"
                      ? "message-bubble system"
                      : message.is_self
                        ? "message-bubble outgoing"
                        : "message-bubble incoming";

                  return (
                    <article key={message.id} className={messageClassName}>
                      {message.kind === "system" ? <strong>{copy.workspace.systemMessageLabel}</strong> : <strong>{message.sender_public_id}</strong>}
                      <p>{message.deleted_at ? copy.workspace.deletedMessage : message.body}</p>
                      <span>{new Date(message.created_at).toLocaleString(locale)}</span>
                    </article>
                  );
                })}
              </div>

              <footer className="composer-bar">
                <input
                  onChange={(event) => setDraftMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || (event.nativeEvent as KeyboardEvent).isComposing) {
                      return;
                    }
                    event.preventDefault();
                    if (!draftMessage.trim() || sendMutation.isPending) {
                      return;
                    }
                    sendMutation.mutate();
                  }}
                  placeholder={copy.workspace.composerPlaceholder}
                  type="text"
                  value={draftMessage}
                />
                <button
                  className="primary-button"
                  disabled={!draftMessage.trim() || sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                  type="button"
                >
                  {sendMutation.isPending ? copy.common.loading : copy.workspace.composerAction}
                </button>
              </footer>
              {sendError ? <p className="error composer-error">{copy.workspace.sendError}</p> : null}
            </>
          ) : (
            <div className="chat-empty">
              <h2>{copy.workspace.chatEmptyTitle}</h2>
              <p>{copy.workspace.chatEmptyText}</p>
            </div>
          )}
        </main>
      </div>

      {currentProfile ? (
        <ProfileDrawer
          isOpen={isProfileOpen}
          onClose={() => setProfileOpen(false)}
          editable
          title={copy.workspace.profileTitle}
          onLogout={() => logoutMutation.mutate()}
          isLoggingOut={logoutMutation.isPending}
          onSave={async (payload) => {
            await profileMutation.mutateAsync({ ...currentProfile, ...payload });
          }}
          profile={currentProfile}
        />
      ) : null}

      {peerProfileId ? (
        peerProfileQuery.data ? (
          <ProfileDrawer
            isOpen={Boolean(peerProfileId)}
            onClose={() => setPeerProfileId(null)}
            title={peerProfileQuery.data.display_name}
            profile={peerProfileQuery.data}
          />
        ) : (
          <div className="drawer-backdrop" onClick={() => setPeerProfileId(null)} role="presentation">
            <section className="profile-modal profile-modal-loading" onClick={(event) => event.stopPropagation()} role="dialog">
              <p className="eyebrow">{copy.common.profile}</p>
              {peerProfileQuery.isLoading ? <p>{copy.common.loading}</p> : <p className="error">{(peerProfileQuery.error as Error | null)?.message ?? copy.common.errorFallback}</p>}
            </section>
          </div>
        )
      ) : null}
    </section>
  );
}
