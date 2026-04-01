import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { anonymousRegister } from "../shared/api";
import { LanguageSwitch } from "../shared/LanguageSwitch";
import { MatrixRain } from "../shared/MatrixRain";
import { UserGlyph } from "../shared/UserGlyph";
import { useI18n } from "../shared/i18n";
import { useSessionStore } from "../shared/session-store";

export function LandingPage() {
  const navigate = useNavigate();
  const { copy, locale } = useI18n();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);
  const registerMutation = useMutation({
    mutationFn: () =>
      anonymousRegister(
        {
          device_name: `${window.navigator.platform || "Web"} / ${window.navigator.userAgent.slice(0, 48)}`,
          platform: "web",
          preferred_language: locale,
        },
        locale,
      ),
    onSuccess: (payload) => {
      setAuthenticated(payload);
      navigate("/app");
    },
  });
  const registerError = registerMutation.error as Error | null;

  const signIn = () => {
    if (!registerMutation.isPending) {
      registerMutation.mutate();
    }
  };

  return (
    <section className="landing-page">
      <MatrixRain />

      <header className="landing-header">
        <div className="brand-lockup">
          <p className="eyebrow">{copy.landing.badge}</p>
          <h1>{copy.common.appName}</h1>
        </div>

        <div className="header-actions">
          <LanguageSwitch />
          <button
            aria-label={copy.landing.topButton}
            className="icon-button"
            onClick={signIn}
            type="button"
          >
            <UserGlyph className="user-glyph" />
          </button>
        </div>
      </header>

      <div className="landing-grid">
        <section className="landing-hero">
          <p className="eyebrow">{copy.landing.matrix}</p>
          <h2>{copy.landing.title}</h2>
          <p className="landing-copy">{copy.landing.subtitle}</p>

          <div className="cta-row">
            <button className="primary-button" onClick={signIn} type="button">
              {registerMutation.isPending ? copy.landing.signingIn : copy.landing.primaryCta}
            </button>
            <a className="ghost-link" href="#landing-details">
              {copy.landing.secondaryCta}
            </a>
          </div>

          {registerError ? <p className="error">{registerError.message}</p> : null}
          <p className="landing-footnote">{copy.landing.attribution}</p>
        </section>

        <aside className="landing-side" id="landing-details">
          <article className="panel panel-compact">
            <h3>{copy.landing.featureTitle}</h3>
            <ul className="plain-list">
              <li>{copy.landing.feature1}</li>
              <li>{copy.landing.feature2}</li>
              <li>{copy.landing.feature3}</li>
              <li>{copy.landing.feature4}</li>
            </ul>
          </article>

          <article className="panel panel-compact">
            <h3>{copy.landing.panelTitle}</h3>
            <ul className="plain-list">
              <li>{copy.landing.panel1}</li>
              <li>{copy.landing.panel2}</li>
              <li>{copy.landing.panel3}</li>
            </ul>
          </article>
        </aside>
      </div>
    </section>
  );
}
