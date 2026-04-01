import { useEffect, useMemo, useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { loginAccount, registerAccount } from "../shared/api";
import { LanguageSwitch } from "../shared/LanguageSwitch";
import { MatrixRain } from "../shared/MatrixRain";
import { useI18n } from "../shared/i18n";
import { useSessionStore } from "../shared/session-store";

type LandingPhase = "boot" | "menu" | "auth";
type AuthMode = "register" | "login";

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
  const [typedPrompts, setTypedPrompts] = useState(["", ""]);
  const [registerForm, setRegisterForm] = useState({
    publicId: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
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

  const registerMutation = useMutation({
    mutationFn: () =>
      registerAccount(
        {
          public_id: registerForm.publicId.trim().toLowerCase(),
          display_name: registerForm.publicId.trim().toLowerCase(),
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

  const promptSequence = useMemo(() => [copy.landing.promptLogin, copy.landing.promptPassword], [copy.landing.promptLogin, copy.landing.promptPassword]);
  const isPending = registerMutation.isPending || loginMutation.isPending;
  const registerError = registerMutation.error as Error | null;
  const loginError = loginMutation.error as Error | null;
  const activeError = mode === "register" ? registerError : loginError;
  const loginPromptReady = typedPrompts[0] === promptSequence[0];
  const passwordPromptReady = typedPrompts[1] === promptSequence[1];

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
    if (phase !== "auth" || !mode) {
      return;
    }

    setTypedPrompts(["", ""]);
    const timers: number[] = [];

    const typeLine = (lineIndex: number, charIndex: number) => {
      const line = promptSequence[lineIndex];
      setTypedPrompts((current) => {
        const next = [...current];
        next[lineIndex] = line.slice(0, charIndex);
        return next;
      });

      if (charIndex <= line.length) {
        playTypingTick(audioContextRef);
      }

      if (charIndex < line.length) {
        timers.push(window.setTimeout(() => typeLine(lineIndex, charIndex + 1), 26 + Math.floor(Math.random() * 24)));
        return;
      }

      if (lineIndex + 1 < promptSequence.length) {
        timers.push(window.setTimeout(() => typeLine(lineIndex + 1, 1), 240));
      }
    };

    timers.push(window.setTimeout(() => typeLine(0, 1), 160));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [phase, mode, promptSequence]);

  useEffect(() => {
    if (phase === "auth" && loginPromptReady) {
      loginInputRef.current?.focus();
    }
  }, [phase, loginPromptReady]);

  useEffect(() => {
    if (phase === "auth" && passwordPromptReady) {
      passwordInputRef.current?.focus();
    }
  }, [phase, passwordPromptReady]);

  const startAuth = (nextMode: AuthMode) => {
    registerMutation.reset();
    loginMutation.reset();
    setMode(nextMode);
    setPhase("auth");
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }
  };

  const backToMenu = () => {
    registerMutation.reset();
    loginMutation.reset();
    setMode(null);
    setTypedPrompts(["", ""]);
    setPhase("menu");
  };

  const submitCurrentMode = () => {
    if (isPending || !mode) {
      return;
    }

    const currentForm = mode === "register" ? registerForm : loginForm;
    if (!currentForm.publicId.trim() || !currentForm.password) {
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
    const formState = mode === "register" ? registerForm : loginForm;
    const setFormState = mode === "register" ? setRegisterForm : setLoginForm;
    const canSubmit = Boolean(formState.publicId.trim() && formState.password && !isPending);
    const submitLabel =
      mode === "register"
        ? registerMutation.isPending
          ? copy.landing.creating
          : copy.landing.createProfile
        : loginMutation.isPending
          ? copy.landing.signingIn
          : copy.common.signIn;

    return (
      <div className="console-stack">
        <p className="console-system-line">{mode === "register" ? copy.landing.createProfileMode : copy.landing.loginMode}</p>

        <div className="console-line">
          <span className="console-prompt">&gt;</span>
          <span>{typedPrompts[0]}</span>
          {!loginPromptReady ? <span className="console-caret" /> : null}
        </div>

        {loginPromptReady ? (
          <div className="console-field">
            <input
              ref={loginInputRef}
              autoCapitalize="none"
              autoCorrect="off"
              onChange={(event) => setFormState((current) => ({ ...current, publicId: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && passwordPromptReady) {
                  event.preventDefault();
                  submitCurrentMode();
                }
              }}
              placeholder={copy.landing.loginPlaceholder}
              type="text"
              value={formState.publicId}
            />
          </div>
        ) : null}

        <div className="console-line">
          <span className="console-prompt">&gt;</span>
          <span>{typedPrompts[1]}</span>
          {loginPromptReady && !passwordPromptReady ? <span className="console-caret" /> : null}
        </div>

        {passwordPromptReady ? (
          <div className="console-field">
            <input
              ref={passwordInputRef}
              onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitCurrentMode();
                }
              }}
              placeholder={copy.landing.passwordPlaceholder}
              type="password"
              value={formState.password}
            />
          </div>
        ) : null}

        {activeError ? <p className="error console-error">{activeError.message}</p> : null}

        {passwordPromptReady ? (
          <div className="console-form-actions">
            <button className="primary-button console-action" disabled={!canSubmit} onClick={submitCurrentMode} type="button">
              {submitLabel}
            </button>
            <button className="ghost-button console-action" disabled={isPending} onClick={backToMenu} type="button">
              {copy.common.back}
            </button>
          </div>
        ) : null}
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

            <div className="console-screen">
              <p className="console-banner">{copy.landing.consoleBanner}</p>
              {phase === "menu" ? renderMenu() : renderAuth()}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
