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
      back: "Back",
      register: "Register",
      signIn: "Sign in",
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
      bootStatus: "Booting secure access shell",
      bootStage: "Loading UNDER OS kernel",
      consoleBanner: "Secure terminal initialized. Select access mode.",
      consoleIdle: "idle",
      consoleActive: "auth flow",
      menuLead: "Choose a command to continue.",
      createProfile: "Create profile",
      createProfileMode: "PROFILE.CREATE",
      loginMode: "SESSION.LOGIN",
      loginLabel: "Login",
      loginPlaceholder: "your-login",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters",
      creating: "Creating account...",
      signingIn: "Signing in...",
      promptLogin: "enter login",
      promptPassword: "enter password",
      launchAccepted: "Session accepted",
      launchPreparing: "Preparing dialog shell",
    },
    workspace: {
      shellTag: "Secure workspace",
      dialogsTitle: "Dialogs",
      searchPlaceholder: "Search chats or users...",
      openDialogs: "Open dialogs",
      closeDialogs: "Hide dialogs",
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
      closeDialog: "Close dialog",
      immutableLogin: "Account login",
      immutableLoginHint: "This login cannot be edited unless an administrator changes it.",
      profileTitle: "Edit profile",
      avatarLabel: "Avatar URL",
      nameLabel: "Display name",
      bioLabel: "Bio",
      birthDateLabel: "Birth date",
      previewTitle: "Preview",
      personalChannelBadge: "Notes",
      profileSaved: "Profile changes are saved for the current account.",
      healthLabel: "Frontend mode",
      healthValue: "SPA workspace",
      emptyPreview: "No messages yet",
      yesterday: "Yesterday",
      chatsLoading: "Loading dialog list...",
      messagesLoading: "Loading messages...",
      sendError: "Message could not be sent.",
      emptyChats: "No chats yet. The personal notes channel should appear first.",
      deletedMessage: "Message removed",
      systemMessageLabel: "system",
      openProfile: "Open profile",
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
      back: "Назад",
      register: "Регистрация",
      signIn: "Войти",
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
      bootStatus: "Запуск защищенной оболочки доступа",
      bootStage: "Загрузка ядра UNDER OS",
      consoleBanner: "Защищенный терминал инициализирован. Выбери режим доступа.",
      consoleIdle: "ожидание",
      consoleActive: "авторизация",
      menuLead: "Выберите команду для продолжения.",
      createProfile: "Создать профиль",
      createProfileMode: "PROFILE.CREATE",
      loginMode: "SESSION.LOGIN",
      loginLabel: "Логин",
      loginPlaceholder: "my-login",
      passwordLabel: "Пароль",
      passwordPlaceholder: "Минимум 8 символов",
      creating: "Создаю аккаунт...",
      signingIn: "Выполняю вход...",
      promptLogin: "введите логин",
      promptPassword: "введите пароль",
      launchAccepted: "Сессия подтверждена",
      launchPreparing: "Подготавливаю оболочку диалогов",
    },
    workspace: {
      shellTag: "Защищенное пространство",
      dialogsTitle: "Диалоги",
      searchPlaceholder: "Искать чаты или пользователей...",
      openDialogs: "Открыть диалоги",
      closeDialogs: "Скрыть диалоги",
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
      closeDialog: "Закрыть диалог",
      immutableLogin: "Логин аккаунта",
      immutableLoginHint: "Этот логин нельзя изменить, если только это не сделает администратор.",
      profileTitle: "Редактирование профиля",
      avatarLabel: "Ссылка на аватар",
      nameLabel: "Отображаемое имя",
      bioLabel: "Описание",
      birthDateLabel: "Дата рождения",
      previewTitle: "Предпросмотр",
      personalChannelBadge: "Заметки",
      profileSaved: "Изменения профиля сохраняются для текущего аккаунта.",
      healthLabel: "Режим фронтенда",
      healthValue: "SPA-интерфейс",
      emptyPreview: "Пока нет сообщений",
      yesterday: "Вчера",
      chatsLoading: "Загрузка списка диалогов...",
      messagesLoading: "Загрузка сообщений...",
      sendError: "Не удалось отправить сообщение.",
      emptyChats: "Пока нет чатов. Сначала должен появиться личный канал заметок.",
      deletedMessage: "Сообщение удалено",
      systemMessageLabel: "система",
      openProfile: "Открыть профиль",
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
