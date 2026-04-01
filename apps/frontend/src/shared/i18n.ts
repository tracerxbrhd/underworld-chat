import { useEffect } from "react";
import { create } from "zustand";

export type Locale = "en" | "ru";

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem("underworld-locale");
  if (stored === "en" || stored === "ru") {
    return stored;
  }

  return window.navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: resolveInitialLocale(),
  setLocale: (locale) => set({ locale }),
}));

const messages = {
  en: {
    common: {
      appName: "Underworld Chat",
      languageLabel: "Language",
      enterWorkspace: "Enter workspace",
      logout: "Logout",
      profile: "Profile",
      close: "Close",
      save: "Save changes",
      guest: "Guest",
      authenticated: "Authenticated",
      revoked: "Revoked",
      loading: "Loading...",
      errorFallback: "Something went wrong.",
    },
    landing: {
      badge: "Anonymous device-first messenger",
      title: "Dark, quiet messaging with a console soul",
      subtitle:
        "A public landing page for guests, free registration for anyone, and an immediate dialog workspace prepared for private notes, search, and encrypted growth.",
      topButton: "Open account entry",
      primaryCta: "Simulate sign-in",
      secondaryCta: "Explore structure",
      attribution: "Apache-2.0 with preserved attribution notice",
      matrix: "Matrix stream active",
      featureTitle: "Prepared from day one",
      feature1: "Open registration with immutable account login",
      feature2: "Profile editing for avatar, bio, birth date, and display name",
      feature3: "Personal notes channel with the same capabilities as a normal chat",
      feature4: "RU/EN-ready interface, repository docs, and chat search",
      panelTitle: "Current product frame",
      panel1: "Guest landing page with a user-entry icon in the top-right corner",
      panel2: "Authenticated workspace with dialogs on the left and chat on the right",
      panel3: "No page reload needed when switching chats or profile state",
      signingIn: "Preparing anonymous account...",
    },
    workspace: {
      shellTag: "Secure workspace",
      dialogsTitle: "Dialogs",
      dialogsHint: "Direct chats, your own notes thread, and fast user search when no chat exists yet.",
      searchPlaceholder: "Search chats or users...",
      searchChatsTitle: "Chats",
      searchUsersTitle: "Users",
      searchEmpty: "Nothing matched this query.",
      startChat: "Start chat",
      notesTitle: "Notes",
      notesSubtitle: "Private thread with yourself",
      online: "online",
      offline: "offline",
      encrypted: "encrypted",
      chatEmptyTitle: "Select a dialog",
      chatEmptyText: "Pick a thread on the left to open the conversation panel.",
      composerPlaceholder: "Write a message...",
      composerAction: "Send",
      topStatus: "Trusted device",
      immutableLogin: "Account login",
      immutableLoginHint: "This login cannot be edited unless an administrator changes it.",
      profileTitle: "Edit profile",
      avatarLabel: "Avatar URL",
      nameLabel: "Display name",
      bioLabel: "Bio",
      birthDateLabel: "Birth date",
      previewTitle: "Preview",
      personalChannelBadge: "Notes",
      profileSaved: "Profile changes are stored locally in the current scaffold.",
      healthLabel: "Frontend mode",
      healthValue: "SPA workspace",
      yesterday: "Yesterday",
      chatsLoading: "Loading dialog list...",
      messagesLoading: "Loading messages...",
      recoveryTitle: "Recovery key",
      recoveryText: "Save it now. In this scaffold it is shown only after the first anonymous registration.",
      sendError: "Message could not be sent.",
      emptyChats: "No chats yet. The personal notes channel should appear first.",
      deletedMessage: "Message removed",
      selfMessage1: "Pinned a few ideas before the first real users arrive.",
      selfMessage2: "Notes should feel exactly like a normal chat, only quieter.",
      peerMessage1: "The landing page already sells the dark console vibe.",
      peerMessage2: "Next step is wiring this shell to real auth and chat endpoints.",
      peerReply1: "Good. The left list and right panel flow already matches the target UX.",
      peerReply2: "Profile editing is here too, with immutable login handled separately.",
    },
  },
  ru: {
    common: {
      appName: "Underworld Chat",
      languageLabel: "Язык",
      enterWorkspace: "Войти в рабочее пространство",
      logout: "Выйти",
      profile: "Профиль",
      close: "Закрыть",
      save: "Сохранить изменения",
      guest: "Гость",
      authenticated: "Авторизован",
      revoked: "Отозван",
      loading: "Загрузка...",
      errorFallback: "Что-то пошло не так.",
    },
    landing: {
      badge: "Анонимный мессенджер с опорой на устройство",
      title: "Темный, тихий мессенджер с консольным характером",
      subtitle:
        "Публичный лендинг для гостей, свободная регистрация для всех и мгновенный переход в пространство диалогов, готовое к заметкам, поиску и дальнейшему шифрованию.",
      topButton: "Открыть вход в аккаунт",
      primaryCta: "Сымитировать вход",
      secondaryCta: "Посмотреть структуру",
      attribution: "Apache-2.0 с сохранением notice и атрибуции",
      matrix: "Поток символов активен",
      featureTitle: "Подготовлено с первого дня",
      feature1: "Свободная регистрация с неизменяемым логином аккаунта",
      feature2: "Редактирование профиля: аватар, описание, дата рождения и имя",
      feature3: "Личный канал заметок с тем же функционалом, что и обычный чат",
      feature4: "Готовность интерфейса, документации и поиска по чатам к RU/EN",
      panelTitle: "Текущая форма продукта",
      panel1: "Гостевой лендинг с иконкой входа в правом верхнем углу",
      panel2: "Рабочее пространство после входа: диалоги слева, чат справа",
      panel3: "Переключение между чатами и профилем без перезагрузки страницы",
      signingIn: "Готовлю анонимный аккаунт...",
    },
    workspace: {
      shellTag: "Защищенное пространство",
      dialogsTitle: "Диалоги",
      dialogsHint: "Direct-чаты, собственная ветка заметок и быстрый поиск пользователей, даже если чата еще нет.",
      searchPlaceholder: "Искать чаты или пользователей...",
      searchChatsTitle: "Чаты",
      searchUsersTitle: "Пользователи",
      searchEmpty: "По этому запросу ничего не найдено.",
      startChat: "Начать чат",
      notesTitle: "Заметки",
      notesSubtitle: "Личная переписка с собой",
      online: "в сети",
      offline: "не в сети",
      encrypted: "шифруется",
      chatEmptyTitle: "Выберите диалог",
      chatEmptyText: "Откройте ветку слева, чтобы загрузить панель переписки.",
      composerPlaceholder: "Введите сообщение...",
      composerAction: "Отправить",
      topStatus: "Доверенное устройство",
      immutableLogin: "Логин аккаунта",
      immutableLoginHint: "Этот логин нельзя изменить, если только это не сделает администратор.",
      profileTitle: "Редактирование профиля",
      avatarLabel: "Ссылка на аватар",
      nameLabel: "Отображаемое имя",
      bioLabel: "Описание",
      birthDateLabel: "Дата рождения",
      previewTitle: "Предпросмотр",
      personalChannelBadge: "Заметки",
      profileSaved: "Изменения профиля пока сохраняются локально в этой заготовке.",
      healthLabel: "Режим фронтенда",
      healthValue: "SPA-интерфейс",
      yesterday: "Вчера",
      chatsLoading: "Загрузка списка диалогов...",
      messagesLoading: "Загрузка сообщений...",
      recoveryTitle: "Recovery key",
      recoveryText: "Сохрани его сейчас. В этой заготовке он показывается только после первой анонимной регистрации.",
      sendError: "Не удалось отправить сообщение.",
      emptyChats: "Пока нет чатов. Сначала должен появиться личный канал заметок.",
      deletedMessage: "Сообщение удалено",
      selfMessage1: "Зафиксировал несколько идей до прихода первых реальных пользователей.",
      selfMessage2: "Заметки должны ощущаться как обычный чат, только без лишнего шума.",
      peerMessage1: "Лендинг уже продает нужное темное консольное настроение.",
      peerMessage2: "Следующий шаг — привязать эту оболочку к реальным auth и chat endpoint.",
      peerReply1: "Хорошо. Связка список слева и чат справа уже совпадает с целевым UX.",
      peerReply2: "Редактирование профиля тоже на месте, а неизменяемый логин вынесен отдельно.",
    },
  },
} as const;

export function useLanguageSync() {
  const locale = useLocaleStore((state) => state.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("underworld-locale", locale);
  }, [locale]);
}

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return {
    locale,
    setLocale,
    copy: messages[locale],
  };
}
