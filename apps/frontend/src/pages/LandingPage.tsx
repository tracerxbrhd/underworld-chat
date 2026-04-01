import { useEffect, useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { type AuthEnvelope, loginAccount, registerAccount } from "../shared/api";
import { LanguageSwitch } from "../shared/LanguageSwitch";
import { MatrixRain } from "../shared/MatrixRain";
import { useI18n } from "../shared/i18n";
import { useSessionStore } from "../shared/session-store";

type LandingPhase = "boot" | "menu" | "auth";
type AuthMode = "register" | "login";
type AuthStep = "typing-login" | "login-input" | "typing-password" | "password-input";

function resolveAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

function playTypingTick(audioContextRef: { current: AudioContext | null }) {
  if (typeof window === "undefined") {
    return;
  }

  if (!audioContextRef.current) {
    audioContextRef.current = resolveAudioContext();
  }

  const context = audioContextRef.current;
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = 1320 + Math.random() * 120;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.012, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.045);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.05);
}

export function LandingPage() {
  const navigate = useNavigate();
  const { copy, locale } = useI18n();
  const setAuthenticated = useSessionStore((state) => state.setAuthenticated);
  const [phase, setPhase] = useState<LandingPhase>("boot");
  const [bootProgress, setBootProgress] = useState(0);
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>("typing-login");
  const [typedLoginPrompt, setTypedLoginPrompt] = useState("");
  const [typedPasswordPrompt, setTypedPasswordPrompt] = useState("");
  const [credentials, setCredentials] = useState({
    publicId: "",
    password: "",
  });
  const loginInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const deviceName =
    typeof window === "undefined"
      ? "Web device"
      : `${window.navigator.platform || "Web"} / ${window.navigator.userAgent.slice(0, 48)}`;

  const completeAuthentication = (payload: AuthEnvelope) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("underworld-launch", "1");
    }
    setAuthenticated(payload);
    navigate("/app", { replace: true });
  };

  const registerMutation = useMutation({
    mutationFn: () =>
      registerAccount(
        {
          public_id: credentials.publicId.trim().toLowerCase(),
          display_name: credentials.publicId.trim(),
          password: credentials.password,
          device_name: deviceName,
          platform: "web",
          preferred_language: locale,
        },
        locale,
      ),
    onSuccess: completeAuthentication,
  });

  const loginMutation = useMutation({
    mutationFn: () =>
      loginAccount(
        {
          public_id: credentials.publicId.trim().toLowerCase(),
          password: credentials.password,
          device_name: deviceName,
          platform: "web",
        },
        locale,
      ),
    onSuccess: completeAuthentication,
  });

  const isPending = registerMutation.isPending || loginMutation.isPending;
  const activeError = (mode === "register" ? registerMutation.error : loginMutation.error) as Error | null;

  useEffect(() => {
    if (phase !== "boot") {
      return;
    }

    let progress = 0;
    let bootTimer: number | null = null;
    const interval = window.setInterval(() => {
      progress = Math.min(
        100,
        progress +
          (progress < 58 ? Math.floor(Math.random() * 12) + 6 : progress < 88 ? Math.floor(Math.random() * 7) + 3 : 1),
      );
      setBootProgress(progress);

      if (progress >= 100) {
        window.clearInterval(interval);
        bootTimer = window.setTimeout(() => setPhase("menu"), 420);
      }
    }, 90);

    return () => {
      window.clearInterval(interval);
      if (bootTimer) {
        window.clearTimeout(bootTimer);
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "auth") {
      return;
    }

    const prompt = authStep === "typing-login" ? copy.landing.promptLogin : authStep === "typing-password" ? copy.landing.promptPassword : null;
    if (!prompt) {
      return;
    }

    if (authStep === "typing-login") {
      setTypedLoginPrompt("");
      setTypedPasswordPrompt("");
    } else {
      setTypedPasswordPrompt("");
    }

    const timers: number[] = [];

    const typePrompt = (index: number) => {
      const nextValue = prompt.slice(0, index);
      if (authStep === "typing-login") {
        setTypedLoginPrompt(nextValue);
      } else {
        setTypedPasswordPrompt(nextValue);
      }

      if (index <= prompt.length) {
        playTypingTick(audioContextRef);
      }

      if (index < prompt.length) {
        timers.push(window.setTimeout(() => typePrompt(index + 1), 26 + Math.floor(Math.random() * 24)));
        return;
      }

      timers.push(
        window.setTimeout(() => {
          setAuthStep(authStep === "typing-login" ? "login-input" : "password-input");
        }, 140),
      );
    };

    timers.push(window.setTimeout(() => typePrompt(1), 160));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [authStep, copy.landing.promptLogin, copy.landing.promptPassword, phase]);

  useEffect(() => {
    if (phase !== "auth") {
      return;
    }

    if (authStep === "login-input") {
      loginInputRef.current?.focus();
    }
    if (authStep === "password-input") {
      passwordInputRef.current?.focus();
    }
  }, [authStep, phase]);

  useEffect(() => {
    if (phase !== "auth") {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isPending) {
        return;
      }

      registerMutation.reset();
      loginMutation.reset();
      setMode(null);
      setCredentials({ publicId: "", password: "" });
      setTypedLoginPrompt("");
      setTypedPasswordPrompt("");
      setAuthStep("typing-login");
      setPhase("menu");
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isPending, loginMutation, phase, registerMutation]);

  const startAuth = (nextMode: AuthMode) => {
    registerMutation.reset();
    loginMutation.reset();
    setMode(nextMode);
    setCredentials({ publicId: "", password: "" });
    setTypedLoginPrompt("");
    setTypedPasswordPrompt("");
    setAuthStep("typing-login");
    setPhase("auth");
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }
  };

  const submitCurrentMode = () => {
    if (isPending || !mode || !credentials.publicId.trim() || !credentials.password) {
      return;
    }

    if (mode === "register") {
      registerMutation.mutate();
      return;
    }

    loginMutation.mutate();
  };

  const renderBoot = () => (
    <div className="boot-shell">
      <div className="boot-core">
        <div className="boot-logo">UNDER OS</div>
        <p className="boot-status">{copy.landing.bootStatus}</p>
        <div className="boot-progress-track">
          <div className="boot-progress-bar" style={{ width: `${bootProgress}%` }} />
        </div>
        <p className="boot-stage">
          {copy.landing.bootStage} {String(bootProgress).padStart(3, "0")}%
        </p>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="console-stack">
      <p className="console-system-line">{copy.landing.menuLead}</p>
      <div className="console-actions">
        <button className="console-action primary-button" onClick={() => startAuth("login")} type="button">
          {copy.common.signIn}
        </button>
        <button className="console-action ghost-button" onClick={() => startAuth("register")} type="button">
          {copy.landing.createProfile}
        </button>
      </div>
    </div>
  );

  const renderAuth = () => {
    const submitLabel =
      mode === "register"
        ? registerMutation.isPending
          ? copy.landing.creating
          : copy.landing.createProfileMode
        : loginMutation.isPending
          ? copy.landing.signingIn
          : copy.landing.loginMode;

    return (
      <div className="console-stack console-stack-auth">
        <p className="console-system-line">{mode === "register" ? copy.landing.createProfileMode : copy.landing.loginMode}</p>

        <div className="console-line">
          <span className="console-prompt">&gt;</span>
          <span>{typedLoginPrompt}</span>
          {authStep === "typing-login" ? <span className="console-caret" /> : null}
        </div>

        {authStep !== "typing-login" ? (
          <div className="console-line console-entry-line">
            <span className="console-prompt">&gt;</span>
            {authStep === "login-input" ? (
              <>
                <input
                  ref={loginInputRef}
                  aria-label={copy.landing.loginLabel}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="console-inline-input"
                  onChange={(event) => setCredentials((current) => ({ ...current, publicId: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }
                    event.preventDefault();
                    if (!credentials.publicId.trim()) {
                      return;
                    }
                    setAuthStep("typing-password");
                  }}
                  spellCheck={false}
                  type="text"
                  value={credentials.publicId}
                />
                <span className="console-caret" />
              </>
            ) : (
              <span className="console-entry-value">{credentials.publicId || copy.landing.loginPlaceholder}</span>
            )}
          </div>
        ) : null}

        {authStep === "typing-password" || authStep === "password-input" || Boolean(credentials.password) || isPending ? (
          <div className="console-line">
            <span className="console-prompt">&gt;</span>
            <span>{typedPasswordPrompt}</span>
            {authStep === "typing-password" ? <span className="console-caret" /> : null}
          </div>
        ) : null}

        {authStep === "password-input" || Boolean(credentials.password) || isPending ? (
          <div className="console-line console-entry-line">
            <span className="console-prompt">&gt;</span>
            {isPending ? (
              <span className="console-entry-value console-entry-value-masked">{Array.from({ length: credentials.password.length || 8 }, () => "•").join("")}</span>
            ) : (
              <>
                <input
                  ref={passwordInputRef}
                  aria-label={copy.landing.passwordLabel}
                  className="console-inline-input"
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }
                    event.preventDefault();
                    submitCurrentMode();
                  }}
                  type="password"
                  value={credentials.password}
                />
                <span className="console-caret" />
              </>
            )}
          </div>
        ) : null}

        {isPending ? <p className="console-system-line console-system-line-accent">{submitLabel}</p> : null}
        {activeError ? <p className="error console-error">{activeError.message}</p> : null}
      </div>
    );
  };

  return (
    <section className="landing-page landing-console-page">
      <MatrixRain />
      <div className="landing-corner">
        <LanguageSwitch />
      </div>

      {phase === "boot" ? (
        renderBoot()
      ) : (
        <div className="console-shell">
          <section className="console-window">
            <div className="console-toolbar">
              <span className="console-toolbar-brand">UNDER OS</span>
              <span className="console-toolbar-state">{phase === "menu" ? copy.landing.consoleIdle : copy.landing.consoleActive}</span>
            </div>

            <div
              className="console-screen"
              onClick={() => {
                if (authStep === "login-input") {
                  loginInputRef.current?.focus();
                }
                if (authStep === "password-input") {
                  passwordInputRef.current?.focus();
                }
              }}
              role="presentation"
            >
              <div className="console-watermark">UNDER OS</div>
              {phase === "menu" ? <p className="console-banner">{copy.landing.consoleBanner}</p> : null}
              {phase === "menu" ? renderMenu() : renderAuth()}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
