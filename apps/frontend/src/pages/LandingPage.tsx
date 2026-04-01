import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginAccount, registerAccount } from "../shared/api";
import { LanguageSwitch } from "../shared/LanguageSwitch";
import { MatrixRain } from "../shared/MatrixRain";
import { UserGlyph } from "../shared/UserGlyph";
import { useI18n } from "../shared/i18n";
import { useSessionStore } from "../shared/session-store";

export function LandingPage() {
  const navigate = useNavigate();
  const { copy, locale } = useI18n();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);
  const authPanelRef = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [registerForm, setRegisterForm] = useState({
    publicId: "",
    displayName: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
    publicId: "",
    password: "",
  });
  const deviceName = `${window.navigator.platform || "Web"} / ${window.navigator.userAgent.slice(0, 48)}`;

  const registerMutation = useMutation({
    mutationFn: () =>
      registerAccount(
        {
          public_id: registerForm.publicId.trim().toLowerCase(),
          display_name: registerForm.displayName.trim(),
          password: registerForm.password,
          device_name: deviceName,
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
  const loginMutation = useMutation({
    mutationFn: () =>
      loginAccount(
        {
          public_id: loginForm.publicId.trim().toLowerCase(),
          password: loginForm.password,
          device_name: deviceName,
          platform: "web",
        },
        locale,
      ),
    onSuccess: (payload) => {
      setAuthenticated(payload);
      navigate("/app");
    },
  });
  const registerError = registerMutation.error as Error | null;
  const loginError = loginMutation.error as Error | null;
  const isPending = registerMutation.isPending || loginMutation.isPending;

  const focusAuth = (nextMode: "register" | "login") => {
    setMode(nextMode);
    authPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitCurrentMode = () => {
    if (isPending) {
      return;
    }
    if (mode === "register") {
      registerMutation.mutate();
      return;
    }
    loginMutation.mutate();
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
            onClick={() => focusAuth("login")}
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
            <button className="primary-button" onClick={() => focusAuth("register")} type="button">
              {copy.landing.primaryCta}
            </button>
            <a className="ghost-link" href="#landing-details">
              {copy.landing.secondaryCta}
            </a>
          </div>

          <p className="landing-footnote">{copy.landing.attribution}</p>
        </section>

        <aside className="landing-side" id="landing-details">
          <article className="panel panel-compact auth-card" ref={authPanelRef}>
            <div className="auth-tabs">
              <button
                className={mode === "register" ? "language-button active" : "language-button"}
                onClick={() => setMode("register")}
                type="button"
              >
                {copy.landing.registerTab}
              </button>
              <button
                className={mode === "login" ? "language-button active" : "language-button"}
                onClick={() => setMode("login")}
                type="button"
              >
                {copy.landing.loginTab}
              </button>
            </div>

            <div className="auth-form">
              <label className="field">
                <span>{copy.landing.loginLabel}</span>
                <input
                  autoCapitalize="none"
                  autoCorrect="off"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (mode === "register") {
                      setRegisterForm((current) => ({ ...current, publicId: value }));
                      return;
                    }
                    setLoginForm((current) => ({ ...current, publicId: value }));
                  }}
                  placeholder={copy.landing.loginPlaceholder}
                  type="text"
                  value={mode === "register" ? registerForm.publicId : loginForm.publicId}
                />
              </label>

              {mode === "register" ? (
                <label className="field">
                  <span>{copy.landing.displayNameLabel}</span>
                  <input
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, displayName: event.target.value }))
                    }
                    placeholder={copy.landing.displayNamePlaceholder}
                    type="text"
                    value={registerForm.displayName}
                  />
                </label>
              ) : null}

              <label className="field">
                <span>{copy.landing.passwordLabel}</span>
                <input
                  onChange={(event) => {
                    const value = event.target.value;
                    if (mode === "register") {
                      setRegisterForm((current) => ({ ...current, password: value }));
                      return;
                    }
                    setLoginForm((current) => ({ ...current, password: value }));
                  }}
                  placeholder={copy.landing.passwordPlaceholder}
                  type="password"
                  value={mode === "register" ? registerForm.password : loginForm.password}
                />
              </label>

              <p className="muted auth-hint">
                {mode === "register" ? copy.landing.registerHint : copy.landing.loginHint}
              </p>

              {mode === "register" && registerError ? <p className="error">{registerError.message}</p> : null}
              {mode === "login" && loginError ? <p className="error">{loginError.message}</p> : null}

              <button className="primary-button auth-submit" disabled={isPending} onClick={submitCurrentMode} type="button">
                {mode === "register"
                  ? registerMutation.isPending
                    ? copy.landing.creating
                    : copy.common.register
                  : loginMutation.isPending
                    ? copy.landing.signingIn
                    : copy.common.signIn}
              </button>
            </div>
          </article>

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
