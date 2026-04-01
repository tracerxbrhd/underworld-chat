import { useI18n } from "./i18n";

export function LanguageSwitch() {
  const { locale, setLocale, copy } = useI18n();

  return (
    <div className="language-switch" aria-label={copy.common.languageLabel}>
      <button
        className={locale === "en" ? "language-button active" : "language-button"}
        onClick={() => setLocale("en")}
        type="button"
      >
        EN
      </button>
      <button
        className={locale === "ru" ? "language-button active" : "language-button"}
        onClick={() => setLocale("ru")}
        type="button"
      >
        RU
      </button>
    </div>
  );
}

