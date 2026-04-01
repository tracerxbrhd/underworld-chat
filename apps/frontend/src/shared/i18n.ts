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
      badge: "Private messenger with direct account access",
      title: "Dark, quiet messaging with a console soul",
      subtitle:
        "A public landing page for guests, registration with your own login and password, and a dialog workspace built around notes, direct messages, and quick search by understandable usernames.",
      topButton: "Open sign-in panel",
      primaryCta: "Create account",
      secondaryCta: "See structure",
      attribution: "Apache-2.0 with preserved attribution notice",
      matrix: "Matrix stream active",
      featureTitle: "Prepared from day one",
      feature1: "Open registration with a user-chosen immutable login",
      feature2: "Profile editing for avatar, bio, birth date, and display name",
      feature3: "Personal notes channel with the same capabilities as a normal chat",
      feature4: "RU/EN-ready interface, repository docs, and chat search",
      panelTitle: "Current product frame",
      panel1: "Guest landing page with a user-entry icon in the top-right corner",
      panel2: "Authenticated workspace with dialogs on the left and chat on the right",
      panel3: "No page reload needed when switching chats or profile state",
      registerTab: "Create account",
      loginTab: "Existing account",
      loginLabel: "Login",
      loginPlaceholder: "your-login",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters",
      displayNameLabel: "Display name",
      displayNamePlaceholder: "How others should see you",
      registerHint: "The login becomes permanent and is used in search.",
      loginHint: "Use the same login and password you registered with.",
      creating: "Creating account...",
      signingIn: "Signing in...",
    },
    workspace: {
      shellTag: "Secure workspace",
      dialogsTitle: "Dialogs",
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
      badge: "Приватный мессенджер с обычным входом в аккаунт",
      title: "Темный, тихий мессенджер с консольным характером",
      subtitle:
        "Публичный лендинг для гостей, регистрация с собственным логином и паролем и пространство диалогов, построенное вокруг заметок, личных сообщений и быстрого поиска по понятным логинам.",
      topButton: "Открыть панель входа",
      primaryCta: "Создать аккаунт",
      secondaryCta: "Посмотреть структуру",
      attribution: "Apache-2.0 с сохранением notice и атрибуции",
      matrix: "Поток символов активен",
      featureTitle: "Подготовлено с первого дня",
      feature1: "Свободная регистрация с пользовательским неизменяемым логином",
      feature2: "Редактирование профиля: аватар, описание, дата рождения и имя",
      feature3: "Личный канал заметок с тем же функционалом, что и обычный чат",
      feature4: "Готовность интерфейса, документации и поиска по чатам к RU/EN",
      panelTitle: "Текущая форма продукта",
      panel1: "Гостевой лендинг с иконкой входа в правом верхнем углу",
      panel2: "Рабочее пространство после входа: диалоги слева, чат справа",
      panel3: "Переключение между чатами и профилем без перезагрузки страницы",
      registerTab: "Новый аккаунт",
      loginTab: "Уже зарегистрирован",
      loginLabel: "Логин",
      loginPlaceholder: "my-login",
      passwordLabel: "Пароль",
      passwordPlaceholder: "Минимум 8 символов",
      displayNameLabel: "Отображаемое имя",
      displayNamePlaceholder: "Как тебя будут видеть другие",
      registerHint: "Логин закрепляется навсегда и используется в поиске.",
      loginHint: "Используй тот же логин и пароль, что указывал при регистрации.",
      creating: "Создаю аккаунт...",
      signingIn: "Выполняю вход...",
    },
    workspace: {
      shellTag: "Защищенное пространство",
      dialogsTitle: "Диалоги",
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
