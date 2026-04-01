import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDirectChat,
  fetchChats,
  fetchMe,
  fetchMessages,
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

export function WorkspacePage() {
  const queryClient = useQueryClient();
  const { copy, locale } = useI18n();
  const { accessToken, clearAuth, notesChannelId, profile, recoveryKey, setNotesChannelId, setProfile } =
    useSessionStore();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(notesChannelId);
  const [draftMessage, setDraftMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue.trim());

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
  const meError = meQuery.error as Error | null;
  const chatsError = chatsQuery.error as Error | null;
  const messagesError = messagesQuery.error as Error | null;
  const searchError = searchQuery.error as Error | null;

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
  const isSearching = deferredSearchValue.length > 0;
  const visibleChats = isSearching ? searchQuery.data?.chats ?? [] : chatsQuery.data ?? [];

  return (
    <section className="workspace-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">{copy.workspace.shellTag}</p>
          <h1>{copy.common.appName}</h1>
        </div>

        <div className="header-actions">
          <LanguageSwitch />
          <button className="ghost-button" onClick={() => logoutMutation.mutate()} type="button">
            {copy.common.logout}
          </button>
          <button className="icon-button" onClick={() => setProfileOpen(true)} type="button">
            <UserGlyph className="user-glyph" />
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="dialogs-panel">
          <div className="panel-heading">
            <div>
              <h2>{copy.workspace.dialogsTitle}</h2>
              <p className="muted">{copy.workspace.dialogsHint}</p>
            </div>
            <span className="status-pill authenticated">{copy.workspace.topStatus}</span>
          </div>

          {recoveryKey ? (
            <section className="recovery-banner">
              <p className="eyebrow">{copy.workspace.recoveryTitle}</p>
              <strong>{recoveryKey}</strong>
              <p className="muted">{copy.workspace.recoveryText}</p>
            </section>
          ) : null}

          {currentProfile ? (
            <div className="profile-chip">
              <img
                alt={currentProfile.display_name}
                className="profile-avatar"
                src={currentProfile.avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='24' fill='%2309140e'/><path d='M48 49c10.493 0 19-8.507 19-19S58.493 11 48 11 29 19.507 29 30s8.507 19 19 19Zm0 8c-15.464 0-28 8.73-28 19.5C20 79.538 21.962 82 24.381 82h47.238C74.038 82 76 79.538 76 76.5 76 65.73 63.464 57 48 57Z' fill='%2353f58f'/></svg>"}
              />
              <div>
                <strong>{currentProfile.display_name}</strong>
                <p className="muted">@{currentProfile.public_id}</p>
              </div>
            </div>
          ) : null}

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

            {isSearching ? <p className="eyebrow search-heading">{copy.workspace.searchChatsTitle}</p> : null}
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
                <p>{chat.last_message_preview || copy.workspace.healthValue}</p>
              </button>
            ))}

            {isSearching ? <p className="eyebrow search-heading">{copy.workspace.searchUsersTitle}</p> : null}
            {isSearching &&
            !searchQuery.isLoading &&
            !visibleChats.length &&
            !(searchQuery.data?.users?.length ?? 0) ? (
              <p className="muted">{copy.workspace.searchEmpty}</p>
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
                  <span className="status-pill authenticated">{copy.workspace.healthValue}</span>
                </div>
              </div>

              <div className="messages-column">
                {messagesQuery.isLoading ? <p className="muted">{copy.workspace.messagesLoading}</p> : null}
                {messagesError ? <p className="error">{messagesError.message}</p> : null}
                {messagesQuery.data?.map((message) => (
                  <article
                    key={message.id}
                    className={message.is_self ? "message-bubble outgoing" : "message-bubble incoming"}
                  >
                    <strong>{message.sender_public_id}</strong>
                    <p>{message.deleted_at ? copy.workspace.deletedMessage : message.body}</p>
                    <span>{new Date(message.created_at).toLocaleString(locale)}</span>
                  </article>
                ))}
              </div>

              <footer className="composer-bar">
                <input
                  onChange={(event) => setDraftMessage(event.target.value)}
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
          onSave={(payload) => profileMutation.mutateAsync({ ...currentProfile, ...payload })}
          profile={currentProfile}
        />
      ) : null}
    </section>
  );
}
