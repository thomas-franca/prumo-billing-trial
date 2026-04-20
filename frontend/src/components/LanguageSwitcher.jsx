import { useLanguage } from "../i18n/language.js";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <details className="language-switcher" data-i18n-lock="true">
      <summary aria-label={t("Idioma")}>
        <span className="language-code" aria-hidden="true">{language.toUpperCase()}</span>
        <span>{language === "pt" ? t("Português") : t("English")}</span>
      </summary>
      <div className="language-options" role="group" aria-label={t("Idioma")}>
        <button
          className={language === "pt" ? "language-option active" : "language-option"}
          type="button"
          onClick={() => setLanguage("pt")}
        >
          <span>PT</span>
          {t("Português")}
        </button>
        <button
          className={language === "en" ? "language-option active" : "language-option"}
          type="button"
          onClick={() => setLanguage("en")}
        >
          <span>EN</span>
          {t("English")}
        </button>
      </div>
    </details>
  );
}